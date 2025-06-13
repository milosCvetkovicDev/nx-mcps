# Advanced MCP Server Development

This guide covers advanced topics for building sophisticated MCP servers in the Nx workspace.

## Table of Contents

- [Streaming Responses](#streaming-responses)
- [Middleware and Interceptors](#middleware-and-interceptors)
- [Custom Transports](#custom-transports)
- [Advanced Error Handling](#advanced-error-handling)
- [Performance Optimization](#performance-optimization)
- [State Management](#state-management)
- [Authentication and Authorization](#authentication-and-authorization)
- [Monitoring and Observability](#monitoring-and-observability)
- [Plugin Architecture](#plugin-architecture)
- [Testing Strategies](#testing-strategies)

## Streaming Responses

For large data sets or real-time updates, implement streaming responses:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'stream-logs') {
    const { filePath, lines = 100 } = request.params.arguments;
    
    // Create a streaming response
    return {
      content: [{
        type: 'text',
        text: await streamLogs(filePath, lines)
      }],
      // Indicate this is a streaming response
      _meta: {
        streaming: true
      }
    };
  }
});

async function* streamLogs(filePath: string, maxLines: number) {
  const stream = createReadStream(filePath, { encoding: 'utf8' });
  let lineCount = 0;
  let buffer = '';
  
  for await (const chunk of stream) {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (lineCount >= maxLines) break;
      yield line + '\n';
      lineCount++;
    }
  }
  
  if (buffer && lineCount < maxLines) {
    yield buffer;
  }
}
```

### Chunked Responses

For very large responses, implement chunking:

```typescript
class ChunkedResponseHandler {
  private chunkSize = 1024 * 1024; // 1MB chunks
  
  async handleLargeDataRequest(request: any) {
    const data = await this.fetchLargeDataset(request.params);
    const chunks = this.chunkData(data);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalChunks: chunks.length,
          chunkSize: this.chunkSize,
          firstChunk: chunks[0]
        })
      }],
      _meta: {
        hasMoreChunks: chunks.length > 1,
        chunkIds: chunks.map((_, i) => `chunk-${i}`)
      }
    };
  }
  
  private chunkData(data: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i += this.chunkSize) {
      chunks.push(data.slice(i, i + this.chunkSize));
    }
    return chunks;
  }
}
```

## Middleware and Interceptors

Implement cross-cutting concerns with middleware:

```typescript
type Middleware = (
  request: any,
  next: () => Promise<any>
) => Promise<any>;

class MiddlewareServer extends Server {
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }
  
  async handleRequest(request: any): Promise<any> {
    const chain = this.middlewares.reduceRight(
      (next, middleware) => () => middleware(request, next),
      () => super.handleRequest(request)
    );
    
    return chain();
  }
}

// Usage
const server = new MiddlewareServer(config);

// Logging middleware
server.use(async (request, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${request.method} started`);
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${request.method} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[${new Date().toISOString()}] ${request.method} failed in ${duration}ms`, error);
    throw error;
  }
});

// Rate limiting middleware
server.use(async (request, next) => {
  const key = `${request.clientId}:${request.method}`;
  const limit = await rateLimiter.check(key);
  
  if (!limit.allowed) {
    throw new Error(`Rate limit exceeded. Try again in ${limit.retryAfter}s`);
  }
  
  return next();
});

// Authentication middleware
server.use(async (request, next) => {
  if (request.method === 'authenticate') {
    return next(); // Skip auth for auth endpoint
  }
  
  const token = request.headers?.authorization;
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const user = await validateToken(token);
  request.user = user;
  
  return next();
});
```

## Custom Transports

Implement custom transports for specific deployment scenarios:

```typescript
import { Transport } from '@modelcontextprotocol/sdk/transport/index.js';
import WebSocket from 'ws';

class WebSocketTransport implements Transport {
  private ws: WebSocket;
  private messageHandlers: Set<(message: any) => void> = new Set();
  
  constructor(private url: string) {}
  
  async connect(): Promise<void> {
    this.ws = new WebSocket(this.url);
    
    return new Promise((resolve, reject) => {
      this.ws.on('open', () => resolve());
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        this.messageHandlers.forEach(handler => handler(message));
      });
    });
  }
  
  async send(message: any): Promise<void> {
    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    this.ws.send(JSON.stringify(message));
  }
  
  onMessage(handler: (message: any) => void): void {
    this.messageHandlers.add(handler);
  }
  
  async close(): Promise<void> {
    this.ws.close();
  }
}

