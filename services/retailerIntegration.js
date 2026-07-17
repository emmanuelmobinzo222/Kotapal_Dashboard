/**
 * Retailer Integration Service
 * Handles multi-retailer API integrations with fault tolerance and caching
 */

const axios = require('axios');
const NodeCache = require('node-cache');
const EventEmitter = require('events');

const DEFAULT_PROVIDER_API_URL = process.env.PROVIDER_SEARCH_URL
  || process.env.SEARCHAPI_AMAZON_URL
  || 'https://www.searchapi.io/api/v1/search';

function extractProviderApiError(error, fallback) {
  const apiMsg = error.response?.data?.error
    || error.response?.data?.message
    || (typeof error.response?.data === 'string' ? error.response.data : null);
  return apiMsg || fallback || error.message;
}

function collectProviderSearchResults(data, limit = 20) {
  if (!data || typeof data !== 'object') return [];

  const seen = new Set();
  const results = [];

  const addItems = (items) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      const key = item.item_id || item.product_id || item.asin || item.id || item.link || item.title;
      if (key && seen.has(String(key))) continue;
      if (key) seen.add(String(key));
      results.push(item);
      if (results.length >= limit) return;
    }
  };

  addItems(data.organic_results);
  if (results.length < limit) addItems(data.related_results);
  if (results.length < limit) addItems(data.other_options);
  if (results.length < limit && Array.isArray(data.sections)) {
    for (const section of data.sections) {
      addItems(section?.results);
      if (results.length >= limit) break;
    }
  }

  return results.slice(0, limit);
}

function resolveEbayResultCount(limit = 20, explicitNum) {
  if (explicitNum != null && explicitNum !== '') {
    const num = parseInt(explicitNum, 10);
    if ([60, 120, 240].includes(num)) return num;
  }
  const value = parseInt(limit, 10) || 20;
  if (value <= 60) return 60;
  if (value <= 120) return 120;
  return 240;
}

function isPlaceholderProviderKey(key) {
  if (!key || typeof key !== 'string') return true;
  const normalized = key.trim().toLowerCase();
  if (!normalized) return true;
  return /^(your[-_])?(searchapi|provider)[-_]?key$|^replace[-_]me$|^change[-_]me/.test(normalized);
}

function pickUsableProviderKey(...candidates) {
  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    if (value && !isPlaceholderProviderKey(value)) return value;
  }
  return '';
}

function resolveRetailerSearchCredentials(retailerName, overrides = {}) {
  const retailer = String(retailerName || '').toLowerCase();
  const envKeyByRetailer = {
    amazon: process.env.AMAZON_API_KEY,
    walmart: process.env.WALMART_API_KEY,
    ebay: process.env.EBAY_API_KEY,
    shopify: process.env.SHOPIFY_API_KEY || process.env.SEARCHAPI_API_KEY,
    skimlinks: process.env.SKIMLINKS_API_KEY || process.env.SEARCHAPI_API_KEY
  };
  const envUrlByRetailer = {
    amazon: process.env.SEARCHAPI_AMAZON_URL,
    walmart: process.env.SEARCHAPI_WALMART_URL,
    ebay: process.env.SEARCHAPI_EBAY_URL,
    shopify: process.env.SHOPIFY_API_URL || process.env.SEARCHAPI_SHOPIFY_URL || DEFAULT_PROVIDER_API_URL,
    skimlinks: process.env.SKIMLINKS_API_URL || process.env.SEARCHAPI_SKIMLINKS_URL || DEFAULT_PROVIDER_API_URL
  };

  return {
    apiKey: pickUsableProviderKey(
      overrides.apiKey,
      process.env.SEARCHAPI_API_KEY,
      envKeyByRetailer[retailer]
    ),
    apiBaseUrl: overrides.apiBaseUrl || envUrlByRetailer[retailer] || DEFAULT_PROVIDER_API_URL
  };
}

const PLATFORM_PRODUCT_RETAILERS = ['amazon', 'walmart', 'shopify', 'skimlinks'];

function wantsTopPerformingSort(query = {}) {
  const explicit = query.sort_by != null && String(query.sort_by).trim() !== '';
  if (explicit) {
    const raw = String(query.sort_by).trim().toLowerCase().replace(/-/g, '_');
    return ['bestsellers', 'best_seller', 'best_sellers', 'top', 'popular', 'performance', 'featured'].includes(raw);
  }
  const hint = String(query.sort || query.performance || 'top').trim().toLowerCase().replace(/-/g, '_');
  return !hint || ['top', 'bestsellers', 'best_seller', 'best_sellers', 'popular', 'performance', 'featured'].includes(hint);
}

function scoreProductPerformance(product, index = 0) {
  const rating = Number(product.rating) || 0;
  const reviews = Number(product.reviews) || 0;
  const positionBonus = Math.max(0, 40 - index);
  return rating * Math.log10(reviews + 10) * 10 + positionBonus + (Number(product.performanceScore) || 0);
}

