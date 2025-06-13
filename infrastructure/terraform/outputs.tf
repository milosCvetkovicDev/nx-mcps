# MCP Server-specific outputs are dynamically generated
# See affected-apps-outputs.tf (auto-generated)

output "deployed_mcp_servers" {
  description = "List of deployed MCP servers"
  value = try(
    jsondecode(file("${path.module}/affected-apps.json")).apps,
    []
  )
} 