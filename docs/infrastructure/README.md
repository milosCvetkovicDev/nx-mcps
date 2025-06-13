# Infrastructure

This directory contains Terraform configurations for deploying NX workspace MCP (Model Context Protocol) server applications to Cloudflare Workers.

## Overview

The infrastructure provides an **affected-only deployment strategy** that:

- **Only deploys changed MCP servers** using NX affected detection
- **Dynamically generates** Terraform configurations based on affected apps
- **Supports MCP protocol** with HTTP and WebSocket endpoints
- **Multi-environment support** (dev, staging, production)
- **Zero-config deployments** for new MCP servers
- **Enhanced features**:
  - Automatic affected app detection
  - Dynamic Terraform configuration generation
  - MCP server adapter for Cloudflare Workers
  - Built-in rate limiting and authentication
  - WebSocket support for streaming
  - KV namespace bindings for state
  - R2 bucket bindings for storage
  - Service bindings for inter-worker communication

## Prerequisites

1. **Terraform**: Install Terraform v1.5.0 or later
   ```bash
   brew install terraform  # macOS
   # or download from https://www.terraform.io/downloads
   ```

2. **Cloudflare Account**: You need a Cloudflare account with Workers enabled

3. **Cloudflare API Token**: Create an API token with the following permissions:
   - Account: Cloudflare Workers Scripts:Edit
   - Zone: Workers Routes:Edit (if using custom routes)

## Project Structure

```
infrastructure/
├── terraform/
│   ├── main.tf                 # Main configuration
│   ├── providers.tf            # Provider configurations
│   ├── versions.tf             # Version constraints
│   ├── variables.tf            # Variable definitions
│   ├── outputs.tf              # Output definitions
│   ├── backend.tf              # State backend configuration
│   ├── Makefile                # Convenience commands
│   ├── environments/           # Environment-specific configs
│   │   ├── dev.tfvars
│   │   ├── staging.tfvars
│   │   └── production.tfvars
│   └── modules/
│       └── cloudflare-worker/  # Reusable Worker module
├── cloudflare-worker-adapter/  # Worker compatibility layer
│   ├── worker-adapter.js       # Main adapter
│   └── example-worker.js       # Example usage
└── README.md
```

## Setup

1. Choose and configure your environment:
   ```bash
   cd infrastructure/terraform
   # Review environment configurations
   cat environments/dev.tfvars
   ```

2. Create your credentials file (not tracked by git):
   ```bash
   # Option 1: Create from example
   cp terraform.tfvars.example terraform.tfvars
   
   # Option 2: Use environment-specific credentials
   touch terraform.tfvars
   ```

3. Edit `terraform.tfvars` with your Cloudflare credentials:
   ```hcl
   cloudflare_api_token  = "your-api-token"
   cloudflare_account_id = "your-account-id"
   ```

4. Configure backend (optional but recommended for teams):
   ```bash
   # Edit backend.tf and uncomment your preferred backend
   vim backend.tf
   ```

5. Initialize Terraform:
   ```bash
   # Using make
   make init
   
   # Or using npm
   npm run tf:init
   
   # Or directly
   cd infrastructure/terraform && terraform init
   ```

## How It Works

### Affected Detection

The deployment system automatically detects which MCP servers have changed:

1. **NX Affected** - Uses NX's dependency graph to find affected applications
2. **MCP Filter** - Filters for apps tagged with `mcp-server`
3. **Dynamic Generation** - Creates Terraform configurations only for affected apps
4. **Optimized Deployment** - Only deploys what has changed

### Dynamic Configuration

Before each deployment, the system:

1. Runs `scripts/generate-affected-config.js`
2. Generates:
   - `affected-apps.tf` - Module instances for each affected app
   - `affected-apps-variables.tf` - Variable definitions
   - `affected-apps-outputs.tf` - Output definitions
   - `affected-apps.auto.tfvars` - Deployment flags

## Deployment

### Using Make (Recommended)

The Makefile provides environment-aware commands:

```bash
# Deploy to development (default)
make plan
make apply

# Deploy to staging
make plan ENV=staging
make apply ENV=staging

# Deploy to production
make plan ENV=production
make apply ENV=production

# Other commands
make fmt        # Format files
make validate   # Validate configuration
make output     # Show outputs
make clean      # Clean temporary files
```

### Using NPM Scripts

The workspace includes NPM scripts for basic Terraform operations:

```bash
# Initialize Terraform
npm run tf:init

# Plan deployment (uses dev environment by default)
npm run tf:plan

# Apply deployment
npm run tf:apply

# Other operations
npm run tf:destroy
npm run tf:fmt
npm run tf:validate
npm run tf:output
```

### Using NX Targets

Deploy specific applications with NX:

```bash
# Build and deploy petstore-api
nx run @./petstore-api:deploy

# Other targets (if configured)
nx run @./petstore-api:tf-init
nx run @./petstore-api:tf-plan
```

### CI/CD with GitHub Actions

The repository includes a GitHub Actions workflow that:

1. **Automatically deploys** on push to:
   - `main` branch → Production
   - `develop` branch → Staging