// Usage
const transport = new WebSocketTransport('ws://localhost:8080');
await server.connect(transport);
```

### HTTP/REST Transport

```typescript
import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

class HttpTransport {
  private app: express.Application;
  private server: Server;
  
  constructor(server: Server, port: number = 3000) {
    this.server = server;
    this.app = express();
    this.setupRoutes();
    this.app.listen(port);
  }
  
  private setupRoutes() {
    this.app.use(express.json());
    
    // List tools
    this.app.get('/tools', async (req, res) => {
      const response = await this.server.handleRequest({
        method: 'tools/list',
        params: {}
      });
      res.json(response);
    });
    
    // Call tool
    this.app.post('/tools/:name', async (req, res) => {
      try {
        const response = await this.server.handleRequest({
          method: 'tools/call',
          params: {
            name: req.params.name,
            arguments: req.body
          }
        });
        res.json(response);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Resources
    this.app.get('/resources', async (req, res) => {
      const response = await this.server.handleRequest({
        method: 'resources/list',
        params: {}
      });
      res.json(response);
    });
    
    this.app.get('/resources/*', async (req, res) => {
      const uri = req.params[0];
      const response = await this.server.handleRequest({
        method: 'resources/read',
        params: { uri }
      });
      res.json(response);
    });
  }
}
```

## Advanced Error Handling

Implement sophisticated error handling with recovery strategies:

```typescript
class ErrorHandler {
  private retryStrategies = new Map<string, RetryStrategy>();
  private errorFilters = new Map<string, ErrorFilter>();
  
  registerRetryStrategy(errorType: string, strategy: RetryStrategy) {
    this.retryStrategies.set(errorType, strategy);
  }
  
  registerErrorFilter(pattern: string, filter: ErrorFilter) {
    this.errorFilters.set(pattern, filter);
  }
  
  async handle<T>(
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    let lastError: Error;
    let attempt = 0;
    
    while (attempt < context.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        attempt++;
        
        // Apply error filters
        const filteredError = this.applyFilters(error);
        if (filteredError !== error) {
          throw filteredError;
        }
        
        // Check if we should retry
        const strategy = this.getRetryStrategy(error);
        if (!strategy || !strategy.shouldRetry(error, attempt)) {
          throw error;
        }
        
        // Wait before retry
        const delay = strategy.getDelay(attempt);
        await this.sleep(delay);
        
        // Log retry attempt
        console.log(`Retrying operation (attempt ${attempt}/${context.maxRetries}) after ${delay}ms`);
      }
    }
    
    throw lastError!;
  }
  
  private applyFilters(error: Error): Error {
    for (const [pattern, filter] of this.errorFilters) {
      if (error.message.includes(pattern)) {
        return filter(error);
      }
    }
    return error;
  }
  
  private getRetryStrategy(error: Error): RetryStrategy | undefined {
    for (const [type, strategy] of this.retryStrategies) {
      if (error.constructor.name === type || error.message.includes(type)) {
        return strategy;
      }
    }
    return undefined;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface RetryStrategy {
  shouldRetry(error: Error, attempt: number): boolean;
  getDelay(attempt: number): number;
}

class ExponentialBackoffStrategy implements RetryStrategy {
  constructor(
    private baseDelay = 1000,
    private maxDelay = 30000,
    private factor = 2
  ) {}
  
  shouldRetry(error: Error, attempt: number): boolean {
    // Retry on network errors or rate limits
    return (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('rate limit') ||
      error.message.includes('timeout')
    );
  }
  
  getDelay(attempt: number): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(this.factor, attempt - 1),
      this.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }
}
```

## Performance Optimization

### Connection Pooling

```typescript
class ConnectionPool<T> {
  private connections: T[] = [];
  private available: T[] = [];
  private pending: Array<(conn: T) => void> = [];
  
  constructor(
    private factory: () => Promise<T>,
    private options: {
      min: number;
      max: number;
      idleTimeout?: number;
      acquireTimeout?: number;
    }
  ) {
    this.initialize();
  }
  
  private async initialize() {
    for (let i = 0; i < this.options.min; i++) {
      const conn = await this.factory();
      this.connections.push(conn);
      this.available.push(conn);
    }
  }
  
  async acquire(): Promise<T> {
    // Return available connection
    if (this.available.length > 0) {
      return this.available.pop()!;
    }
    
    // Create new connection if under limit
    if (this.connections.length < this.options.max) {
      const conn = await this.factory();
      this.connections.push(conn);
      return conn;
    }
    
    // Wait for connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.pending.indexOf(resolve);
        if (index !== -1) {
          this.pending.splice(index, 1);
          reject(new Error('Connection acquire timeout'));
        }
      }, this.options.acquireTimeout || 30000);
      
      this.pending.push((conn) => {
        clearTimeout(timeout);
        resolve(conn);
      });
    });
  }
  
  release(conn: T): void {
    const pending = this.pending.shift();
    if (pending) {
      pending(conn);
    } else {
      this.available.push(conn);
    }
  }
  
  async destroy(): Promise<void> {
    // Close all connections
    await Promise.all(
      this.connections.map(conn => this.closeConnection(conn))
    );
    this.connections = [];
    this.available = [];
    this.pending = [];
  }
  
  private async closeConnection(conn: T): Promise<void> {
    if (typeof (conn as any).close === 'function') {
      await (conn as any).close();
    }
  }
}
```

### Caching

```typescript
interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  updateOnGet?: boolean;
}

