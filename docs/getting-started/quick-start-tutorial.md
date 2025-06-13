# Quick Start Tutorial: Build Your First MCP Server in 10 Minutes

This tutorial will guide you through creating your first MCP (Model Context Protocol) server from scratch. By the end, you'll have a working server that can respond to requests from Claude or other MCP clients.

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- npm (comes with Node.js)
- Basic TypeScript knowledge
- A text editor (VS Code recommended)

## Step 1: Generate Your Server (2 minutes)

Open your terminal in the workspace root and run:

```bash
npm run mcp:new
```

When prompted, enter:
- **Server name**: `hello-world`
- **Description**: `My first MCP server`
- **Transport**: `stdio` (recommended for Claude Desktop)

The generator will create your server in `apps/hello-world/`.

## Step 2: Explore the Generated Structure (2 minutes)

Navigate to your new server:

```bash
cd apps/hello-world
```

You'll see this structure:
```
hello-world/
├── src/
│   ├── main.ts          # Server entry point
│   ├── handlers/        # Request handlers
│   ├── tools/           # Tool implementations
│   │   └── example.ts   # Example tool
│   ├── resources/       # Resource providers
│   └── prompts/         # Prompt templates
├── README.md            # Server documentation
├── project.json         # Nx configuration
└── tsconfig.json        # TypeScript config
```

## Step 3: Create Your First Tool (3 minutes)

Open `src/tools/example.ts` and replace it with:

```typescript
import { CallToolRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';

export const greetingTool: Tool = {
  name: 'greeting',
  description: 'Generate a personalized greeting',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the person to greet'
      },
      language: {
        type: 'string',
        enum: ['english', 'spanish', 'french'],
        description: 'Language for the greeting',
        default: 'english'
      }
    },
    required: ['name']
  }
};

export async function handleGreetingTool(name: string, language: string = 'english') {
  const greetings = {
    english: `Hello, ${name}! Welcome to MCP!`,
    spanish: `¡Hola, ${name}! ¡Bienvenido a MCP!`,
    french: `Bonjour, ${name}! Bienvenue à MCP!`
  };

  return {
    content: [
      {
        type: 'text',
        text: greetings[language] || greetings.english
      }
    ]
  };
}
```

## Step 4: Wire Up Your Tool (2 minutes)

Open `src/handlers/tool-handler.ts` and update it:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { greetingTool, handleGreetingTool } from '../tools/example.js';

export function setupToolHandlers(server: Server) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [greetingTool]
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'greeting') {
      return await handleGreetingTool(args.name, args.language);
    }

    throw new Error(`Unknown tool: ${name}`);
  });
}
```

## Step 5: Test Your Server (1 minute)

Build and run your server:

```bash
# In the apps/hello-world directory
nx serve hello-world
```

You should see:
```
MCP server running on stdio transport
Server: hello-world v0.1.0
```

Press `Ctrl+C` to stop the server.

## Step 6: Test with MCP Inspector (Optional)

Install and run the MCP Inspector to test your server interactively:

```bash
# Build your server first
nx build hello-world

# Run with inspector
npx @modelcontextprotocol/inspector dist/apps/hello-world/src/main.js
```

In the inspector:
1. Click "List Tools" to see your `greeting` tool
2. Click on the tool to test it
3. Enter a name and select a language
4. See the greeting response!

## 🎉 Congratulations!

You've just built your first MCP server! It can:
- ✅ Accept connections from MCP clients
- ✅ List available tools
- ✅ Execute tool calls
- ✅ Return formatted responses

## Next Steps

Now that you have a working server, try these challenges:

1. **Add Another Tool**: Create a calculator tool that can add, subtract, multiply, and divide
2. **Add a Resource**: Create a resource that returns the current time
3. **Add a Prompt**: Create a prompt template for code reviews

Ready for more? Continue with:
- [Core Concepts](./core-concepts.md) - Understand MCP fundamentals
- [Development Guide](../development/development-guide.md) - Deep dive into development
- [Weather Server Tutorial](../tutorials/weather-server-tutorial.md) - Build a real-world server

## Troubleshooting

### Server won't start
- Check Node.js version: `node --version` (should be 18+)
- Reinstall dependencies: `npm install`
- Clear Nx cache: `nx reset`

### Tool not appearing
- Ensure the tool is exported from the handler
- Check for TypeScript errors: `nx typecheck hello-world`
- Verify the tool name matches in all places

### Can't connect with Claude
- Build the server first: `nx build hello-world`
- Check the path in Claude's configuration
- Ensure you're using stdio transport

Need help? Check the [Troubleshooting Guide](../troubleshooting/common-issues.md) or ask in our [Discord community](https://discord.gg/mcp). 