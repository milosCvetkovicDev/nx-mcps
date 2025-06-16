# Staging Environment Configuration
environment = "staging"

# MCP server-specific configurations are dynamically generated
# based on affected applications. Add configurations here
# using the pattern: {app_name}_routes, {app_name}_env_vars, etc.
# where app_name is the sanitized project name (e.g., petstore_api)

# Petstore API configuration
petstore_api_routes = []

# Environment variables for petstore API
petstore_api_env_vars = {
  NODE_ENV    = "staging"
  API_VERSION = "v1"
  LOG_LEVEL   = "info"
  CORS_ORIGIN = "*"
  RATE_LIMIT  = "1000"
}

# Optional: KV namespaces and R2 buckets
petstore_api_kv_namespaces = []
petstore_api_r2_buckets    = [] 