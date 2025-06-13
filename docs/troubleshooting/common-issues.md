# Common Issues and Solutions

This guide covers frequently encountered issues when developing and deploying MCP servers, along with their solutions.

## Table of Contents

- [Development Issues](#development-issues)
- [Runtime Errors](#runtime-errors)
- [Connection Problems](#connection-problems)
- [Performance Issues](#performance-issues)
- [Deployment Problems](#deployment-problems)
- [Claude Desktop Integration](#claude-desktop-integration)

## Development Issues

### TypeScript Compilation Errors

**Problem**: `Cannot find module '@modelcontextprotocol/sdk'`

**Solution**:
```bash
# Ensure dependencies are installed
npm install

# If still failing, clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify TypeScript paths
npx nx sync
```

**Problem**: `Type 'X' is not assignable to type 'Y'`

**Solution**:
```typescript
// Check your type definitions
import { Tool } from '@modelcontextprotocol/sdk/types.js';

// Ensure proper type structure
const myTool: Tool = {
  name: 'my-tool',
  description: 'Tool description',
  inputSchema: {
    type: 'object',
    properties: {
      // Define all properties with correct types
    },
    required: ['requiredField']
  }
};
```

### Build Failures

**Problem**: `nx build my-server` fails with module errors

**Solution**:
```bash
# Clear Nx cache
nx reset

# Rebuild with verbose logging
nx build my-server --verbose

# Check for circular dependencies
nx graph
```

**Problem**: Out of memory during build

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
nx build my-server

# Or add to package.json script
"build:prod": "NODE_OPTIONS='--max-old-space-size=4096' nx build"
```

## Runtime Errors

### Server Won't Start

**Problem**: `Error: Cannot find module './src/main.js'`

**Solution**:
```bash
# Ensure the server is built
nx build my-server

# Check the build output exists
ls dist/apps/my-server/src/main.js

# Run from correct directory
cd dist/apps/my-server
node src/main.js
```

**Problem**: `Error: EADDRINUSE: address already in use`

**Solution**:
```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
MCP_PORT=3001 node src/main.js
```

### Handler Registration Issues

**Problem**: `Unknown tool: my-tool`

**Solution**:
```typescript
// Ensure tool is registered
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [myTool] // Tool must be in this array
  };
});

// Verify tool name matches exactly
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'my-tool') { // Name must match
    // Handle tool
  }
});
```

### JSON-RPC Errors

**Problem**: `Parse error: Invalid JSON`

**Solution**:
```typescript
// For stdio transport, ensure proper separation
console.error('Log message'); // Logs go to stderr
process.stdout.write(JSON.stringify(response)); // Responses to stdout

// Validate JSON before sending
try {
  const json = JSON.stringify(response);
  JSON.parse(json); // Validate
  process.stdout.write(json);
} catch (error) {
  console.error('Invalid JSON:', error);
}
```

## Connection Problems

### stdio Transport Issues

**Problem**: Claude Desktop shows "Failed to connect to MCP server"

**Solution**:
1. Check server path is absolute:
   ```json
   {
     "mcpServers": {
       "my-server": {
         "command": "node",
         "args": ["/absolute/path/to/main.js"]
       }
     }
   }
   ```

2. Test server manually:
   ```bash
   echo '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}' | \
   node /path/to/main.js
   ```

3. Check permissions:
   ```bash
   chmod +x dist/apps/my-server/src/main.js
   ls -la dist/apps/my-server/src/main.js
   ```

### HTTP Transport Issues

**Problem**: `CORS error when connecting`

**Solution**:
```typescript
// Add CORS headers for HTTP transport
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Problem**: `SSL/TLS connection required`

**Solution**:
```typescript
import https from 'https';
import fs from 'fs';

const server = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app);

server.listen(3000);
```

## Performance Issues

### Slow Response Times

**Problem**: Tool execution takes too long

**Solution**:
1. Add timeouts:
   ```typescript
   const result = await Promise.race([
     executeOperation(),
     new Promise((_, reject) => 
       setTimeout(() => reject(new Error('Timeout')), 30000)
     )
   ]);
   ```

2. Implement caching:
   ```typescript
   const cache = new Map();
   
   async function getCachedResult(key: string) {
     if (cache.has(key)) {
       return cache.get(key);
     }
     
     const result = await expensiveOperation();
     cache.set(key, result);
     return result;
   }
   ```

3. Use streaming for large responses:
   ```typescript
   async function* streamResults() {
     for await (const chunk of largeDataset) {
       yield {
         type: 'text',
         text: JSON.stringify(chunk)
       };
     }
   }
   ```

