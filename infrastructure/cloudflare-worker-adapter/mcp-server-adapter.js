/**
 * MCP Server Adapter for Cloudflare Workers
 * Adapts Model Context Protocol servers to run on Cloudflare Workers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * Creates a Cloudflare Worker handler for an MCP server
 * @param {Object} serverConfig - MCP server configuration
 * @param {Object} options - Adapter options
 * @returns {Object} Cloudflare Worker module
 */
export function createMcpWorkerHandler(serverConfig, options = {}) {
  const {
    serverName = 'mcp-server',
    serverVersion = '1.0.0',
    enableCors = true,
    corsOrigin = '*',
    authToken = null,
    rateLimitPerMinute = 60,
  } = options;

  // CORS headers
  const corsHeaders = enableCors ? {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MCP-Version',
    'Access-Control-Max-Age': '86400',
  } : {};

  /**
   * Handle MCP requests over HTTP
   */
  async function handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS' && enableCors) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Check authentication if configured
    if (authToken && request.headers.get('Authorization') !== `Bearer ${authToken}`) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Rate limiting using Cloudflare KV or Durable Objects
    if (env.RATE_LIMITER && rateLimitPerMinute > 0) {
      const clientId = request.headers.get('CF-Connecting-IP') || 'anonymous';
      const rateLimitKey = `rate:${clientId}:${new Date().getMinutes()}`;
      
      const currentCount = parseInt(await env.RATE_LIMITER.get(rateLimitKey) || '0');
      if (currentCount >= rateLimitPerMinute) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Maximum ${rateLimitPerMinute} requests per minute`
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            ...corsHeaders
          }
        });
      }
      
      // Increment rate limit counter
      await env.RATE_LIMITER.put(rateLimitKey, String(currentCount + 1), {
        expirationTtl: 60
      });
    }

    try {
      // Handle different endpoints
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          serverName,
          serverVersion,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      if (url.pathname === '/mcp' && request.method === 'POST') {
        // Handle MCP protocol messages
        const body = await request.json();
        
        // Create MCP server instance
        const server = new Server(
          {
            name: serverName,
            version: serverVersion,
          },
          {
            capabilities: serverConfig.capabilities || {}
          }
        );

        // Register tools if provided
        if (serverConfig.tools) {
          for (const tool of serverConfig.tools) {
            server.setRequestHandler(tool.handler, tool.schema);
          }
        }

        // Register resources if provided
        if (serverConfig.resources) {
          for (const resource of serverConfig.resources) {
            server.addResource(resource);
          }
        }

        // Process the MCP message
        const response = await processMcpMessage(server, body, env, ctx);
        
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-MCP-Version': '1.0',
            ...corsHeaders
          }
        });
      }

      if (url.pathname === '/mcp/capabilities' && request.method === 'GET') {
        // Return server capabilities
        return new Response(JSON.stringify({
          capabilities: serverConfig.capabilities || {},
          tools: serverConfig.tools?.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.schema
          })) || [],
          resources: serverConfig.resources?.map(r => ({
            uri: r.uri,
            name: r.name,
            description: r.description,
            mimeType: r.mimeType
          })) || []
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // WebSocket endpoint for streaming
      if (url.pathname === '/mcp/ws') {
        return handleWebSocket(request, env, ctx, serverConfig);
      }

      return new Response('Not found', { 
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      console.error('MCP Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }

  // Return Cloudflare Worker module format
  return {
    fetch: handleRequest
  };
}

/**
 * Process MCP protocol messages
 */
async function processMcpMessage(server, message, env, ctx) {
  // This is a simplified version - in reality, you'd need to handle
  // the full MCP protocol including JSON-RPC 2.0 messages
  
  const { method, params, id } = message;
  
  try {
    switch (method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '1.0',
            capabilities: server.capabilities,
            serverInfo: {
              name: server.name,
              version: server.version
            }
          }
        };
      }
        
      case 'tools/call': {
        const tool = server.tools.find(t => t.name === params.name);
        if (!tool) {
          throw new Error(`Unknown tool: ${params.name}`);
        }
        
        const result = await tool.handler(params.arguments, { env, ctx });
        return {
          jsonrpc: '2.0',
          id,
          result
        };
      }
        
      case 'resources/read': {
        const resource = server.resources.find(r => r.uri === params.uri);
        if (!resource) {
          throw new Error(`Unknown resource: ${params.uri}`);
        }
        
        const content = await resource.handler({ env, ctx });
        return {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [{
              uri: resource.uri,
              mimeType: resource.mimeType,
              text: content
            }]
          }
        };
      }
        
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: error.message
      }
    };
  }
}

/**
 * Handle WebSocket connections for streaming
 */
async function handleWebSocket(request, env, ctx, serverConfig) {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  // Accept the WebSocket connection
  server.accept();

  // Handle WebSocket messages
  server.addEventListener('message', async (event) => {
    try {
      const message = JSON.parse(event.data);
      const mcpServer = createMcpServerInstance(serverConfig);
      const response = await processMcpMessage(mcpServer, message, env, ctx);
      server.send(JSON.stringify(response));
    } catch (error) {
      server.send(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error'
        }
      }));
    }
  });

  server.addEventListener('close', () => {
    console.log('WebSocket closed');
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

/**
 * Helper to create MCP server instance
 */
function createMcpServerInstance(serverConfig) {
  const server = new Server(
    {
      name: serverConfig.name || 'mcp-server',
      version: serverConfig.version || '1.0.0',
    },
    {
      capabilities: serverConfig.capabilities || {}
    }
  );

  // Register components
  if (serverConfig.tools) {
    server.tools = serverConfig.tools;
  }
  if (serverConfig.resources) {
    server.resources = serverConfig.resources;
  }

  return server;
}

/**
 * Export utilities for MCP server development
 */
export const McpWorkerUtils = {
  /**
   * Create a tool handler
   */
  createTool: (name, description, schema, handler) => ({
    name,
    description,
    schema,
    handler
  }),

  /**
   * Create a resource handler
   */
  createResource: (uri, name, description, mimeType, handler) => ({
    uri,
    name,
    description,
    mimeType,
    handler
  }),

  /**
   * Standard error responses
   */
  errors: {
    invalidRequest: (id) => ({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32600,
        message: 'Invalid Request'
      }
    }),
    
    methodNotFound: (id, method) => ({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    }),
    
    internalError: (id, message) => ({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: `Internal error: ${message}`
      }
    })
  }
}; 