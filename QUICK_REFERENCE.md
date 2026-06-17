# KOTA PAL v2.0 - Quick Reference Guide

## 🚀 Quick Start (Copy & Paste Commands)

### Local Development (5 minutes)
```bash
# Setup
cd /path/to/kota-pal
npm install
cp env.txt .env

# Edit .env file with your API keys
# Then start:
npm start

# Access: http://localhost:3000/dashboard-realtime.html
```

### Docker Setup (3 minutes)
```bash
npm run docker:build    # Build image
npm run docker:run      # Start all services
npm run docker:logs     # View logs

# Access: http://localhost:3000
```

### Stop Services
```bash
npm run docker:stop
# Or: docker-compose down
```

---

## 📚 File Guide

| File | Purpose | Size |
|------|---------|------|
| `backend-enhanced.js` | Main server with v2.0 features | 400 LOC |
| `services/retailerIntegration.js` | Multi-retailer API layer | 800 LOC |
| `services/realTimeDataPipeline.js` | Event processing & aggregation | 350 LOC |
| `services/websocketService.js` | Real-time WebSocket management | 300 LOC |
| `dashboard-realtime.html` | Real-time dashboard UI | 600 LOC |
| `Dockerfile` | Docker image config | 20 LOC |
| `docker-compose.yml` | Multi-container orchestration | 80 LOC |
| `package.json` | Dependencies & scripts | 100 LOC |
| `INTEGRATION_GUIDE.md` | Complete technical docs | 600+ LOC |
| `DEPLOYMENT_CHECKLIST.md` | Pre-deployment verification | 400+ LOC |
| `README.md` | Quick start & overview | 300 LOC |

---

## 🔧 Key Environment Variables

```env
# Must change before production
JWT_SECRET=change-this-to-random-string
NODE_ENV=production

# Retailer APIs (get from provider dashboards)
AMAZON_PA_API_KEY=your-amazon-key
WALMART_API_KEY=your-walmart-key
SHOPIFY_API_KEY=your-shopify-key
SKIMLINKS_API_KEY=your-skimlinks-key

# Optional (defaults work for local dev)
PORT=3000
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@host/db
```

---

## 🌐 API Endpoints Cheat Sheet

### Authentication
```bash
POST /api/auth/register     # Create account
POST /api/auth/login        # Get JWT token
GET /api/user/profile       # Current user info
```

### Real-Time Data
```bash
GET /api/bestsellers/:retailer          # Best-sellers for retailer
GET /api/analytics/:retailer            # Click analytics
GET /api/dashboard/realtime             # Live metrics (all retailers)
GET /api/trending/:retailer             # Top trending products
POST /api/events/click                  # Record click event
POST /api/sync/retailers                # Manual sync all retailers
GET /api/system/metrics                 # Performance metrics
```

**Add header to all requests**:
```
Authorization: Bearer {jwt-token}
```

---

## 📊 WebSocket Events Reference

### Connect & Authenticate
```javascript
// 1. Connect
const ws = new WebSocket('ws://localhost:3000');

// 2. Authenticate
ws.send(JSON.stringify({
  type: 'authenticate',
  token: localStorage.getItem('token')
}));

// 3. Subscribe to updates
ws.send(JSON.stringify({
  type: 'subscribe',
  data: {
    channels: ['bestsellers:amazon', 'analytics', 'performance']
  }
}));

// 4. Listen for updates
ws.onmessage = (event) => {
  const { type, channel, data } = JSON.parse(event.data);
  console.log(`Update from ${channel}:`, data);
};
```

---

## 🐳 Docker Commands

```bash
# Build image
docker build -t kota-pal:latest .

# Run standalone
docker run -p 3000:3000 \
  -e JWT_SECRET=secret \
  -e REDIS_URL=redis://redis:6379 \
  kota-pal:latest

# Docker Compose (recommended)
docker-compose up -d      # Start
docker-compose down       # Stop
docker-compose logs -f    # View logs
docker-compose ps         # Status
```

---

## 🚀 Deployment Paths

### Development
```bash
npm start
# Or
nodemon backend-enhanced.js
```

### Staging
```bash
# Via Docker
docker-compose -f docker-compose.staging.yml up -d

# Via script
./scripts/deploy.sh staging
```

### Production
```bash
# Via script (recommended)
./scripts/deploy.sh production

# Via Kubernetes
kubectl apply -f k8s/production/deployment.yml
kubectl apply -f k8s/production/service.yml
```

---

## 🔍 Debugging Tips

