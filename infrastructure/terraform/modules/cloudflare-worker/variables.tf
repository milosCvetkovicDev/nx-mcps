variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "worker_name" {
  description = "Name of the Cloudflare Worker"
  type        = string
}

variable "worker_script" {
  description = "Content of the Worker script"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., development, staging, production)"
  type        = string
  default     = "development"
}

variable "compatibility_date" {
  description = "Compatibility date for the Workers runtime"
  type        = string
  default     = "2024-01-01"
}

variable "routes" {
  description = "Routes for the Worker"
  type = list(object({
    pattern = string
    zone_id = optional(string)
  }))
  default = []
}

variable "environment_variables" {
  description = "Environment variables for the Worker"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "kv_namespaces" {
  description = "KV namespace bindings"
  type = list(object({
    binding = string
    id      = string
  }))
  default = []
}

variable "r2_buckets" {
  description = "R2 bucket bindings"
  type = list(object({
    binding     = string
    bucket_name = string
  }))
  default = []
}

variable "service_bindings" {
  description = "Service bindings for other Workers"
  type = list(object({
    binding = string
    service = string
  }))
  default = []
}

variable "analytics_engine_datasets" {
  description = "Analytics Engine dataset bindings"
  type = list(object({
    binding = string
    dataset = string
  }))
  default = []
}

variable "custom_domain" {
  description = "Custom domain for the Worker"
  type        = string
  default     = null
}

variable "custom_domain_zone_id" {
  description = "Zone ID for the custom domain"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
} 