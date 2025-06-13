# Quick Start: Deploying MCP Servers to Cloudflare Workers

This guide helps you deploy only affected MCP servers to Cloudflare Workers.

## Prerequisites

- Terraform installed
- Cloudflare account with Workers enabled
- NX workspace with MCP servers (tagged with `mcp-server`)

## Initial Setup

1. **Configure credentials:**
   ```bash
   cd infrastructure/terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your Cloudflare credentials
   ```

2. **Initialize Terraform:**
   ```bash
   make init
   # or
   npm run tf:init
   ```

## Deploying Affected MCP Servers

### Option 1: Using Make (Recommended)

```bash
cd infrastructure/terraform

# Deploy to development
make deploy-affected ENV=dev

# Deploy to staging  
make deploy-affected ENV=staging

# Deploy to production
make deploy-affected ENV=production
```

### Option 2: Using NPM Scripts

```bash
# Deploy to specific environments
npm run deploy:affected:dev
npm run deploy:affected:staging
npm run deploy:affected:production
```

### Option 3: Manual Steps

```bash
# 1. Build affected applications
nx affected --target=build

# 2. Generate Terraform configuration
cd infrastructure/terraform
node scripts/generate-affected-config.js --env=development

# 3. Deploy
terraform apply -var-file=environments/dev.tfvars
```

## Testing Affected Detection

Test which MCP servers would be deployed:

```bash
cd infrastructure/terraform
make test-affected

# Or specify custom base/head
../scripts/test-affected.sh origin/main HEAD
```

## Adding MCP Server Configuration

1. **Tag your project as an MCP server:**
   ```json
   // apps/my-mcp-server/project.json
   {
     "tags": ["mcp-server", "type:app"]
   }
   ```

2. **Add environment-specific configuration:**
   ```hcl
   # infrastructure/terraform/environments/dev.tfvars
   
   # Routes for your MCP server
   my_mcp_server_routes = [
     {
       pattern = "my-server.example.com/*"
       zone_id = "your-zone-id"
     }
   ]
   
   # Environment variables
   my_mcp_server_env_vars = {
     NODE_ENV = "development"
     API_KEY  = "your-api-key"
   }
   
   # KV namespaces (optional)
   my_mcp_server_kv_namespaces = [
     {
       binding = "RATE_LIMITER"
       id      = "your-kv-namespace-id"
     }
   ]
   ```

## CI/CD

The GitHub Actions workflow automatically:
- Detects affected MCP servers on push
- Builds only affected applications
- Deploys to appropriate environment:
  - `main` branch → Production
  - `develop` branch → Staging
  - Pull requests → Build only (no deploy)

## Troubleshooting

### No affected apps detected
- Ensure your app is tagged with `mcp-server`
- Check that changes were made to the app or its dependencies
- Run `make test-affected` to debug

### Build failures
- Ensure affected apps build successfully: `nx affected --target=build`
- Check build output in `dist/` directory

### Terraform errors
- Validate configuration: `make validate`
- Check generated files: `ls affected-apps*.tf`
- Review logs: `terraform plan`

## Common Commands

```bash
# Show what would be deployed
make plan ENV=dev

# Show affected MCP servers
make show-affected

# Clean up generated files
make clean

# Format Terraform files
make fmt

# Validate setup
./infrastructure/scripts/validate-setup.sh
``` 