# Terraform Makefile for NX MCP Cloudflare Workers
.PHONY: help init plan apply destroy fmt validate clean

# Default environment
ENV ?= dev

# Terraform variables file based on environment
TF_VARS := -var-file=environments/$(ENV).tfvars

# Help target
help:
	@echo "Terraform Makefile for NX MCP Cloudflare Workers"
	@echo ""
	@echo "Usage:"
	@echo "  make [target] ENV=[dev|staging|production]"
	@echo ""
	@echo "Targets:"
	@echo "  init              Initialize Terraform"
	@echo "  plan              Show deployment plan"
	@echo "  apply             Apply changes"
	@echo "  destroy           Destroy infrastructure"
	@echo "  fmt               Format Terraform files"
	@echo "  validate          Validate configuration"
	@echo "  clean             Clean temporary files"
	@echo "  generate-affected Generate config for affected apps"
	@echo "  deploy-affected   Deploy only affected MCP servers"
	@echo "  show-affected     Show affected MCP servers"
	@echo "  test-affected     Test affected detection"
	@echo ""
	@echo "Examples:"
	@echo "  make plan ENV=dev"
	@echo "  make apply ENV=production"

# Initialize Terraform
init:
	terraform init -upgrade

# Generate affected apps configuration
generate-affected:
	@echo "Generating configuration for affected MCP servers..."
	node scripts/generate-affected-config.js --env=$(ENV)

# Plan deployment
plan: validate generate-affected
	terraform plan $(TF_VARS)

# Apply deployment
apply: validate generate-affected
	terraform apply $(TF_VARS)

# Apply with auto-approve (use with caution)
apply-auto: validate generate-affected
	terraform apply -auto-approve $(TF_VARS)

# Destroy infrastructure
destroy:
	terraform destroy $(TF_VARS)

# Format Terraform files
fmt:
	terraform fmt -recursive

# Validate configuration
validate: fmt
	terraform validate

# Clean temporary files
clean:
	rm -rf .terraform/
	rm -rf .terraform.lock.hcl
	rm -rf terraform.tfstate*
	rm -rf .terraform/tmp/

# Show outputs
output:
	terraform output -json

# Refresh state
refresh:
	terraform refresh $(TF_VARS)

# Test affected detection
test-affected:
	@../scripts/test-affected.sh

# Deploy only affected MCP servers
deploy-affected: generate-affected apply-auto

# Show affected apps
show-affected:
	@if [ -f affected-apps.json ]; then \
		echo "Affected MCP servers:"; \
		jq -r '.apps[]? | "  - \(.name) (\(.root))"' affected-apps.json; \
	else \
		echo "No affected apps file found. Run 'make generate-affected' first."; \
	fi 