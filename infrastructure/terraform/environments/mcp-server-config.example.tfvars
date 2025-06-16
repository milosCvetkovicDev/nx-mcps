# Example MCP Server Configuration
# Copy this file and customize for your specific MCP servers

# Example for petstore-api MCP server
petstore_api_routes = [
  {
    pattern = "petstore.example.com/*"
    zone_id = "your-zone-id"
  }
]

petstore_api_env_vars = {
  NODE_ENV        = "production"
  API_VERSION     = "v1"
  LOG_LEVEL       = "info"
  CORS_ORIGIN     = "https://example.com"
  RATE_LIMIT      = "1000"
  
  # MCP-specific settings
  MCP_AUTH_TOKEN  = "your-secret-token"  # Optional authentication
  MCP_MAX_TIMEOUT = "30000"              # Max timeout in ms
}

petstore_api_kv_namespaces = [
  {
    binding = "RATE_LIMITER"  # For rate limiting
    id      = "your-kv-namespace-id"
  },
  {
    binding = "CACHE"         # For caching responses
    id      = "your-cache-namespace-id"
  }
]

petstore_api_r2_buckets = []

# Example for another MCP server (weather-api)
weather_api_routes = [
  {
    pattern = "weather.example.com/*"
    zone_id = "your-zone-id"
  }
]

weather_api_env_vars = {
  NODE_ENV           = "production"
  API_VERSION        = "v1"
  WEATHER_API_KEY    = "your-weather-api-key"
  CACHE_TTL_SECONDS  = "300"
}

weather_api_kv_namespaces = [
  {
    binding = "WEATHER_CACHE"
    id      = "weather-cache-namespace-id"
  }
]

weather_api_r2_buckets = []

# Common pattern for MCP servers:
# {app_name}_routes          - Cloudflare routes
# {app_name}_env_vars        - Environment variables
# {app_name}_kv_namespaces   - KV namespace bindings
# {app_name}_r2_buckets      - R2 bucket bindings
#
# Where app_name is the sanitized project name:
# - @./my-app becomes my_app
# - @scope/package becomes scope_package 