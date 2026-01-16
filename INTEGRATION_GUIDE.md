# KOTA PAL v2.0 - Real-Time Multi-Retailer Integration Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [System Components](#system-components)
4. [API Endpoints](#api-endpoints)
5. [Real-Time Features](#real-time-features)
6. [Deployment Guide](#deployment-guide)
7. [Security & Compliance](#security--compliance)
8. [Performance Tuning](#performance-tuning)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Design
```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Dashboard)                       │
│                  Real-time Updates via WebSocket                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    WebSocket/REST
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  Express.js API Server                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes | Authentication | Request Validation       │   │
│  └──────────┬───────────────────────────────────────────────┘   │
│             │                                                    │
│  ┌──────────▼────────────────────────────────────────────────┐  │
│  │         Service Layer                                    │  │
│  │  ┌─────────────────┐  ┌──────────────────┐              │  │
│  │  │  Retailer       │  │  Real-time Data  │              │  │
│  │  │  Integration    │  │  Pipeline        │              │  │
│  │  │  Service        │  │                  │              │  │
│  │  └────────┬────────┘  └────────┬─────────┘              │  │
│  │           │                    │                         │  │
│  │  ┌────────▼────────────────────▼──────┐                 │  │
│  │  │  WebSocket Service                 │                 │  │
│  │  │  (Real-time Subscriptions)         │                 │  │
│  │  └────────────────────────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        │                │                │
    ┌───▼──┐         ┌───▼──┐        ┌───▼──┐
    │Redis │         │Queue │        │Cache │
    │Cache │         │(Bull)│        │Layer │
    └──────┘         └──────┘        └──────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼────┐    ┌─────▼─────┐    ┌────▼────┐
    │ Amazon │    │ Walmart   │    │ Shopify │
    │ API    │    │ API       │    │ API     │
    └────────┘    └───────────┘    └─────────┘
```

### Component Overview

| Component | Purpose | Technology |
|-----------|---------|-----------|
| **Retailer Integration Service** | Multi-retailer API management | Node.js classes with adapter pattern |
| **Real-time Data Pipeline** | Event processing & aggregation | Bull queue + Redis |
| **WebSocket Service** | Live dashboard updates | ws library |
| **Cache Layer** | Performance optimization | Redis + node-cache |
| **Express API** | Backend endpoints | Express.js |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Redis (for production)
- Internet connection for retailer APIs

### Local Development Setup

#### 1. Clone & Install
```bash
cd /path/to/kota-pal
npm install
```

#### 2. Configure Environment
```bash
cp env.txt .env
```

Edit `.env` with your credentials:
```env
PORT=3000
JWT_SECRET=your-super-secure-secret-key
NODE_ENV=development
REDIS_URL=redis://localhost:6379

# Retailer API Keys
AMAZON_PA_API_KEY=your-amazon-key
AMAZON_PA_API_SECRET=your-amazon-secret
WALMART_API_KEY=your-walmart-key
SHOPIFY_API_KEY=your-shopify-key
SKIMLINKS_API_KEY=your-skimlinks-key
```

#### 3. Start Services
```bash
# Terminal 1: Start Redis (if not using Docker)
redis-server

# Terminal 2: Start backend
npm start

# Terminal 3: Open dashboard
open http://localhost:3000/dashboard-realtime.html
```

### Docker Deployment (Recommended)

#### 1. Build & Run
```bash
# Build image
npm run docker:build

# Start all services
npm run docker:run

# View logs
npm run docker:logs
```

#### 2. Access Application
- API: http://localhost:3000
- Dashboard: http://localhost/dashboard-realtime.html

#### 3. Verify Health
```bash
curl http://localhost:3000/
# Response: { message: "KOTA PAL API is running", ... }
```

---

## System Components

### 1. Retailer Integration Service

**File**: `services/retailerIntegration.js`

**Features**:
- Multi-retailer adapter pattern
- Automatic retry logic with exponential backoff
- Built-in caching system
- Error handling & fallback mechanisms

**Supported Retailers**:
- Amazon Associates
- Walmart Affiliate
- Shopify Partner
- Skimlinks

**Usage Example**:
```javascript
const { RetailerIntegrationService } = require('./services/retailerIntegration');

const retailerService = new RetailerIntegrationService({
  cacheStdTTL: 3600,
  maxRetries: 3,
  requestTimeout: 10000
});

// Fetch best-sellers
const bestSellers = await retailerService.fetchBestSellers('amazon', {
  category: 'electronics',
  limit: 20
});

// Get analytics
const analytics = await retailerService.fetchClickAnalytics('walmart', {
  dateRange: '7d'
});

// Aggregate multiple retailers
const results = await retailerService.aggregateMultiRetailerData(
  ['amazon', 'walmart', 'shopify'],
  'fetchBestSellers',
  { limit: 20 }
);
```

### 2. Real-Time Data Pipeline

**File**: `services/realTimeDataPipeline.js`

**Features**:
- Event-based architecture
- Bull queue for async processing
- Redis-backed aggregation buffers
- Real-time event broadcasting
- Audit trail logging

**Event Types**:
```javascript
// Click event
{
  type: 'click',
  data: {
    userId, blockId, productId, retailer, revenue
  },
  timestamp: ISO8601
}

// Best-seller update
{
  type: 'bestseller-update',
  data: {
    retailer, items: [...]
  },
  timestamp: ISO8601
}

// Analytics data
{
  type: 'analytics',
  data: {
    userId, retailer, metrics: {...}
  },
  timestamp: ISO8601
}
```

**Usage Example**:
```javascript
const RealTimeDataPipeline = require('./services/realTimeDataPipeline');

const pipeline = new RealTimeDataPipeline({
  redisUrl: 'redis://localhost:6379',
  aggregationWindow: 60000
});

await pipeline.connect();

// Queue event for processing
await pipeline.enqueueEvent({
  type: 'click',
  data: { userId, blockId, productId, retailer, revenue },
  timestamp: new Date().toISOString()
}, 'high');

// Subscribe to events
pipeline.on('click-recorded', (data) => {
  console.log('Click recorded:', data);
});

pipeline.on('aggregation-flushed', (data) => {
  console.log('Aggregation flushed:', data);
});
```

### 3. WebSocket Service

**File**: `services/websocketService.js`

**Features**:
- Real-time bidirectional communication
- Channel-based subscriptions
- Automatic heartbeat/ping-pong
- Client connection tracking
- Message queuing

**Events**:
```javascript
// Client authentication
{ type: 'authenticate', token: 'jwt-token' }

// Subscribe to channels
{ type: 'subscribe', data: { channels: ['bestsellers:amazon'] } }

// Unsubscribe
{ type: 'unsubscribe', data: { channels: ['bestsellers:amazon'] } }

// Receive updates
{ type: 'channel-message', channel: 'bestsellers:amazon', data: {...} }
```

**Usage Example**:
```javascript
const WebSocketService = require('./services/websocketService');

const wsService = new WebSocketService(server, {
  heartbeatInterval: 30000
});

// Publish to channel
wsService.publishToChannel('bestsellers:amazon', {
  type: 'bestsellers-updated',
  items: [...],
  timestamp: new Date()
});

// Publish to user
wsService.publishToUser(userId, {
  type: 'analytics-updated',
  metrics: {...}
});

// Broadcast to all
wsService.broadcast({
  type: 'system-notification',
  message: 'System maintenance in 5 minutes'
});

// Get statistics
const stats = wsService.getStatistics();
console.log(stats);
// {
//   totalConnections: 42,
//   totalUsers: 15,
//   totalChannels: 8,
//   channels: [...]
// }
```

---

## API Endpoints

### Authentication
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password",
  "plan": "pro"
}

Response: { user: {...}, token: "jwt-token" }
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure-password"
}

Response: { user: {...}, token: "jwt-token" }
```

### Real-Time Integration Endpoints

#### Get Best Sellers
```http
GET /api/bestsellers/:retailer
Authorization: Bearer {token}
Query: category=electronics&limit=20

Response: {
  retailer: "amazon",
  items: [
    {
      id: "B091234567",
      title: "Product Name",
      price: 99.99,
      originalPrice: 149.99,
      rating: 4.8,
      reviews: 1234,
      image: "url",
      availability: "In Stock",
      retailer: "amazon",
      normalizedAt: "2024-01-15T10:30:00Z"
    }
  ],
  timestamp: "2024-01-15T10:30:00Z",
  cached: false
}
```

#### Get Click Analytics
```http
GET /api/analytics/:retailer
Authorization: Bearer {token}
Query: dateRange=7d&blockId=blk_123

Response: {
  retailer: "amazon",
  analytics: {
    totalClicks: 1500,
    clicksToday: 250,
    ctr: 3.2,
    revenue: 450.00,
    topProduct: "Product Name"
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

#### Get Real-Time Dashboard Metrics
```http
GET /api/dashboard/realtime
Authorization: Bearer {token}
Query: retailer=all

Response: {
  userId: "user_123",
  metrics: {
    amazon: {
      totalClicks: 1500,
      totalRevenue: 450.00,
      ctr: 3.2,
      lastUpdated: "2024-01-15T10:30:00Z"
    },
    walmart: {
      totalClicks: 800,
      totalRevenue: 250.00,
      ctr: 2.8,
      lastUpdated: "2024-01-15T10:28:00Z"
    }
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

#### Get Trending Products
```http
GET /api/trending/:retailer
Authorization: Bearer {token}

Response: {
  retailer: "amazon",
  trending: {
    items: [...],
    updatedAt: "2024-01-15T10:30:00Z"
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

#### Record Click Event
```http
POST /api/events/click
Authorization: Bearer {token}
Content-Type: application/json

{
  "blockId": "blk_123",
  "productId": "prod_456",
  "retailer": "amazon",
  "revenue": 15.50
}

Response: {
  message: "Click event queued for processing",
  eventId: "evt_1705319400000"
}
```

#### Sync Retailers Data
```http
POST /api/sync/retailers
Authorization: Bearer {token}
Content-Type: application/json

{
  "retailers": ["amazon", "walmart", "shopify"]
}

Response: {
  syncedRetailers: [
    {
      retailer: "amazon",
      status: "fulfilled",
      data: [...]
    }
  ],
  timestamp: "2024-01-15T10:30:00Z"
}
```

#### Get System Metrics
```http
GET /api/system/metrics
Authorization: Bearer {token}

Response: {
  retailerService: {
    totalRequests: 1500,
    successfulRequests: 1485,
    failedRequests: 15,
    cacheHits: 450,
    cacheMisses: 150,
    successRate: "99.00%",
    cacheHitRate: "75.00%",
    timestamp: "2024-01-15T10:30:00Z"
  },
  websocket: {
    totalConnections: 42,
    totalUsers: 15,
    totalChannels: 8,
    channels: [...]
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

---

## Real-Time Features

### WebSocket Connection

#### Client Setup
```javascript
// Initialize WebSocket
const token = localStorage.getItem('token');
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: token
  }));

  // Subscribe to channels
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: {
      channels: ['bestsellers:amazon', 'analytics', 'performance']
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'channel-message') {
    console.log('Update from', message.channel, ':', message.data);
  }
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
  // Implement reconnection logic
};
```

#### Server Broadcasting
```javascript
// From backend
websocketService.publishToChannel('bestsellers:amazon', {
  type: 'bestsellers-updated',
  items: bestsellers,
  timestamp: new Date()
});

websocketService.publishToUser(userId, {
  type: 'click-recorded',
  data: { blockId, productId, revenue }
});

websocketService.broadcast({
  type: 'system-notification',
  message: 'New best-sellers available'
});
```

### Live Updates Handling

#### Real-Time Metrics Update
- Click events trigger immediate KPI updates
- Revenue aggregation occurs every 60 seconds
- Chart animations reflect live data changes
- Notifications alert on performance anomalies

#### Best-Sellers Refresh
- Automatic updates every 60 minutes
- Manual sync available via API
- Trending products highlight top performers
- Category filtering for focused view

---

## Deployment Guide

### Development Environment

```bash
# Run all services locally
docker-compose up -d

# Or use npm scripts
npm install
npm run dev
```

### Staging Environment

#### 1. Configure Environment
```bash
# Create .env.staging
cp .env.txt .env.staging

# Update with staging credentials
REDIS_URL=redis://redis.staging.internal:6379
DATABASE_URL=postgresql://user:pass@db.staging.internal/kota-pal
JWT_SECRET=staging-secret-key
NODE_ENV=staging
```

#### 2. Deploy with Docker
```bash
docker build -f Dockerfile.staging -t kota-pal:staging .
docker push registry.example.com/kota-pal:staging

# Deploy via docker-compose
docker-compose -f docker-compose.staging.yml up -d
```

#### 3. Health Checks
```bash
# Check backend
curl https://staging.api.kota-pal.com/
curl https://staging.api.kota-pal.com/api/system/metrics

# Check Redis
redis-cli -h redis.staging.internal ping
```

### Production Environment

#### 1. Pre-deployment Checklist
- [ ] All tests passing (`npm test`)
- [ ] Security audit completed
- [ ] Database migrations tested
- [ ] SSL certificates configured
- [ ] Load balancing setup
- [ ] Monitoring & logging configured
- [ ] Backup procedures verified

#### 2. Deploy via Kubernetes

```yaml
# kota-pal-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kota-pal-backend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kota-pal-backend
  template:
    metadata:
      labels:
        app: kota-pal-backend
    spec:
      containers:
      - name: backend
        image: registry.example.com/kota-pal:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: kota-pal-secrets
              key: jwt-secret
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: kota-pal-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 3. Service Configuration
```yaml
apiVersion: v1
kind: Service
metadata:
  name: kota-pal-api
  namespace: production
spec:
  type: LoadBalancer
  selector:
    app: kota-pal-backend
  ports:
  - protocol: TCP
    port: 443
    targetPort: 3000
  - protocol: TCP
    port: 80
    targetPort: 3000
```

#### 4. Deploy
```bash
kubectl apply -f kota-pal-deployment.yml
kubectl apply -f kota-pal-service.yml

# Verify deployment
kubectl get pods -n production
kubectl logs -f deployment/kota-pal-backend -n production
```

### Scaling Strategies

#### Horizontal Scaling (Multiple Instances)
```bash
# Scale replicas
kubectl scale deployment kota-pal-backend -n production --replicas=5

# Auto-scaling based on CPU
kubectl autoscale deployment kota-pal-backend -n production \
  --min=3 --max=10 --cpu-percent=70
```

#### Vertical Scaling (Resource Limits)
Update resource requests/limits in deployment manifest and redeploy.

#### Data Pipeline Scaling
- Increase Redis cluster size
- Scale Bull queue workers
- Configure worker concurrency
```javascript
// Example: Scale queue workers
const queue = new Queue('kota-pal-events', {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 }
  }
});

// Process with higher concurrency
queue.process(50, processJob); // 50 concurrent jobs
```

---

## Security & Compliance

### Data Protection

#### Encryption
```javascript
// Encrypt sensitive data before storage
const crypto = require('crypto');

function encryptData(data, key) {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptData(encrypted, key) {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

#### API Key Management
```bash
# Use environment variables or secrets manager
export AMAZON_PA_API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id kota-pal/amazon-api-key --query SecretString --output text)

# Or use HashiCorp Vault
vault read secret/kota-pal/amazon-credentials
```

### Authentication & Authorization

#### JWT Token Security
```javascript
// Token expiration
jwt.sign(
  { id: user.id, email: user.email },
  JWT_SECRET,
  { expiresIn: '24h', algorithm: 'HS256' }
);

// Token refresh endpoint
app.post('/api/auth/refresh', (req, res) => {
  // Validate refresh token
  // Issue new access token
});
```

#### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

app.post('/api/auth/login', authLimiter, handleLogin);
```

### Compliance

#### Data Privacy (GDPR)
```javascript
// Delete user data
app.delete('/api/user/data', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  // Delete user account
  await User.destroy({ where: { id: userId } });
  
  // Delete user's blocks
  await Block.destroy({ where: { userId } });
  
  // Delete user's analytics
  await Analytics.destroy({ where: { userId } });
  
  // Delete audit logs (after retention period)
  await AuditLog.destroy({
    where: {
      userId,
      createdAt: { [Op.lt]: moment().subtract(90, 'days').toDate() }
    }
  });
  
  res.json({ message: 'User data deleted' });
});
```

#### Audit Logging
```javascript
async function logAudit(userId, action, resource, details) {
  await AuditLog.create({
    userId,
    action,
    resource,
    details,
    timestamp: new Date(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
}
```

---

## Performance Tuning

### Database Optimization

#### Indexing Strategy
```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_block_user_id ON blocks(user_id);
CREATE INDEX idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX idx_analytics_user_retailer ON analytics(user_id, retailer);

-- Composite indexes for common queries
CREATE INDEX idx_block_status ON blocks(user_id, status, created_at);
```

#### Query Optimization
```javascript
// Use pagination for large datasets
app.get('/api/analytics', authenticateToken, async (req, res) => {
  const { page = 1, limit = 50, retailer } = req.query;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Analytics.findAll({
      where: { userId: req.user.id, retailer },
      limit: parseInt(limit),
      offset,
      order: [['timestamp', 'DESC']]
    }),
    Analytics.count({ where: { userId: req.user.id, retailer } })
  ]);

  res.json({
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

### Caching Strategy

#### Multi-Level Caching
```javascript
// Level 1: In-memory cache (fast)
const localCache = new NodeCache({ stdTTL: 600 });

// Level 2: Redis cache (distributed)
const redis = new Redis();

// Level 3: Database (source of truth)

async function getCachedData(key, fetchFn, options = {}) {
  // Check local cache
  let data = localCache.get(key);
  if (data) return data;

  // Check Redis
  data = await redis.get(key);
  if (data) {
    localCache.set(key, JSON.parse(data));
    return JSON.parse(data);
  }

  // Fetch from database
  data = await fetchFn();
  
  // Store in both caches
  const ttl = options.ttl || 3600;
  localCache.set(key, data, ttl);
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}
```

### WebSocket Optimization

#### Connection Pooling
```javascript
class WebSocketConnectionPool {
  constructor(maxConnections = 10000) {
    this.maxConnections = maxConnections;
    this.connections = new Map();
    this.userConnections = new Map();
  }

  addConnection(clientId, userId, ws) {
    if (this.connections.size >= this.maxConnections) {
      ws.close(1008, 'Server at capacity');
      return false;
    }

    this.connections.set(clientId, { userId, ws });
    
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, []);
    }
    this.userConnections.get(userId).push(clientId);

    return true;
  }

  removeConnection(clientId) {
    const conn = this.connections.get(clientId);
    if (conn) {
      this.userConnections.get(conn.userId).splice(
        this.userConnections.get(conn.userId).indexOf(clientId), 1
      );
      this.connections.delete(clientId);
    }
  }
}
```

### API Endpoint Performance

#### Request/Response Compression
```javascript
const compression = require('compression');

