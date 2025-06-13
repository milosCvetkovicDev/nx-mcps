# MCP (Model Context Protocol) Server Development in NX

This NX workspace is configured to build MCP servers using the TypeScript SDK. MCP servers provide tools, resources, and prompts that can be consumed by LLM applications.

## 🚀 Quick Start

### Creating a New MCP Server

MCP servers should be created as **applications** in the `apps` folder:

```bash
# Create a new MCP server application
npx nx g @nx/js:library --name=my-mcp-server --directory=apps/my-mcp-server --projectNameAndRootFormat=as-provided --bundler=tsc

# Then:
# 1. Rename src/index.ts to src/main.ts
# 2. Update it to implement your MCP server
# 3. Create a project.json to configure it as an application
# 4. Update package.json with bin configuration
```



### Building MCP Servers

```bash
# Build a specific server
nx build [server-name]

# Build all MCP servers (tagged with 'mcp-server')
nx run-many -t build --projects=tag:mcp-server
```

### Running MCP Servers

```bash
# Run in development mode with watch
nx serve [server-name]

# Run the built server
node dist/apps/[server-name]/src/main.js
```

## 📦 MCP Server Patterns and Examples

For complete, production-ready MCP server implementations, see the **[Server Examples](./server-examples.md)** documentation, which includes:

### Database Operations
- Safe SQL query execution
- Connection pooling
- Schema introspection
- Transaction support

### File System Operations
- Sandboxed file access
- Streaming large files
- File watching and monitoring
- Secure path validation

### API Gateway
- Multiple API integration
- Authentication handling
- Rate limiting
- Response caching

### Code Analysis
- TypeScript/JavaScript analysis
- Linting and formatting
- Complexity metrics
- Refactoring suggestions

### And More...
- Task management servers
- Real-time communication servers
- Machine learning integration
- DevOps automation tools

## 🏗️ MCP Server Structure

### Application Structure (Recommended for MCP Servers)

MCP servers in the `apps` folder follow this structure:

```
apps/my-mcp-server/
├── src/
│   └── main.ts          # Main entry point with server implementation
├── project.json         # NX project configuration
├── package.json         # Dependencies and bin configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.lib.json    # Build configuration
└── README.md           # Server documentation
```

### Library Structure (Alternative Approach)

MCP servers can also be created as libraries:

```
packages/my-mcp-server/
├── src/
│   ├── index.ts          # Entry point with shebang
│   └── lib/
│       └── my-mcp-server.ts    # Main server implementation
├── package.json          # Dependencies and configuration
├── tsconfig.json         # TypeScript configuration
├── tsconfig.lib.json     # Build configuration
└── README.md            # Server documentation
```

## 🔧 Key Components

### 1. Server Setup

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'my-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);
```

### 2. Implementing Tools

```typescript
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'my-tool',
        description: 'Tool description',
        inputSchema: {
          type: 'object',
          properties: {
            param: { type: 'string' }
          },
          required: ['param']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'my-tool') {
    // Tool implementation
  }
});
```

### 3. Package Configuration

For **applications** in `apps/`:

```json
{
  "name": "@my-server/app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/src/main.js",
  "bin": {
    "my-server": "./dist/src/main.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "*"
  }
}
```

For **libraries** in `packages/`:

```json
{
  "type": "module",
  "bin": {
    "my-server": "./dist/src/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "*"
  }
}
```

### 4. TypeScript Configuration

Update `tsconfig.lib.json` for ES modules:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["node"]
  }
}
```

## 🧪 Testing

```bash
# Run tests for a specific server
nx test [server-name]

# Run all tests
nx run-many -t test
```

## 📝 Best Practices

1. **Modular Design**: Keep tools, resources, and prompts focused on specific domains
2. **Error Handling**: Always provide meaningful error messages
3. **Type Safety**: Use TypeScript interfaces for all data structures
4. **Documentation**: Include comprehensive README files for each server
5. **Testing**: Write unit tests for handler logic

## 🔗 Integration

MCP servers can be integrated with:
- Claude Desktop App
- Custom MCP clients
- Any application supporting the MCP protocol

### Example Claude Desktop Configuration

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/dist/apps/my-server/src/main.js"]
    }
  }
}
```

## 🛠️ Development Workflow

### For Applications (Recommended):
1. Create a new library in `apps/` folder using NX
2. Rename `src/index.ts` to `src/main.ts`
3. Create `project.json` to configure as application
4. Add MCP SDK dependency in `package.json`
5. Implement server handlers in `main.ts`
6. Configure TypeScript for ES modules
7. Build, test, and document

### For Libraries:
1. Create a new library in `packages/` folder using NX
2. Add MCP SDK dependency
3. Implement server handlers
4. Configure TypeScript for ES modules
5. Build and test
6. Document usage

## 📚 Resources

- [MCP Specification](https://github.com/modelcontextprotocol/specification)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [NX Documentation](https://nx.dev)

## 🤝 Contributing

When adding new MCP servers:
1. Follow the established patterns
2. Include comprehensive tests
3. Document all tools, resources, and prompts
4. Add examples to this documentation 