class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private accessOrder: K[] = [];
  
  constructor(private options: CacheOptions = {}) {}
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }
    
    // Update access order
    if (this.options.updateOnGet) {
      this.updateAccessOrder(key);
    }
    
    return entry.value;
  }
  
  set(key: K, value: V, ttl?: number): void {
    // Remove least recently used if at capacity
    if (this.options.maxSize && this.cache.size >= this.options.maxSize) {
      const lru = this.accessOrder.shift();
      if (lru) this.cache.delete(lru);
    }
    
    const expiresAt = ttl || this.options.ttl
      ? Date.now() + (ttl || this.options.ttl!)
      : undefined;
    
    this.cache.set(key, { value, expiresAt });
    this.updateAccessOrder(key);
  }
  
  delete(key: K): boolean {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  private updateAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
}

interface CacheEntry<V> {
  value: V;
  expiresAt?: number;
}

// Usage with memoization decorator
function memoize(options?: CacheOptions) {
  const cache = new LRUCache(options);
  
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = JSON.stringify({ method: propertyKey, args });
      
      let result = cache.get(key);
      if (result !== undefined) {
        return result;
      }
      
      result = await original.apply(this, args);
      cache.set(key, result);
      
      return result;
    };
    
    return descriptor;
  };
}

// Example usage
class DataService {
  @memoize({ ttl: 60000, maxSize: 100 })
  async fetchUserData(userId: string) {
    // Expensive operation
    return await db.query(`SELECT * FROM users WHERE id = ?`, [userId]);
  }
}
```

## State Management

For servers that need to maintain state:

```typescript
interface StateStore<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

class RedisStateStore<T> implements StateStore<T> {
  constructor(private redis: RedisClient) {}
  
  async get(key: string): Promise<T | undefined> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : undefined;
  }
  
  async set(key: string, value: T): Promise<void> {
    await this.redis.set(key, JSON.stringify(value));
  }
  
  async delete(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result > 0;
  }
  
  async clear(): Promise<void> {
    await this.redis.flushdb();
  }
}

class InMemoryStateStore<T> implements StateStore<T> {
  private store = new Map<string, T>();
  
  async get(key: string): Promise<T | undefined> {
    return this.store.get(key);
  }
  
  async set(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
  
  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }
  
  async clear(): Promise<void> {
    this.store.clear();
  }
}

// State management with event sourcing
class EventSourcedState<T> {
  private events: StateEvent[] = [];
  private snapshots = new Map<number, T>();
  private snapshotInterval = 100;
  
  constructor(
    private initialState: T,
    private reducer: (state: T, event: StateEvent) => T
  ) {}
  
  async dispatch(event: StateEvent): Promise<void> {
    this.events.push(event);
    
    // Create snapshot periodically
    if (this.events.length % this.snapshotInterval === 0) {
      const state = await this.getState();
      this.snapshots.set(this.events.length, state);
    }
  }
  
  async getState(): Promise<T> {
    // Find nearest snapshot
    let state = this.initialState;
    let startIndex = 0;
    
    for (const [index, snapshot] of this.snapshots) {
      if (index <= this.events.length) {
        state = snapshot;
        startIndex = index;
      }
    }
    
    // Apply events since snapshot
    for (let i = startIndex; i < this.events.length; i++) {
      state = this.reducer(state, this.events[i]);
    }
    
    return state;
  }
  
