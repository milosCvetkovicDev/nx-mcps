# MCP Server Examples

This guide provides practical examples of MCP servers for common use cases.

## Table of Contents

- [Database Query Server](#database-query-server)
- [File System Operations Server](#file-system-operations-server)
- [API Gateway Server](#api-gateway-server)
- [Code Analysis Server](#code-analysis-server)
- [Task Management Server](#task-management-server)
- [Monitoring Dashboard Server](#monitoring-dashboard-server)
- [Translation Server](#translation-server)
- [Email Server](#email-server)

## Database Query Server

A server that provides safe database access with query building and result formatting.

```typescript
// apps/database-mcp/src/main.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';

interface QueryOptions {
  query: string;
  params?: any[];
  limit?: number;
}

class DatabaseServer {
  private server: Server;
  private db: Pool;

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.server = new Server(
      {
        name: 'database-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'query',
            description: 'Execute a SQL query',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'SQL query to execute',
                },
                params: {
                  type: 'array',
                  description: 'Query parameters',
                  items: { type: ['string', 'number', 'boolean', 'null'] },
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of rows to return',
                  default: 100,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'list-tables',
            description: 'List all tables in the database',
            inputSchema: {
              type: 'object',
              properties: {
                schema: {
                  type: 'string',
                  description: 'Schema name',
                  default: 'public',
                },
              },
            },
          },
          {
            name: 'describe-table',
            description: 'Get table structure',
            inputSchema: {
              type: 'object',
              properties: {
                table: {
                  type: 'string',
                  description: 'Table name',
                },
                schema: {
                  type: 'string',
                  description: 'Schema name',
                  default: 'public',
                },
              },
              required: ['table'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'query':
          return await this.executeQuery(args as QueryOptions);
        case 'list-tables':
          return await this.listTables(args.schema || 'public');
        case 'describe-table':
          return await this.describeTable(args.table, args.schema || 'public');
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'db://schema',
            name: 'Database Schema',
            description: 'Complete database schema information',
            mimeType: 'application/json',
          },
          {
            uri: 'db://stats',
            name: 'Database Statistics',
            description: 'Database performance and usage statistics',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Read resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'db://schema':
          return await this.getSchema();
        case 'db://stats':
          return await this.getStats();
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private async executeQuery(options: QueryOptions) {
    // Validate query (basic SQL injection prevention)
    const forbidden = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE'];
    const upperQuery = options.query.toUpperCase();
    
    for (const keyword of forbidden) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Forbidden operation: ${keyword}`);
      }
    }

    try {
      const result = await this.db.query(
        options.query,
        options.params,
      );

      // Apply limit
      const rows = options.limit
        ? result.rows.slice(0, options.limit)
        : result.rows;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                rowCount: rows.length,
                totalRows: result.rowCount,
                fields: result.fields.map((f) => ({
                  name: f.name,
                  dataType: f.dataTypeID,
                })),
                rows: rows,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Query error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listTables(schema: string) {
    const query = `
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = $1
      ORDER BY table_name
    `;

    const result = await this.db.query(query, [schema]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.rows, null, 2),
        },
      ],
    };
  }

  private async describeTable(table: string, schema: string) {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `;

    const result = await this.db.query(query, [schema, table]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.rows, null, 2),
        },
      ],
    };
  }

  private async getSchema() {
    const query = `
      SELECT 
        t.table_schema,
        t.table_name,
        array_agg(
          json_build_object(
            'column', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_schema = c.table_schema 
        AND t.table_name = c.table_name
      WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
      GROUP BY t.table_schema, t.table_name
      ORDER BY t.table_schema, t.table_name
    `;

    const result = await this.db.query(query);

    return {
      contents: [
        {
          uri: 'db://schema',
          mimeType: 'application/json',
          text: JSON.stringify(result.rows, null, 2),
        },
      ],
    };
  }

  private async getStats() {
    const query = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        n_live_tup as row_count,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_analyze
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 20
    `;

    const result = await this.db.query(query);

    return {
      contents: [
        {
          uri: 'db://stats',
          mimeType: 'application/json',
          text: JSON.stringify(result.rows, null, 2),
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Database MCP server started');
  }
}

// Start the server
const server = new DatabaseServer();
server.start().catch(console.error);
```

## File System Operations Server

A server for safe file system operations with sandboxing.

```typescript
// apps/filesystem-mcp/src/main.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as crypto from 'crypto';

class FileSystemServer {
  private server: Server;
  private rootDir: string;

  constructor() {
    // Sandbox operations to a specific directory
    this.rootDir = process.env.FS_ROOT || '/tmp/mcp-sandbox';
    
    this.server = new Server(
      {
        name: 'filesystem-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private resolvePath(filePath: string): string {
    const resolved = path.resolve(this.rootDir, filePath);
    if (!resolved.startsWith(this.rootDir)) {
      throw new Error('Path traversal attempt detected');
    }
    return resolved;
  }

  private setupHandlers() {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list-files',
            description: 'List files in a directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Directory path',
                  default: '.',
                },
                recursive: {
                  type: 'boolean',
                  description: 'List recursively',
                  default: false,
                },
                pattern: {
                  type: 'string',
                  description: 'File pattern (glob)',
                },
              },
            },
          },
          {
            name: 'read-file',
            description: 'Read file contents',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'File path',
                },
                encoding: {
                  type: 'string',
                  description: 'File encoding',
                  default: 'utf8',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'write-file',
            description: 'Write content to file',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'File path',
                },
                content: {
                  type: 'string',
                  description: 'File content',
                },
                append: {
                  type: 'boolean',
                  description: 'Append to file',
                  default: false,
                },
              },
              required: ['path', 'content'],
            },
          },
          {
            name: 'delete-file',
            description: 'Delete a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'File path',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'move-file',
            description: 'Move or rename a file',
            inputSchema: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  description: 'Source path',
                },
                destination: {
                  type: 'string',
                  description: 'Destination path',
                },
              },
              required: ['source', 'destination'],
            },
          },
          {
            name: 'file-info',
            description: 'Get file information',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'File path',
                },
              },
              required: ['path'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'list-files':
          return await this.listFiles(args.path || '.', args.recursive, args.pattern);
        case 'read-file':
          return await this.readFile(args.path, args.encoding || 'utf8');
        case 'write-file':
          return await this.writeFile(args.path, args.content, args.append);
        case 'delete-file':
          return await this.deleteFile(args.path);
        case 'move-file':
          return await this.moveFile(args.source, args.destination);
        case 'file-info':
          return await this.fileInfo(args.path);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async listFiles(dirPath: string, recursive: boolean, pattern?: string) {
    const resolvedPath = this.resolvePath(dirPath);
    
    const listDir = async (dir: string, baseDir: string): Promise<any[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = [];

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (pattern && !minimatch(entry.name, pattern)) {
          continue;
        }

        const stats = await fs.stat(fullPath);
        
        files.push({
          name: entry.name,
          path: relativePath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime,
        });

        if (recursive && entry.isDirectory()) {
          const subFiles = await listDir(fullPath, baseDir);
          files.push(...subFiles);
        }
      }

      return files;
    };

    const files = await listDir(resolvedPath, resolvedPath);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(files, null, 2),
        },
      ],
    };
  }

  private async readFile(filePath: string, encoding: string) {
    const resolvedPath = this.resolvePath(filePath);
    const stats = await fs.stat(resolvedPath);

    // Limit file size to prevent memory issues
    if (stats.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('File too large to read');
    }

    const content = await fs.readFile(resolvedPath, encoding);

    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private async writeFile(filePath: string, content: string, append: boolean) {
    const resolvedPath = this.resolvePath(filePath);
    
    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });

    if (append) {
      await fs.appendFile(resolvedPath, content);
    } else {
      await fs.writeFile(resolvedPath, content);
    }

    return {
      content: [
        {
          type: 'text',
          text: `File ${append ? 'appended' : 'written'} successfully`,
        },
      ],
    };
  }

  private async deleteFile(filePath: string) {
    const resolvedPath = this.resolvePath(filePath);
    await fs.unlink(resolvedPath);

    return {
      content: [
        {
          type: 'text',
          text: 'File deleted successfully',
        },
      ],
    };
  }

  private async moveFile(source: string, destination: string) {
    const sourcePath = this.resolvePath(source);
    const destPath = this.resolvePath(destination);

    await fs.rename(sourcePath, destPath);

    return {
      content: [
        {
          type: 'text',
          text: 'File moved successfully',
        },
      ],
    };
  }

  private async fileInfo(filePath: string) {
    const resolvedPath = this.resolvePath(filePath);
    const stats = await fs.stat(resolvedPath);
    
    // Calculate file hash for integrity
    let hash = '';
    if (stats.isFile() && stats.size < 100 * 1024 * 1024) { // 100MB
      const hasher = crypto.createHash('sha256');
      const stream = createReadStream(resolvedPath);
      
      await pipeline(stream, hasher);
      hash = hasher.digest('hex');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            path: filePath,
            size: stats.size,
            sizeHuman: this.formatBytes(stats.size),
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            permissions: stats.mode.toString(8),
            hash: hash || 'File too large for hash calculation',
          }, null, 2),
        },
      ],
    };
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  async start() {
    // Ensure sandbox directory exists
    await fs.mkdir(this.rootDir, { recursive: true });
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FileSystem MCP server started');
  }
}

