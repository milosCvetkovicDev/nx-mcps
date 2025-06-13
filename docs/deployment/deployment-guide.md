# MCP Server Deployment Guide

This guide covers various deployment strategies for MCP servers, from local development to production environments.

## Table of Contents

- [Build Process](#build-process)
- [Deployment Strategies](#deployment-strategies)
- [Environment Configuration](#environment-configuration)
- [Security Considerations](#security-considerations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Scaling Strategies](#scaling-strategies)

## Build Process

### Development Build

For development and testing:

```bash
# Build a specific server
nx build my-server

# Build with source maps for debugging
nx build my-server --sourceMap

# Build all servers
npm run mcp:build
```

### Production Build

For production deployment:

```bash
# Production build with optimizations
nx build my-server --configuration=production

# Build with specific Node.js target
nx build my-server --configuration=production --target=node18
```

### Build Output

Build artifacts are placed in:
```
dist/
└── apps/
    └── my-server/
        ├── src/
        │   ├── main.js        # Entry point
        │   └── ...            # Compiled source
        ├── package.json       # Dependencies
        └── assets/            # Static assets
```

## Deployment Strategies

### 1. Local Development

Best for testing and development:

```bash
# Direct execution
node dist/apps/my-server/src/main.js

# With environment variables
NODE_ENV=development node dist/apps/my-server/src/main.js

# Using npm scripts
cd dist/apps/my-server && npm start
```

### 2. Claude Desktop Integration

For use with Claude Desktop app:

**macOS Configuration:**
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/absolute/path/to/dist/apps/my-server/src/main.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Windows Configuration:**
```json
// %APPDATA%\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "my-server": {
      "command": "node.exe",
      "args": ["C:\\path\\to\\dist\\apps\\my-server\\src\\main.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. Process Manager (PM2)

For production servers with auto-restart:

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start dist/apps/my-server/src/main.js \
  --name "mcp-my-server" \
  --instances 1 \
  --max-memory-restart 1G

# Configure auto-start on boot
pm2 save
pm2 startup

# View logs
pm2 logs mcp-my-server

# Monitor
pm2 monit
```

**PM2 Ecosystem File:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mcp-my-server',
    script: './dist/apps/my-server/src/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 4. Docker Deployment

For containerized deployments:

**Basic Dockerfile:**
```dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy built application
COPY dist/apps/my-server ./

# Install production dependencies only
RUN npm ci --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port if using HTTP transport
EXPOSE 3000

# Start the server
CMD ["node", "src/main.js"]
```

**Multi-stage Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /build
COPY . .
RUN npm ci
RUN nx build my-server --configuration=production

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /build/dist/apps/my-server ./
RUN npm ci --production
USER node
CMD ["node", "src/main.js"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  mcp-server:
    build: .
    container_name: mcp-my-server
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    ports:
      - "3000:3000"  # For HTTP transport
    volumes:
      - ./config:/app/config:ro
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 5. Systemd Service

For Linux systems:

```ini
# /etc/systemd/system/mcp-server.service
[Unit]
Description=MCP Server - My Server
Documentation=https://github.com/your-org/mcp-server
After=network.target

[Service]
Type=simple
User=mcp
Group=mcp
WorkingDirectory=/opt/mcp-server
ExecStart=/usr/bin/node /opt/mcp-server/src/main.js
Restart=on-failure
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/mcp-server/logs

# Resource limits
LimitNOFILE=65535
MemoryLimit=1G

# Environment
Environment="NODE_ENV=production"
Environment="LOG_LEVEL=info"

[Install]
WantedBy=multi-user.target
```

**Managing the service:**
```bash
# Enable and start
sudo systemctl enable mcp-server
sudo systemctl start mcp-server

# Check status
sudo systemctl status mcp-server

# View logs
sudo journalctl -u mcp-server -f
```

### 6. Kubernetes Deployment

For cloud-native deployments:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
  labels:
    app: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: your-registry/mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-server
spec:
  selector:
    app: mcp-server
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

## Environment Configuration

### Configuration Management

**Environment Variables:**
```bash
# .env.production
NODE_ENV=production
MCP_LOG_LEVEL=info
MCP_TRANSPORT=stdio
MCP_PORT=3000
MCP_HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@host/db
API_KEY=your-secure-api-key
```

**Configuration File:**
```typescript
// config/production.json
{
  "server": {
    "name": "my-server",
    "version": "1.0.0",
    "transport": "http",
    "port": 3000
  },
  "features": {
    "rateLimit": true,
    "authentication": true
  },
  "database": {
    "host": "db.example.com",
    "port": 5432,
    "ssl": true
  }
}
```

**Loading Configuration:**
```typescript
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: `.env.${process.env.NODE_ENV}` });

// Load JSON config
const configFile = `config/${process.env.NODE_ENV}.json`;
const configuration = JSON.parse(readFileSync(configFile, 'utf-8'));

// Merge with environment overrides
const finalConfig = {
  ...configuration,
  server: {
    ...configuration.server,
    port: process.env.MCP_PORT || configuration.server.port
  }
};
```

## Security Considerations

### 1. Transport Security

**For HTTP Transport:**
```typescript
// Enable HTTPS
import { createServer } from 'https';
import { readFileSync } from 'fs';

const httpsOptions = {
  key: readFileSync('private-key.pem'),
  cert: readFileSync('certificate.pem')
};

const server = createServer(httpsOptions, app);
```

### 2. Authentication

**API Key Authentication:**
```typescript
server.setRequestHandler(async (request, context) => {
  const apiKey = context.headers['x-api-key'];
  
  if (!apiKey || !isValidApiKey(apiKey)) {
    throw new Error('Unauthorized');
  }
  
  // Process request
});
```

### 3. Input Validation

```typescript
import { z } from 'zod';

const toolInputSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().min(1).max(100).default(10)
});

function validateInput(input: unknown) {
  return toolInputSchema.parse(input);
}
```

### 4. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests'
});

app.use('/mcp', limiter);
```

## Monitoring and Logging

### Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'mcp-server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('Server started', { port: 3000, transport: 'http' });
logger.error('Tool execution failed', { tool: 'calculate', error: err.message });
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Readiness check
app.get('/ready', async (req, res) => {
  try {
    // Check dependencies
    await checkDatabase();
    await checkExternalAPIs();
    
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

### Metrics Collection

```typescript
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default metrics
collectDefaultMetrics();

// Custom metrics
const toolCallsTotal = new Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total number of tool calls',
  labelNames: ['tool_name', 'status']
});

const toolDuration = new Histogram({
  name: 'mcp_tool_duration_seconds',
  help: 'Tool execution duration',
  labelNames: ['tool_name']
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Scaling Strategies

### Horizontal Scaling

**Load Balancing with NGINX:**
```nginx
upstream mcp_servers {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name mcp.example.com;

    location / {
        proxy_pass http://mcp_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Caching Strategy

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function getCachedData(key: string, fetchFn: () => Promise<any>) {
  const cached = cache.get(key);
  if (cached) return cached;
  
  const data = await fetchFn();
  cache.set(key, data);
  return data;
}
```

## Deployment Checklist

Before deploying to production:

- [ ] **Build & Test**
  - [ ] Run all tests: `nx test my-server`
  - [ ] Check types: `nx typecheck my-server`
  - [ ] Lint code: `nx lint my-server`
  - [ ] Production build: `nx build my-server --configuration=production`

- [ ] **Security**
  - [ ] Environment variables secured
  - [ ] API keys rotated
  - [ ] HTTPS configured (if applicable)
  - [ ] Input validation implemented
  - [ ] Rate limiting enabled

- [ ] **Monitoring**
  - [ ] Logging configured
  - [ ] Health checks implemented
  - [ ] Metrics collection setup
  - [ ] Error tracking enabled

- [ ] **Performance**
  - [ ] Resource limits set
  - [ ] Caching implemented
  - [ ] Connection pooling configured
  - [ ] Timeouts defined

- [ ] **Documentation**
  - [ ] Deployment guide updated
  - [ ] Configuration documented
  - [ ] Runbook created
  - [ ] API documentation current

## Next Steps

- [Claude Desktop Integration](./claude-desktop-integration.md) - Specific setup for Claude
- [Docker Deployment](./docker-deployment.md) - Detailed Docker guide
- [Production Checklist](./production-checklist.md) - Comprehensive production requirements
- [Troubleshooting Guide](../troubleshooting/common-issues.md) - Common deployment issues 