### Check if services are running
```bash
# API health
curl http://localhost:3000/

# Redis connection
redis-cli ping

# Database connection
psql -h localhost -U admin -d kota-pal -c "SELECT 1"

# WebSocket connection
curl http://localhost:3000/health
```

### View logs
```bash
# Docker
npm run docker:logs

# Or specific container
docker logs kota-pal-backend -f

# Or local Node
tail -f logs/app.log
```

### Monitor real-time
```bash
# System metrics
curl http://localhost:3000/api/system/metrics \
  -H "Authorization: Bearer {token}"

# CPU/Memory (local)
top -p $(pgrep -f "node backend-enhanced.js")

# Docker stats
docker stats kota-pal-backend
```

---

## 📈 Performance Optimization

### Cache Management
```bash
# Clear cache
npm run clear-cache

# Check cache size
npm run cache-stats
```

### Database
```bash
# Run migrations
npm run migrate:db

# Seed test data
npm run seed:db

# Optimize tables
npm run optimize-db
```

### Monitor
```bash
# Check system metrics
curl http://localhost:3000/api/system/metrics

# Monitor queue
curl http://localhost:3000/api/queue/stats

# Check connections
redis-cli info clients
```

---

## 🔒 Security Checklist

- [ ] JWT_SECRET changed from default
- [ ] All API keys configured (Amazon, Walmart, etc.)
- [ ] HTTPS/TLS enabled for production
- [ ] Rate limiting configured (if modified)
- [ ] Database credentials secured
- [ ] Environment variables not in git
- [ ] .env files in .gitignore
- [ ] CORS origins restricted
- [ ] Security headers enabled (Helmet)
- [ ] Audit logging enabled

---

## 🐛 Common Issues & Fixes

### "Connection refused" on localhost:3000
```bash
# Check if port is in use
lsof -i :3000

# Start backend
npm start
```

### WebSocket not connecting
```javascript
// Check browser console for errors
// Verify server is running: curl http://localhost:3000/
// Check firewall/proxy settings
```

### Redis connection error
```bash
# Start Redis
redis-server

# Or via Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Database connection error
```bash
# Check PostgreSQL is running
psql -h localhost

# Or via Docker
docker run -d -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:15-alpine
```

### High CPU/Memory usage
```bash
# Check Node.js process
top -p $(pgrep -f "node backend")

# Profile
node --prof backend-enhanced.js
node --prof-process isolate-*.log > profile.txt
```

---

## 📞 Quick Support

### Get Help
1. Check logs: `npm run docker:logs`
2. Review documentation: `INTEGRATION_GUIDE.md`
3. Check deployment checklist: `DEPLOYMENT_CHECKLIST.md`
4. GitHub issues: Submit detailed problem description
5. Email: support@kota-pal.com

### Common Questions

**Q: How do I add a new retailer?**  
A: See "Adding New Retailer Support" in `INTEGRATION_GUIDE.md`

**Q: How do I scale to production?**  
A: Use `./scripts/deploy.sh production` after following `DEPLOYMENT_CHECKLIST.md`

**Q: How do I monitor performance?**  
A: Visit `GET /api/system/metrics` endpoint for real-time stats

**Q: How do I backup data?**  
A: Database backups are auto-created during deployment. Manual: `pg_dump`

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ Frontend accessible at http://localhost:3000/dashboard-realtime.html  
✅ API responding: `curl http://localhost:3000/`  
✅ WebSocket connected (green indicator on dashboard)  
✅ Best-sellers loading from retailers  
✅ Clicks being recorded and aggregated  
✅ Real-time updates visible without page refresh  
✅ Error rate < 0.1%  
✅ Response times < 200ms (p95)  

---

## 📋 Maintenance Tasks

### Daily
- [ ] Check error rates (< 0.1%)
- [ ] Monitor WebSocket connections
- [ ] Verify all retailers syncing

### Weekly
- [ ] Review performance metrics
- [ ] Check disk space usage
- [ ] Verify backups created
- [ ] Test failover procedures

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Review logs for patterns
- [ ] Capacity planning review
- [ ] Security audit

---

## 🔗 Useful Links

- **GitHub**: https://github.com/kota-pal/kota-pal
- **Documentation**: See `INTEGRATION_GUIDE.md`
- **API Reference**: See `INTEGRATION_GUIDE.md` → API Endpoints
- **Status Page**: https://status.kota-pal.com
- **Community**: https://discord.gg/kota-pal

---

## 📝 Version Info

- **Current Version**: 2.0.0
- **Node.js Requirement**: 18+
- **Release Date**: January 2024
- **Last Updated**: January 15, 2024

---

**Need help?** Check the full documentation in `INTEGRATION_GUIDE.md` or contact support@kota-pal.com
