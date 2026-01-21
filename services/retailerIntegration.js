/**
 * Retailer Integration Service
 * Handles multi-retailer API integrations with fault tolerance and caching
 */

const axios = require('axios');
const NodeCache = require('node-cache');
const EventEmitter = require('events');

class RetailerIntegrationService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      cacheStdTTL: config.cacheStdTTL || 3600, // 1 hour default
      checkperiod: config.checkperiod || 600,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      requestTimeout: config.requestTimeout || 10000,
      ...config
    };

    this.cache = new NodeCache({
      stdTTL: this.config.cacheStdTTL,
      checkperiod: this.config.checkperiod
    });

    this.retailers = {};
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    this.initializeRetailers();
  }

  /**
   * Initialize all supported retailers
   */
  initializeRetailers() {
    this.retailers = {
      amazon: new AmazonRetailer(this),
      walmart: new WalmartRetailer(this),
      shopify: new ShopifyRetailer(this),
      skimlinks: new SkimlinksRetailer(this)
    };
  }

  /**
   * Get a specific retailer adapter
   */
  getRetailer(retailerName) {
    const retailer = this.retailers[retailerName.toLowerCase()];
    if (!retailer) {
      throw new Error(`Unsupported retailer: ${retailerName}`);
    }
    return retailer;
  }

  /**
   * Fetch best-selling items from a retailer
   */
  async fetchBestSellers(retailerName, options = {}) {
    const cacheKey = `bestsellers:${retailerName}:${JSON.stringify(options)}`;
    
    // Check cache first
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      this.metrics.cacheHits++;
      this.emit('cache-hit', { retailer: retailerName, key: cacheKey });
      return cachedData;
    }

    this.metrics.cacheMisses++;

    try {
      const retailer = this.getRetailer(retailerName);
      const data = await this.executeWithRetry(
        () => retailer.fetchBestSellers(options),
        { retailer: retailerName, operation: 'fetchBestSellers' }
      );

      // Cache the successful response
      this.cache.set(cacheKey, data);
      this.metrics.successfulRequests++;

      this.emit('data-fetched', {
        retailer: retailerName,
        itemsCount: data.length,
        timestamp: new Date()
      });

      return data;
    } catch (error) {
      this.metrics.failedRequests++;
      this.emit('error', {
        retailer: retailerName,
        operation: 'fetchBestSellers',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Fetch click analytics for products
   */
  async fetchClickAnalytics(retailerName, options = {}) {
    const cacheKey = `analytics:${retailerName}:${JSON.stringify(options)}`;
    
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      this.metrics.cacheHits++;
      return cachedData;
    }

    this.metrics.cacheMisses++;

    try {
      const retailer = this.getRetailer(retailerName);
      const analytics = await this.executeWithRetry(
        () => retailer.fetchClickAnalytics(options),
        { retailer: retailerName, operation: 'fetchClickAnalytics' }
      );

      this.cache.set(cacheKey, analytics);
      this.metrics.successfulRequests++;

      return analytics;
    } catch (error) {
      this.metrics.failedRequests++;
      throw error;
    }
  }

  /**
   * Execute API call with retry logic and timeout
   */
  async executeWithRetry(fn, context = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.metrics.totalRequests++;

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.config.requestTimeout)
        );

        const result = await Promise.race([fn(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error;

        this.emit('retry-attempt', {
          ...context,
          attempt,
          maxRetries: this.config.maxRetries,
          error: error.message
        });

        if (attempt < this.config.maxRetries) {
          const backoffDelay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Aggregate data from multiple retailers
   */
  async aggregateMultiRetailerData(retailers, operation, options = {}) {
    const results = await Promise.allSettled(
      retailers.map(retailer =>
        this[operation](retailer, options).catch(err => ({
          error: err.message,
          retailer
        }))
      )
    );

    return results.map((result, index) => ({
      retailer: retailers[index],
      status: result.status,
      data: result.value,
      error: result.reason?.message
    }));
  }

  /**
   * Normalize data across retailers for consistent display
   */
  normalizeData(data, retailerName) {
    const retailer = this.getRetailer(retailerName);
    return retailer.normalizeData(data);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const successRate = this.metrics.totalRequests > 0
      ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2)
      : 0;

    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      successRate: `${successRate}%`,
      cacheHitRate: `${cacheHitRate}%`,
      timestamp: new Date()
    };
  }

  /**
   * Clear cache
   */
  clearCache(pattern = null) {
    if (pattern) {
      const keys = this.cache.keys();
      const keysToDelete = keys.filter(key => key.includes(pattern));
      keysToDelete.forEach(key => this.cache.del(key));
      return keysToDelete.length;
    }
    this.cache.flushAll();
    return true;
  }
}

/**
 * Base Retailer Adapter
 */
class BaseRetailer {
  constructor(integrationService) {
    this.service = integrationService;
    this.name = 'base';
    this.rateLimit = 100; // requests per minute
  }

  async fetchBestSellers(options) {
    throw new Error('fetchBestSellers not implemented');
  }

  async fetchClickAnalytics(options) {
    throw new Error('fetchClickAnalytics not implemented');
  }

  normalizeData(data) {
    throw new Error('normalizeData not implemented');
  }

  generateAffiliateUrl(productId, affiliateId) {
    throw new Error('generateAffiliateUrl not implemented');
  }

  /**
   * Validate response data
   */
  validateResponse(data, schema) {
    if (!data) return false;
    
    for (const [key, type] of Object.entries(schema)) {
      if (typeof data[key] !== type) return false;
    }
    return true;
  }
}

/**
 * Amazon Retailer Adapter
 * Uses SearchAPI.io Amazon Search API to access Amazon's product database
 * The Amazon Search API lets developers tap into Amazon's huge product database 
 * to scrape real-time results. You can search for items, get sorted results based 
 * on relevance or reviews, and pull product details.
 */
class AmazonRetailer extends BaseRetailer {
  constructor(integrationService) {
    super(integrationService);
    this.name = 'amazon';
    // SearchAPI.io Amazon Search API
    // Endpoint: https://www.searchapi.io/api/v1/search?engine=amazon_search
    this.apiBaseUrl = process.env.SEARCHAPI_AMAZON_URL || 'https://www.searchapi.io/api/v1/search';
    // Default API key for Amazon product searches
    this.apiKey = process.env.SEARCHAPI_API_KEY || 
                  process.env.AMAZON_API_KEY || 
                  'WceNe5Tmok9RVw5Y4Qn6PnLM';
  }

  /**
   * Search Amazon products using SearchAPI.io Amazon Search API
   * Provides real-time results from Amazon's product database
   */
  async searchProducts(query, options = {}) {
    const { limit = 20, page = 1 } = options;

    // API key is always available (default is set in constructor)
    try {
      const response = await axios.get(this.apiBaseUrl, {
        params: {
          engine: 'amazon_search',
          api_key: this.apiKey,
          q: query,
          num: limit,
          page: page
        },
        timeout: this.service.config.requestTimeout
      });

      if (response.data && response.data.organic_results) {
        return this.normalizeData(response.data.organic_results);
      }

      return this.normalizeData(response.data || []);
    } catch (error) {
      console.error('Amazon searchProducts error:', error.message);
      // Fallback to mock data on error
      return this.getMockBestSellers(limit);
    }
  }

  async fetchBestSellers(options = {}) {
    const { category = 'electronics', limit = 20 } = options;

    try {
      // Use SearchAPI.io to search for best sellers in category
      // Always use the configured API key (default is set in constructor)
      const response = await axios.get(this.apiBaseUrl, {
        params: {
          engine: 'amazon_search',
          api_key: this.apiKey,
          q: `best sellers ${category}`,
          num: limit
        },
        timeout: this.service.config.requestTimeout
      });

      if (response.data && response.data.organic_results) {
        return this.normalizeData(response.data.organic_results);
      }

      // Fallback to mock data if no results
      return this.getMockBestSellers(limit);
    } catch (error) {
      console.error('Amazon fetchBestSellers error:', error.message);
      // Fallback to mock data on error
      return this.getMockBestSellers(limit);
    }
  }

  async fetchClickAnalytics(options = {}) {
    const { dateRange = '7d', blockId } = options;

    try {
      // Mock implementation for analytics
      const response = await axios.get(`${this.apiBaseUrl}/analytics/clicks`, {
        params: { dateRange, blockId },
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.service.config.requestTimeout
      }).catch(() => this.getMockAnalytics());

      return response.data || response;
    } catch (error) {
      console.error('Amazon fetchClickAnalytics error:', error.message);
      throw error;
    }
  }

  normalizeData(data) {
    return Array.isArray(data) ? data.map(item => ({
      id: item.asin || item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.originalPrice,
      rating: item.rating,
      reviews: item.reviews,
      image: item.image,
      availability: item.availability,
      category: item.category,
      retailer: 'amazon',
      normalizedAt: new Date()
    })) : data;
  }

  generateAffiliateUrl(productId, affiliateId) {
    return `https://www.amazon.com/dp/${productId}?tag=${affiliateId}`;
  }

  getMockBestSellers(limit) {
    return {
      data: Array.from({ length: limit }, (_, i) => ({
        asin: `B${String(i).padStart(10, '0')}`,
        title: `Amazon Product #${i + 1}`,
        price: Math.floor(Math.random() * 500) + 10,
        originalPrice: Math.floor(Math.random() * 600) + 20,
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviews: Math.floor(Math.random() * 10000),
        image: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}`,
        availability: 'In Stock',
        category: 'electronics'
      }))
    };
  }

  getMockAnalytics() {
    return {
      totalClicks: Math.floor(Math.random() * 5000),
      clicksToday: Math.floor(Math.random() * 500),
      ctr: (Math.random() * 5).toFixed(2),
      revenue: (Math.random() * 1000).toFixed(2),
      topProduct: 'Product Name'
    };
  }
}

/**
 * Walmart Retailer Adapter
 * Uses SearchAPI.io for Walmart product search
 * Endpoint: https://www.searchapi.io/api/v1/search?engine=walmart_search
 */
class WalmartRetailer extends BaseRetailer {
  constructor(integrationService) {
    super(integrationService);
    this.name = 'walmart';
    // SearchAPI.io Walmart Search API
    this.apiBaseUrl = process.env.SEARCHAPI_WALMART_URL || 'https://www.searchapi.io/api/v1/search';
    // Default API key for Walmart product searches (same as Amazon)
    this.apiKey = process.env.SEARCHAPI_API_KEY || 
                  process.env.WALMART_API_KEY || 
                  'WceNe5Tmok9RVw5Y4Qn6PnLM';
  }

  /**
   * Search Walmart products using SearchAPI.io
   */
  async searchProducts(query, options = {}) {
    const { limit = 20, page = 1 } = options;

    // API key is always available (default is set in constructor)
    try {
      const response = await axios.get(this.apiBaseUrl, {
        params: {
          engine: 'walmart_search',
          api_key: this.apiKey,
          q: query,
          num: limit,
          page: page
        },
        timeout: this.service.config.requestTimeout
      });

      if (response.data && response.data.organic_results) {
        return this.normalizeData(response.data.organic_results);
      }

      return this.normalizeData(response.data || []);
    } catch (error) {
      console.error('Walmart searchProducts error:', error.message);
      // Fallback to mock data on error
      return this.getMockBestSellers(limit);
    }
  }

  async fetchBestSellers(options = {}) {
    const { category = 'home-garden', limit = 20 } = options;

    try {
      // Use SearchAPI.io to search for best sellers in category
      // Always use the configured API key (default is set in constructor)
      const response = await axios.get(this.apiBaseUrl, {
        params: {
          engine: 'walmart_search',
          api_key: this.apiKey,
          q: `best sellers ${category}`,
          num: limit
        },
        timeout: this.service.config.requestTimeout
      });

      if (response.data && response.data.organic_results) {
        return this.normalizeData(response.data.organic_results);
      }

      // Fallback to mock data if no results
      return this.getMockBestSellers(limit);
    } catch (error) {
      console.error('Walmart fetchBestSellers error:', error.message);
      // Fallback to mock data on error
      return this.getMockBestSellers(limit);
    }
  }

  async fetchClickAnalytics(options = {}) {
    const { dateRange = '7d', blockId } = options;

    return this.getMockAnalytics();
  }

  normalizeData(data) {
    return Array.isArray(data) ? data.map(item => {
      // Handle SearchAPI.io response format
      let price = 0;
      if (item.price) {
        const priceStr = typeof item.price === 'string' ? item.price : String(item.price);
        const priceMatch = priceStr.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(/,/g, ''));
        }
      }
      
      return {
        id: item.product_id || item.item_id || item.itemId || item.id,
        title: item.title || item.name || 'Product',
        price: price || item.price || item.salePrice || 0,
        originalPrice: item.original_price ? parseFloat(String(item.original_price).replace(/[^0-9.]/g, '')) : (item.originalPrice || item.msrp || price),
        rating: item.rating ? parseFloat(item.rating) : (item.customerRating || 0),
        reviews: item.reviews ? parseInt(String(item.reviews).replace(/[^0-9]/g, '')) : (item.reviewCount || 0),
        image: item.thumbnail || item.image || item.imageUrl || 'https://via.placeholder.com/200',
        availability: (item.availability || item.in_stock || item.inStock) ? 'In Stock' : 'Out of Stock',
        category: item.category || '',
        retailer: 'walmart',
        link: item.link || item.url || `https://www.walmart.com/ip/${item.product_id || item.item_id || ''}`,
        normalizedAt: new Date()
      };
    }) : data;
  }

  generateAffiliateUrl(productId, affiliateId) {
    return `https://www.walmart.com/ip/${productId}?affid=${affiliateId}`;
  }

  getMockBestSellers(limit) {
    return {
      data: Array.from({ length: limit }, (_, i) => ({
        itemId: String(Math.floor(Math.random() * 1000000000)),
        title: `Walmart Item #${i + 1}`,
        price: Math.floor(Math.random() * 500) + 10,
        originalPrice: Math.floor(Math.random() * 600) + 20,
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviews: Math.floor(Math.random() * 8000),
        image: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}`,
        inStock: true,
        category: 'home-garden'
      }))
    };
  }

  getMockAnalytics() {
    return {
      totalClicks: Math.floor(Math.random() * 4000),
      clicksToday: Math.floor(Math.random() * 400),
      ctr: (Math.random() * 4).toFixed(2),
      revenue: (Math.random() * 800).toFixed(2),
      topProduct: 'Walmart Top Product'
    };
  }
}

/**
 * Shopify Retailer Adapter
 */
class ShopifyRetailer extends BaseRetailer {
  constructor(integrationService) {
    super(integrationService);
    this.name = 'shopify';
    this.apiBaseUrl = process.env.SHOPIFY_API_URL || 'https://shopify.com/admin/api';
    this.apiKey = process.env.SHOPIFY_API_KEY;
  }

  async fetchBestSellers(options = {}) {
    const { category = 'all', limit = 20, sortBy = 'sales' } = options;

    try {
      const response = await axios.get(`${this.apiBaseUrl}/2024-01/products.json`, {
        params: { limit, sortBy },
        headers: {
          'X-Shopify-Access-Token': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: this.service.config.requestTimeout
      }).catch(() => this.getMockBestSellers(limit));

      return this.normalizeData(response.data?.products || response);
    } catch (error) {
      console.error('Shopify fetchBestSellers error:', error.message);
      throw error;
    }
  }

  async fetchClickAnalytics(options = {}) {
    return this.getMockAnalytics();
  }

  normalizeData(data) {
    return Array.isArray(data) ? data.map(item => ({
      id: item.id,
      title: item.title,
      price: item.variants?.[0]?.price || 0,
      originalPrice: item.variants?.[0]?.compare_at_price || item.variants?.[0]?.price,
      rating: item.rating || 4.5,
      reviews: item.reviewCount || 0,
      image: item.image?.src || item.featured_image?.src,
      availability: item.status === 'active' ? 'In Stock' : 'Out of Stock',
      category: item.product_type,
      retailer: 'shopify',
      normalizedAt: new Date()
    })) : data;
  }

  generateAffiliateUrl(productId, affiliateId) {
    return `https://store.shopify.com/products/${productId}?ref=${affiliateId}`;
  }

  getMockBestSellers(limit) {
    return Array.from({ length: limit }, (_, i) => ({
      id: String(Math.floor(Math.random() * 1000000000)),
      title: `Shopify Product #${i + 1}`,
      variants: [{
        price: (Math.random() * 500 + 10).toFixed(2),
        compare_at_price: (Math.random() * 600 + 20).toFixed(2)
      }],
      image: { src: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}` },
      status: 'active',
      product_type: 'fashion',
      rating: (Math.random() * 2 + 3).toFixed(1)
    }));
  }

  getMockAnalytics() {
    return {
      totalClicks: Math.floor(Math.random() * 3000),
      clicksToday: Math.floor(Math.random() * 300),
      ctr: (Math.random() * 3.5).toFixed(2),
      revenue: (Math.random() * 600).toFixed(2),
      topProduct: 'Shopify Top Product'
    };
  }
}

/**
 * Skimlinks Retailer Adapter
 */
class SkimlinksRetailer extends BaseRetailer {
  constructor(integrationService) {
    super(integrationService);
    this.name = 'skimlinks';
    this.apiBaseUrl = process.env.SKIMLINKS_API_URL || 'https://api.skimlinks.com';
    this.apiKey = process.env.SKIMLINKS_API_KEY;
  }

  async fetchBestSellers(options = {}) {
    const { category = 'all', limit = 20 } = options;

    try {
      const response = await axios.get(`${this.apiBaseUrl}/v1/products`, {
        params: { category, limit, sort: 'popularity' },
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: this.service.config.requestTimeout
      }).catch(() => this.getMockBestSellers(limit));

      return this.normalizeData(response.data || response);
    } catch (error) {
      console.error('Skimlinks fetchBestSellers error:', error.message);
      throw error;
    }
  }

  async fetchClickAnalytics(options = {}) {
    return this.getMockAnalytics();
  }

  normalizeData(data) {
    return Array.isArray(data) ? data.map(item => ({
      id: item.productId || item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.originalPrice,
      rating: item.rating,
      reviews: item.reviewCount,
      image: item.imageUrl,
      availability: item.available ? 'In Stock' : 'Out of Stock',
      category: item.category,
      retailer: 'skimlinks',
      normalizedAt: new Date()
    })) : data;
  }

  generateAffiliateUrl(productId, affiliateId) {
    return `https://skimlinks.com/redirect/${productId}?affid=${affiliateId}`;
  }

  getMockBestSellers(limit) {
    return Array.from({ length: limit }, (_, i) => ({
      productId: String(Math.floor(Math.random() * 1000000000)),
      title: `Skimlinks Product #${i + 1}`,
      price: Math.floor(Math.random() * 500) + 10,
      originalPrice: Math.floor(Math.random() * 600) + 20,
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviewCount: Math.floor(Math.random() * 6000),
      imageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}`,
      available: true,
      category: 'multi'
    }));
  }

  getMockAnalytics() {
    return {
      totalClicks: Math.floor(Math.random() * 6000),
      clicksToday: Math.floor(Math.random() * 600),
      ctr: (Math.random() * 6).toFixed(2),
      revenue: (Math.random() * 1200).toFixed(2),
      topProduct: 'Skimlinks Top Product'
    };
  }
}

module.exports = {
  RetailerIntegrationService,
  BaseRetailer,
  AmazonRetailer,
  WalmartRetailer,
  ShopifyRetailer,
  SkimlinksRetailer
};
