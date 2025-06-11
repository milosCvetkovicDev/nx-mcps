# MCP Scripts Guide

This guide explains how to use the scripts added to `package.json` for working with MCP (Model Context Protocol) servers in your Nx workspace.

## Quick Start

### 1. Create a New MCP Server
```bash
npm run mcp:new
```
This will run the MCP app generator. You'll be prompted to provide:
- Name of your MCP server
- Description
- Transport type (stdio or http)

### 2. Build MCP Servers
```bash
# Build all MCP servers (tagged with 'mcp-server')
npm run mcp:build

# Build all projects in the workspace
npm run mcp:build:all
```

### 3. Run MCP Servers in Development
```bash
# Run all MCP servers in development mode with hot reloading
npm run mcp:dev

# Run a specific MCP server
nx dev <app-name>
```

### 4. Test MCP Servers
```bash
# Run tests for all MCP servers
npm run mcp:test

# Run tests in watch mode
npm run mcp:test:watch

# Test a specific MCP server
nx test <app-name>
```

## Script Categories

### MCP-Specific Scripts (`mcp:*`)
- **`mcp:new`**: Generate a new MCP server application
- **`mcp:build`**: Build all projects tagged with 'mcp-server'
- **`mcp:dev`**: Run MCP servers in development mode
- **`mcp:serve`**: Serve MCP servers (production mode)
- **`mcp:test`**: Run tests for MCP servers
- **`mcp:test:watch`**: Run tests in watch mode
- **`mcp:lint`**: Lint all MCP servers
- **`mcp:typecheck`**: Run TypeScript type checking

### Individual Server Scripts
- **`mcp:run <path/to/server>`**: Run a built MCP server
- **`mcp:debug <path/to/server>`**: Run with Node.js inspector for debugging
- **`mcp:list`**: List all available Nx plugins
- **`mcp:show-projects`**: Show all MCP server projects in the workspace

Example:
```bash
npm run mcp:run dist/apps/my-mcp-server/main.js
npm run mcp:debug -- --inspect-brk dist/apps/my-mcp-server/main.js
npm run mcp:show-projects
```

### Workspace Scripts
- **`build`**: Build all projects
- **`test`**: Test all projects
- **`lint`**: Lint all projects
- **`typecheck`**: Type check all projects
- **`format`**: Format code using Prettier
- **`format:check`**: Check code formatting

### Nx Commands
- **`graph`**: Visualize project dependency graph
- **`affected:graph`**: Show affected projects graph
- **`affected:build`**: Build only affected projects
- **`affected:test`**: Test only affected projects
- **`affected:lint`**: Lint only affected projects

## Best Practices

### 1. Tag Your MCP Servers
When creating MCP servers using the generator, they're automatically tagged with 'mcp-server' in their `project.json`:
```json
{
  "tags": ["mcp-server", "type:app"]
}
```

### 2. Development Workflow
```bash
# 1. Create a new MCP server
npm run mcp:new

# 2. Develop with hot reloading
npm run mcp:dev

# 3. Test your changes
npm run mcp:test:watch

# 4. Build for production
npm run mcp:build
```

### 3. Production Deployment
```bash
# Build the server
nx build <app-name>

# Run the built server
node dist/apps/<app-name>/main.js
```

### 4. Testing MCP Servers with Claude Desktop
For stdio-based MCP servers, add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["<path-to-workspace>/dist/apps/my-server/main.js"]
    }
  }
}
```

### 5. Running Multiple MCP Servers
The scripts run servers sequentially (`--parallel=false`) to avoid port conflicts for HTTP-based servers. For stdio servers, you can enable parallel execution by modifying the scripts.

## Debugging Tips

1. **View logs**: MCP servers log to stderr by convention
2. **Use debug mode**: `npm run mcp:debug -- dist/apps/my-server/main.js`
3. **Check the Nx graph**: `npm run graph` to visualize dependencies
4. **Run affected tests**: `npm run affected:test` after changes

## Example: Creating and Running a Weather MCP Server

```bash
# 1. Generate the server
npm run mcp:new
# Choose: name=weather-server, transport=stdio

# 2. Implement your weather functionality
# Edit apps/weather-server/src/main.ts

# 3. Test during development
cd apps/weather-server
nx test weather-server --watch

# 4. Build and run
nx build weather-server
npm run mcp:run dist/apps/weather-server/main.js
```

## Quick Example: Your First MCP Server

Let's create a simple calculator MCP server:

```bash
# 1. Create the server
npm run mcp:new
# Enter name: calculator
# Choose transport: stdio

# 2. View all MCP servers
npm run mcp:show-projects

# 3. Run in development (with auto-reload)
nx serve calculator

# 4. In another terminal, run tests
nx test calculator --watch

# 5. Build for production
nx build calculator --configuration=production

# 6. Test the built server
npm run mcp:run dist/apps/calculator/main.js
```

The generated server includes example implementations of:
- **Tools**: Process and respond to tool calls
- **Resources**: Provide data to LLMs
- **Prompts**: Offer reusable prompt templates

You can now modify `apps/calculator/src/main.ts` to implement your own calculator logic! 