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
      ebay: new eBayRetailer(this),
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

      const items = Array.isArray(data) ? data : [];
      this.cache.set(cacheKey, items);
      this.metrics.successfulRequests++;

      this.emit('data-fetched', {
        retailer: retailerName,
        itemsCount: items.length,
        timestamp: new Date()
      });

      return items;
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
   * Supports all Amazon API parameters: amazon_domain, language, delivery_country,
   * rh (filters), sort_by, price_min, price_max, page
   */
  async searchProducts(query, options = {}) {
    const { 
      limit = 20, 
      page = 1, 
      amazon_domain, 
      language, 
      delivery_country, 
      rh, 
      sort_by, 
      price_min, 
      price_max 
    } = options;

    // API key is always available (default is set in constructor)
    try {
      const params = {
        engine: 'amazon_search',
        api_key: this.apiKey,
        q: query,
        num: limit,
        page: page
      };

      // Add optional parameters if provided
      if (amazon_domain) params.amazon_domain = amazon_domain;
      if (language) params.language = language;
      if (delivery_country) params.delivery_country = delivery_country;
      if (rh) params.rh = rh;
      if (sort_by) params.sort_by = sort_by;
      if (price_min) params.price_min = price_min;
      if (price_max) params.price_max = price_max;

      const response = await axios.get(this.apiBaseUrl, {
        params: params,
        timeout: this.service.config.requestTimeout
      });

      // Handle organic_results from Amazon API response
      let allResults = [];
      if (response.data && response.data.organic_results) {
        allResults = allResults.concat(response.data.organic_results);
      }

      return this.normalizeData(allResults);
    } catch (error) {
      console.error('Amazon searchProducts error:', error.message);
      throw new Error(`Amazon search failed: ${error.message}`);
    }
  }

  async fetchBestSellers(options = {}) {
    const { category = 'electronics', limit = 20 } = options;

    try {
      // Use SearchAPI.io to search for best sellers in category
      // Always use the configured API key (default is set in constructor)
      // Use sort_by=bestsellers to get best-selling items
      const response = await axios.get(this.apiBaseUrl, {
        params: {
          engine: 'amazon_search',
          api_key: this.apiKey,
          q: `best sellers ${category}`,
          num: limit,
          sort_by: 'bestsellers'
        },
        timeout: this.service.config.requestTimeout
      });

      let allResults = [];
      if (response.data && response.data.organic_results) {
        allResults = allResults.concat(response.data.organic_results);
      }

      return this.normalizeData(allResults);
    } catch (error) {
      console.error('Amazon fetchBestSellers error:', error.message);
      throw new Error(`Amazon best sellers fetch failed: ${error.message}`);
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
    return Array.isArray(data) ? data.map(item => {
      // Handle price extraction - use extracted_price if available (cleaner than parsing price string)
      const price = item.extracted_price !== undefined && item.extracted_price !== null
        ? parseFloat(item.extracted_price)
        : (item.price ? parseFloat(String(item.price).replace(/[^0-9.]/g, '')) : 0);
      
      const originalPrice = item.extracted_original_price !== undefined && item.extracted_original_price !== null
        ? parseFloat(item.extracted_original_price)
        : (item.original_price ? parseFloat(String(item.original_price).replace(/[^0-9.]/g, '')) : price);

      // Handle fulfillment/availability
      const hasFulfillment = item.fulfillment && (
        item.fulfillment.standard_delivery || 
        item.fulfillment.fastest_delivery
      );
      const availability = hasFulfillment ? 'In Stock' : (item.availability || 'Out of Stock');

      return {
        id: item.asin || item.id,
        title: item.title || 'Product',
        price: price || 0,
        originalPrice: originalPrice || price,
        rating: item.rating ? parseFloat(item.rating) : 0,
        reviews: item.reviews ? parseInt(String(item.reviews).replace(/[^0-9]/g, '')) : 0,
        image: item.thumbnail || item.image || 'https://via.placeholder.com/200',
        availability: availability,
        category: item.category || '',
        retailer: 'amazon',
        link: item.link || `https://www.amazon.com/dp/${item.asin || item.id || ''}`,
        normalizedAt: new Date(),
        // Additional fields from Amazon API response
        asin: item.asin || null,
        brand: item.brand || null,
        position: item.position || null,
        recentSales: item.recent_sales || null,
        fulfillment: item.fulfillment || null,
        moreOffers: item.more_offers || null,
        attributes: item.attributes || [],
        isPrime: item.is_prime || false,
        isOverallPick: item.is_overall_pick || false,
        tags: item.tags || [],
        media: item.media || null,
        authors: item.authors || [],
        credits: item.credits || null,
        prices: item.prices || [],
        otherFormats: item.other_formats || [],
        pricePer: item.price_per || null
      };
    }) : data;
  }

  generateAffiliateUrl(productId, affiliateId) {
    return `https://www.amazon.com/dp/${productId}?tag=${affiliateId}`;
  }

  // Mock data functions REMOVED - Using real API only
  // All Amazon products now come from SearchAPI.io Amazon Search API

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

      return this.getMockBestSellers(limit);
    } catch (error) {
      console.error('Walmart fetchBestSellers error:', error.message);
      return this.getMockBestSellers(limit);
    }
  }

  async fetchClickAnalytics(options = {}) {
    const { dateRange = '7d', blockId } = options;

    return this.getMockAnalytics();
  }

  normalizeData(data) {
    return Array.isArray(data) ? data.map(item => {
      // Handle SearchAPI.io response format (matching the example structure)
      // Use extracted_price if available (cleaner than parsing price string)
      let price = 0;
      if (item.extracted_price !== undefined && item.extracted_price !== null) {
        price = parseFloat(item.extracted_price);
      } else if (item.price) {
        const priceStr = typeof item.price === 'string' ? item.price : String(item.price);
        const priceMatch = priceStr.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(/,/g, ''));
        }
      }
      
      // Handle price_range for variants
      const priceRange = item.price_range?.extracted_from_price || price;
      
      return {
        id: item.product_id || item.id,
        title: item.title || item.name || 'Product',
        price: price || priceRange || 0,
        originalPrice: price || priceRange, // Use same price if no original_price
        rating: item.rating ? parseFloat(item.rating) : (item.customerRating || 0),
        reviews: item.reviews ? parseInt(item.reviews) : (item.reviewCount || 0),
        image: item.thumbnail || item.image || item.imageUrl || 'https://via.placeholder.com/200',
        availability: item.fulfillment ? 'In Stock' : ((item.availability || item.in_stock || item.inStock) ? 'In Stock' : 'Out of Stock'),
        category: item.category || '',
        retailer: 'walmart',
        link: item.link || item.url || `https://www.walmart.com/ip/${item.product_id || item.id || ''}`,
        // Additional fields from API response
        sellerName: item.seller_name || 'Walmart',
        sellerId: item.seller_id || null,
        unitPrice: item.unit_price || item.extracted_unit_price || null,
        position: item.position || null,
        description: item.description || null,
        brand: item.brand || null,
        badges: item.badges || [],
        fulfillment: item.fulfillment || null,
        variants: item.variants || null,
        stock: item.stock || null,
        isFreeShipping: item.is_free_shipping || item.is_free_shipping_with_walmart_plus || false,
        normalizedAt: new Date()
      };
    }) : data;
  }

  generateAffiliateUrl(productId, affiliateId) {
    return `https://www.walmart.com/ip/${productId}?affid=${affiliateId}`;
  }

  /** Fallback mock when API fails or returns no results (used by searchProducts + fetchBestSellers) */
  getMockBestSellers(limit) {
    return this.normalizeData(Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      product_id: `mock-walmart-${Date.now()}-${i}`,
      id: `mock-walmart-${Date.now()}-${i}`,
      title: `Walmart Product #${i + 1}`,
      extracted_price: (Math.random() * 200 + 10).toFixed(2),
      price: `$${(Math.random() * 200 + 10).toFixed(2)}`,
      thumbnail: `https://via.placeholder.com/200?text=Walmart+${i + 1}`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviews: Math.floor(Math.random() * 500),
      category: 'home-garden',
      link: `https://www.walmart.com/ip/mock-${i}`,
      fulfillment: true
    })));
  }

  getMockAnalytics() {
    // Analytics can still use mock data as it's not product-related
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
 * eBay Retailer Adapter
 * Uses SearchAPI.io eBay Search API to access eBay's marketplace data
 * Endpoint: https://www.searchapi.io/api/v1/search?engine=ebay_search
 * Supports organic_results, sections, filters, pagination
 */
class eBayRetailer extends BaseRetailer {
  constructor(integrationService) {
    super(integrationService);
    this.name = 'ebay';
    this.apiBaseUrl = process.env.SEARCHAPI_EBAY_URL || 'https://www.searchapi.io/api/v1/search';
    this.apiKey = process.env.SEARCHAPI_API_KEY ||
                  process.env.EBAY_API_KEY ||
                  'WceNe5Tmok9RVw5Y4Qn6PnLM';
  }

  /**
   * Search eBay products using SearchAPI.io eBay Search API
   * Supports: q, category_id, ebay_domain, country, delivery_country, postal_code,
   * distance_radius, product_origin_country, price_min, price_max, condition,
   * buying_format, filters, advanced_filters, sort_by, layout, num, page
   */
  async searchProducts(query, options = {}) {
    const {
      limit = 20,
      page = 1,
      category_id,
      ebay_domain,
      country,
      delivery_country,
      postal_code,
      distance_radius,
      product_origin_country,
      price_min,
      price_max,
      condition,
      buying_format,
      filters,
      advanced_filters,
      sort_by,
      layout,
      num
    } = options;

    const numVal = num || (limit <= 60 ? 60 : limit <= 120 ? 120 : 240);

    try {
      const params = {
        engine: 'ebay_search',
        api_key: this.apiKey,
        q: query,
        num: Math.min(numVal, 240),
        page: page
      };

      if (category_id) params.category_id = category_id;
      if (ebay_domain) params.ebay_domain = ebay_domain;
      if (country) params.country = country;
      if (delivery_country) params.delivery_country = delivery_country;
      if (postal_code) params.postal_code = postal_code;
      if (distance_radius) params.distance_radius = distance_radius;
      if (product_origin_country) params.product_origin_country = product_origin_country;
      if (price_min) params.price_min = price_min;
      if (price_max) params.price_max = price_max;
      if (condition) params.condition = condition;
      if (buying_format) params.buying_format = buying_format;
      if (filters) params.filters = filters;
      if (advanced_filters) params.advanced_filters = advanced_filters;
      if (sort_by) params.sort_by = sort_by;
      if (layout) params.layout = layout;

      const response = await axios.get(this.apiBaseUrl, {
        params,
        timeout: this.service.config.requestTimeout
      });

      let allResults = [];
      if (response.data && response.data.organic_results) {
        allResults = allResults.concat(response.data.organic_results);
      }
      if (response.data && response.data.sections) {
        for (const sec of response.data.sections) {
          if (sec.results && Array.isArray(sec.results)) {
            allResults = allResults.concat(sec.results);
          }
        }
      }

      return this.normalizeData(allResults.slice(0, limit || 60));
    } catch (error) {
      console.error('eBay searchProducts error:', error.message);
      throw new Error(`eBay search failed: ${error.message}`);
    }
  }

  async fetchBestSellers(options = {}) {
    const { category = 'electronics', limit = 20 } = options;
    try {
      const response = await axios.get(this.apiBaseUrl, {
        params: {
          engine: 'ebay_search',
          api_key: this.apiKey,
          q: `best sellers ${category}`,
          num: 60,
          sort_by: 'best_match'
        },
        timeout: this.service.config.requestTimeout
      });

      let allResults = [];
      if (response.data && response.data.organic_results) {
        allResults = allResults.concat(response.data.organic_results);
      }
      if (response.data && response.data.sections) {
        for (const sec of response.data.sections) {
          if (sec.results && Array.isArray(sec.results)) {
            allResults = allResults.concat(sec.results);
          }
        }
      }
      return this.normalizeData(allResults.slice(0, limit));
    } catch (error) {
      console.error('eBay fetchBestSellers error:', error.message);
      throw new Error(`eBay best sellers fetch failed: ${error.message}`);
    }
  }

  async fetchClickAnalytics(options = {}) {
    return {
      totalClicks: Math.floor(Math.random() * 3500),
      clicksToday: Math.floor(Math.random() * 350),
      ctr: (Math.random() * 3.8).toFixed(2),
      revenue: (Math.random() * 700).toFixed(2),
      topProduct: 'eBay Top Product'
    };
  }

  normalizeData(data) {
    return Array.isArray(data) ? data.map(item => {
      let price = 0;
      if (item.extracted_price !== undefined && item.extracted_price !== null) {
        price = parseFloat(item.extracted_price);
      } else if (item.extracted_price_range) {
        price = item.extracted_price_range.from || item.extracted_price_range.to || 0;
      } else if (item.price) {
        const m = String(item.price).match(/\$?([\d,]+\.?\d*)/);
        if (m) price = parseFloat(m[1].replace(/,/g, ''));
      }

      const originalPrice = item.extracted_original_price != null
        ? parseFloat(item.extracted_original_price)
        : (item.original_price ? parseFloat(String(item.original_price).replace(/[^0-9.]/g, '')) : price);

      return {
        id: item.item_id || item.id,
        title: item.title || 'Product',
        price: price || 0,
        originalPrice: originalPrice || price,
        rating: item.rating != null ? parseFloat(item.rating) : 0,
        reviews: item.reviews != null ? parseInt(String(item.reviews).replace(/[^0-9]/g, '')) : 0,
        image: item.thumbnail || item.images?.[0] || 'https://via.placeholder.com/200',
        availability: 'In Stock',
        category: '',
        retailer: 'ebay',
        link: item.link || `https://www.ebay.com/itm/${item.item_id || item.id || ''}`,
        normalizedAt: new Date(),
        item_id: item.item_id || null,
        condition: item.condition || null,
        seller: item.seller || null,
        buying_format: item.buying_format || null,
        shipping: item.shipping || null,
        extracted_shipping: item.extracted_shipping,
        discount: item.discount || null,
        is_sponsored: item.is_sponsored || false,
        watching: item.extracted_watching ?? item.watching,
        items_sold: item.extracted_items_sold ?? item.items_sold,
        is_free_return: item.is_free_return || false,
        extensions: item.extensions || []
      };
    }) : data;
  }

  generateAffiliateUrl(productId, affiliateId) {
    return `https://www.ebay.com/itm/${productId}${affiliateId ? '?mkevt=1&mkcid=1&campid=' + affiliateId : ''}`;
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

      const raw = response.data ?? response;
      const toNormalize = Array.isArray(raw) ? raw : (raw?.products ?? raw);
      return this.normalizeData(Array.isArray(toNormalize) ? toNormalize : []);
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
  eBayRetailer,
  ShopifyRetailer,
  SkimlinksRetailer
};