// Start the server
const server = new FileSystemServer();
server.start().catch(console.error);
```

## API Gateway Server

A server that acts as a gateway to multiple APIs with authentication and rate limiting.

```typescript
// apps/api-gateway-mcp/src/main.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios, { AxiosInstance } from 'axios';
import { RateLimiter } from 'limiter';

interface APIConfig {
  name: string;
  baseURL: string;
  auth?: {
    type: 'bearer' | 'apikey' | 'basic';
    credentials: string;
    header?: string;
  };
  rateLimit?: {
    requests: number;
    interval: number; // milliseconds
  };
}

class APIGatewayServer {
  private server: Server;
  private apis: Map<string, APIClient> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'api-gateway-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.loadAPIConfigs();
    this.setupHandlers();
  }

  private loadAPIConfigs() {
    const configs: APIConfig[] = [
      {
        name: 'github',
        baseURL: 'https://api.github.com',
        auth: {
          type: 'bearer',
          credentials: process.env.GITHUB_TOKEN || '',
        },
        rateLimit: {
          requests: 60,
          interval: 60 * 60 * 1000, // 1 hour
        },
      },
      {
        name: 'weather',
        baseURL: 'https://api.openweathermap.org/data/2.5',
        auth: {
          type: 'apikey',
          credentials: process.env.OPENWEATHER_API_KEY || '',
          header: 'appid',
        },
        rateLimit: {
          requests: 60,
          interval: 60 * 1000, // 1 minute
        },
      },
      // Add more API configurations as needed
    ];

    for (const config of configs) {
      this.apis.set(config.name, new APIClient(config));
    }
  }

  private setupHandlers() {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [];

      // Generic API call tool
      tools.push({
        name: 'api-call',
        description: 'Make an API call to a configured service',
        inputSchema: {
          type: 'object',
          properties: {
            api: {
              type: 'string',
              description: 'API name',
              enum: Array.from(this.apis.keys()),
            },
            method: {
              type: 'string',
              description: 'HTTP method',
              enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
              default: 'GET',
            },
            path: {
              type: 'string',
              description: 'API path',
            },
            params: {
              type: 'object',
              description: 'Query parameters',
            },
            data: {
              type: 'object',
              description: 'Request body',
            },
            headers: {
              type: 'object',
              description: 'Additional headers',
            },
          },
          required: ['api', 'path'],
        },
      });

      // API-specific tools
      tools.push({
        name: 'github-repo-info',
        description: 'Get GitHub repository information',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
          },
          required: ['owner', 'repo'],
        },
      });

      tools.push({
        name: 'weather-current',
        description: 'Get current weather for a city',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'City name',
            },
            country: {
              type: 'string',
              description: 'Country code',
            },
            units: {
              type: 'string',
              description: 'Temperature units',
              enum: ['metric', 'imperial'],
              default: 'metric',
            },
          },
          required: ['city'],
        },
      });

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'api-call':
          return await this.apiCall(args);
        case 'github-repo-info':
          return await this.githubRepoInfo(args.owner, args.repo);
        case 'weather-current':
          return await this.weatherCurrent(args.city, args.country, args.units);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'api://config',
            name: 'API Configuration',
            description: 'Current API gateway configuration',
            mimeType: 'application/json',
          },
          {
            uri: 'api://stats',
            name: 'API Statistics',
            description: 'API usage statistics',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Read resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'api://config':
          return this.getConfig();
        case 'api://stats':
          return this.getStats();
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private async apiCall(args: any) {
    const client = this.apis.get(args.api);
    if (!client) {
      throw new Error(`Unknown API: ${args.api}`);
    }

    try {
      const response = await client.request({
        method: args.method || 'GET',
        url: args.path,
        params: args.params,
        data: args.data,
        headers: args.headers,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `API error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async githubRepoInfo(owner: string, repo: string) {
    const github = this.apis.get('github');
    if (!github) {
      throw new Error('GitHub API not configured');
    }

    const response = await github.request({
      method: 'GET',
      url: `/repos/${owner}/${repo}`,
    });

    // Extract relevant information
    const info = {
      name: response.data.name,
      description: response.data.description,
      stars: response.data.stargazers_count,
      forks: response.data.forks_count,
      language: response.data.language,
      created: response.data.created_at,
      updated: response.data.updated_at,
      topics: response.data.topics,
      license: response.data.license?.name,
      defaultBranch: response.data.default_branch,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  private async weatherCurrent(city: string, country?: string, units = 'metric') {
    const weather = this.apis.get('weather');
    if (!weather) {
      throw new Error('Weather API not configured');
    }

    const q = country ? `${city},${country}` : city;
    
    const response = await weather.request({
      method: 'GET',
      url: '/weather',
      params: { q, units },
    });

    // Format weather data
    const data = {
      location: response.data.name,
      country: response.data.sys.country,
      temperature: response.data.main.temp,
      feelsLike: response.data.main.feels_like,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      pressure: response.data.main.pressure,
      windSpeed: response.data.wind.speed,
      windDirection: response.data.wind.deg,
      clouds: response.data.clouds.all,
      units: units,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private getConfig() {
    const config = Array.from(this.apis.entries()).map(([name, client]) => ({
      name,
      baseURL: client.config.baseURL,
      authType: client.config.auth?.type,
      rateLimit: client.config.rateLimit,
    }));

    return {
      contents: [
        {
          uri: 'api://config',
          mimeType: 'application/json',
          text: JSON.stringify(config, null, 2),
        },
      ],
    };
  }

  private getStats() {
    const stats = Array.from(this.apis.entries()).map(([name, client]) => ({
      name,
      requestsRemaining: client.limiter?.getTokensRemaining(),
      totalRequests: client.requestCount,
      errors: client.errorCount,
    }));

    return {
      contents: [
        {
          uri: 'api://stats',
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('API Gateway MCP server started');
  }
}

class APIClient {
  public config: APIConfig;
  public limiter?: RateLimiter;
  public requestCount = 0;
  public errorCount = 0;
  private axios: AxiosInstance;

  constructor(config: APIConfig) {
    this.config = config;

    // Set up rate limiter
    if (config.rateLimit) {
      this.limiter = new RateLimiter({
        tokensPerInterval: config.rateLimit.requests,
        interval: config.rateLimit.interval,
      });
    }

    // Set up axios instance
    this.axios = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
    });

    // Add authentication
    this.setupAuth();

    // Add interceptors
    this.setupInterceptors();
  }

  private setupAuth() {
    if (!this.config.auth) return;

    const { type, credentials, header } = this.config.auth;

    switch (type) {
      case 'bearer':
        this.axios.defaults.headers.common['Authorization'] = `Bearer ${credentials}`;
        break;
      case 'apikey':
        if (header) {
          this.axios.defaults.params = { [header]: credentials };
        } else {
          this.axios.defaults.headers.common['X-API-Key'] = credentials;
        }
        break;
      case 'basic':
        this.axios.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
        break;
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.axios.interceptors.request.use(
      async (config) => {
        // Check rate limit
        if (this.limiter) {
          const hasToken = await this.limiter.tryRemoveTokens(1);
          if (!hasToken) {
            throw new Error('Rate limit exceeded');
          }
        }

        this.requestCount++;
        return config;
      },
      (error) => {
        this.errorCount++;
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        this.errorCount++;
        
        // Enhanced error message
        if (error.response) {
          error.message = `${error.response.status}: ${error.response.statusText}`;
          if (error.response.data?.message) {
            error.message += ` - ${error.response.data.message}`;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async request(config: any) {
    return await this.axios.request(config);
  }
}

// Start the server
const server = new APIGatewayServer();
server.start().catch(console.error);
```

## Code Analysis Server

A server that provides code analysis and refactoring suggestions.

```typescript
// apps/code-analysis-mcp/src/main.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ESLint } from 'eslint';

class CodeAnalysisServer {
  private server: Server;
  private eslint: ESLint;

  constructor() {
    this.server = new Server(
      {
        name: 'code-analysis-mcp',
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

    this.eslint = new ESLint({
      useEslintrc: false,
      overrideConfig: {
        extends: ['eslint:recommended'],
        parserOptions: {
          ecmaVersion: 2021,
          sourceType: 'module',
        },
        env: {
          node: true,
          es2021: true,
        },
      },
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze-typescript',
            description: 'Analyze TypeScript code for issues and suggestions',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'TypeScript code to analyze',
                },
                filename: {
                  type: 'string',
                  description: 'Filename for context',
                  default: 'code.ts',
                },
              },
              required: ['code'],
            },
          },
          {
            name: 'lint-code',
            description: 'Lint JavaScript/TypeScript code',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code to lint',
                },
                filename: {
                  type: 'string',
                  description: 'Filename for context',
                  default: 'code.js',
                },
                fix: {
                  type: 'boolean',
                  description: 'Apply automatic fixes',
                  default: false,
                },
              },
              required: ['code'],
            },
          },
          {
            name: 'complexity-analysis',
            description: 'Analyze code complexity',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code to analyze',
                },
                threshold: {
                  type: 'number',
                  description: 'Complexity threshold',
                  default: 10,
                },
              },
              required: ['code'],
            },
          },
          {
            name: 'suggest-refactoring',
            description: 'Suggest code refactoring',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code to refactor',
                },
                type: {
                  type: 'string',
                  description: 'Refactoring type',
                  enum: ['extract-function', 'simplify-conditional', 'remove-duplication'],
                },
              },
              required: ['code'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'analyze-typescript':
          return await this.analyzeTypeScript(args.code, args.filename);
        case 'lint-code':
          return await this.lintCode(args.code, args.filename, args.fix);
        case 'complexity-analysis':
          return await this.analyzeComplexity(args.code, args.threshold);
        case 'suggest-refactoring':
          return await this.suggestRefactoring(args.code, args.type);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'code-review',
            description: 'Perform a comprehensive code review',
            arguments: [
              {
                name: 'code',
                description: 'Code to review',
                required: true,
              },
              {
                name: 'language',
                description: 'Programming language',
                required: true,
              },
              {
                name: 'focus',
                description: 'Review focus areas',
                required: false,
              },
            ],
          },
          {
            name: 'optimization-suggestions',
            description: 'Suggest performance optimizations',
            arguments: [
              {
                name: 'code',
                description: 'Code to optimize',
                required: true,
              },
              {
                name: 'context',
                description: 'Application context',
                required: false,
              },
            ],
          },
        ],
      };
    });

    // Get prompts
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'code-review':
          return {
            description: 'Perform a comprehensive code review',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Please review the following ${args.language} code:

${args.code}

Focus areas: ${args.focus || 'general review'}

Please analyze:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Readability and maintainability
6. Suggestions for improvement`,
                },
              },
            ],
          };
        case 'optimization-suggestions':
          return {
            description: 'Suggest performance optimizations',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Please analyze the following code for performance optimization opportunities:

${args.code}

Context: ${args.context || 'general application'}

Please suggest:
1. Algorithm improvements
2. Data structure optimizations
3. Caching opportunities
4. Async/parallel processing options
5. Memory usage optimizations`,
                },
              },
            ],
          };
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });
  }

  private async analyzeTypeScript(code: string, filename: string) {
    const sourceFile = ts.createSourceFile(
      filename,
      code,
      ts.ScriptTarget.Latest,
      true
    );

    const diagnostics: any[] = [];
    const suggestions: any[] = [];

    // Analyze syntax errors
    const syntaxDiagnostics = sourceFile.parseDiagnostics;
    for (const diag of syntaxDiagnostics) {
      diagnostics.push({
        type: 'error',
        message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
        line: sourceFile.getLineAndCharacterOfPosition(diag.start || 0).line + 1,
      });
    }

    // Analyze code patterns
    const visit = (node: ts.Node) => {
      // Check for console.log statements
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText() === 'console'
      ) {
        suggestions.push({
          type: 'suggestion',
          message: 'Consider using a proper logging library instead of console.log',
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        });
      }

      // Check for any type
      if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'any') {
        suggestions.push({
          type: 'warning',
          message: 'Avoid using "any" type, use specific types instead',
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        });
      }

      // Check for large functions
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        const body = node.body;
        if (body && ts.isBlock(body)) {
          const lines = body.statements.length;
          if (lines > 20) {
            suggestions.push({
              type: 'suggestion',
              message: `Function is too long (${lines} statements). Consider breaking it down`,
              line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              diagnostics,
              suggestions,
              summary: {
                errors: diagnostics.filter(d => d.type === 'error').length,
                warnings: suggestions.filter(s => s.type === 'warning').length,
                suggestions: suggestions.filter(s => s.type === 'suggestion').length,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async lintCode(code: string, filename: string, fix: boolean) {
    const results = await this.eslint.lintText(code, {
      filePath: filename,
      fix,
    });

    const result = results[0];
    const summary = {
      errorCount: result.errorCount,
      warningCount: result.warningCount,
      fixableErrorCount: result.fixableErrorCount,
      fixableWarningCount: result.fixableWarningCount,
    };

    const issues = result.messages.map(msg => ({
      ruleId: msg.ruleId,
      severity: msg.severity === 2 ? 'error' : 'warning',
      message: msg.message,
      line: msg.line,
      column: msg.column,
      fix: msg.fix ? {
        range: msg.fix.range,
        text: msg.fix.text,
      } : null,
    }));

    const response: any = {
      summary,
      issues,
    };

    if (fix && result.output) {
      response.fixedCode = result.output;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async analyzeComplexity(code: string, threshold: number) {
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );

    const complexities: any[] = [];

    const calculateComplexity = (node: ts.Node): number => {
      let complexity = 1;

      const visit = (n: ts.Node) => {
        // Increment complexity for control flow statements
        if (
          ts.isIfStatement(n) ||
          ts.isConditionalExpression(n) ||
          ts.isSwitchStatement(n) ||
          ts.isForStatement(n) ||
          ts.isForInStatement(n) ||
          ts.isForOfStatement(n) ||
          ts.isWhileStatement(n) ||
          ts.isDoStatement(n) ||
          ts.isCatchClause(n)
        ) {
          complexity++;
        }

        // Increment for logical operators
        if (ts.isBinaryExpression(n)) {
          const op = n.operatorToken.kind;
          if (op === ts.SyntaxKind.AmpersandAmpersandToken || op === ts.SyntaxKind.BarBarToken) {
            complexity++;
          }
        }

        ts.forEachChild(n, visit);
      };

      visit(node);
      return complexity;
    };

    const analyzeFunctions = (node: ts.Node) => {
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node)
      ) {
        const name = node.name?.getText() || '<anonymous>';
        const complexity = calculateComplexity(node);
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

        complexities.push({
          name,
          complexity,
          line,
          exceedsThreshold: complexity > threshold,
        });
      }

      ts.forEachChild(node, analyzeFunctions);
    };

    analyzeFunctions(sourceFile);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              threshold,
              functions: complexities,
              summary: {
                total: complexities.length,
                complex: complexities.filter(f => f.exceedsThreshold).length,
                averageComplexity: complexities.length > 0
                  ? (complexities.reduce((sum, f) => sum + f.complexity, 0) / complexities.length).toFixed(2)
                  : 0,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async suggestRefactoring(code: string, type?: string) {
    const suggestions: any[] = [];

    // Parse the code
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );

    if (!type || type === 'extract-function') {
      // Look for repeated code blocks
      const codeBlocks = new Map<string, number>();
      
      const visit = (node: ts.Node) => {
        if (ts.isBlock(node) && node.statements.length > 3) {
          const blockText = node.getText();
          const count = codeBlocks.get(blockText) || 0;
          codeBlocks.set(blockText, count + 1);
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

      for (const [block, count] of codeBlocks) {
        if (count > 1) {
          suggestions.push({
            type: 'extract-function',
            message: `This code block appears ${count} times. Consider extracting it into a function`,
            code: block.substring(0, 100) + '...',
          });
        }
      }
    }

    if (!type || type === 'simplify-conditional') {
      // Look for complex conditionals
      const visit = (node: ts.Node) => {
        if (ts.isIfStatement(node)) {
          const condition = node.expression;
          const conditionText = condition.getText();
          
          // Check for negated conditions with else clause
          if (
            ts.isPrefixUnaryExpression(condition) &&
            condition.operator === ts.SyntaxKind.ExclamationToken &&
            node.elseStatement
          ) {
            suggestions.push({
              type: 'simplify-conditional',
              message: 'Consider inverting this condition to remove negation',
              original: `if (!${condition.operand.getText()}) { ... } else { ... }`,
              suggested: `if (${condition.operand.getText()}) { /* else block */ } else { /* if block */ }`,
            });
          }

          // Check for complex boolean expressions
          const countLogicalOps = (n: ts.Node): number => {
            let count = 0;
            if (ts.isBinaryExpression(n)) {
              const op = n.operatorToken.kind;
              if (
                op === ts.SyntaxKind.AmpersandAmpersandToken ||
                op === ts.SyntaxKind.BarBarToken
              ) {
                count = 1 + countLogicalOps(n.left) + countLogicalOps(n.right);
              }
            }
            return count;
          };

          const logicalOps = countLogicalOps(condition);
          if (logicalOps > 2) {
            suggestions.push({
              type: 'simplify-conditional',
              message: 'Complex condition detected. Consider extracting to a well-named variable or function',
              condition: conditionText,
              complexity: logicalOps + 1,
            });
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              requestedType: type,
              suggestions,
              summary: {
                total: suggestions.length,
                byType: suggestions.reduce((acc, s) => {
                  acc[s.type] = (acc[s.type] || 0) + 1;
                  return acc;
                }, {}),
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Code Analysis MCP server started');
  }
}

// Start the server
const server = new CodeAnalysisServer();
server.start().catch(console.error);
```

These examples demonstrate various MCP server patterns:

1. **Database Query Server**: Safe database access with parameterized queries
2. **File System Operations Server**: Sandboxed file operations with security checks
3. **API Gateway Server**: Unified API access with authentication and rate limiting
4. **Code Analysis Server**: Advanced code analysis with TypeScript compiler API

Each example includes:
- Proper error handling
- Input validation
- Resource management
- Security considerations
- Comprehensive tool definitions
- Clear response formatting

For more examples and patterns, see the [Advanced Topics](./advanced-topics.md) guide. 