2. **Manual deployment** via workflow dispatch:
   ```yaml
   # Trigger manual deployment from GitHub UI
   # Select environment: dev, staging, or production
   ```

3. **Required secrets**:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `NX_CLOUD_ACCESS_TOKEN` (optional)

## Configuration

### Environment Variables

Set environment variables for your Workers in `terraform.tfvars`:

```hcl
petstore_api_env_vars = {
  NODE_ENV    = "production"
  API_VERSION = "v1"
  DATABASE_URL = "your-database-url"
}
```

### Custom Routes

Configure custom routes for your Workers:

```hcl
petstore_api_routes = [
  {
    pattern = "api.example.com/*"
    zone_id = "your-zone-id"
  },
  {
    pattern = "example.com/api/*"
    zone_id = "your-zone-id"
  }
]
```

### KV Namespaces

Bind KV namespaces to your Workers:

```hcl
petstore_api_kv_namespaces = [
  {
    binding = "CACHE"
    id      = "your-kv-namespace-id"
  }
]
```

## MCP Server Development

### Creating MCP Servers for Cloudflare

The infrastructure includes an MCP server adapter (`mcp-server-adapter.js`) that:

- Handles HTTP POST requests at `/mcp` endpoint
- Provides WebSocket support at `/mcp/ws` for streaming
- Includes built-in authentication and rate limiting
- Exposes capabilities at `/mcp/capabilities`
- Health checks at `/health`

### Example MCP Server

```javascript
import { createMcpWorkerHandler, McpWorkerUtils } from '../infrastructure/cloudflare-worker-adapter/mcp-server-adapter.js';

const serverConfig = {
  name: 'my-mcp-server',
  version: '1.0.0',
  capabilities: {
    tools: true,
    resources: true
  },
  tools: [
    McpWorkerUtils.createTool(
      'getData',
      'Fetch data from the API',
      { type: 'object', properties: { id: { type: 'string' } } },
      async (args, { env }) => {
        // Tool implementation
        return { data: 'example' };
      }
    )
  ],
  resources: [
    McpWorkerUtils.createResource(
      'config://settings',
      'Settings',
      'Server configuration',
      'application/json',
      async ({ env }) => JSON.stringify({ version: '1.0' })
    )
  ]
};

export default createMcpWorkerHandler(serverConfig, {
  authToken: process.env.MCP_AUTH_TOKEN,
  rateLimitPerMinute: 100
});
```

### Tagging MCP Servers

Ensure your NX project is tagged as an MCP server:

```json
// apps/my-mcp-server/project.json
{
  "tags": ["mcp-server", "type:app"]
}
```

## Worker Adapter

The `cloudflare-worker-adapter` provides compatibility between NX applications and Cloudflare Workers:

### Features

- Converts Express-like apps to Worker format
- Handles CORS automatically
- Provides request/response transformation
- Supports various app types (Express, custom handlers, native Workers)

### Usage

1. Create a worker entry file:

```javascript
import { createWorkerHandler } from '../infrastructure/cloudflare-worker-adapter/worker-adapter.js';
import app from './main.js'; // Your NX app

export default createWorkerHandler(app, {
  enableCors: true,
  corsOrigin: '*'
});
```

2. Update your build configuration to output the worker entry file

3. Deploy using Terraform

## Adding New Applications

To add a new application for Cloudflare Workers deployment:

1. Add a new module instance in `infrastructure/terraform/main.tf`:

```hcl
module "my_new_app_worker" {
  source = "./modules/cloudflare-worker"

  worker_name     = "my-new-app"
  worker_script   = file("${path.module}/../../dist/apps/my-new-app/main.js")
  account_id      = var.cloudflare_account_id
  routes          = var.my_new_app_routes
  environment     = var.environment
  
  compatibility_date    = "2024-01-01"
  environment_variables = var.my_new_app_env_vars
  kv_namespaces        = var.my_new_app_kv_namespaces
}
```

2. Add corresponding variables in `infrastructure/terraform/variables.tf`

3. Add outputs in `infrastructure/terraform/outputs.tf`

4. Update `terraform.tfvars` with configuration for the new app

## Environments

You can manage multiple environments by using different `.tfvars` files:

```bash
# Development
terraform apply -var-file="dev.tfvars"

# Staging
terraform apply -var-file="staging.tfvars"

# Production
terraform apply -var-file="prod.tfvars"
```

## Troubleshooting

### Build Not Found

Ensure you build your application before deploying:

```bash
nx run @./petstore-api:build
# Then deploy
nx run @./petstore-api:deploy
```

### API Token Issues

Ensure your Cloudflare API token has the necessary permissions:
- Account: Cloudflare Workers Scripts:Edit
- Zone: Workers Routes:Edit (if using custom routes)

### Module Not Found

If Terraform can't find the module, ensure you've run:

```bash
terraform init
```

## Best Practices

1. **State Management**: Consider using remote state storage (e.g., Terraform Cloud, S3) for team collaboration
2. **Secrets**: Use environment variables or secret management services for sensitive data
3. **Staging**: Always test deployments in a staging environment first
4. **Version Control**: Don't commit `.tfvars` files with sensitive data
5. **Build Before Deploy**: Ensure applications are built before running Terraform 