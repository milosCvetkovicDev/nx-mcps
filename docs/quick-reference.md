# MCP Development Quick Reference

## 🚀 Common Commands

### Create a New Server
```bash
npm run mcp:new
```

### Development
```bash
# Run in development mode
nx serve [server-name]

# Run with debugging
nx serve [server-name] --inspect

# Watch mode for tests
nx test [server-name] --watch
```

### Building
```bash
# Build one server
nx build [server-name]

# Build all MCP servers
npm run mcp:build

# Production build
nx build [server-name] --configuration=production
```

### Testing
```bash
# Run tests
nx test [server-name]

# Run with coverage
nx test [server-name] --coverage

# Run all tests
npm run test
```

### Running
```bash
# Run built server
node dist/apps/[server-name]/src/main.js

# Run with inspector
node --inspect dist/apps/[server-name]/src/main.js
```

## 📁 File Structure

```
my-server/
├── src/
│   ├── main.ts          # Entry point
│   ├── handlers/        # Request handlers
│   │   ├── tools.ts
│   │   ├── resources.ts
│   │   └── prompts.ts
│   └── lib/            # Business logic
├── project.json        # Nx configuration
├── tsconfig.json      # TypeScript config
└── README.md          # Documentation
```

## 🔧 Basic Server Template

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'my-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// Implement handlers here

const transport = new StdioServerTransport();
await server.connect(transport);
```

## 📝 Tool Definition

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'my-tool',
        description: 'Does something useful',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string' }
          },
          required: ['input']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'my-tool') {
    return {
      content: [{
        type: 'text',
        text: `Result: ${args.input}`
      }]
    };
  }
});
```

## 🗄️ Resource Definition

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'data://my-resource',
        name: 'My Resource',
        mimeType: 'application/json'
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'data://my-resource') {
    return {
      contents: [{
        uri: request.params.uri,
        mimeType: 'application/json',
        text: JSON.stringify({ data: 'value' })
      }]
    };
  }
});
```

## 💬 Prompt Definition

```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'analyze',
        description: 'Analyze data',
        arguments: [
          {
            name: 'data',
            description: 'Data to analyze',
            required: true
          }
        ]
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === 'analyze') {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Analyze this data: ${request.params.arguments.data}`
        }
      }]
    };
  }
});
```

## 🔌 Claude Desktop Config

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/dist/apps/my-server/src/main.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🐛 Common Issues

### Module not found
```bash
npm install
nx build [server-name] --skip-nx-cache
```

### TypeScript errors
```bash
npx nx sync
nx reset
```

### Server won't connect
- Check server path in config
- Ensure using absolute paths
- Verify server outputs to stderr for logs

## 📚 More Help

- **[Setup Guide](./setup-guide.md)** - Initial setup
- **[Development Guide](./development-guide.md)** - In-depth guide
- **[Server Examples](./server-examples.md)** - Full examples
- **[Advanced Topics](./advanced-topics.md)** - Advanced patterns

---

[← Back to Documentation Index](./README.md) 