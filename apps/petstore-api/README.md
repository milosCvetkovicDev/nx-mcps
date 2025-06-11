# Petstore API MCP Server

A powerful MCP (Model Context Protocol) server that provides seamless integration with the Petstore API via OpenAPI/Swagger specification. This server enables AI assistants like Claude to interact with REST APIs dynamically.

## 📚 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Build](#installation--build)
- [Usage Guide](#usage-guide)
- [Claude Desktop Integration](#claude-desktop-integration)
- [Cursor IDE Integration](#cursor-ide-integration)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Overview

The Petstore API MCP Server is a TypeScript-based Model Context Protocol server that automatically generates tools, resources, and prompts from OpenAPI specifications. It acts as a bridge between AI assistants and REST APIs.

### What is MCP?

Model Context Protocol (MCP) is an open protocol that enables seamless integration between AI applications and external tools/data sources. This server implements MCP to provide:

- **Dynamic API Integration**: Automatically generates tools from OpenAPI specs
- **Intelligent Caching**: Reduces API calls and improves performance
- **Error Resilience**: Built-in retry logic and error handling
- **Type Safety**: Full TypeScript support

## Features

### 🛠️ Dynamic Tool Generation

Automatically creates MCP tools for every API endpoint:

**Pet Operations**:
- `addPet` - Add a new pet to the store
- `updatePet` - Update an existing pet
- `findPetsByStatus` - Find pets by status
- `findPetsByTags` - Find pets by tags
- `getPetById` - Get a specific pet by ID
- `deletePet` - Delete a pet

**Store Operations**:
- `getInventory` - Get store inventory
- `placeOrder` - Place a new order
- `getOrderById` - Find purchase order by ID
- `deleteOrder` - Delete purchase order

**User Operations**:
- `createUser` - Create a new user
- `getUserByName` - Get user by username
- `updateUser` - Update user information
- `deleteUser` - Delete user
- `loginUser` - Log user into the system
- `logoutUser` - Log out current user

### 📚 Resources

- **OpenAPI Specification** (`openapi://specification`) - Complete API spec in JSON
- **API Endpoints** (`openapi://endpoints`) - Human-readable endpoint list
- **Data Schemas** (`openapi://schemas`) - JSON schemas for all models
- **Available Tools** (`openapi://tools`) - List of all MCP tools

### 💬 Intelligent Prompts

- **API Explorer** (`api-explorer`) - Interactive API exploration
- **Generate Client** (`generate-client`) - Generate API client code
- **Test Scenario** (`test-scenario`) - Create comprehensive test scenarios
- **API Documentation** (`api-documentation`) - Generate human-readable docs

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For cloning the repository
- **Internet Connection**: Required for API calls

```bash
# Check prerequisites
node --version  # Should be v18+
npm --version   # Should be v8+
```

## Installation & Build

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd mcp

# Install dependencies
npm install
```

### 2. Build the Server

```bash
# Build for development
nx build petstore-api

# Build for production
nx build petstore-api --configuration=production

# Alternative using npm
npm run build -- petstore-api
```

### 3. Verify Build

```bash
# Check build output
ls -la dist/apps/petstore-api/
# Should see: main.js and other module files
```

## Usage Guide

### Development Mode

```bash
# Run with hot reload
nx serve petstore-api

# With debug logging
LOG_LEVEL=debug nx serve petstore-api
```

### Production Mode

```bash
# Run built server
node dist/apps/petstore-api/main.js

# With environment variables
NODE_ENV=production \
LOG_LEVEL=info \
CACHE_TTL=600000 \
node dist/apps/petstore-api/main.js
```

### Testing with MCP Inspector

```bash
# Install inspector
npm install -g @modelcontextprotocol/inspector

# Run with inspector
npx @modelcontextprotocol/inspector node dist/apps/petstore-api/main.js
```

## Claude Desktop Integration

### Step 1: Get Your Absolute Path

```bash
# macOS/Linux
cd /path/to/your/mcp
pwd
# Example: /Users/username/projects/mcp

# Windows
cd C:\path\to\your\mcp
echo %CD%
# Example: C:\Users\username\projects\mcp
```

### Step 2: Configure Claude Desktop

**macOS**:
```bash
# Edit configuration
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**:
```powershell
# Edit configuration
notepad "%APPDATA%\Claude\claude_desktop_config.json"
```

**Linux**:
```bash
# Edit configuration
nano ~/.config/Claude/claude_desktop_config.json
```

### Step 3: Add Configuration

```json
{
  "mcpServers": {
    "petstore-api": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/dist/apps/petstore-api/main.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "PETSTORE_API_BASE": "https://petstore3.swagger.io"
      }
    }
  }
}
```

### Step 4: Restart Claude

1. Completely quit Claude (Cmd+Q on macOS)
2. Restart Claude Desktop
3. Look for MCP indicator

### Step 5: Test Integration

In Claude, try:
- "What MCP tools are available?"
- "Show me all available pets"
- "Create a new pet named Max"

## Cursor IDE Integration

### Method 1: Global Settings

1. Open settings: `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
2. Search for "MCP"
3. Edit settings.json:

```json
{
  "mcp.servers": {
    "petstore-api": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/dist/apps/petstore-api/main.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Method 2: Project Configuration

Create `.cursorrules` in project root:

```yaml
mcp_servers:
  petstore-api:
    command: node
    args:
      - /absolute/path/to/mcp/dist/apps/petstore-api/main.js
    env:
      NODE_ENV: production
      LOG_LEVEL: info
```

### Method 3: Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "petstore-api": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/apps/petstore-api/main.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Using in Cursor

```
@petstore-api list all endpoints
@petstore-api create a TypeScript client for pets
@petstore-api generate tests for store operations
```

## Configuration

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PETSTORE_API_BASE` | API base URL | `https://petstore3.swagger.io` | Custom API URL |
| `CACHE_TTL` | Cache time (ms) | `300000` | `600000` (10 min) |
| `MAX_RETRIES` | Retry attempts | `3` | `5` |
| `RETRY_DELAY` | Retry delay (ms) | `1000` | `2000` |
| `REQUEST_TIMEOUT` | Timeout (ms) | `30000` | `60000` |
| `LOG_LEVEL` | Log level | `info` | `debug`, `warn`, `error` |

### Configuration Examples

**Development**:
```bash
CACHE_TTL=0 \
LOG_LEVEL=debug \
node dist/apps/petstore-api/main.js
```

**Production**:
```bash
NODE_ENV=production \
CACHE_TTL=900000 \
LOG_LEVEL=warn \
node dist/apps/petstore-api/main.js
```

## Architecture

```
petstore-api/
├── src/
│   ├── main.ts              # Server entry point
│   ├── types/               # TypeScript types
│   ├── utils/               # Utilities
│   │   ├── cache.ts         # Caching logic
│   │   ├── config.ts        # Configuration
│   │   ├── http-client.ts   # HTTP client
│   │   └── logger.ts        # Logging
│   ├── tools/               # Tool handlers
│   │   ├── openapi-loader.ts
│   │   └── tool-executor.ts
│   ├── resources/           # Resource providers
│   └── prompts/             # Prompt handlers
```

## Development

### Setup Development Environment

```bash
# Install Nx CLI globally
npm install -g nx

# Run in development
nx serve petstore-api

# Run tests
nx test petstore-api

# Check types
nx typecheck petstore-api
```

### Adding Custom Features

**Custom Tool**:
```typescript
// src/tools/custom-tool.ts
export function createCustomTool() {
  return {
    name: 'customTool',
    description: 'My custom tool',
    parameters: [...],
    execute: async (params) => {
      // Implementation
    }
  };
}
```

## Troubleshooting

### Common Issues

**Server not starting**:
```bash
# Check Node version
node --version  # Must be 18+

# Rebuild
nx build petstore-api --skip-nx-cache

# Check permissions
chmod +x dist/apps/petstore-api/main.js
```

**Claude not connecting**:
```bash
# Validate JSON config
python -m json.tool < ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Test server manually
node /absolute/path/to/dist/apps/petstore-api/main.js
```

**API errors**:
```bash
# Test connectivity
curl https://petstore3.swagger.io/api/v3/openapi.json

# Enable debug logging
LOG_LEVEL=debug node dist/apps/petstore-api/main.js
```

### Debug Mode

```bash
# Full debug output
DEBUG=* \
LOG_LEVEL=debug \
node dist/apps/petstore-api/main.js 2>&1 | tee debug.log
```

## Examples

### Using in Claude

```
User: "Show me all available pets"
Claude: [Uses findPetsByStatus tool with status='available']

User: "Create a new dog named Buddy"
Claude: [Uses addPet tool with pet details]

User: "Generate a Python client for the pet API"
Claude: [Uses generate-client prompt with language='python']
```

### Using in Cursor

```
@petstore-api create a function to fetch all pets

@petstore-api write Jest tests for pet CRUD operations

@petstore-api generate TypeScript interfaces for all models
```

## Additional Resources

- **Quick Start Guide**: See `docs/QUICK-START.md` for rapid setup
- **Integration Guide**: See `docs/INTEGRATION-GUIDE.md` for detailed setup
- **Examples**: See `docs/EXAMPLES.md` for practical use cases
- **Detailed Guide**: See `docs/DETAILED-GUIDE.md` for comprehensive walkthrough
- **API Documentation**: Available via `api-documentation` prompt
- **MCP SDK Docs**: https://github.com/modelcontextprotocol/sdk
- **OpenAPI Spec**: https://petstore3.swagger.io

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs with `LOG_LEVEL=debug`
3. Use MCP Inspector for testing
4. Create an issue with:
   - Environment details
   - Error messages
   - Steps to reproduce