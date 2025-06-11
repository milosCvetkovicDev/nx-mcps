# Petstore API MCP Server Integration Guide

This guide provides detailed instructions for integrating the Petstore API MCP Server with Claude Desktop and Cursor IDE.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- MCP workspace cloned and dependencies installed
- Petstore API server built (`nx build petstore-api`)

### Build Commands
```bash
# Clone repository
git clone <repository-url>
cd mcp

# Install dependencies
npm install

# Build the petstore-api server
nx build petstore-api

# Verify build
ls dist/apps/petstore-api/main.js
```

## Claude Desktop Integration

### macOS Setup

1. **Find your absolute path**:
   ```bash
   cd /path/to/your/mcp
   pwd
   # Example: /Users/john/projects/mcp
   ```

2. **Open Claude configuration**:
   ```bash
   # Create config directory if it doesn't exist
   mkdir -p ~/Library/Application\ Support/Claude
   
   # Edit configuration
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Add this configuration** (replace the path):
   ```json
   {
     "mcpServers": {
       "petstore-api": {
         "command": "node",
         "args": ["/Users/john/projects/mcp/dist/apps/petstore-api/main.js"],
         "env": {
           "NODE_ENV": "production",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**:
   - Press `Cmd+Q` to quit Claude completely
   - Reopen Claude from Applications

### Windows Setup

1. **Find your absolute path**:
   ```powershell
   cd C:\path\to\your\mcp
   echo $PWD.Path
   # Example: C:\Users\john\projects\mcp
   ```

2. **Open Claude configuration**:
   ```powershell
   # Create config directory if needed
   mkdir "$env:APPDATA\Claude" -Force
   
   # Edit configuration
   notepad "$env:APPDATA\Claude\claude_desktop_config.json"
   ```

3. **Add this configuration** (replace the path):
   ```json
   {
     "mcpServers": {
       "petstore-api": {
         "command": "node",
         "args": ["C:\\Users\\john\\projects\\mcp\\dist\\apps\\petstore-api\\main.js"],
         "env": {
           "NODE_ENV": "production",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**:
   - Right-click Claude in system tray → Exit
   - Restart Claude from Start Menu

### Linux Setup

1. **Find your absolute path**:
   ```bash
   cd /path/to/your/mcp
   pwd
   # Example: /home/john/projects/mcp
   ```

2. **Open Claude configuration**:
   ```bash
   # Create config directory if needed
   mkdir -p ~/.config/Claude
   
   # Edit configuration
   nano ~/.config/Claude/claude_desktop_config.json
   ```

3. **Add this configuration** (replace the path):
   ```json
   {
     "mcpServers": {
       "petstore-api": {
         "command": "node",
         "args": ["/home/john/projects/mcp/dist/apps/petstore-api/main.js"],
         "env": {
           "NODE_ENV": "production",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

### Verifying Claude Integration

After restarting Claude, test with these prompts:

```
"What MCP tools are available?"

"Show me all pets with status 'available'"

"Create a new pet named Max"

"Generate a Python script to interact with the petstore API"
```

## Cursor IDE Integration

### Method 1: Global Settings

1. **Open Settings**:
   - Press `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
   - Search for "MCP"

2. **Edit settings.json**:
   ```json
   {
     "mcp.servers": {
       "petstore-api": {
         "command": "node",
         "args": ["/absolute/path/to/mcp/dist/apps/petstore-api/main.js"],
         "env": {
           "NODE_ENV": "production",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

### Method 2: Project-Specific Configuration

1. **Create `.cursorrules` in your project root**:
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

2. **Or use JSON format**:
   ```json
   {
     "mcp_servers": {
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

### Method 3: Workspace Settings

1. **Create `.vscode/settings.json` in your workspace**:
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

1. **Open AI Assistant**:
   - Press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux)

2. **Reference the server**:
   ```
   @petstore-api list all available endpoints
   
   @petstore-api create a TypeScript client for pet operations
   
   @petstore-api generate integration tests
   ```

## Environment Variables

### Basic Configuration

```bash
# Minimal configuration
NODE_ENV=production
LOG_LEVEL=info

# Full configuration
PETSTORE_API_BASE=https://petstore3.swagger.io
CACHE_TTL=300000        # 5 minutes
MAX_RETRIES=3
RETRY_DELAY=1000        # 1 second
REQUEST_TIMEOUT=30000   # 30 seconds
LOG_LEVEL=info
```

### Configuration in Claude Desktop

```json
{
  "mcpServers": {
    "petstore-api": {
      "command": "node",
      "args": ["/path/to/dist/apps/petstore-api/main.js"],
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

### Configuration in Cursor

```json
{
  "mcp.servers": {
    "petstore-api": {
      "command": "node",
      "args": ["/path/to/dist/apps/petstore-api/main.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "PETSTORE_API_BASE": "https://petstore3.swagger.io",
        "CACHE_TTL": "300000"
      }
    }
  }
}
```

## Testing Your Integration

### Manual Testing

1. **Test the server directly**:
   ```bash
   node dist/apps/petstore-api/main.js
   ```

2. **Test with MCP Inspector**:
   ```bash
   npx @modelcontextprotocol/inspector node dist/apps/petstore-api/main.js
   ```

### Testing in Claude

Try these prompts:

```
"What tools does the petstore API provide?"

"Find all pets with status 'available'"

"Add a new pet named Buddy that is a golden retriever"

"Show me the inventory of the pet store"

"Generate a Python client to interact with the pet endpoints"
```

### Testing in Cursor

Use these commands:

```
@petstore-api Show me all API endpoints

@petstore-api Create a TypeScript interface for the Pet model

@petstore-api Write a function to fetch all available pets

@petstore-api Generate Jest tests for pet CRUD operations
```

## Troubleshooting

### Claude Desktop Issues

#### Server not appearing in Claude

1. **Check configuration syntax**:
   ```bash
   # macOS/Linux
   python3 -m json.tool < ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Windows
   python -m json.tool < "$env:APPDATA\Claude\claude_desktop_config.json"
   ```

2. **Verify path is absolute**:
   - Path must start with `/` on macOS/Linux
   - Path must include drive letter on Windows (e.g., `C:\`)

3. **Check server runs manually**:
   ```bash
   node /absolute/path/to/dist/apps/petstore-api/main.js
   ```

4. **Enable debug logging**:
   ```json
   {
     "mcpServers": {
       "petstore-api": {
         "command": "node",
         "args": ["/path/to/dist/apps/petstore-api/main.js"],
         "env": {
           "LOG_LEVEL": "debug"
         }
       }
     }
   }
   ```

### Cursor IDE Issues

#### @petstore-api not recognized

1. **Restart Cursor**:
   - Close all Cursor windows
   - Reopen Cursor

2. **Check Developer Tools**:
   - Help → Toggle Developer Tools
   - Look for MCP-related errors

3. **Verify settings location**:
   - Global: `~/.config/Code/User/settings.json`
   - Workspace: `.vscode/settings.json`
   - Project: `.cursorrules`

4. **Test with simple config**:
   ```json
   {
     "mcp.servers": {
       "test": {
         "command": "echo",
         "args": ["test"]
       }
     }
   }
   ```

### Common Error Messages

#### "Tool not found"
- Server may not be running
- OpenAPI spec failed to load
- Check internet connectivity

#### "Connection refused"
- Wrong path in configuration
- Server failed to start
- Check Node.js version

#### "Permission denied"
- File permissions issue
- Run: `chmod +x dist/apps/petstore-api/main.js`

#### "Module not found"
- Dependencies not installed
- Build incomplete
- Run: `nx build petstore-api --skip-nx-cache`

## Best Practices

### For Claude Desktop

1. **Use production configuration**:
   ```json
   "env": {
     "NODE_ENV": "production",
     "LOG_LEVEL": "info"
   }
   ```

2. **Set appropriate cache TTL**:
   - Development: `"CACHE_TTL": "0"`
   - Production: `"CACHE_TTL": "300000"`

3. **Monitor logs**:
   ```bash
   # View Claude logs
   tail -f ~/Library/Logs/Claude/mcp-*.log
   ```

### For Cursor IDE

1. **Use workspace-relative paths when possible**:
   ```json
   "args": ["${workspaceFolder}/dist/apps/petstore-api/main.js"]
   ```

2. **Configure per-project**:
   - Use `.cursorrules` for project-specific servers
   - Use global settings for commonly used servers

3. **Enable IntelliSense**:
   - Cursor can provide completions for @petstore-api commands

## Advanced Usage

### Custom API Endpoints

To use with a different API:

```json
{
  "env": {
    "PETSTORE_API_BASE": "https://your-api.com",
    "OPENAPI_SPEC_URL": "/swagger.json"
  }
}
```

### Multiple Server Instances

Run multiple instances with different configs:

```json
{
  "mcpServers": {
    "petstore-dev": {
      "command": "node",
      "args": ["/path/to/main.js"],
      "env": {
        "PETSTORE_API_BASE": "https://dev-api.com",
        "LOG_LEVEL": "debug"
      }
    },
    "petstore-prod": {
      "command": "node",
      "args": ["/path/to/main.js"],
      "env": {
        "PETSTORE_API_BASE": "https://prod-api.com",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

### Performance Optimization

For better performance:

```json
{
  "env": {
    "CACHE_TTL": "900000",      // 15 minutes
    "MAX_RETRIES": "2",         // Fewer retries
    "REQUEST_TIMEOUT": "10000", // Shorter timeout
    "LOG_LEVEL": "warn"         // Less logging
  }
}
```

## Support

### Getting Help

1. **Check server logs**:
   ```bash
   LOG_LEVEL=debug node dist/apps/petstore-api/main.js
   ```

2. **Use MCP Inspector**:
   ```bash
   npx @modelcontextprotocol/inspector node dist/apps/petstore-api/main.js
   ```

3. **Review documentation**:
   - Main README: `apps/petstore-api/README.md`
   - MCP SDK docs: https://github.com/modelcontextprotocol/sdk

### Reporting Issues

When reporting issues, include:

1. **Environment details**:
   ```bash
   node --version
   npm --version
   nx --version
   ```

2. **Configuration used**:
   - Claude/Cursor configuration
   - Environment variables

3. **Error messages**:
   - Complete error output
   - Log files if available

4. **Steps to reproduce**:
   - Exact commands run
   - Expected vs actual behavior 