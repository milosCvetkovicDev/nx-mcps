# MCP API Reference

This document provides a complete API reference for developing MCP servers using the TypeScript SDK.

## Table of Contents

- [Server API](#server-api)
- [Tool API](#tool-api)
- [Resource API](#resource-api)
- [Prompt API](#prompt-api)
- [Transport API](#transport-api)
- [Types and Interfaces](#types-and-interfaces)
- [Error Handling](#error-handling)

## Server API

### Server Class

The main class for creating MCP servers.

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server(
  serverInfo: ServerInfo,
  options: ServerOptions
);
```

#### ServerInfo

```typescript
interface ServerInfo {
  name: string;         // Unique server identifier
  version: string;      // Server version (semver)
  metadata?: {          // Optional metadata
    description?: string;
    author?: string;
    homepage?: string;
  };
}
```

#### ServerOptions

```typescript
interface ServerOptions {
  capabilities: ServerCapabilities;
  logger?: Logger;
  errorHandler?: ErrorHandler;
}

interface ServerCapabilities {
  tools?: object;       // Enable tool support
  resources?: {         // Enable resource support
    subscribe?: boolean;  // Enable subscriptions
  };
  prompts?: object;     // Enable prompt support
  logging?: object;     // Enable logging support
}
```

### Server Methods

#### setRequestHandler

Register handlers for specific request types.

```typescript
server.setRequestHandler<T extends RequestSchema>(
  schema: T,
  handler: (request: ParsedRequest<T>) => Promise<Response>
): void
```

Example:
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'my-tool',
        description: 'Tool description',
        inputSchema: { /* JSON Schema */ }
      }
    ]
  };
});
```

#### connect

Connect the server to a transport.

```typescript
await server.connect(transport: Transport): Promise<void>
```

#### close

Gracefully shut down the server.

```typescript
await server.close(): Promise<void>
```

## Tool API

### Tool Definition

Tools are functions that the LLM can invoke.

```typescript
interface Tool {
  name: string;              // Unique tool identifier
  description: string;       // Human-readable description
  inputSchema: JSONSchema;   // JSON Schema for parameters
}
```

### Tool Handlers

#### ListToolsRequestSchema

List all available tools.

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Tool[]
  };
});
```

#### CallToolRequestSchema

Handle tool invocations.

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Tool execution logic
  
  return {
    content: ContentItem[]
  };
});
```

### Tool Response Format

```typescript
interface ToolResponse {
  content: ContentItem[];
  isError?: boolean;
  metadata?: Record<string, any>;
}

type ContentItem = TextContent | ImageContent | ResourceContent;

interface TextContent {
  type: 'text';
  text: string;
}

interface ImageContent {
  type: 'image';
  data: string;        // Base64 encoded
  mimeType: string;
}

interface ResourceContent {
  type: 'resource';
  resource: {
    uri: string;
    mimeType?: string;
    text?: string;
  };
}
```

## Resource API

### Resource Definition

Resources provide data that the LLM can read.

```typescript
interface Resource {
  uri: string;          // Unique resource identifier
  name: string;         // Human-readable name
  description?: string; // Optional description
  mimeType?: string;    // MIME type of content
}
```

### Resource Handlers

#### ListResourcesRequestSchema

List available resources.

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Resource[]
  };
});
```

#### ReadResourceRequestSchema

Read resource content.

```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  return {
    contents: ResourceContent[]
  };
});
```

### Resource Content Format

```typescript
interface ResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;        // Text content
  blob?: string;        // Base64 for binary
}
```

### Resource Subscriptions

For real-time updates:

```typescript
server.setRequestHandler(SubscribeResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  return {
    subscription: AsyncIterable<ResourceContent>
  };
});
```

## Prompt API

### Prompt Definition

Prompts are reusable templates.

```typescript
interface Prompt {
  name: string;              // Unique identifier
  description: string;       // Human-readable description
  arguments?: PromptArgument[];  // Optional arguments
}

interface PromptArgument {
  name: string;
  description: string;
  required?: boolean;
  default?: any;
}
```

### Prompt Handlers

#### ListPromptsRequestSchema

List available prompts.

```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: Prompt[]
  };
});
```

#### GetPromptRequestSchema

Get prompt content.

```typescript
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  return {
    description?: string;
    messages: PromptMessage[]
  };
});
```

### Prompt Message Format

```typescript
interface PromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
}

type MessageContent = TextContent | ImageContent | ToolCall | ToolResponse;
```

## Transport API

### StdioServerTransport

For stdio-based communication (Claude Desktop).

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const transport = new StdioServerTransport();
await server.connect(transport);
```

### HttpServerTransport

For HTTP-based communication.

```typescript
import { HttpServerTransport } from '@modelcontextprotocol/sdk/server/http.js';

const transport = new HttpServerTransport({
  port: 3000,
  host: '0.0.0.0',
  path: '/mcp',
  cors?: CorsOptions
});
```

### Custom Transport

Implement the Transport interface:

```typescript
interface Transport {
  start(): Promise<void>;
  send(message: JSONRPCMessage): Promise<void>;
  onMessage(handler: MessageHandler): void;
  onError(handler: ErrorHandler): void;
  close(): Promise<void>;
}
```

## Types and Interfaces

### Request Types

```typescript
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface ParsedRequest<T extends RequestSchema> {
  params: InferType<T>;
}
```

### Response Types

```typescript
interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: JSONRPCError;
}

interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}
```

### Schema Types

```typescript
// Using zod for schema validation
import { z } from 'zod';

const ListToolsRequestSchema = z.object({
  // No parameters
});

const CallToolRequestSchema = z.object({
  name: z.string(),
  arguments: z.any()
});
```

## Error Handling

### Standard Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid request | Invalid request structure |
| -32601 | Method not found | Unknown method |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Internal server error |
| -32000 to -32099 | Server error | Custom server errors |

### Error Response Format

```typescript
{
  jsonrpc: '2.0',
  id: requestId,
  error: {
    code: -32602,
    message: 'Invalid params',
    data: {
      field: 'name',
      reason: 'Required field missing'
    }
  }
}
```

### Custom Error Handling

```typescript
class MCPError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// Usage
throw new MCPError(
  -32001,
  'Tool not found',
  { toolName: 'unknown-tool' }
);
```

### Global Error Handler

```typescript
server.setErrorHandler((error, request) => {
  console.error('Request failed:', error);
  
  if (error instanceof MCPError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        data: error.data
      }
    };
  }
  
  return {
    error: {
      code: -32603,
      message: 'Internal server error'
    }
  };
});
```

## Complete Example

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Create server
const server = new Server({
  name: 'example-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: 'calculate',
      description: 'Perform calculations',
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string' }
        },
        required: ['expression']
      }
    }]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'calculate') {
    try {
      const result = eval(args.expression); // Note: Use safe evaluation in production
      return {
        content: [{
          type: 'text',
          text: `Result: ${result}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }],
        isError: true
      };
    }
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('MCP server running');
```

## Best Practices

1. **Validate all inputs** using JSON Schema or zod
2. **Handle errors gracefully** with informative messages
3. **Use TypeScript** for type safety
4. **Log to stderr** for stdio transport
5. **Implement timeouts** for long-running operations
6. **Document tools clearly** with descriptions and examples
7. **Version your API** following semantic versioning
8. **Test thoroughly** with unit and integration tests

## Related Documentation

- [Core Concepts](../getting-started/core-concepts.md)
- [Development Guide](../development/development-guide.md)
- [Transport Protocols](../advanced/custom-transports.md)
- [Error Handling](../troubleshooting/error-reference.md) 