function getPlatformCuratedCatalog(retailer) {
  const catalogs = {
    shopify: [
      { id: 'shp_yoga_mat', title: 'Premium Eco Yoga Mat', price: 49.99, originalPrice: 69.99, rating: 4.8, reviews: 2140, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=500&q=80', brand: 'KotaFit', category: 'fitness', link: 'https://shopify.com' },
      { id: 'shp_tee', title: 'Organic Cotton Creator Tee', price: 28.0, originalPrice: 36.0, rating: 4.6, reviews: 980, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80', brand: 'KotaWear', category: 'apparel', link: 'https://shopify.com' },
      { id: 'shp_bottle', title: 'Insulated Steel Water Bottle 32oz', price: 34.5, originalPrice: 42.0, rating: 4.7, reviews: 3120, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=500&q=80', brand: 'HydraCo', category: 'lifestyle', link: 'https://shopify.com' },
      { id: 'shp_bag', title: 'Everyday Canvas Tote Bag', price: 22.0, originalPrice: 29.0, rating: 4.5, reviews: 1540, image: 'https://images.unsplash.com/photo-1590874103328-eac38a67437f?auto=format&fit=crop&w=500&q=80', brand: 'CarryAll', category: 'accessories', link: 'https://shopify.com' },
      { id: 'shp_candle', title: 'Soy Wax Signature Candle Set', price: 39.99, originalPrice: 49.99, rating: 4.9, reviews: 870, image: 'https://images.unsplash.com/photo-1602601370317-eea769387070?auto=format&fit=crop&w=500&q=80', brand: 'GlowHouse', category: 'home', link: 'https://shopify.com' },
      { id: 'shp_skincare', title: 'Vitamin C Brightening Serum', price: 45.0, originalPrice: 58.0, rating: 4.7, reviews: 4210, image: 'https://images.unsplash.com/photo-1620916569983-4f267b0aea47?auto=format&fit=crop&w=500&q=80', brand: 'PureGlow', category: 'beauty', link: 'https://shopify.com' },
      { id: 'shp_headphones', title: 'Wireless Studio Headphones', price: 129.0, originalPrice: 159.0, rating: 4.6, reviews: 2680, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80', brand: 'SoundPeak', category: 'electronics', link: 'https://shopify.com' },
      { id: 'shp_desk', title: 'Standing Desk Converter', price: 189.0, originalPrice: 229.0, rating: 4.4, reviews: 1120, image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=500&q=80', brand: 'WorkLift', category: 'office', link: 'https://shopify.com' }
    ],
    skimlinks: [
      { id: 'skm_airmax', title: 'Nike Air Max Running Shoes', price: 129.99, originalPrice: 149.99, rating: 4.7, reviews: 8900, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80', brand: 'Nike', category: 'footwear', link: 'https://www.nike.com' },
      { id: 'skm_instantpot', title: 'Instant Pot Duo 7-in-1', price: 89.99, originalPrice: 119.99, rating: 4.8, reviews: 15200, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=500&q=80', brand: 'Instant Pot', category: 'kitchen', link: 'https://www.instantpot.com' },
      { id: 'skm_dyson', title: 'Dyson V8 Cordless Vacuum', price: 349.0, originalPrice: 429.0, rating: 4.6, reviews: 6400, image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=500&q=80', brand: 'Dyson', category: 'home', link: 'https://www.dyson.com' },
      { id: 'skm_airpods', title: 'Apple AirPods Pro', price: 199.0, originalPrice: 249.0, rating: 4.8, reviews: 22100, image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=500&q=80', brand: 'Apple', category: 'electronics', link: 'https://www.apple.com' },
      { id: 'skm_kindle', title: 'Kindle Paperwhite E-Reader', price: 139.99, originalPrice: 159.99, rating: 4.7, reviews: 18700, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80', brand: 'Amazon Devices', category: 'electronics', link: 'https://www.amazon.com' },
      { id: 'skm_lego', title: 'LEGO Architecture Skyline Set', price: 59.99, originalPrice: 69.99, rating: 4.9, reviews: 4300, image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=500&q=80', brand: 'LEGO', category: 'toys', link: 'https://www.lego.com' },
      { id: 'skm_backpack', title: 'Travel Backpack 35L', price: 79.0, originalPrice: 99.0, rating: 4.5, reviews: 2100, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80', brand: 'TrailForge', category: 'travel', link: 'https://www.rei.com' },
      { id: 'skm_blender', title: 'High-Speed Personal Blender', price: 49.99, originalPrice: 69.99, rating: 4.6, reviews: 5600, image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=500&q=80', brand: 'BlendJet', category: 'kitchen', link: 'https://www.blendjet.com' }
    ]
  };
  return (catalogs[retailer] || []).map((item) => ({
    ...item,
    retailer,
    availability: 'In Stock',
    performanceScore: scoreProductPerformance(item, 0),
    normalizedAt: new Date()
  }));
}

function filterRankCuratedCatalog(retailer, query, limit = 20) {
  const q = String(query || '').trim().toLowerCase();
  let items = getPlatformCuratedCatalog(retailer);
  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean);
    items = items.filter((p) => {
      const hay = `${p.title} ${p.brand || ''} ${p.category || ''}`.toLowerCase();
      return tokens.every((t) => hay.includes(t)) || hay.includes(q);
    });
    if (items.length === 0) {
      items = getPlatformCuratedCatalog(retailer).filter((p) => {
        const hay = `${p.title} ${p.brand || ''} ${p.category || ''}`.toLowerCase();
        return tokens.some((t) => hay.includes(t));
      });
    }
  }
  return items
    .map((p, i) => ({ ...p, performanceScore: scoreProductPerformance(p, i) }))
    .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
    .slice(0, limit);
}

async function searchGoogleShoppingAsRetailer(retailer, query, options = {}) {
  const apiKey = pickUsableProviderKey(options.apiKey, process.env.SEARCHAPI_API_KEY);
  const apiBaseUrl = options.apiBaseUrl || DEFAULT_PROVIDER_API_URL;
  if (!apiKey) return null;

  const response = await axios.get(apiBaseUrl, {
    params: {
      engine: 'google_shopping',
      api_key: apiKey,
      q: query,
      gl: 'us',
      hl: 'en'
    },
    timeout: options.timeout || 15000
  });

  const raw = collectProviderSearchResults(response.data, options.limit || 20);
  return raw.map((item, index) => ({
    id: String(item.product_id || item.id || `${retailer}_${index}`),
    title: item.title || 'Product',
    price: parseFloat(String(item.price || item.extracted_price || '0').replace(/[^0-9.]/g, '')) || 0,
    originalPrice: parseFloat(String(item.old_price || item.price || '0').replace(/[^0-9.]/g, '')) || 0,
    rating: item.rating || 0,
    reviews: item.reviews || item.reviews_count || 0,
    image: item.thumbnail || item.image || '',
    availability: item.in_stock === false ? 'Out of Stock' : 'In Stock',
    retailer,
    link: item.link || item.product_link || '',
    brand: item.source || item.seller || '',
    performanceScore: scoreProductPerformance({
      rating: item.rating || 0,
      reviews: item.reviews || item.reviews_count || 0
    }, index),
    normalizedAt: new Date()
  }));
}

class RetailerIntegrationService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      cacheStdTTL: config.cacheStdTTL || 3600, // 1 hour default
      checkperiod: config.checkperiod || 600,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      requestTimeout: config.requestTimeout || 15000,
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
   * Search products from a retailer (live SearchAPI.io)
   */
  async searchProducts(retailerName, query, options = {}) {
    const retailerKey = String(retailerName || '').toLowerCase();
    if (retailerKey === 'all' || retailerKey === 'multi') {
      return this.searchTopAcrossRetailers(query, options);
    }

    const cacheKey = `search:${retailerKey}:${query}:${JSON.stringify(options)}`;

    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      this.metrics.cacheHits++;
      return cachedData;
    }

    this.metrics.cacheMisses++;

    try {
      const retailer = this.getRetailer(retailerKey);
      const data = await this.executeWithRetry(
        () => retailer.searchProducts(query, options),
        { retailer: retailerKey, operation: 'searchProducts' }
      );

      const items = Array.isArray(data) ? data : [];
      this.cache.set(cacheKey, items, 300);
      this.metrics.successfulRequests++;

      this.emit('data-fetched', {
        retailer: retailerKey,
        itemsCount: items.length,
        operation: 'searchProducts',
        timestamp: new Date()
      });

      return items;
    } catch (error) {
      this.metrics.failedRequests++;
      this.emit('error', {
        retailer: retailerKey,
        operation: 'searchProducts',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Fan-out top-performing search across Amazon, Walmart, Shopify, and Skimlinks.
   * Platform credentials only — creators do not supply store API keys.
   */
  async searchTopAcrossRetailers(query, options = {}) {
    const limit = parseInt(options.limit, 10) || 24;
    const perRetailer = Math.max(4, Math.ceil(limit / PLATFORM_PRODUCT_RETAILERS.length) + 1);
    const batches = await Promise.allSettled(
      PLATFORM_PRODUCT_RETAILERS.map((retailer) =>
        this.searchProducts(retailer, query, {
          ...options,
          limit: perRetailer,
          sort_by: options.sort_by || (retailer === 'walmart' ? 'best_seller' : retailer === 'amazon' ? 'bestsellers' : options.sort_by)
        })
      )
    );

    const merged = [];
    batches.forEach((result, index) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        merged.push(...result.value.map((item, i) => ({
          ...item,
          retailer: item.retailer || PLATFORM_PRODUCT_RETAILERS[index],
          performanceScore: scoreProductPerformance(item, i)
        })));
      }
    });

    return merged
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
      .slice(0, limit);
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

const AMAZON_VALID_SORT = new Set([
  'featured',
  'price_low_to_high',
  'price_high_to_low',
  'average_review',
  'newest_arrivals',
  'bestsellers'
]);

function normalizeAmazonSortBy(sortBy) {
  if (sortBy == null || sortBy === '') return undefined;
  const raw = String(sortBy).trim().toLowerCase().replace(/-/g, '_');
  const aliases = {
    best_seller: 'bestsellers',
    bestseller: 'bestsellers',
    best_sellers: 'bestsellers',
    relevance: 'featured',
    best_match: 'featured',
    price_asc: 'price_low_to_high',
    price_desc: 'price_high_to_low',
    reviews: 'average_review',
    average_reviews: 'average_review',
    newest: 'newest_arrivals'
  };
  const mapped = aliases[raw] || raw;
  return AMAZON_VALID_SORT.has(mapped) ? mapped : undefined;
}

function buildAmazonSearchParams(query, options = {}) {
  const {
    page = 1,
    amazon_domain,
    language,
    delivery_country,
    category_id,
    rh,
    sort_by,
    price_min,
    price_max,
    apiKey,
    apiBaseUrl
  } = options;

  const resolvedApiKey = apiKey;
  const params = {
    engine: 'amazon_search',
    api_key: resolvedApiKey,
    q: query,
    page
  };

  if (amazon_domain) params.amazon_domain = amazon_domain;
  if (language) params.language = language;
  if (delivery_country) params.delivery_country = delivery_country;
  if (category_id) params.category_id = category_id;
  if (rh) params.rh = rh;

  const normalizedSort = normalizeAmazonSortBy(sort_by);
  if (normalizedSort) params.sort_by = normalizedSort;

  if (price_min != null && price_min !== '') params.price_min = price_min;
  if (price_max != null && price_max !== '') params.price_max = price_max;

  return { params, apiBaseUrl };
}

function buildRetailerSearchOptions(retailerName, query = {}) {
  const retailer = String(retailerName || '').toLowerCase();
  const options = {
    limit: parseInt(query.limit, 10) || 20,
    page: parseInt(query.page, 10) || 1,
    category_id: query.category_id,
    store_id: query.store_id,
    ebay_domain: query.ebay_domain,
    sort_by: query.sort_by,
    price_min: query.price_min,
    price_max: query.price_max,
    filters: query.filters
  };

  const preferTop = wantsTopPerformingSort(query);

  if (retailer === 'amazon') {
    options.amazon_domain = query.amazon_domain;
    options.language = query.language;
    options.delivery_country = query.delivery_country;
    options.rh = query.rh;
    if (preferTop && !options.sort_by) options.sort_by = 'bestsellers';
    if (options.sort_by) {
      const normalized = normalizeAmazonSortBy(options.sort_by === 'top' || options.sort_by === 'popular' || options.sort_by === 'performance'
        ? 'bestsellers'
        : options.sort_by);
      if (normalized) options.sort_by = normalized;
    }
  }

  if (retailer === 'ebay') {
    options.country = query.country;
    options.delivery_country = query.delivery_country;
    options.postal_code = query.postal_code;
    options.distance_radius = query.distance_radius;
    options.product_origin_country = query.product_origin_country;
    options.condition = query.condition;
    options.buying_format = query.buying_format;
    options.preferred_location = query.preferred_location;
    options.include_related_results = query.include_related_results;
    options.advanced_filters = query.advanced_filters;
    options.layout = query.layout;
    options.num = query.num;
    if (options.sort_by) {
      const normalized = normalizeEbaySortBy(options.sort_by);
      if (normalized) options.sort_by = normalized;
    }
  }

  if (retailer === 'walmart') {
    if (preferTop && !options.sort_by) options.sort_by = 'best_seller';
    if (options.sort_by) {
      const normalized = normalizeWalmartSortBy(
        ['top', 'popular', 'performance', 'bestsellers', 'best_sellers'].includes(String(options.sort_by).toLowerCase())
          ? 'best_seller'
          : options.sort_by
      );
      if (normalized) options.sort_by = normalized;
    }
  }

  if (retailer === 'shopify' || retailer === 'skimlinks' || retailer === 'all' || retailer === 'multi') {
    options.preferTop = preferTop;
  }

  return options;
}

const EBAY_VALID_SORT = new Set([
  'best_match',
  'price_shipping_low_to_high',
  'price_shipping_high_to_low',
  'time_newly_listed',
  'time_ending_soonest',
  'distance_nearest',
  'price_low_to_high',
  'price_high_to_low',
  'condition_new_first',
  'condition_used_first'
]);

function normalizeEbaySortBy(sortBy) {
  if (sortBy == null || sortBy === '') return undefined;
  const raw = String(sortBy).trim().toLowerCase().replace(/-/g, '_');
  const aliases = {
    relevance: 'best_match',
    featured: 'best_match',
    newest: 'time_newly_listed',
    newly_listed: 'time_newly_listed',
    ending_soon: 'time_ending_soonest',
    ending_soonest: 'time_ending_soonest',
    price_asc: 'price_low_to_high',
    price_desc: 'price_high_to_low',
    shipping_low: 'price_shipping_low_to_high',
    shipping_high: 'price_shipping_high_to_low',
    distance: 'distance_nearest',
    new_first: 'condition_new_first',
    used_first: 'condition_used_first'
  };
  const mapped = aliases[raw] || raw;
  return EBAY_VALID_SORT.has(mapped) ? mapped : undefined;
}

function buildEbaySearchParams(query, options = {}) {
  const {
    page = 1,
    limit = 20,
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
    preferred_location,
    include_related_results = true,
    filters,
    advanced_filters,
    sort_by,
    layout,
    num,
    apiKey
  } = options;

  const trimmedQuery = query != null ? String(query).trim() : '';
  if (!trimmedQuery && !category_id) {
    throw new Error('eBay search requires a query (q) or category_id.');
  }

  const params = {
    engine: 'ebay_search',
    api_key: apiKey,
    page,
    num: resolveEbayResultCount(limit, num),
    include_related_results: include_related_results === true
      || include_related_results === 'true'
      || include_related_results === '1'
  };

  if (trimmedQuery) params.q = trimmedQuery;
  if (category_id) params.category_id = category_id;
  if (ebay_domain) params.ebay_domain = ebay_domain;
  if (country) params.country = country;
  if (delivery_country) params.delivery_country = delivery_country;
  if (postal_code) params.postal_code = postal_code;
  if (distance_radius != null && distance_radius !== '') params.distance_radius = distance_radius;
  if (product_origin_country) params.product_origin_country = product_origin_country;
  if (price_min != null && price_min !== '') params.price_min = price_min;
  if (price_max != null && price_max !== '') params.price_max = price_max;
  if (condition) params.condition = condition;
  if (buying_format) params.buying_format = buying_format;
  if (preferred_location) params.preferred_location = preferred_location;
  if (filters) params.filters = filters;
  if (advanced_filters) params.advanced_filters = advanced_filters;

  const normalizedSort = normalizeEbaySortBy(sort_by);
  if (normalizedSort) params.sort_by = normalizedSort;

  if (layout) params.layout = layout;

  return { params };
}

const WALMART_VALID_SORT = new Set([
  'best_match',
  'price_low_to_high',
  'price_high_to_low',
  'best_seller'
]);

function normalizeWalmartSortBy(sortBy) {
  if (sortBy == null || sortBy === '') return undefined;
  const raw = String(sortBy).trim().toLowerCase().replace(/-/g, '_');
  const aliases = {
    relevance: 'best_match',
    featured: 'best_match',
    price_low: 'price_low_to_high',
    price_high: 'price_high_to_low',
    price_asc: 'price_low_to_high',
    price_desc: 'price_high_to_low',
    bestsellers: 'best_seller',
    best_sellers: 'best_seller',
    best_seller: 'best_seller'
  };
  const mapped = aliases[raw] || raw;
  return WALMART_VALID_SORT.has(mapped) ? mapped : undefined;
}

function buildWalmartSearchParams(query, options = {}) {
  const {
    page = 1,
    category_id,
    store_id,
    price_min,
    price_max,
    filters,
    sort_by,
    apiKey
  } = options;

  const trimmedQuery = query != null ? String(query).trim() : '';
  if (!trimmedQuery) {
    throw new Error('Walmart search requires a query (q).');
  }

  const params = {
    engine: 'walmart_search',
    api_key: apiKey,
    q: trimmedQuery,
    page
  };

  if (category_id) params.category_id = category_id;
  if (store_id != null && store_id !== '') params.store_id = store_id;
  if (price_min != null && price_min !== '') params.price_min = price_min;
  if (price_max != null && price_max !== '') params.price_max = price_max;
  if (filters) params.filters = filters;

  const normalizedSort = normalizeWalmartSortBy(sort_by);
  if (normalizedSort) params.sort_by = normalizedSort;

  return { params };
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
    this.apiKey = process.env.SEARCHAPI_API_KEY || process.env.AMAZON_API_KEY || '';
  }

  /**
   * Search Amazon products using SearchAPI.io Amazon Search API
   * Provides real-time results from Amazon's product database
   * Supports all Amazon API parameters: amazon_domain, language, delivery_country,
   * rh (filters), sort_by, price_min, price_max, page
   */
  async searchProducts(query, options = {}) {
    const { limit = 20, apiKey, apiBaseUrl, ...searchOptions } = options;
    const resolvedApiKey = apiKey || this.apiKey;
    const resolvedApiBaseUrl = apiBaseUrl || this.apiBaseUrl;

    if (!resolvedApiKey) {
      throw new Error('Amazon product lookup is not configured on the server.');
    }

    try {
      const { params } = buildAmazonSearchParams(query, {
        ...searchOptions,
        apiKey: resolvedApiKey,
        apiBaseUrl: resolvedApiBaseUrl
      });

      const response = await axios.get(resolvedApiBaseUrl, {
        params,
        timeout: this.service.config.requestTimeout
      });

      const allResults = collectProviderSearchResults(response.data, limit);
      return this.normalizeData(allResults);
    } catch (error) {
      const apiMsg = extractProviderApiError(error);
      console.error('Amazon searchProducts error:', apiMsg);
      throw new Error(apiMsg || `Amazon search failed: ${error.message}`);
    }
  }

  async fetchBestSellers(options = {}) {
    const { category = 'electronics', limit = 20, apiKey, apiBaseUrl } = options;
    const resolvedApiKey = apiKey || this.apiKey;
    const resolvedApiBaseUrl = apiBaseUrl || this.apiBaseUrl;

    if (!resolvedApiKey) {
      throw new Error('Amazon product key is required. Add your key in Settings.');
    }

    try {
      const { params } = buildAmazonSearchParams(`best sellers ${category}`, {
        sort_by: 'bestsellers',
        page: 1,
        apiKey: resolvedApiKey,
        apiBaseUrl: resolvedApiBaseUrl
      });

      const response = await axios.get(resolvedApiBaseUrl, {
        params,
        timeout: this.service.config.requestTimeout
      });

      const allResults = collectProviderSearchResults(response.data, limit);
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
    this.apiKey = process.env.SEARCHAPI_API_KEY || process.env.WALMART_API_KEY || '';
  }

  /**
   * Search Walmart products (engine=walmart_search)
   */
  async searchProducts(query, options = {}) {
    const { limit = 20, apiKey, apiBaseUrl, ...searchOptions } = options;
    const resolvedApiKey = apiKey || this.apiKey;
    const resolvedApiBaseUrl = apiBaseUrl || this.apiBaseUrl;

    if (!resolvedApiKey) {
      throw new Error('Walmart product lookup is not configured on the server.');
    }

    try {
      const { params } = buildWalmartSearchParams(query, {
        ...searchOptions,
        apiKey: resolvedApiKey
      });

      const response = await axios.get(resolvedApiBaseUrl, {
        params,
        timeout: this.service.config.requestTimeout
      });

      const allResults = collectProviderSearchResults(response.data, limit);
      return this.normalizeData(allResults);
    } catch (error) {
      const apiMsg = extractProviderApiError(error);
      console.error('Walmart searchProducts error:', apiMsg);
      throw new Error(apiMsg || `Walmart search failed: ${error.message}`);
    }
  }

  async fetchBestSellers(options = {}) {
    const { category = 'home', limit = 20, apiKey, apiBaseUrl } = options;
    const resolvedApiKey = apiKey || this.apiKey;
    const resolvedApiBaseUrl = apiBaseUrl || this.apiBaseUrl;

    if (!resolvedApiKey) {
      throw new Error('Walmart product lookup is not configured on the server.');
    }

    try {
      const { params } = buildWalmartSearchParams(`best sellers ${category}`, {
        sort_by: 'best_seller',
        page: 1,
        apiKey: resolvedApiKey
      });

      const response = await axios.get(resolvedApiBaseUrl, {
        params,
        timeout: this.service.config.requestTimeout
      });

      const allResults = collectProviderSearchResults(response.data, limit);
      return this.normalizeData(allResults);
    } catch (error) {
      console.error('Walmart fetchBestSellers error:', error.message);
      throw new Error(`Walmart best sellers fetch failed: ${error.message}`);
    }
  }

  async fetchClickAnalytics(options = {}) {
    const { dateRange = '7d', blockId } = options;

    return this.getMockAnalytics();
  }

  normalizeData(data) {
    return Array.isArray(data) ? data.map(item => {
      let price = 0;
      if (item.extracted_price !== undefined && item.extracted_price !== null) {
        price = parseFloat(item.extracted_price);
      } else if (item.price_range?.extracted_from_price != null) {
        price = parseFloat(item.price_range.extracted_from_price);
      } else if (item.price) {
        const priceStr = typeof item.price === 'string' ? item.price : String(item.price);
        const priceMatch = priceStr.match(/\$?([\d,]+\.?\d*)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(/,/g, ''));
        }
      }
      
      const priceRange = item.price_range?.extracted_from_price || price;
      
      return {
        id: item.product_id || item.id,
        title: item.title || item.name || 'Product',
        price: price || priceRange || 0,
        originalPrice: price || priceRange,
        rating: item.rating ? parseFloat(item.rating) : (item.customerRating || 0),
        reviews: item.reviews ? parseInt(item.reviews) : (item.reviewCount || 0),
        image: item.thumbnail || item.image || item.imageUrl || 'https://via.placeholder.com/200',
        availability: item.fulfillment ? 'In Stock' : ((item.availability || item.in_stock || item.inStock) ? 'In Stock' : 'Out of Stock'),
        category: item.category || '',
        retailer: 'walmart',
        link: item.link || item.url || `https://www.walmart.com/ip/${item.id || item.product_id || ''}`,
        sellerName: item.seller_name || 'Walmart',
        sellerId: item.seller_id || null,
        unitPrice: item.unit_price || null,
        extractedUnitPrice: item.extracted_unit_price || null,
        position: item.position || null,
        description: item.description || null,
        brand: item.brand || null,
        badges: item.badges || [],
        fulfillment: item.fulfillment || null,
        variants: item.variants || null,
        stock: item.stock || null,
        priceRange: item.price_range || null,
        isFreeShipping: item.is_free_shipping || false,
        isFreeShippingWithWalmartPlus: item.is_free_shipping_with_walmart_plus || false,
        isSponsored: item.is_sponsored || false,
        isSubscriptionEligible: item.is_subscription_eligible || false,
        flag: item.flag || null,
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
    this.apiKey = process.env.SEARCHAPI_API_KEY || process.env.EBAY_API_KEY || '';
  }

  /**
   * Search eBay products using SearchAPI.io eBay Search API
   * Supports: q, category_id, ebay_domain, country, delivery_country, postal_code,
   * distance_radius, product_origin_country, price_min, price_max, condition,
   * buying_format, filters, advanced_filters, sort_by, layout, num, page
   */
  async searchProducts(query, options = {}) {
    const { limit = 20, apiKey, apiBaseUrl, ...searchOptions } = options;
    const resolvedApiKey = apiKey || this.apiKey;
    const resolvedApiBaseUrl = apiBaseUrl || this.apiBaseUrl;

    if (!resolvedApiKey) {
      throw new Error('eBay product key is required. Add your key in Settings.');
    }

    try {
      const { params } = buildEbaySearchParams(query, {
        ...searchOptions,
        limit,
        apiKey: resolvedApiKey
      });

      const response = await axios.get(resolvedApiBaseUrl, {
        params,
        timeout: this.service.config.requestTimeout
      });

      const allResults = collectProviderSearchResults(response.data, limit);
      return this.normalizeData(allResults);
    } catch (error) {
      const apiMsg = extractProviderApiError(error);
      console.error('eBay searchProducts error:', apiMsg);
      throw new Error(apiMsg || `eBay search failed: ${error.message}`);
    }
  }

  async fetchBestSellers(options = {}) {
    const { category = 'electronics', limit = 20, apiKey, apiBaseUrl } = options;
    const resolvedApiKey = apiKey || this.apiKey;
    const resolvedApiBaseUrl = apiBaseUrl || this.apiBaseUrl;

    if (!resolvedApiKey) {
      throw new Error('eBay product key is required. Add your key in Settings.');
    }

    try {
      const { params } = buildEbaySearchParams(`trending ${category}`, {
        sort_by: 'best_match',
        include_related_results: true,
        page: 1,
        limit,
        filters: 'sale_items',
        apiKey: resolvedApiKey
      });

      const response = await axios.get(resolvedApiBaseUrl, {
        params,
        timeout: this.service.config.requestTimeout
      });

      const allResults = collectProviderSearchResults(response.data, limit);
      return this.normalizeData(allResults);
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
        extensions: item.extensions || [],
        authenticity: item.authenticity || null,
        is_buy_it_now: item.is_buy_it_now || false,
        is_price_range: item.is_price_range || false,
        price_range: item.extracted_price_range || null,
        deal: item.deal || null,
        stock: item.stock || null,
        images: item.images || [],
        position: item.position || null
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

  async searchProducts(query, options = {}) {
    const { limit = 20, apiKey, apiBaseUrl } = options;
    const q = String(query || '').trim();
    if (!q) return filterRankCuratedCatalog('shopify', '', limit);

    const adminKey = pickUsableProviderKey(apiKey, this.apiKey);
    const adminUrl = apiBaseUrl || this.apiBaseUrl;

    if (adminKey && adminUrl && /admin\/api|myshopify\.com/i.test(String(adminUrl))) {
      try {
        const response = await axios.get(adminUrl.replace(/\/$/, '') + '/2024-01/products.json', {
          params: { limit, title: q },
          headers: {
            'X-Shopify-Access-Token': adminKey,
            'Content-Type': 'application/json'
          },
          timeout: this.service.config.requestTimeout
        });
        const normalized = this.normalizeData(response.data && response.data.products ? response.data.products : []);
        if (normalized.length) {
          return normalized
            .map((p, i) => Object.assign({}, p, { performanceScore: scoreProductPerformance(p, i) }))
            .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
            .slice(0, limit);
        }
      } catch (err) {
        console.warn('Shopify Admin search unavailable, trying platform catalog:', err.message);
      }
    }

    try {
      const shopping = await searchGoogleShoppingAsRetailer('shopify', q + ' shopify', {
        apiKey: pickUsableProviderKey(apiKey, process.env.SEARCHAPI_API_KEY),
        apiBaseUrl: DEFAULT_PROVIDER_API_URL,
        limit,
        timeout: this.service.config.requestTimeout
      });
      if (Array.isArray(shopping) && shopping.length) {
        return shopping
          .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
          .slice(0, limit);
      }
    } catch (err) {
      console.warn('Shopify shopping search fallback:', err.message);
    }

    return filterRankCuratedCatalog('shopify', q, limit);
  }

  async fetchBestSellers(options = {}) {
    const { category = 'all', limit = 20 } = options;
    try {
      const live = await this.searchProducts(category === 'all' ? 'best sellers' : ('best sellers ' + category), { limit });
      if (live.length) return live;
      return this.normalizeData(this.getMockBestSellers(limit));
    } catch (error) {
      console.error('Shopify fetchBestSellers error:', error.message);
      return filterRankCuratedCatalog('shopify', category === 'all' ? '' : category, limit);
    }
  }

  async fetchClickAnalytics() {
    return this.getMockAnalytics();
  }

  normalizeData(data) {
    return Array.isArray(data) ? data.map(item => ({
      id: item.id,
      title: item.title,
      price: parseFloat((item.variants && item.variants[0] && item.variants[0].price) || item.price || 0) || 0,
      originalPrice: parseFloat((item.variants && item.variants[0] && item.variants[0].compare_at_price) || item.originalPrice || (item.variants && item.variants[0] && item.variants[0].price) || item.price || 0) || 0,
      rating: item.rating || 4.5,
      reviews: item.reviewCount || item.reviews || 0,
      image: (item.image && item.image.src) || (item.featured_image && item.featured_image.src) || item.image,
      availability: item.status === 'active' || !item.status ? 'In Stock' : 'Out of Stock',
      category: item.product_type || item.category,
      retailer: 'shopify',
      link: item.link || '',
      brand: item.vendor || item.brand || '',
      normalizedAt: new Date()
    })) : data;
  }

  generateAffiliateUrl(productId, affiliateId) {
    const base = 'https://store.shopify.com/products/' + productId;
    return affiliateId ? (base + '?ref=' + affiliateId) : base;
  }

  getMockBestSellers(limit) {
    return filterRankCuratedCatalog('shopify', '', limit).map((item) => ({
      id: item.id,
      title: item.title,
      variants: [{ price: item.price, compare_at_price: item.originalPrice }],
      image: { src: item.image },
      status: 'active',
      product_type: item.category,
      rating: item.rating,
      reviewCount: item.reviews
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

  async searchProducts(query, options = {}) {
    const { limit = 20, apiKey, apiBaseUrl } = options;
    const q = String(query || '').trim();
    if (!q) return filterRankCuratedCatalog('skimlinks', '', limit);

    const skimKey = pickUsableProviderKey(apiKey, this.apiKey);
    const skimUrl = apiBaseUrl || this.apiBaseUrl;

    if (skimKey && skimUrl && /skimlinks|partnerize/i.test(String(skimUrl))) {
      try {
        const response = await axios.get(String(skimUrl).replace(/\/$/, '') + '/v1/products', {
          params: { q, limit, sort: 'popularity' },
          headers: { Authorization: 'Bearer ' + skimKey },
          timeout: this.service.config.requestTimeout
        });
        const raw = response.data != null ? response.data : response;
        const toNormalize = Array.isArray(raw) ? raw : (raw.products || []);
        const normalized = this.normalizeData(Array.isArray(toNormalize) ? toNormalize : []);
        if (normalized.length) {
          return normalized
            .map((p, i) => Object.assign({}, p, { performanceScore: scoreProductPerformance(p, i) }))
            .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
            .slice(0, limit);
        }
      } catch (err) {
        console.warn('Skimlinks API search unavailable, trying platform catalog:', err.message);
      }
    }

    try {
      const shopping = await searchGoogleShoppingAsRetailer('skimlinks', q, {
        apiKey: pickUsableProviderKey(apiKey, process.env.SEARCHAPI_API_KEY),
        apiBaseUrl: DEFAULT_PROVIDER_API_URL,
        limit,
        timeout: this.service.config.requestTimeout
      });
      if (Array.isArray(shopping) && shopping.length) {
        return shopping
          .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
          .slice(0, limit);
      }
    } catch (err) {
      console.warn('Skimlinks shopping search fallback:', err.message);
    }

    return filterRankCuratedCatalog('skimlinks', q, limit);
  }

  async fetchBestSellers(options = {}) {
    const { category = 'all', limit = 20 } = options;
    try {
      const live = await this.searchProducts(category === 'all' ? 'best sellers' : ('best sellers ' + category), { limit });
      if (live.length) return live;
      return this.normalizeData(this.getMockBestSellers(limit));
    } catch (error) {
      console.error('Skimlinks fetchBestSellers error:', error.message);
      return filterRankCuratedCatalog('skimlinks', category === 'all' ? '' : category, limit);
    }
  }

  async fetchClickAnalytics() {
    return this.getMockAnalytics();
  }

  normalizeData(data) {
    return Array.isArray(data) ? data.map(item => ({
      id: item.productId || item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.originalPrice,
      rating: item.rating,
      reviews: item.reviewCount || item.reviews,
      image: item.image || item.thumbnail || item.imageUrl,
      availability: item.availability || (item.available === false ? 'Out of Stock' : 'In Stock'),
      category: item.category,
      retailer: 'skimlinks',
      link: item.link || item.url || '',
      brand: item.brand || item.merchant || '',
      normalizedAt: new Date()
    })) : data;
  }

  generateAffiliateUrl(productId, affiliateId) {
    if (affiliateId) {
      return 'https://go.skimresources.com/?id=' + encodeURIComponent(affiliateId) + '&url=' + encodeURIComponent(String(productId));
    }
    return 'https://skimlinks.com/redirect/' + productId;
  }

  getMockBestSellers(limit) {
    return filterRankCuratedCatalog('skimlinks', '', limit);
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
  SkimlinksRetailer,
  collectProviderSearchResults,
  resolveRetailerSearchCredentials,
  buildRetailerSearchOptions,
  normalizeAmazonSortBy,
  buildAmazonSearchParams,
  normalizeEbaySortBy,
  buildEbaySearchParams,
  normalizeWalmartSortBy,
  buildWalmartSearchParams,
  PLATFORM_PRODUCT_RETAILERS,
  wantsTopPerformingSort,
  scoreProductPerformance,
  filterRankCuratedCatalog,
  getPlatformCuratedCatalog
};
