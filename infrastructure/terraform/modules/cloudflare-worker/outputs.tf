output "worker_id" {
  description = "ID of the deployed Worker"
  value       = cloudflare_worker_script.worker.id
}

output "worker_name" {
  description = "Name of the deployed Worker"
  value       = cloudflare_worker_script.worker.name
}

output "worker_routes" {
  description = "Routes configured for the Worker"
  value = [
    for route in cloudflare_worker_route.routes : {
      pattern = route.pattern
      zone_id = route.zone_id
    }
  ]
}

output "worker_url" {
  description = "Default URL for the Worker"
  value       = "https://${var.worker_name}.${var.account_id}.workers.dev"
}

output "custom_domain" {
  description = "Custom domain for the Worker (if configured)"
  value       = var.custom_domain
} 