// Affiliate API integrations for Amazon, Walmart, Shopify, and Skimlinks
const axios = require('axios');

class AffiliateAPIs {
  constructor() {
    this.amazonConfig = {
      baseUrl: 'https://webservices.amazon.com/paapi5',
      accessKey: process.env.AMAZON_ACCESS_KEY,
      secretKey: process.env.AMAZON_SECRET_KEY,
      partnerTag: process.env.AMAZON_PARTNER_TAG,
      marketplace: 'www.amazon.com'
    };
    
    this.walmartConfig = {
      baseUrl: 'https://developer.api.walmartlabs.com/v1',
      apiKey: process.env.WALMART_API_KEY
    };
    
    this.shopifyConfig = {
      baseUrl: process.env.SHOPIFY_STORE_URL,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN
    };
    
    this.skimlinksConfig = {
      baseUrl: 'https://api.skimlinks.com',
      apiKey: process.env.SKIMLINKS_API_KEY
    };
  }

  // Amazon Product Advertising API
  async searchAmazonProducts(query, options = {}) {
    try {
      const params = {
        Keywords: query,
        SearchIndex: options.category || 'All',
        ItemCount: Math.min(options.limit || 10, 10),
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'Offers.Listings.Price',
          'Offers.Listings.Availability',
          'CustomerReviews.StarRating',
          'CustomerReviews.Count'
        ]
      };

      // Mock implementation for demo - replace with actual Amazon PA API
      return this.mockAmazonProducts(query, options);
    } catch (error) {
      console.error('Amazon API error:', error);
      throw new Error('Failed to search Amazon products');
    }
  }

  async getAmazonProductDetails(asin) {
    try {
      // Mock implementation - replace with actual Amazon PA API
      return this.mockAmazonProductDetails(asin);
    } catch (error) {
      console.error('Amazon product details error:', error);
      throw new Error('Failed to get Amazon product details');
    }
  }

  // Walmart Open API
  async searchWalmartProducts(query, options = {}) {
    try {
      const response = await axios.get(`${this.walmartConfig.baseUrl}/search`, {
        params: {
          query,
          apiKey: this.walmartConfig.apiKey,
          format: 'json',
          numItems: Math.min(options.limit || 10, 25)
        }
      });

      return response.data.items.map(item => ({
        id: `wlm_${item.itemId}`,
        title: item.name,
        image: item.mediumImage,
        price: item.salePrice || item.msrp,
        originalPrice: item.msrp,
        rating: item.customerRating,
        reviews: item.numReviews,
        availability: item.availableOnline ? 'In Stock' : 'Out of Stock',
        itemId: item.itemId,
        category: item.categoryPath,
        retailer: 'walmart',
        url: item.productUrl
      }));
    } catch (error) {
      console.error('Walmart API error:', error);
      // Fallback to mock data
      return this.mockWalmartProducts(query, options);
    }
  }

  async getWalmartProductDetails(itemId) {
    try {
      const response = await axios.get(`${this.walmartConfig.baseUrl}/items/${itemId}`, {
        params: {
          apiKey: this.walmartConfig.apiKey,
          format: 'json'
        }
      });

      const item = response.data;
      return {
        id: `wlm_${item.itemId}`,
        title: item.name,
        image: item.largeImage,
        price: item.salePrice || item.msrp,
        originalPrice: item.msrp,
        rating: item.customerRating,
        reviews: item.numReviews,
        availability: item.availableOnline ? 'In Stock' : 'Out of Stock',
        itemId: item.itemId,
        category: item.categoryPath,
        retailer: 'walmart',
        url: item.productUrl
      };
    } catch (error) {
      console.error('Walmart product details error:', error);
      throw new Error('Failed to get Walmart product details');
    }
  }

  // Shopify Storefront API
  async searchShopifyProducts(query, options = {}) {
    try {
      const response = await axios.post(`${this.shopifyConfig.baseUrl}/admin/api/2023-10/graphql.json`, {
        query: `
          query searchProducts($query: String!, $first: Int!) {
            products(first: $first, query: $query) {
              edges {
                node {
                  id
                  title
                  handle
                  images(first: 1) {
                    edges {
                      node {
                        url
                      }
                    }
                  }
                  variants(first: 1) {
                    edges {
                      node {
                        price
                        compareAtPrice
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          query,
          first: Math.min(options.limit || 10, 50)
        }
      }, {
        headers: {
          'X-Shopify-Access-Token': this.shopifyConfig.accessToken,
          'Content-Type': 'application/json'
        }
      });

      return response.data.data.products.edges.map(edge => {
        const product = edge.node;
        const variant = product.variants.edges[0]?.node;
        const image = product.images.edges[0]?.node;
        
        return {
          id: `shp_${product.id.split('/').pop()}`,
          title: product.title,
          image: image?.url || '',
          price: parseFloat(variant?.price || 0),
          originalPrice: parseFloat(variant?.compareAtPrice || 0),
          rating: 4.5, // Default rating
          reviews: 0,
          availability: 'In Stock',
          productId: product.id.split('/').pop(),
          category: 'General',
          retailer: 'shopify',
          url: `${this.shopifyConfig.baseUrl}/products/${product.handle}`
        };
      });
    } catch (error) {
      console.error('Shopify API error:', error);
      // Fallback to mock data
      return this.mockShopifyProducts(query, options);
    }
  }

  async getShopifyProductDetails(productId) {
    try {
      const response = await axios.post(`${this.shopifyConfig.baseUrl}/admin/api/2023-10/graphql.json`, {
        query: `
          query getProduct($id: ID!) {
            product(id: $id) {
              id
              title
              handle
              images(first: 5) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    compareAtPrice
                    availableForSale
                  }
                }
              }
            }
          }
        `,
        variables: {
          id: `gid://shopify/Product/${productId}`
        }
      }, {
        headers: {
          'X-Shopify-Access-Token': this.shopifyConfig.accessToken,
          'Content-Type': 'application/json'
        }
      });

      const product = response.data.data.product;
      const variant = product.variants.edges[0]?.node;
      const image = product.images.edges[0]?.node;
      
      return {
        id: `shp_${productId}`,
        title: product.title,
        image: image?.url || '',
        price: parseFloat(variant?.price || 0),
        originalPrice: parseFloat(variant?.compareAtPrice || 0),
        rating: 4.5,
        reviews: 0,
        availability: variant?.availableForSale ? 'In Stock' : 'Out of Stock',
        productId,
        category: 'General',
        retailer: 'shopify',
        url: `${this.shopifyConfig.baseUrl}/products/${product.handle}`
      };
    } catch (error) {
      console.error('Shopify product details error:', error);
      throw new Error('Failed to get Shopify product details');
    }
  }

  // Skimlinks API
  async searchSkimlinksProducts(query, options = {}) {
    try {
      const response = await axios.get(`${this.skimlinksConfig.baseUrl}/merchants`, {
        params: {
          q: query,
          limit: Math.min(options.limit || 10, 50)
        },
        headers: {
          'Authorization': `Bearer ${this.skimlinksConfig.apiKey}`
        }
      });

      return response.data.merchants.map(merchant => ({
        id: `skm_${merchant.id}`,
        title: merchant.name,
        image: merchant.logo,
        price: 0, // Price not available in merchant search
        originalPrice: 0,
        rating: 4.0,
        reviews: 0,
        availability: 'Available',
        productId: merchant.id,
        category: merchant.category,
        retailer: 'skimlinks',
        url: merchant.url
      }));
    } catch (error) {
      console.error('Skimlinks API error:', error);
      // Fallback to mock data
      return this.mockSkimlinksProducts(query, options);
    }
  }

  async getSkimlinksProductDetails(productId) {
    try {
      // Mock implementation - replace with actual Skimlinks API
      const productIdClean = productId.replace('skm_', '');
      return {
        id: `skm_${productIdClean}`,
        title: 'Skimlinks Product',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c25lYWtlcnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
        price: 0,
        originalPrice: 0,
        rating: 4.0,
        reviews: 0,
        availability: 'Available',
        productId: productIdClean,
        category: 'General',
        retailer: 'skimlinks',
        url: `https://skimlinks.com/product/${productIdClean}`
      };
    } catch (error) {
      console.error('Skimlinks product details error:', error);
      throw new Error('Failed to get Skimlinks product details');
    }
  }

  // Generate affiliate URLs
  async generateAffiliateUrl(retailer, productId, affiliateId) {
    switch (retailer) {
      case 'amazon':
        const asin = productId.split('_')[1];
        return `https://www.amazon.com/dp/${asin}?tag=${affiliateId}`;
      
      case 'walmart':
        const walmartId = productId.split('_')[1];
        return `https://www.walmart.com/ip/${walmartId}?affid=${affiliateId}`;
      
      case 'shopify':
        const shopifyId = productId.split('_')[1];
        return `https://store.shopify.com/products/${shopifyId}?ref=${affiliateId}`;
      
      case 'skimlinks':
        return `https://skimlinks.com/redirect/${productId}?affid=${affiliateId}`;
      
      default:
        return '#';
    }
  }

  // Unified search method
  async searchProducts(retailer, query, options = {}) {
    switch (retailer) {
      case 'amazon':
        return await this.searchAmazonProducts(query, options);
      case 'walmart':
        return await this.searchWalmartProducts(query, options);
      case 'shopify':
        return await this.searchShopifyProducts(query, options);
      case 'skimlinks':
        return await this.searchSkimlinksProducts(query, options);
      default:
        throw new Error('Unsupported retailer');
    }
  }

  async getProductDetails(retailer, productId) {
    switch (retailer) {
      case 'amazon':
        return await this.getAmazonProductDetails(productId);
      case 'walmart':
        return await this.getWalmartProductDetails(productId);
      case 'shopify':
        return await this.getShopifyProductDetails(productId);
      case 'skimlinks':
        return await this.getSkimlinksProductDetails(productId);
      default:
        throw new Error('Unsupported retailer');
    }
  }

  // Mock data for development/demo
  mockAmazonProducts(query, options = {}) {
    const products = [
      {
        id: 'amz_1',
        title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
        price: 299.99,
        originalPrice: 349.99,
        rating: 4.8,
        reviews: 12478,
        availability: 'In Stock',
        asin: 'B09XYZ1234',
        category: 'Electronics',
        retailer: 'amazon'
      },
      {
        id: 'amz_2',
        title: 'Bose QuietComfort 45 Headphones',
        image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGhlYWRwaG9uZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
        price: 279.99,
        originalPrice: 329.99,
        rating: 4.7,
        reviews: 8923,
        availability: 'In Stock',
        asin: 'B08XYZ5678',
        category: 'Electronics',
        retailer: 'amazon'
      },
      {
        id: 'amz_3',
        title: 'Apple AirPods Max',
        image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGhlYWRwaG9uZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
        price: 549.00,
        originalPrice: 549.00,
        rating: 4.6,
        reviews: 6789,
        availability: 'In Stock',
        asin: 'B09XYZ9012',
        category: 'Electronics',
        retailer: 'amazon'
      }
    ];

    return products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
  }

  mockWalmartProducts(query, options = {}) {
    const products = [
      {
        id: 'wlm_1',
        title: 'Samsung 55" Class Crystal UHD TU-8000 Series',
        image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHR2fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80',
        price: 499.99,
        originalPrice: 599.99,
        rating: 4.5,
        reviews: 3456,
        availability: 'In Stock',
        itemId: '123456789',
        category: 'TV & Home Theater',
        retailer: 'walmart'
      },
      {
        id: 'wlm_2',
        title: 'Dyson V11 Cordless Vacuum Cleaner',
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dmFjdXVtfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80',
        price: 599.00,
        originalPrice: 699.00,
        rating: 4.7,
        reviews: 2345,
        availability: 'In Stock',
        itemId: '987654321',
        category: 'Home & Kitchen',
        retailer: 'walmart'
      }
    ];

    return products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
  }

  mockShopifyProducts(query, options = {}) {
    const products = [
      {
        id: 'shp_1',
        title: 'Premium Yoga Mat - Eco Friendly',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8eW9nYSUyMG1hdHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
        price: 49.99,
        originalPrice: 69.99,
        rating: 4.9,
        reviews: 1234,
        availability: 'In Stock',
        productId: 'prod_123',
        category: 'Fitness',
        retailer: 'shopify'
      },
      {
        id: 'shp_2',
        title: 'Organic Cotton T-Shirt - Unisex',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dCUyMHNoaXJ0fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=80',
        price: 29.99,
        originalPrice: 39.99,
        rating: 4.6,
        reviews: 890,
        availability: 'In Stock',
        productId: 'prod_456',
        category: 'Clothing',
        retailer: 'shopify'
      }
    ];

    return products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
  }

  mockSkimlinksProducts(query, options = {}) {
    const products = [
      {
        id: 'skm_1',
        title: 'Nike Air Max 270',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c25lYWtlcnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=80',
        price: 150.00,
        originalPrice: 160.00,
        rating: 4.5,
        reviews: 4567,
        availability: 'In Stock',
        productId: 'nike_123',
        category: 'Footwear',
        retailer: 'skimlinks'
      },
      {
        id: 'skm_2',
        title: 'Instant Pot Duo 7-in-1',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW5zdGFudCUyMHBvdHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
        price: 89.99,
        originalPrice: 99.99,
        rating: 4.8,
        reviews: 15678,
        availability: 'In Stock',
        productId: 'ip_456',
        category: 'Kitchen',
        retailer: 'skimlinks'
      }
    ];

    return products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
  }

  mockAmazonProductDetails(asin) {
    return {
      id: `amz_${asin}`,
      title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=80',
      price: 299.99,
      originalPrice: 349.99,
      rating: 4.8,
      reviews: 12478,
      availability: 'In Stock',
      asin,
      category: 'Electronics',
      retailer: 'amazon',
      description: 'Industry-leading noise canceling with Dual Noise Sensor technology',
      features: [
        '30-hour battery life',
        'Quick charge (3 min charge = 3 hours of playback)',
        'Speak-to-Chat technology',
        'Multipoint connection'
      ]
    };
  }
}

module.exports = new AffiliateAPIs();
