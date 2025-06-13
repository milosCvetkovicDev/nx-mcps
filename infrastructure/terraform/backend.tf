# Backend configuration for Terraform state
# Uncomment and configure one of the following backends:

# # Terraform Cloud Backend
# terraform {
#   cloud {
#     organization = "your-org-name"
#     
#     workspaces {
#       name = "nx-mcp-cloudflare"
#     }
#   }
# }

# # S3 Backend (AWS)
# terraform {
#   backend "s3" {
#     bucket         = "your-terraform-state-bucket"
#     key            = "nx-mcp/cloudflare/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     dynamodb_table = "terraform-state-lock"
#   }
# }

# # Cloudflare R2 Backend
# terraform {
#   backend "s3" {
#     bucket                      = "terraform-state"
#     key                         = "nx-mcp/cloudflare/terraform.tfstate"
#     region                      = "auto"
#     skip_credentials_validation = true
#     skip_metadata_api_check     = true
#     skip_region_validation      = true
#     skip_requesting_account_id  = true
#     endpoints = {
#       s3 = "https://<account-id>.r2.cloudflarestorage.com"
#     }
#   }
# }

# # Local Backend (default - not recommended for production)
# terraform {
#   backend "local" {
#     path = "terraform.tfstate"
#   }
# } 