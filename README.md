# nx-mcps

Nx workspace for building TypeScript MCP (Model Context Protocol) servers — a generator, one worked example, and a Cloudflare Workers deploy path.

## What's here

- **`apps/petstore-api`** — a complete MCP server that turns an OpenAPI spec into MCP tools at runtime: it loads the spec, generates one tool per operation, validates arguments against the operation schemas, executes calls over HTTP with caching and retry, and exposes the spec itself as MCP resources plus a few guided prompts. Petstore is the demo target; the loader and executor are generic — point them at another spec and you get another server.
- **`tools/generators/mcp-app`** — an Nx generator that scaffolds a new stdio MCP server with the same structure: entry point, handler layout, tsconfig, tests, README.
- **`infrastructure/`** — a Cloudflare Worker adapter for running MCP servers at the edge, a Terraform module that provisions the Workers, and a GitHub Actions workflow that deploys only Nx-affected servers.
- **`docs/`** — working notes: core concepts, architecture decisions, deployment.

## Run the example

```bash
npm install

npx nx build petstore-api
node dist/apps/petstore-api/src/main.js

# or inspect it interactively
npx @modelcontextprotocol/inspector node dist/apps/petstore-api/src/main.js
```

## Wire into Claude Desktop

```json
{
  "mcpServers": {
    "petstore-api": {
      "command": "node",
      "args": ["/absolute/path/to/dist/apps/petstore-api/src/main.js"]
    }
  }
}
```

## Scaffold a new server

```bash
npx nx g ./tools/generators/mcp-app:mcp-app my-server
```

## License

MIT
