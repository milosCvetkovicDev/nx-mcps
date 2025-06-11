# Petstore API MCP Server - Quick Start Guide

Get up and running with the Petstore API MCP Server in 5 minutes!

## 🚀 Quick Setup

### 1. Build the Server

```bash
# Clone and setup
git clone <repository-url>
cd mcp
npm install

# Build the server
nx build petstore-api

# Verify build
ls dist/apps/petstore-api/main.js
```

### 2. Get Your Path

```bash
# Get absolute path (save this!)
pwd
# Example: /Users/john/projects/mcp
```

## 🤖 Claude Desktop Setup

### macOS

```bash
# Edit config
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Add this (replace path):
```json
{
  "mcpServers": {
    "petstore-api": {
      "command": "node",
      "args": ["/Users/john/projects/mcp/dist/apps/petstore-api/main.js"]
    }
  }
}
```

### Windows

```powershell
# Edit config
notepad "%APPDATA%\Claude\claude_desktop_config.json"
```

Add this (replace path):
```json
{
  "mcpServers": {
    "petstore-api": {
      "command": "node",
      "args": ["C:\\Users\\john\\projects\\mcp\\dist\\apps\\petstore-api\\main.js"]
    }
  }
}
```

### Test in Claude

1. Quit Claude completely (Cmd+Q / Alt+F4)
2. Restart Claude
3. Try: "What MCP tools are available?"

## 💻 Cursor IDE Setup

### Option 1: Global Settings

Press `Cmd+,` (macOS) or `Ctrl+,` (Windows), search "MCP", add:

```json
{
  "mcp.servers": {
    "petstore-api": {
      "command": "node",
      "args": ["/path/to/mcp/dist/apps/petstore-api/main.js"]
    }
  }
}
```

### Option 2: Project File

Create `.cursorrules` in your project:

```yaml
mcp_servers:
  petstore-api:
    command: node
    args:
      - /path/to/mcp/dist/apps/petstore-api/main.js
```

### Test in Cursor

Try: `@petstore-api list all endpoints`

## 📝 Example Usage

### In Claude

```
"Show me all available pets"
"Create a new dog named Max"
"Generate a Python client for the API"
```

### In Cursor

```
@petstore-api create a TypeScript pet manager
@petstore-api write tests for pet operations
@petstore-api generate API documentation
```

## 🔧 Troubleshooting

### Server won't start?
```bash
node --version  # Need v18+
nx build petstore-api --skip-nx-cache
```

### Not working in Claude?
```bash
# Test manually
node /your/path/dist/apps/petstore-api/main.js

# Check config syntax
python -m json.tool < ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Debug mode
```bash
LOG_LEVEL=debug node dist/apps/petstore-api/main.js
```

## 📚 More Resources

- Full documentation: `README.md`
- Integration details: `INTEGRATION-GUIDE.md`
- Examples: `EXAMPLES.md`

## 🎉 Success!

You should now have the Petstore API MCP Server running in Claude Desktop and/or Cursor IDE! 