### Memory Leaks

**Problem**: Server memory usage grows over time

**Solution**:
1. Monitor memory usage:
   ```typescript
   setInterval(() => {
     const usage = process.memoryUsage();
     console.error('Memory:', {
       rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
       heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`
     });
   }, 60000);
   ```

2. Clean up resources:
   ```typescript
   class ResourceManager {
     private resources = new Map();
     
     async cleanup() {
       for (const [id, resource] of this.resources) {
         await resource.close();
         this.resources.delete(id);
       }
     }
   }
   
   // Periodic cleanup
   setInterval(() => manager.cleanup(), 300000);
   ```

## Deployment Problems

### Docker Container Issues

**Problem**: Container exits immediately

**Solution**:
```dockerfile
# Ensure proper signal handling
FROM node:18-alpine
WORKDIR /app
COPY . .

# Add tini for proper signal handling
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "src/main.js"]
```

**Problem**: Cannot connect to containerized server

**Solution**:
```yaml
# docker-compose.yml
services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"  # Map container port to host
    environment:
      - MCP_HOST=0.0.0.0  # Bind to all interfaces
```

### PM2 Issues

**Problem**: PM2 process keeps restarting

**Solution**:
```bash
# Check logs
pm2 logs my-server --lines 100

# Common fixes:
# 1. Increase memory limit
pm2 start app.js --max-memory-restart 2G

# 2. Add restart delay
pm2 start app.js --restart-delay=5000

# 3. Check error logs
pm2 describe my-server
```

## Claude Desktop Integration

### Configuration Issues

**Problem**: "MCP server not found" in Claude

**Solution**:
1. Verify configuration file location:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Validate JSON syntax:
   ```bash
   # macOS
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
   ```

3. Check server is built:
   ```bash
   # Build server first
   nx build my-server
   
   # Verify output exists
   ls -la dist/apps/my-server/src/main.js
   ```

### Server Not Appearing

**Problem**: Server doesn't show in Claude's MCP menu

**Solution**:
1. Restart Claude Desktop completely
2. Check server name has no spaces or special characters
3. Verify server initializes correctly:
   ```typescript
   const server = new Server({
     name: 'my-server',  // Must match config
     version: '1.0.0'
   }, {
     capabilities: {
       tools: {},
       resources: {}
     }
   });
   ```

### Tool Execution Failures

**Problem**: Tools appear but fail when called

**Solution**:
1. Enable debug logging:
   ```typescript
   server.onerror = (error) => {
     console.error('Server error:', error);
   };
   ```

2. Validate tool input schema:
   ```typescript
   const schema = {
     type: 'object',
     properties: {
       query: { type: 'string' }
     },
     required: ['query'],
     additionalProperties: false  // Prevent extra fields
   };
   ```

3. Test with MCP Inspector:
   ```bash
   npx @modelcontextprotocol/inspector dist/apps/my-server/src/main.js
   ```

## Debug Techniques

### Enable Verbose Logging

```typescript
// Add debug logging
const DEBUG = process.env.MCP_DEBUG === 'true';

function debug(...args: any[]) {
  if (DEBUG) {
    console.error('[DEBUG]', new Date().toISOString(), ...args);
  }
}

// Use throughout code
debug('Request received:', request);
debug('Processing with args:', args);
debug('Response:', response);
```

### Use MCP Inspector

```bash
# Install globally
npm install -g @modelcontextprotocol/inspector

# Run with your server
mcp-inspector node dist/apps/my-server/src/main.js

# Or use npx
npx @modelcontextprotocol/inspector dist/apps/my-server/src/main.js
```

### Network Debugging

For HTTP transport:
```bash
# Monitor HTTP traffic
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Use verbose mode
curl -v -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs**: Both server logs and Claude logs
2. **Search existing issues**: [GitHub Issues](https://github.com/modelcontextprotocol/specification/issues)
3. **Ask the community**: [Discord Server](https://discord.gg/mcp)
4. **Review examples**: Check the `server-examples.md` for working code
5. **Enable debug mode**: Set `MCP_DEBUG=true` for verbose output

## Quick Fixes Checklist

- [ ] Dependencies installed: `npm install`
- [ ] Server built: `nx build my-server`
- [ ] Correct Node.js version: `node --version` (18+)
- [ ] Valid JSON configuration
- [ ] Absolute paths in config
- [ ] Server has execute permissions
- [ ] No port conflicts
- [ ] Proper error handling implemented
- [ ] Tools registered correctly
- [ ] Transport configured properly 