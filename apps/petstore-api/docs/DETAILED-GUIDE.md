# Petstore API MCP Server - Comprehensive Guide

A complete guide for building, using, and integrating the Petstore API MCP Server with Claude Desktop and Cursor IDE.

## Table of Contents

1. [Introduction](#introduction)
2. [What is MCP?](#what-is-mcp)
3. [Getting Started](#getting-started)
4. [Building the Application](#building-the-application)
5. [Running the Server](#running-the-server)
6. [Claude Desktop Integration](#claude-desktop-integration)
7. [Cursor IDE Integration](#cursor-ide-integration)
8. [Using the Server](#using-the-server)
9. [Advanced Configuration](#advanced-configuration)
10. [Troubleshooting](#troubleshooting)
11. [Development Workflow](#development-workflow)
12. [Examples and Use Cases](#examples-and-use-cases)

## Introduction

The Petstore API MCP Server is a TypeScript application that bridges AI assistants (like Claude) with REST APIs. It automatically generates tools from OpenAPI specifications, enabling AI assistants to interact with APIs naturally through conversation.

### Key Benefits

- **No Code Required**: AI assistants can call APIs without writing code
- **Dynamic Tool Generation**: Automatically creates tools from OpenAPI specs
- **Type Safety**: Full TypeScript support ensures reliability
- **Intelligent Caching**: Improves performance and reduces API calls
- **Error Handling**: Built-in retry logic and graceful error handling

## What is MCP?

Model Context Protocol (MCP) is an open protocol that enables seamless integration between AI applications and external tools/data sources. MCP servers:

- Provide **tools** that AI can invoke
- Expose **resources** (documents, data)
- Offer **prompts** for common tasks
- Use standard communication protocols (stdio, HTTP)

## Getting Started

### Prerequisites

Ensure you have the following installed:

```bash
# Check Node.js version (requires 18+)
node --version

# Check npm version (requires 8+)
npm --version

# Verify installation
which node
which npm
```

If you need to install Node.js, visit [nodejs.org](https://nodejs.org/).

### Repository Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd mcp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Verify Nx Installation**:
   ```bash
   npx nx --version
   ```

## Building the Application

### Step-by-Step Build Process

1. **Clean Previous Builds** (optional):
   ```bash
   rm -rf dist/apps/petstore-api
   ```

2. **Build for Development**:
   ```bash
   nx build petstore-api
   ```

3. **Build for Production**:
   ```bash
   nx build petstore-api --configuration=production
   ```

4. **Verify Build Output**:
   ```bash
   # List build files
   ls -la dist/apps/petstore-api/
   
   # Check file size
   du -sh dist/apps/petstore-api/
   ```

### Build Output Structure

```
dist/apps/petstore-api/
├── main.js                 # Main entry point
├── package.json            # Package metadata
├── resources/              # Resource handlers
│   └── resource-handler.js
├── tools/                  # Tool implementations
│   ├── openapi-loader.js
│   └── tool-executor.js
├── prompts/                # Prompt handlers
│   └── prompt-handler.js
├── utils/                  # Utilities
│   ├── cache.js
│   ├── config.js
│   ├── http-client.js
│   └── logger.js
└── types/                  # Type definitions
    └── index.js
```

## Running the Server

### Development Mode

Run with hot-reloading for development:

```bash
# Using Nx
nx serve petstore-api

# With environment variables
LOG_LEVEL=debug nx serve petstore-api

# With custom API base
PETSTORE_API_BASE=https://petstore3.swagger.io nx serve petstore-api
```

### Production Mode

Run the built server:

```bash
# Basic run
node dist/apps/petstore-api/main.js

# With full configuration
NODE_ENV=production \
LOG_LEVEL=info \
CACHE_TTL=600000 \
PETSTORE_API_BASE=https://petstore3.swagger.io \
node dist/apps/petstore-api/main.js
```

### Using MCP Inspector

Test your server with the MCP Inspector:

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run with inspector
npx @modelcontextprotocol/inspector node dist/apps/petstore-api/main.js
```

The inspector provides:
- Interactive tool testing
- Resource browsing
- Prompt execution
- Real-time logging

## Claude Desktop Integration

### Step 1: Find Configuration File

The configuration file location depends on your operating system:

**macOS**:
```bash
# Open configuration directory
open ~/Library/Application\ Support/Claude/

# Edit configuration
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**:
```powershell
# Open configuration directory
explorer %APPDATA%\Claude

# Edit configuration
notepad %APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```bash
# Edit configuration
nano ~/.config/Claude/claude_desktop_config.json
```

### Step 2: Get Absolute Path

Find the absolute path to your built server:

```bash
# macOS/Linux
cd /path/to/your/mcp
pwd
# Example output: /Users/username/projects/mcp

# Windows (PowerShell)
cd C:\path\to\your\mcp
$PWD.Path
# Example output: C:\Users\username\projects\mcp
```

### Step 3: Configure Claude Desktop

Create or edit the configuration file:

```json
{
  "mcpServers": {
    "petstore-api": {
      "command": "node",
      "args": ["/Users/username/projects/mcp/dist/apps/petstore-api/main.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "PETSTORE_API_BASE": "https://petstore3.swagger.io",
        "CACHE_TTL": "300000",
        "MAX_RETRIES": "3",
        "REQUEST_TIMEOUT": "30000"
      }
    }
  }
}
```

**Important**: Replace the path in `args` with your actual absolute path.

### Step 4: Restart Claude Desktop

1. **Quit Claude Completely**:
   - macOS: `Cmd+Q` or Claude → Quit Claude
   - Windows: Right-click system tray → Exit
   - Linux: Close all windows and kill process

2. **Start Claude Desktop**:
   - Launch from Applications/Start Menu

3. **Verify Connection**:
   - Look for "MCP" indicator in Claude
   - Check server logs for connection

### Step 5: Test Integration

In Claude, try these commands:

```
"What tools are available from the petstore API?"

"List all available pets in the store"

"Create a new pet named Buddy"

"Generate a Python client for the petstore API"
```

## Cursor IDE Integration

### Method 1: Settings Configuration

1. **Open Cursor Settings**:
   - Press `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
   - Or: File → Preferences → Settings

2. **Search for MCP**:
   - Type "MCP" in search bar
   - Click "Edit in settings.json"

3. **Add Configuration**:
   ```json
   {
     "mcp.servers": {
       "petstore-api": {
         "command": "node",
         "args": ["/absolute/path/to/dist/apps/petstore-api/main.js"],
         "env": {
           "NODE_ENV": "production",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

### Method 2: Project Configuration

1. **Create `.cursorrules` in Project Root**:
   ```yaml
   mcp_servers:
     petstore-api:
       command: node
       args:
         - /absolute/path/to/dist/apps/petstore-api/main.js
       env:
         NODE_ENV: production
         LOG_LEVEL: info
         PETSTORE_API_BASE: https://petstore3.swagger.io
   ```

2. **Alternative JSON Format**:
   ```json
   {
     "mcp_servers": {
       "petstore-api": {
         "command": "node",
         "args": ["/absolute/path/to/dist/apps/petstore-api/main.js"],
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

### Method 3: Workspace Configuration

1. **Create `.vscode/settings.json`**:
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

1. **Open AI Panel**:
   - Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux)

2. **Reference the Server**:
   ```
   @petstore-api list all endpoints
   
   @petstore-api create a TypeScript client
   
   @petstore-api write tests for pet operations
   ```

3. **Inline Usage**:
   - Type `@petstore-api` in editor
   - Autocomplete will show available commands

## Using the Server

### Available Tools

The server dynamically generates tools from the OpenAPI spec:

#### Pet Operations
- **addPet**: Add a new pet to the store
- **updatePet**: Update an existing pet
- **findPetsByStatus**: Find pets by status
- **findPetsByTags**: Find pets by tags
- **getPetById**: Get a pet by ID
- **updatePetWithForm**: Update pet with form data
- **deletePet**: Delete a pet
- **uploadFile**: Upload pet image

#### Store Operations
- **getInventory**: Get store inventory
- **placeOrder**: Place a new order
- **getOrderById**: Find order by ID
- **deleteOrder**: Delete an order

#### User Operations
- **createUser**: Create user
- **createUsersWithListInput**: Create multiple users
- **loginUser**: Log user in
- **logoutUser**: Log user out
- **getUserByName**: Get user by username
- **updateUser**: Update user
- **deleteUser**: Delete user

### Available Resources

Access these resources for documentation:

1. **OpenAPI Specification**:
   ```
   URI: openapi://specification
   Description: Complete OpenAPI spec in JSON
   ```

2. **API Endpoints**:
   ```
   URI: openapi://endpoints
   Description: Human-readable endpoint list
   ```

3. **Data Schemas**:
   ```
   URI: openapi://schemas
   Description: JSON schemas for all models
   ```

4. **Available Tools**:
   ```
   URI: openapi://tools
   Description: List of all MCP tools
   ```

### Available Prompts

Use these prompts for common tasks:

1. **API Explorer** (`api-explorer`):
   - Explore endpoints interactively
   - Test API operations
   - View example responses

2. **Generate Client** (`generate-client`):
   - Generate API clients
   - Support for multiple languages
   - Include error handling

3. **Test Scenario** (`test-scenario`):
   - Create test suites
   - Cover edge cases
   - Generate test data

4. **API Documentation** (`api-documentation`):
   - Generate documentation
   - Multiple formats
   - Include examples

## Advanced Configuration

### Environment Variables

Full list of configuration options:

```bash
# API Configuration
PETSTORE_API_BASE=https://petstore3.swagger.io  # API base URL
OPENAPI_SPEC_URL=/api/v3/openapi.json          # OpenAPI spec path

# Caching
CACHE_TTL=300000                                # Cache TTL (5 minutes)
CACHE_MAX_SIZE=100                              # Max cached items

# HTTP Client
MAX_RETRIES=3                                   # Retry attempts
RETRY_DELAY=1000                                # Initial retry delay (ms)
REQUEST_TIMEOUT=30000                           # Request timeout (ms)
CONNECTION_TIMEOUT=5000                         # Connection timeout (ms)

# Logging
LOG_LEVEL=info                                  # debug, info, warn, error
LOG_FORMAT=json                                 # json, text
LOG_FILE=/var/log/petstore-api.log             # Log file path

# Performance
CONCURRENT_REQUESTS=10                          # Max concurrent requests
RATE_LIMIT=100                                  # Requests per minute

# Development
NODE_ENV=production                             # production, development
DEBUG=false                                     # Enable debug mode
```

### Configuration Profiles

Create environment-specific configurations:

**Development** (`.env.development`):
```bash
NODE_ENV=development
LOG_LEVEL=debug
CACHE_TTL=0
REQUEST_TIMEOUT=60000
DEBUG=true
```

**Production** (`.env.production`):
```bash
NODE_ENV=production
LOG_LEVEL=warn
CACHE_TTL=900000
REQUEST_TIMEOUT=10000
DEBUG=false
```

**Testing** (`.env.test`):
```bash
NODE_ENV=test
LOG_LEVEL=error
CACHE_TTL=0
REQUEST_TIMEOUT=5000
```

### Load Configuration:
```bash
# Load specific environment
source .env.production && node dist/apps/petstore-api/main.js
```

## Troubleshooting

### Common Issues

#### 1. Server Won't Start

**Symptoms**: Error when running `node dist/apps/petstore-api/main.js`

**Solutions**:
```bash
# Check if built
ls dist/apps/petstore-api/main.js

# Rebuild if missing
nx build petstore-api

# Check Node version
node --version  # Must be 18+

# Check for port conflicts
lsof -i :3000  # If using HTTP transport
```

#### 2. Claude Desktop Not Connecting

**Symptoms**: No MCP indicator in Claude

**Solutions**:
```bash
# Verify config file exists
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Check JSON syntax
python -m json.tool < ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Test server manually
node dist/apps/petstore-api/main.js

# Check logs
LOG_LEVEL=debug node dist/apps/petstore-api/main.js
```

#### 3. API Calls Failing

**Symptoms**: Tools return errors

**Solutions**:
```bash
# Test API connectivity
curl https://petstore3.swagger.io/api/v3/openapi.json

# Increase timeout
REQUEST_TIMEOUT=60000 node dist/apps/petstore-api/main.js

# Disable cache
CACHE_TTL=0 node dist/apps/petstore-api/main.js

# Enable debug logging
LOG_LEVEL=debug node dist/apps/petstore-api/main.js
```

#### 4. Cursor Integration Issues

**Symptoms**: @petstore-api not working

**Solutions**:
1. Restart Cursor IDE
2. Check settings.json syntax
3. Verify absolute path is correct
4. Check Cursor logs: Help → Toggle Developer Tools

### Debug Mode

Enable comprehensive debugging:

```bash
DEBUG=* \
LOG_LEVEL=debug \
NODE_ENV=development \
node dist/apps/petstore-api/main.js 2>&1 | tee debug.log
```

### Log Analysis

```bash
# View recent errors
grep -i error debug.log | tail -20

# Check connection attempts
grep -i "connect" debug.log

# Monitor in real-time
tail -f debug.log | grep -E "(error|warn|connect)"
```

## Development Workflow

### 1. Setting Up Development

```bash
# Clone and setup
git clone <repo>
cd mcp
npm install

# Create feature branch
git checkout -b feature/my-feature

# Start development server
nx serve petstore-api
```

### 2. Making Changes

```bash
# Edit source files
code apps/petstore-api/src/

# Run tests continuously
nx test petstore-api --watch

# Check types
nx typecheck petstore-api

# Lint code
nx lint petstore-api
```

### 3. Testing Changes

```bash
# Unit tests
nx test petstore-api

# Integration test with inspector
npx @modelcontextprotocol/inspector nx serve petstore-api

# Manual testing
LOG_LEVEL=debug nx serve petstore-api
```

### 4. Building and Deploying

```bash
# Build for production
nx build petstore-api --configuration=production

# Run production build
NODE_ENV=production node dist/apps/petstore-api/main.js

# Package for distribution
tar -czf petstore-api.tar.gz dist/apps/petstore-api/
```

## Examples and Use Cases

### Example 1: Pet Management

In Claude or Cursor:

```
User: "I need to manage pets in the store. First, show me all available pets." 