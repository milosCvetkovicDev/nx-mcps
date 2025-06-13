#!/usr/bin/env node

/**
 * Generates Terraform configuration for affected MCP server applications
 * This script is run before Terraform to dynamically create deployment configurations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const base = args.find(arg => arg.startsWith('--base='))?.split('=')[1] || 'HEAD~1';
const head = args.find(arg => arg.startsWith('--head='))?.split('=')[1] || 'HEAD';
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';

// Function to execute shell commands
function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return '';
  }
}

// Get affected MCP server applications
function getAffectedMcpServers() {
  // Get affected apps with mcp-server tag (NX 19+ compatible)
  const affectedCommand = `nx show projects --affected --base=${base} --head=${head} --type app`;
  const affectedApps = exec(affectedCommand);
  
  if (!affectedApps) {
    return [];
  }
  
  // Parse the affected apps (one per line in NX 19+)
  const apps = affectedApps.split('\n').map(app => app.trim()).filter(Boolean);
  const mcpServers = [];
  
  for (const app of apps) {
    // Check if app has mcp-server tag
    const tagsCommand = `nx show project ${app} --json`;
    try {
      const projectInfo = JSON.parse(exec(tagsCommand));
      if (projectInfo.tags && projectInfo.tags.includes('mcp-server')) {
        mcpServers.push({
          name: app,
          root: projectInfo.root,
          projectName: projectInfo.name || app
        });
      }
    } catch (error) {
      console.error(`Error getting project info for ${app}:`, error.message);
    }
  }
  
  return mcpServers;
}

// Generate Terraform module configuration for an MCP server
function generateModuleConfig(app, index) {
  const moduleName = app.name.replace(/[@/.]/g, '_').replace(/^_+/, '');
  const workerName = app.name.replace('@./', '').replace(/\//g, '-');
  
  return `
# Module for ${app.name}
module "${moduleName}_worker" {
  source = "./modules/cloudflare-worker"
  count  = var.deploy_${moduleName} ? 1 : 0

  # Basic configuration
  worker_name   = "\${local.worker_prefix}${workerName}"
  worker_script = data.archive_file.${moduleName}[0].source_file
  account_id    = var.cloudflare_account_id
  environment   = var.environment
  
  # Worker configuration
  compatibility_date = var.compatibility_date
  
  # Routes configuration
  routes = var.${moduleName}_routes
  
  # Environment variables with defaults
  environment_variables = merge(
    {
      ENVIRONMENT = var.environment
      WORKER_NAME = "\${local.worker_prefix}${workerName}"
      MCP_SERVER  = "true"
    },
    var.${moduleName}_env_vars
  )
  
  # Optional bindings
  kv_namespaces = var.${moduleName}_kv_namespaces
  r2_buckets    = var.${moduleName}_r2_buckets
  
  # Tags for tracking
  tags = local.common_tags
}`;
}

// Generate archive data source for an MCP server
function generateArchiveConfig(app) {
  const moduleName = app.name.replace(/[@/.]/g, '_').replace(/^_+/, '');
  
  return `
# Archive for ${app.name}
data "archive_file" "${moduleName}" {
  count       = var.deploy_${moduleName} ? 1 : 0
  type        = "zip"
  source_file = "\${local.dist_path}/${app.root}/main.js"
  output_path = "\${path.module}/.terraform/tmp/${moduleName}.zip"
}`;
}

// Generate variable definitions for an MCP server
function generateVariables(app) {
  const moduleName = app.name.replace(/[@/.]/g, '_').replace(/^_+/, '');
  const displayName = app.name.replace('@./', '');
  
  return `
# Variables for ${app.name}
variable "deploy_${moduleName}" {
  description = "Whether to deploy ${displayName}"
  type        = bool
  default     = false
}

variable "${moduleName}_routes" {
  description = "Routes for ${displayName}"
  type = list(object({
    pattern = string
    zone_id = optional(string)
  }))
  default = []
}

variable "${moduleName}_env_vars" {
  description = "Environment variables for ${displayName}"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "${moduleName}_kv_namespaces" {
  description = "KV namespace bindings for ${displayName}"
  type = list(object({
    binding = string
    id      = string
  }))
  default = []
}

variable "${moduleName}_r2_buckets" {
  description = "R2 bucket bindings for ${displayName}"
  type = list(object({
    binding     = string
    bucket_name = string
  }))
  default = []
}`;
}

// Generate outputs for an MCP server
function generateOutputs(app) {
  const moduleName = app.name.replace(/[@/.]/g, '_').replace(/^_+/, '');
  
  return `
# Outputs for ${app.name}
output "${moduleName}_worker_url" {
  description = "URL for ${app.name}"
  value       = try(module.${moduleName}_worker[0].worker_url, "")
}

output "${moduleName}_worker_id" {
  description = "Worker ID for ${app.name}"
  value       = try(module.${moduleName}_worker[0].worker_id, "")
}

output "${moduleName}_routes" {
  description = "Routes for ${app.name}"
  value       = try(module.${moduleName}_worker[0].worker_routes, [])
}`;
}

// Generate environment-specific tfvars
function generateEnvTfvars(apps, env) {
  const deployVars = apps.map(app => {
    const moduleName = app.name.replace(/[@/.]/g, '_').replace(/^_+/, '');
    return `deploy_${moduleName} = true`;
  }).join('\n');
  
  return `# Auto-generated deployment flags for affected MCP servers
# Environment: ${env}
# Generated at: ${new Date().toISOString()}

${deployVars}
`;
}

// Main function
async function main() {
  console.log('🔍 Detecting affected MCP server applications...');
  console.log(`Base: ${base}, Head: ${head}, Environment: ${environment}`);
  
  const affectedApps = getAffectedMcpServers();
  
  if (affectedApps.length === 0) {
    console.log('No affected MCP server applications found.');
    // Create empty files to avoid Terraform errors
    fs.writeFileSync(path.join(__dirname, '../affected-apps.auto.tfvars'), '# No affected applications\n');
    return;
  }
  
  console.log(`Found ${affectedApps.length} affected MCP server(s):`);
  affectedApps.forEach(app => console.log(`  - ${app.name}`));
  
  // Generate Terraform configurations
  const archives = affectedApps.map(generateArchiveConfig).join('\n');
  const modules = affectedApps.map(generateModuleConfig).join('\n');
  const variables = affectedApps.map(generateVariables).join('\n');
  const outputs = affectedApps.map(generateOutputs).join('\n');
  const envTfvars = generateEnvTfvars(affectedApps, environment);
  
  // Write generated files
  const outputDir = path.join(__dirname, '..');
  
  // Main configuration for affected apps
  const affectedMainContent = `# Auto-generated Terraform configuration for affected MCP servers
# DO NOT EDIT - This file is generated by scripts/generate-affected-config.js

${archives}

${modules}
`;
  
  fs.writeFileSync(path.join(outputDir, 'affected-apps.tf'), affectedMainContent);
  
  // Variables for affected apps
  const affectedVarsContent = `# Auto-generated variables for affected MCP servers
# DO NOT EDIT - This file is generated by scripts/generate-affected-config.js

${variables}
`;
  
  fs.writeFileSync(path.join(outputDir, 'affected-apps-variables.tf'), affectedVarsContent);
  
  // Outputs for affected apps
  const affectedOutputsContent = `# Auto-generated outputs for affected MCP servers
# DO NOT EDIT - This file is generated by scripts/generate-affected-config.js

${outputs}
`;
  
  fs.writeFileSync(path.join(outputDir, 'affected-apps-outputs.tf'), affectedOutputsContent);
  
  // Environment tfvars for deployment flags
  fs.writeFileSync(path.join(outputDir, 'affected-apps.auto.tfvars'), envTfvars);
  
  // Write affected apps list for other scripts
  const affectedList = {
    timestamp: new Date().toISOString(),
    environment,
    base,
    head,
    apps: affectedApps
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'affected-apps.json'),
    JSON.stringify(affectedList, null, 2)
  );
  
  console.log('✅ Generated Terraform configuration for affected applications');
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 