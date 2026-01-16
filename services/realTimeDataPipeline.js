/**
 * Real-time Data Pipeline Service
 * Processes streaming data and updates analytics in real-time
 */

const EventEmitter = require('events');
const { Queue } = require('bull');
const Redis = require('redis');

class RealTimeDataPipeline extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      redisUrl: config.redisUrl || 'redis://localhost:6379',
      queueName: config.queueName || 'kota-pal-events',
      batchSize: config.batchSize || 50,
      batchTimeout: config.batchTimeout || 5000,
      aggregationWindow: config.aggregationWindow || 60000, // 1 minute
      ...config
    };

    this.redis = Redis.createClient({ url: this.config.redisUrl });
    this.queue = new Queue(this.config.queueName, this.config.redisUrl);
    
    this.subscribers = {};
    this.aggregationBuffers = {};
    this.aggregationTimers = {};
    this.isProcessing = false;

    this.setupQueListeners();
  }

  /**
   * Connect to Redis
   */
  async connect() {
    try {
      await this.redis.connect();
      this.emit('connected');
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Redis connection error:', error);
      this.emit('error', error);
    }
  }

  /**
   * Setup queue listeners
   */
  setupQueListeners() {
    this.queue.process(async (job) => {
      return this.processEvent(job.data);
    });

    this.queue.on('completed', (job) => {
      this.emit('job-completed', { jobId: job.id, data: job.data });
    });

    this.queue.on('failed', (job, error) => {
      this.emit('job-failed', { jobId: job.id, error: error.message });
    });
  }

  /**
   * Enqueue event for processing
   */
  async enqueueEvent(event, priority = 'normal') {
    try {
      const job = await this.queue.add(event, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        priority: this.getPriorityLevel(priority)
      });

      return job;
    } catch (error) {
      console.error('Error enqueuing event:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process individual event
   */
  async processEvent(event) {
    try {
      const { type, data, timestamp } = event;

      switch (type) {
        case 'click':
          return await this.processClickEvent(data, timestamp);
        case 'bestseller-update':
          return await this.processBestSellerUpdate(data, timestamp);
        case 'analytics':
          return await this.processAnalyticsData(data, timestamp);
        default:
          throw new Error(`Unknown event type: ${type}`);
      }
    } catch (error) {
      console.error('Event processing error:', error);
      throw error;
    }
  }

  /**
   * Process click events with aggregation
   */
  async processClickEvent(data, timestamp) {
    const { userId, blockId, retailer, productId } = data;
    const aggregationKey = `${userId}:${blockId}:${retailer}`;

    // Add to aggregation buffer
    if (!this.aggregationBuffers[aggregationKey]) {
      this.aggregationBuffers[aggregationKey] = {
        clicks: 0,
        revenue: 0,
        products: {},
        startTime: Date.now(),
        events: []
      };

      // Set aggregation timer
      this.setAggregationTimer(aggregationKey);
    }

    const buffer = this.aggregationBuffers[aggregationKey];
    buffer.clicks += 1;
    buffer.revenue += data.revenue || 0;
    
    if (!buffer.products[productId]) {
      buffer.products[productId] = { clicks: 0, revenue: 0 };
    }
    buffer.products[productId].clicks += 1;
    buffer.products[productId].revenue += data.revenue || 0;

    buffer.events.push({
      timestamp,
      productId,
      revenue: data.revenue
    });

    // Emit real-time update
    this.emit('click-recorded', {
      userId,
      blockId,
      retailer,
      productId,
      timestamp
    });

    // Store individual click for audit
    await this.storeClickAudit(data, timestamp);

    return { success: true, processed: true };
  }

  /**
   * Process best-seller updates
   */
  async processBestSellerUpdate(data, timestamp) {
    const { retailer, items } = data;
    const key = `bestsellers:${retailer}`;

    // Store in Redis for fast access
    await this.redis.set(
      key,
      JSON.stringify({ items, updatedAt: timestamp }),
      { EX: 3600 } // 1 hour TTL
    );

    // Emit update event for real-time subscribers
    this.emit('bestsellers-updated', {
      retailer,
      itemsCount: items.length,
      timestamp
    });

    // Update trending products
    await this.updateTrendingProducts(retailer, items);

    return { success: true, itemsStored: items.length };
  }

  /**
   * Process analytics data
   */
  async processAnalyticsData(data, timestamp) {
    const { userId, retailer, metrics } = data;
    const key = `analytics:${userId}:${retailer}`;

    const currentData = await this.redis.get(key);
    const parsed = currentData ? JSON.parse(currentData) : {};

    const updated = {
      ...parsed,
      ...metrics,
      lastUpdated: timestamp
    };

    await this.redis.set(
      key,
      JSON.stringify(updated),
      { EX: 86400 } // 24 hours TTL
    );

    this.emit('analytics-updated', {
      userId,
      retailer,
      metrics: updated
    });

    return { success: true, analyticsUpdated: true };
  }

  /**
   * Set aggregation timer to flush buffer
   */
  setAggregationTimer(key) {
    if (this.aggregationTimers[key]) {
      clearTimeout(this.aggregationTimers[key]);
    }

    this.aggregationTimers[key] = setTimeout(async () => {
      await this.flushAggregationBuffer(key);
    }, this.config.aggregationWindow);
  }

  /**
   * Flush aggregation buffer
   */
  async flushAggregationBuffer(key) {
    const buffer = this.aggregationBuffers[key];

    if (!buffer || buffer.clicks === 0) {
      delete this.aggregationBuffers[key];
      return;
    }

    try {
      // Store aggregated data
      const aggregationKey = `aggregated:${key}`;
      const existing = await this.redis.get(aggregationKey);
      const parsed = existing ? JSON.parse(existing) : {};

      const aggregated = {
        ...parsed,
        totalClicks: (parsed.totalClicks || 0) + buffer.clicks,
        totalRevenue: (parsed.totalRevenue || 0) + buffer.revenue,
        lastUpdated: new Date().toISOString(),
        topProducts: this.getTopProducts(buffer.products)
      };

      await this.redis.set(
        aggregationKey,
        JSON.stringify(aggregated),
        { EX: 86400 }
      );

      this.emit('aggregation-flushed', {
        key,
        data: aggregated
      });

      delete this.aggregationBuffers[key];
      delete this.aggregationTimers[key];
    } catch (error) {
      console.error('Error flushing aggregation buffer:', error);
      this.emit('error', error);
    }
  }

  /**
   * Get top products from buffer
   */
  getTopProducts(products, limit = 10) {
    return Object.entries(products)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Update trending products
   */
  async updateTrendingProducts(retailer, items) {
    const trendingKey = `trending:${retailer}`;
    const trendingData = {
      items: items.slice(0, 20),
      updatedAt: new Date().toISOString()
    };

    await this.redis.set(
      trendingKey,
      JSON.stringify(trendingData),
      { EX: 3600 }
    );
  }

  /**
   * Store click audit trail
   */
  async storeClickAudit(data, timestamp) {
    const auditKey = `audit:clicks:${new Date(timestamp).toISOString().split('T')[0]}`;
    
    try {
      await this.redis.lPush(
        auditKey,
        JSON.stringify({ ...data, timestamp })
      );
      // Keep audit logs for 30 days
      await this.redis.expire(auditKey, 2592000);
    } catch (error) {
      console.error('Error storing audit:', error);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(channel, callback) {
    if (!this.subscribers[channel]) {
      this.subscribers[channel] = [];
    }
    this.subscribers[channel].push(callback);

    return () => {
      this.subscribers[channel] = this.subscribers[channel].filter(cb => cb !== callback);
    };
  }

  /**
   * Publish update to subscribers
   */
  publishUpdate(channel, data) {
    if (this.subscribers[channel]) {
      this.subscribers[channel].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(userId, retailer) {
    const key = `analytics:${userId}:${retailer}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(retailer) {
    const key = `trending:${retailer}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : { items: [], updatedAt: null };
  }

  /**
   * Get priority level
   */
  getPriorityLevel(priority) {
    const levels = {
      'low': 3,
      'normal': 2,
      'high': 1,
      'critical': 0
    };
    return levels[priority] || 2;
  }

  /**
   * Flush all pending aggregations
   */
  async flushAll() {
    const keys = Object.keys(this.aggregationBuffers);
    await Promise.all(keys.map(key => this.flushAggregationBuffer(key)));
  }

  /**
   * Disconnect
   */
  async disconnect() {
    await this.flushAll();
    await this.redis.quit();
    await this.queue.close();
  }
}

module.exports = RealTimeDataPipeline;
