terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.26"
    }
  }
}

# Local variables for processing
locals {
  # Read the worker script content
  worker_content = try(file(var.worker_script), var.worker_script)

  # Determine if we're using modules format
  is_module_format = can(regex("export\\s+default\\s+{", local.worker_content))
  
  # Handle environment variables - ensure it's always a proper map
  env_vars = var.environment_variables != null ? var.environment_variables : {}
}

# Create the Worker script
resource "cloudflare_workers_script" "worker" {
  account_id = var.account_id
  name       = var.worker_name
  content    = local.worker_content

  # Set compatibility date for Workers runtime
  compatibility_date = var.compatibility_date

  # Module format for ES modules
  module = local.is_module_format

  # Environment variables - Currently commented out due to provider limitations
  # The plain_text_binding block doesn't support dynamic blocks properly
  # TODO: Uncomment and add individual plain_text_binding blocks as needed
  # plain_text_binding {
  #   name = "ENVIRONMENT"
  #   text = var.environment
  # }

  # KV namespace bindings
  dynamic "kv_namespace_binding" {
    for_each = var.kv_namespaces
    content {
      name         = kv_namespace_binding.value.binding
      namespace_id = kv_namespace_binding.value.id
    }
  }

  # R2 bucket bindings
  dynamic "r2_bucket_binding" {
    for_each = var.r2_buckets
    content {
      name        = r2_bucket_binding.value.binding
      bucket_name = r2_bucket_binding.value.bucket_name
    }
  }

  # Durable Object bindings
  dynamic "service_binding" {
    for_each = var.service_bindings
    content {
      name    = service_binding.value.binding
      service = service_binding.value.service
    }
  }

  # Analytics engine bindings
  dynamic "analytics_engine_binding" {
    for_each = var.analytics_engine_datasets
    content {
      name    = analytics_engine_binding.value.binding
      dataset = analytics_engine_binding.value.dataset
    }
  }
}

# Create routes for the worker
resource "cloudflare_workers_route" "routes" {
  for_each = { for idx, route in var.routes : idx => route }

  zone_id     = each.value.zone_id
  pattern     = each.value.pattern
  script_name = cloudflare_workers_script.worker.name
}

# Create a custom domain for the worker (optional)
resource "cloudflare_workers_domain" "domain" {
  count = var.custom_domain != null ? 1 : 0

  account_id = var.account_id
  hostname   = var.custom_domain
  service    = cloudflare_workers_script.worker.name
  zone_id    = var.custom_domain_zone_id
} 