// Compress responses larger than 1KB
app.use(compression({ threshold: 1024 }));
```

#### Response Streaming for Large Data
```javascript
app.get('/api/analytics/export', authenticateToken, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="analytics.jsonl"');

  const stream = Analytics.findAll({
    where: { userId: req.user.id },
    raw: true
  }).stream();

  stream.on('data', (row) => {
    res.write(JSON.stringify(row) + '\n');
  });

  stream.on('end', () => {
    res.end();
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue: WebSocket Connection Failing
```javascript
// Debug WebSocket issues
ws.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
  console.log('Error code:', event.code);
  console.log('Error reason:', event.reason);
});

// Server-side debugging
websocketService.on('error', (error) => {
  console.error('WebSocket service error:', error);
});
```

**Solutions**:
1. Check firewall/proxy settings
2. Verify WebSocket port is open
3. Check JWT token validity
4. Review browser console for errors

#### Issue: High CPU Usage
```bash
# Monitor CPU usage
top -p $(pgrep -f "node backend-enhanced.js")

# Profile Node.js process
node --prof backend-enhanced.js
node --prof-process isolate-*.log > profile.txt

# Check for memory leaks
npm install -g clinic
clinic doctor -- node backend-enhanced.js
```

**Solutions**:
1. Increase queue concurrency
2. Implement rate limiting
3. Add caching layer
4. Optimize database queries

#### Issue: Redis Connection Issues
```javascript
// Test Redis connection
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

client.on('error', (error) => {
  console.error('Redis error:', error);
});

client.on('connect', () => {
  console.log('Redis connected');
});
```

**Solutions**:
1. Check Redis server status: `redis-cli ping`
2. Verify credentials in .env
3. Check network connectivity
4. Review Redis logs

#### Issue: Database Connection Failures
```bash
# Test database connection
psql -h db.example.com -U admin -d kota-pal -c "SELECT 1"

# Check connection pool
SELECT * FROM pg_stat_activity;

# Increase pool size
DATABASE_URL=postgresql://user:pass@host/db?pool=20
```

#### Issue: Performance Degradation
```javascript
// Enable performance monitoring
const metrics = {
  endpoints: {},
  middleware: require('pino-http')()
};

app.use(metrics.middleware);

app.get('/api/system/performance', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    eventLoop: require('perf_hooks').performance.now()
  });
});
```

### Monitoring & Logging

#### Structured Logging
```javascript
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

logger.info({ userId: 'user_123', action: 'click_recorded' });
```

#### Health Check Endpoint
```bash
# Check all services
curl http://localhost:3000/health

# Response:
{
  "status": "healthy",
  "services": {
    "api": "up",
    "redis": "up",
    "database": "up",
    "websocket": "up"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Support & Resources

- **Documentation**: [docs/API.md](docs/API.md)
- **GitHub Issues**: [github.com/kota-pal/issues](https://github.com/kota-pal/issues)
- **Community**: [Discord Server](https://discord.gg/kota-pal)
- **Email**: support@kota-pal.com

---

**Version**: 2.0.0  
**Last Updated**: January 2024  
**License**: MIT
