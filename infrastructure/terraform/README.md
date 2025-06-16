# Terraform Infrastructure for MCP Servers

This directory contains Terraform configuration for deploying MCP servers to Cloudflare Workers.

## GitHub Secrets Setup

The following secrets must be configured in your GitHub repository for CI/CD deployments:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with permissions to manage Workers
  - Create at: https://dash.cloudflare.com/profile/api-tokens
  - Required permissions: Account:Cloudflare Workers Scripts:Edit
  
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
  - Find in your Cloudflare dashboard URL or account settings

## Local Development

For local Terraform operations, create a `terraform.tfvars.local` file:

```hcl
# terraform.tfvars.local
cloudflare_api_token  = "your-actual-40-character-api-token"
cloudflare_account_id = "your-actual-32-character-account-id"
```

This file is gitignored and will not be committed to the repository.

## Usage

### Initialize Terraform
```bash
terraform init
```

### Plan changes
```bash
# For staging environment
terraform plan -var-file=terraform.tfvars -var-file=terraform.tfvars.local -var-file=environments/staging.tfvars

# For production environment
terraform plan -var-file=terraform.tfvars -var-file=terraform.tfvars.local -var-file=environments/production.tfvars
```

### Apply changes
```bash
# For staging environment
terraform apply -var-file=terraform.tfvars -var-file=terraform.tfvars.local -var-file=environments/staging.tfvars

# For production environment
terraform apply -var-file=terraform.tfvars -var-file=terraform.tfvars.local -var-file=environments/production.tfvars
```

## CI/CD Deployment

The GitHub Actions workflow automatically:
1. Detects affected MCP server applications
2. Builds and tests them
3. Generates Terraform configuration for affected apps
4. Deploys to the appropriate environment based on the branch:
   - `main` → production
   - `develop` → staging
   - Pull requests → dev (plan only, no apply)

## Environment-Specific Configuration

Each environment has its own configuration file in `environments/`:
- `dev.tfvars`
- `staging.tfvars`
- `production.tfvars`

These files contain environment-specific settings like routes, environment variables, and KV namespaces for each MCP server. 