  async getEvents(since?: number): Promise<StateEvent[]> {
    return since ? this.events.slice(since) : this.events;
  }
}

interface StateEvent {
  type: string;
  payload: any;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

## Authentication and Authorization

Implement secure authentication:

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface AuthConfig {
  jwtSecret: string;
  jwtExpiry: string;
  bcryptRounds: number;
}

class AuthService {
  constructor(private config: AuthConfig) {}
  
  async createUser(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(
      password,
      this.config.bcryptRounds
    );
    
    const user = {
      id: generateId(),
      username,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    await db.users.insert(user);
    return user;
  }
  
  async authenticate(username: string, password: string): Promise<string> {
    const user = await db.users.findOne({ username });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }
    
    return this.generateToken(user);
  }
  
  async validateToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, this.config.jwtSecret) as JwtPayload;
      const user = await db.users.findOne({ id: payload.userId });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      this.config.jwtSecret,
      {
        expiresIn: this.config.jwtExpiry
      }
    );
  }
}

// Role-based access control
class AuthorizationService {
  private permissions = new Map<string, Set<string>>();
  
  defineRole(role: string, permissions: string[]) {
    this.permissions.set(role, new Set(permissions));
  }
  
  can(user: User, permission: string): boolean {
    const userPermissions = new Set<string>();
    
    // Collect all permissions from user roles
    for (const role of user.roles || []) {
      const rolePermissions = this.permissions.get(role);
      if (rolePermissions) {
        rolePermissions.forEach(p => userPermissions.add(p));
      }
    }
    
    // Check for wildcard permissions
    if (userPermissions.has('*')) return true;
    
    // Check specific permission
    return userPermissions.has(permission);
  }
  
  requirePermission(permission: string) {
    return async (request: any, next: () => Promise<any>) => {
      if (!this.can(request.user, permission)) {
        throw new Error(`Permission denied: ${permission}`);
      }
      return next();
    };
  }
}

// Usage
const auth = new AuthorizationService();
auth.defineRole('admin', ['*']);
auth.defineRole('user', ['tools.read', 'resources.read']);
auth.defineRole('developer', ['tools.*', 'resources.*']);

server.use(auth.requirePermission('tools.execute'));
```

## Monitoring and Observability

Implement comprehensive monitoring:

```typescript
import { metrics } from '@opentelemetry/api-metrics';
import { trace } from '@opentelemetry/api';

class MonitoringService {
  private meter = metrics.getMeter('mcp-server');
  private tracer = trace.getTracer('mcp-server');
  
  // Metrics
  private requestCounter = this.meter.createCounter('requests_total', {
    description: 'Total number of requests'
  });
  
  private requestDuration = this.meter.createHistogram('request_duration', {
    description: 'Request duration in milliseconds'
  });
  
  private activeConnections = this.meter.createUpDownCounter('active_connections', {
    description: 'Number of active connections'
  });
  
  private errorCounter = this.meter.createCounter('errors_total', {
    description: 'Total number of errors'
  });
  
  // Monitoring middleware
  middleware() {
    return async (request: any, next: () => Promise<any>) => {
      const span = this.tracer.startSpan('mcp.request', {
        attributes: {
          'mcp.method': request.method,
          'mcp.client_id': request.clientId
        }
      });
      
      const start = Date.now();
      this.requestCounter.add(1, { method: request.method });
      
      try {
        const result = await trace.context.with(
          trace.setSpan(trace.context.active(), span),
          next
        );
        
        const duration = Date.now() - start;
        this.requestDuration.record(duration, { method: request.method });
        
        span.setStatus({ code: 0 });
        return result;
      } catch (error) {
        this.errorCounter.add(1, {
          method: request.method,
          error: error.constructor.name
        });
        
        span.setStatus({
          code: 2,
          message: error.message
        });
        span.recordException(error);
        
        throw error;
      } finally {
        span.end();
      }
    };
  }
  
  // Health check endpoint
  async healthCheck(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs()
    ]);
    
    const status: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    checks.forEach((result, index) => {
      const checkName = ['database', 'redis', 'external_apis'][index];
      status.checks[checkName] = result.status === 'fulfilled'
        ? { status: 'healthy', ...result.value }
        : { status: 'unhealthy', error: result.reason.message };
      
      if (result.status === 'rejected') {
        status.status = 'unhealthy';
      }
    });
    
    return status;
  }
  
  private async checkDatabase(): Promise<any> {
    const start = Date.now();
    await db.query('SELECT 1');
    return { responseTime: Date.now() - start };
  }
  
  private async checkRedis(): Promise<any> {
    const start = Date.now();
    await redis.ping();
    return { responseTime: Date.now() - start };
  }
  
  private async checkExternalAPIs(): Promise<any> {
    // Check external dependencies
    return { status: 'ok' };
  }
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: Record<string, any>;
}
```

## Plugin Architecture

Create an extensible plugin system:

```typescript
interface Plugin {
  name: string;
  version: string;
  init(server: Server): Promise<void>;
  destroy?(): Promise<void>;
}

