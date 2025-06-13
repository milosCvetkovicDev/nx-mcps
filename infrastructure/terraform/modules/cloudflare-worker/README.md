# Cloudflare Worker Terraform Module

This module deploys a Cloudflare Worker with support for various bindings and configurations.

## Features

- Deploy Worker scripts to Cloudflare
- Configure custom routes
- Set environment variables
- Bind KV namespaces
- Bind R2 buckets
- Service bindings for Worker-to-Worker communication
- Analytics Engine bindings
- Custom domain support

## Usage

```hcl
module "my_worker" {
  source = "./modules/cloudflare-worker"

  # Required
  account_id    = "your-cloudflare-account-id"
  worker_name   = "my-worker-name"
  worker_script = file("path/to/worker/script.js")

  # Optional
  environment        = "production"
  compatibility_date = "2024-01-01"

  # Routes (optional)
  routes = [
    {
      pattern = "example.com/api/*"
      zone_id = "your-zone-id"
    }
  ]

  # Environment variables (optional)
  environment_variables = {
    API_KEY = "secret-key"
    NODE_ENV = "production"
  }

  # KV namespace bindings (optional)
  kv_namespaces = [
    {
      binding = "MY_KV"
      id      = "kv-namespace-id"
    }
  ]

  # R2 bucket bindings (optional)
  r2_buckets = [
    {
      binding     = "MY_BUCKET"
      bucket_name = "my-r2-bucket"
    }
  ]

  # Service bindings (optional)
  service_bindings = [
    {
      binding = "AUTH_SERVICE"
      service = "auth-worker"
    }
  ]

  # Custom domain (optional)
  custom_domain         = "api.example.com"
  custom_domain_zone_id = "zone-id"
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| account_id | Cloudflare account ID | `string` | n/a | yes |
| worker_name | Name of the Cloudflare Worker | `string` | n/a | yes |
| worker_script | Content of the Worker script | `string` | n/a | yes |
| environment | Environment name | `string` | `"development"` | no |
| compatibility_date | Compatibility date for Workers runtime | `string` | `"2024-01-01"` | no |
| routes | Routes for the Worker | `list(object)` | `[]` | no |
| environment_variables | Environment variables for the Worker | `map(string)` | `{}` | no |
| kv_namespaces | KV namespace bindings | `list(object)` | `[]` | no |
| r2_buckets | R2 bucket bindings | `list(object)` | `[]` | no |
| service_bindings | Service bindings for other Workers | `list(object)` | `[]` | no |
| analytics_engine_datasets | Analytics Engine dataset bindings | `list(object)` | `[]` | no |
| custom_domain | Custom domain for the Worker | `string` | `null` | no |
| custom_domain_zone_id | Zone ID for the custom domain | `string` | `null` | no |

## Outputs

| Name | Description |
|------|-------------|
| worker_id | ID of the deployed Worker |
| worker_name | Name of the deployed Worker |
| worker_routes | Routes configured for the Worker |
| worker_url | Default URL for the Worker |
| custom_domain | Custom domain for the Worker (if configured) |

## Route Configuration

Routes determine which requests are handled by your Worker. Each route requires:

- `pattern`: The URL pattern (e.g., `example.com/*`, `*.example.com/api/*`)
- `zone_id`: The Cloudflare zone ID (required if using a zone-scoped route)

## Environment Variables

Environment variables are injected into your Worker at runtime. They're encrypted and stored securely by Cloudflare.

## KV Namespace Bindings

KV namespaces provide key-value storage for your Workers. To use them:

1. Create a KV namespace in Cloudflare
2. Add the binding to your module configuration
3. Access it in your Worker code via the binding name

## R2 Bucket Bindings

R2 buckets provide object storage for your Workers. Similar to KV, create the bucket first, then add the binding.

## Service Bindings

Service bindings allow Workers to call other Workers directly without going through the public internet. 