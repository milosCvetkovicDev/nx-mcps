#!/bin/bash

# Validation script for Terraform Cloudflare setup

set -e

echo "🔍 Validating Terraform setup for Cloudflare Workers..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        return 1
    fi
}

# Check required tools
echo "1. Checking required tools:"
command_exists terraform
print_status $? "Terraform is installed"

command_exists node
print_status $? "Node.js is installed"

command_exists npm
print_status $? "npm is installed"

echo ""

# Check directory structure
echo "2. Checking directory structure:"
[ -d "infrastructure/terraform" ]
print_status $? "Terraform directory exists"

[ -f "infrastructure/terraform/main.tf" ]
print_status $? "main.tf exists"

[ -d "infrastructure/terraform/modules/cloudflare-worker" ]
print_status $? "Cloudflare Worker module exists"

[ -d "infrastructure/terraform/environments" ]
print_status $? "Environments directory exists"

echo ""

# Check build output
echo "3. Checking MCP servers:"
# Get MCP servers
MCP_SERVERS=$(nx show projects --projects=tag:mcp-server 2>/dev/null)
if [ -n "$MCP_SERVERS" ]; then
    echo "Found MCP servers:"
    echo "$MCP_SERVERS" | while read -r server; do
        if [ -n "$server" ]; then
            if [ -d "dist/$server" ]; then
                print_status 0 "$server build output exists"
            else
                echo -e "${YELLOW}⚠${NC}  $server not built yet"
            fi
        fi
    done
else
    echo -e "${YELLOW}⚠${NC}  No MCP servers found (projects tagged with 'mcp-server')"
fi

echo ""

# Check Terraform configuration
echo "4. Validating Terraform configuration:"
cd infrastructure/terraform

# Check if terraform.tfvars exists
if [ -f "terraform.tfvars" ]; then
    print_status 0 "terraform.tfvars exists"
    
    # Check if required variables are set
    if grep -q "cloudflare_api_token" terraform.tfvars && grep -q "cloudflare_account_id" terraform.tfvars; then
        print_status 0 "Required variables appear to be set"
    else
        echo -e "${RED}✗${NC} Required variables not found in terraform.tfvars"
    fi
else
    echo -e "${YELLOW}⚠${NC}  terraform.tfvars not found. Copy from terraform.tfvars.example"
fi

# Validate Terraform configuration
terraform validate >/dev/null 2>&1
print_status $? "Terraform configuration is valid"

echo ""
echo "5. Environment configurations:"
for env in dev staging production; do
    [ -f "environments/${env}.tfvars" ]
    print_status $? "${env}.tfvars exists"
done

echo ""
echo "6. Affected deployment scripts:"
[ -f "scripts/generate-affected-config.js" ]
print_status $? "Affected config generator exists"

[ -x "scripts/generate-affected-config.js" ]
print_status $? "Generator script is executable"

echo ""
echo "7. GitHub Actions:"
cd ../..
[ -f ".github/workflows/deploy-cloudflare.yml" ]
print_status $? "GitHub Actions workflow exists"

echo ""
echo "✨ Validation complete!"
echo ""
echo "Next steps:"
echo "1. Ensure terraform.tfvars is configured with your Cloudflare credentials"
echo "2. Build your applications: npm run build"
echo "3. Initialize Terraform: npm run tf:init"
echo "4. Deploy: make apply ENV=dev" 