class PluginManager {
  private plugins = new Map<string, Plugin>();
  private server: Server;
  
  constructor(server: Server) {
    this.server = server;
  }
  
  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }
    
    console.log(`Registering plugin: ${plugin.name} v${plugin.version}`);
    await plugin.init(this.server);
    this.plugins.set(plugin.name, plugin);
  }
  
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }
    
    if (plugin.destroy) {
      await plugin.destroy();
    }
    
    this.plugins.delete(name);
  }
  
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
  
  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version
    }));
  }
}

// Example plugin
class LoggingPlugin implements Plugin {
  name = 'logging';
  version = '1.0.0';
  
  async init(server: Server): Promise<void> {
    // Add logging to all handlers
    const originalSetHandler = server.setRequestHandler.bind(server);
    
    server.setRequestHandler = (schema: any, handler: any) => {
      const wrappedHandler = async (request: any) => {
        console.log(`[${this.name}] Handling ${schema.name}`);
        const start = Date.now();
        
        try {
          const result = await handler(request);
          console.log(`[${this.name}] Completed ${schema.name} in ${Date.now() - start}ms`);
          return result;
        } catch (error) {
          console.error(`[${this.name}] Error in ${schema.name}:`, error);
          throw error;
        }
      };
      
      originalSetHandler(schema, wrappedHandler);
    };
  }
}
```

## Testing Strategies

### Contract Testing

```typescript
import { Contract, ContractVerifier } from '@mcp/contract-testing';

// Define contracts
const calculatorContract = new Contract({
  name: 'calculator',
  version: '1.0.0',
  tools: [
    {
      name: 'add',
      input: {
        type: 'object',
        properties: {
          a: { type: 'number' },
          b: { type: 'number' }
        },
        required: ['a', 'b']
      },
      output: {
        type: 'object',
        properties: {
          result: { type: 'number' }
        }
      },
      examples: [
        {
          input: { a: 2, b: 3 },
          output: { result: 5 }
        }
      ]
    }
  ]
});

// Verify server implements contract
describe('Calculator Server Contract', () => {
  const verifier = new ContractVerifier(calculatorContract);
  
  it('should fulfill the calculator contract', async () => {
    const server = await createTestServer();
    await verifier.verify(server);
  });
});
```

### Load Testing

```typescript
import { loadTest } from '@mcp/load-testing';

describe('Performance Tests', () => {
  it('should handle 1000 concurrent requests', async () => {
    const results = await loadTest({
      server: 'dist/apps/my-server/main.js',
      scenarios: [
        {
          name: 'steady load',
          executor: 'constant-vus',
          vus: 100,
          duration: '30s',
          requests: [
            {
              method: 'tools/call',
              params: {
                name: 'calculate',
                arguments: { expression: '2 + 2' }
              },
              weight: 0.7
            },
            {
              method: 'resources/list',
              params: {},
              weight: 0.3
            }
          ]
        }
      ],
      thresholds: {
        'http_req_duration': ['p(95)<200'],
        'http_req_failed': ['rate<0.01']
      }
    });
    
    expect(results.success).toBe(true);
  });
});
```

## Best Practices Summary

1. **Use TypeScript** for type safety and better IDE support
2. **Implement proper error handling** with meaningful error messages
3. **Add comprehensive logging** for debugging and monitoring
4. **Use middleware** for cross-cutting concerns
5. **Implement caching** for expensive operations
6. **Add health checks** for production monitoring
7. **Write tests** at multiple levels (unit, integration, contract)
8. **Document your APIs** thoroughly
9. **Version your servers** properly
10. **Monitor performance** and optimize bottlenecks

## Next Steps

- Explore the [server examples](./server-examples.md) documentation
- Read the [MCP specification](https://github.com/modelcontextprotocol/specification)
- Join the [MCP community](https://discord.gg/mcp) for support

---

For more information, see the main [README](../README.md) and [Development Guide](./development-guide.md) documentation. 