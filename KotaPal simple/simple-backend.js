// Simple backend without complex dependencies
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simple JSON file database
const DATA_PATH = path.join(__dirname, 'data.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_PATH)) {
    const seed = {
      users: [
        {
          id: 'user_123',
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password123', // Simple password for demo
          plan: 'pro',
          createdAt: '2024-01-15',
          affiliateIds: { amazon: 'john-20', walmart: 'walmart-123', shopify: 'shopify-store', skimlinks: 'skim-456' }
        }
      ],
      blocks: [
        {
          id: 'blk_1',
          userId: 'user_123',
          title: 'Best Headphones 2024',
          layout: 'grid',
          ctaText: 'Buy Now',
          products: 3,
          clicks: 1247,
          revenue: 89.42,
          ctr: 3.2,
          lastUpdated: '2024-05-15',
          status: 'active',
          retailer: 'amazon',
          productsList: [
            { id: 'amz_1', title: 'Sony WH-1000XM5', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80', price: 299.99 },
            { id: 'amz_2', title: 'Bose QuietComfort 45', image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=500&q=80', price: 279.99 },
            { id: 'amz_3', title: 'Apple AirPods Max', image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&w=500&q=80', price: 549.0 }
          ]
        }
      ],
      integrations: [
        { id: 'amazon', userId: 'user_123', name: 'Amazon Associates', status: 'connected', lastSync: '2 hours ago', affiliateId: 'john-20' },
        { id: 'walmart', userId: 'user_123', name: 'Walmart Affiliate', status: 'connected', lastSync: '1 day ago', affiliateId: 'walmart-123' },
        { id: 'shopify', userId: 'user_123', name: 'Shopify Partner', status: 'disconnected', lastSync: 'Never', affiliateId: '' },
        { id: 'skimlinks', userId: 'user_123', name: 'Skimlinks', status: 'connected', lastSync: '3 hours ago', affiliateId: 'skim-456' }
      ],
      clicks: []
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(seed, null, 2), 'utf8');
  }
}

function loadData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Simple password hash (for demo only)
function simpleHash(password) {
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password, hash) {
  return simpleHash(password) === hash;
}

// Simple JWT-like token (for demo only)
function createToken(user) {
  const payload = { id: user.id, email: user.email, name: user.name };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
  // Handle test token for development
  if (token === 'test-token') {
    return { id: 'test-user', email: 'test@example.com' };
  }
  
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

// Retailer API Integration Functions
async function getProductPerformanceData(retailer, productIds) {
  const productIdsArray = productIds ? productIds.split(',') : [];
  
  switch (retailer) {
    case 'amazon':
      return await getAmazonProductData(productIdsArray);
    case 'shopify':
      return await getShopifyProductData(productIdsArray);
    case 'walmart':
      return await getWalmartProductData(productIdsArray);
    case 'skimlinks':
      return await getSkimlinksProductData(productIdsArray);
    default:
      throw new Error('Unsupported retailer');
  }
}

// Amazon Product Advertising API
async function getAmazonProductData(productIds) {
  // In a real implementation, you would use the Amazon Product Advertising API
  // For now, we'll simulate realistic data based on actual Amazon performance patterns
  const mockData = {
    retailer: 'amazon',
    products: productIds.map((id, index) => ({
      id: id,
      title: `Amazon Product ${index + 1}`,
      price: Math.random() * 500 + 50,
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      reviewCount: Math.floor(Math.random() * 1000) + 100,
      salesRank: Math.floor(Math.random() * 10000) + 1,
      conversionRate: (Math.random() * 5 + 2).toFixed(2), // 2-7%
      clickThroughRate: (Math.random() * 3 + 1).toFixed(2), // 1-4%
      revenue: Math.random() * 1000 + 100,
      lastUpdated: new Date().toISOString()
    })),
    summary: {
      totalProducts: productIds.length,
      avgConversionRate: '4.2%',
      avgClickThroughRate: '2.8%',
      totalRevenue: productIds.length * 500,
      topPerformer: productIds[0] || 'N/A'
    }
  };
  
  return mockData;
}

// Shopify API
async function getShopifyProductData(productIds) {
  // In a real implementation, you would use the Shopify Admin API
  const mockData = {
    retailer: 'shopify',
    products: productIds.map((id, index) => ({
      id: id,
      title: `Shopify Product ${index + 1}`,
      price: Math.random() * 300 + 25,
      inventory: Math.floor(Math.random() * 100) + 10,
      views: Math.floor(Math.random() * 5000) + 500,
      orders: Math.floor(Math.random() * 200) + 20,
      conversionRate: (Math.random() * 4 + 1).toFixed(2), // 1-5%
      revenue: Math.random() * 800 + 50,
      lastUpdated: new Date().toISOString()
    })),
    summary: {
      totalProducts: productIds.length,
      avgConversionRate: '3.1%',
      totalViews: productIds.length * 2500,
      totalOrders: productIds.length * 100,
      totalRevenue: productIds.length * 400
    }
  };
  
  return mockData;
}

// Walmart API
async function getWalmartProductData(productIds) {
  // In a real implementation, you would use the Walmart Open API
  const mockData = {
    retailer: 'walmart',
    products: productIds.map((id, index) => ({
      id: id,
      title: `Walmart Product ${index + 1}`,
      price: Math.random() * 200 + 20,
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      reviewCount: Math.floor(Math.random() * 500) + 50,
      availability: Math.random() > 0.2 ? 'In Stock' : 'Limited Stock',
      conversionRate: (Math.random() * 3 + 1.5).toFixed(2), // 1.5-4.5%
      clickThroughRate: (Math.random() * 2.5 + 0.8).toFixed(2), // 0.8-3.3%
      revenue: Math.random() * 600 + 75,
      lastUpdated: new Date().toISOString()
    })),
    summary: {
      totalProducts: productIds.length,
      avgConversionRate: '2.8%',
      avgClickThroughRate: '2.1%',
      totalRevenue: productIds.length * 300,
      inStockRate: '85%'
    }
  };
  
  return mockData;
}

// Skimlinks API
async function getSkimlinksProductData(productIds) {
  // In a real implementation, you would use the Skimlinks API
  const mockData = {
    retailer: 'skimlinks',
    products: productIds.map((id, index) => ({
      id: id,
      title: `Skimlinks Product ${index + 1}`,
      price: Math.random() * 400 + 30,
      clicks: Math.floor(Math.random() * 1000) + 100,
      conversions: Math.floor(Math.random() * 50) + 5,
      commission: Math.random() * 20 + 2, // 2-22%
      conversionRate: (Math.random() * 6 + 2).toFixed(2), // 2-8%
      clickThroughRate: (Math.random() * 4 + 1).toFixed(2), // 1-5%
      revenue: Math.random() * 1200 + 150,
      lastUpdated: new Date().toISOString()
    })),
    summary: {
      totalProducts: productIds.length,
      avgConversionRate: '4.5%',
      avgClickThroughRate: '3.2%',
      totalClicks: productIds.length * 500,
      totalConversions: productIds.length * 25,
      totalRevenue: productIds.length * 600,
      avgCommission: '12.5%'
    }
  };
  
  return mockData;
}

// Search products across retailers
async function searchRetailerProducts(retailer, query) {
  // In a real implementation, you would call the actual retailer APIs
  // For now, we'll simulate realistic search results based on the retailer
  
  const baseProducts = [
    {
      id: `${retailer}_${Date.now()}_1`,
      title: `${retailer.charAt(0).toUpperCase() + retailer.slice(1)} ${query} - Premium Model`,
      price: Math.random() * 200 + 50,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
      retailer: retailer,
      rating: (Math.random() * 2 + 3).toFixed(1),
      availability: 'In Stock',
      performance: {
        conversionRate: (Math.random() * 5 + 2).toFixed(2),
        clickThroughRate: (Math.random() * 3 + 1).toFixed(2),
        revenue: Math.random() * 1000 + 100
      }
    },
    {
      id: `${retailer}_${Date.now()}_2`,
      title: `${retailer.charAt(0).toUpperCase() + retailer.slice(1)} ${query} - Standard Model`,
      price: Math.random() * 150 + 30,
      image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=500&q=80',
      retailer: retailer,
      rating: (Math.random() * 2 + 3).toFixed(1),
      availability: 'In Stock',
      performance: {
        conversionRate: (Math.random() * 4 + 1.5).toFixed(2),
        clickThroughRate: (Math.random() * 2.5 + 0.8).toFixed(2),
        revenue: Math.random() * 800 + 75
      }
    },
    {
      id: `${retailer}_${Date.now()}_3`,
      title: `${retailer.charAt(0).toUpperCase() + retailer.slice(1)} ${query} - Budget Model`,
      price: Math.random() * 100 + 20,
      image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&w=500&q=80',
      retailer: retailer,
      rating: (Math.random() * 2 + 3).toFixed(1),
      availability: Math.random() > 0.1 ? 'In Stock' : 'Limited Stock',
      performance: {
        conversionRate: (Math.random() * 3 + 1).toFixed(2),
        clickThroughRate: (Math.random() * 2 + 0.5).toFixed(2),
        revenue: Math.random() * 600 + 50
      }
    }
  ];

  // Add retailer-specific data
  return baseProducts.map(product => {
    switch (retailer) {
      case 'amazon':
        return {
          ...product,
          salesRank: Math.floor(Math.random() * 10000) + 1,
          reviewCount: Math.floor(Math.random() * 1000) + 100,
          primeEligible: Math.random() > 0.3
        };
      case 'shopify':
        return {
          ...product,
          inventory: Math.floor(Math.random() * 100) + 10,
          views: Math.floor(Math.random() * 5000) + 500,
          orders: Math.floor(Math.random() * 200) + 20
        };
      case 'walmart':
        return {
          ...product,
          reviewCount: Math.floor(Math.random() * 500) + 50,
          pickupAvailable: Math.random() > 0.2,
          deliveryAvailable: Math.random() > 0.1
        };
      case 'skimlinks':
        return {
          ...product,
          commission: (Math.random() * 20 + 2).toFixed(1),
          clicks: Math.floor(Math.random() * 1000) + 100,
          conversions: Math.floor(Math.random() * 50) + 5
        };
      default:
        return product;
    }
  });
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  
  console.log('Request:', method, pathname, parsedUrl.query);

  // Health check
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'KOTA PAL API is running' }));
    return;
  }

  // Serve static files
  if (pathname === '/dashboard' || pathname === '/dashboard.html') {
    const filePath = path.join(__dirname, 'dashboard.html');
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(filePath, 'utf8'));
      return;
    }
  }

  if (pathname === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(filePath, 'utf8'));
      return;
    }
  }

  // API routes
  if (pathname.startsWith('/api/')) {
    // Handle GET requests immediately (no body to read)
    if (method === 'GET') {
      (async () => {
        try {
        const data = loadData();
        let response = {};
        
        // Handle GET routes here
        if (pathname === '/api/products/search' && method === 'GET') {
          console.log('Product search endpoint hit');
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access token required' }));
            return;
          }

          const payload = verifyToken(token);
          if (!payload) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
          }

          const { retailer, query } = parsedUrl.query;
          
          try {
            console.log('Searching products for retailer:', retailer, 'query:', query);
            const searchResults = await searchRetailerProducts(retailer, query);
            console.log('Search results:', searchResults);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(searchResults));
            return;
          } catch (error) {
            console.error('Search error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to search products' }));
            return;
          }
        }
        
        // Add other GET routes here...
        
        // If no GET route matched, return empty response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
        return;
        
      } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
        return;
        }
      })();
      return;
    }
    
    // Handle POST/PUT/DELETE requests (need to read body)
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = loadData();
        let response = {};

        // User registration
        if (pathname === '/api/auth/register' && method === 'POST') {
          const { name, email, password, website, plan = 'starter' } = JSON.parse(body);
          
          // Check if user exists
          const existingUser = data.users.find(u => u.email === email);
          if (existingUser) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User with this email already exists' }));
            return;
          }

          // Create new user
          const newUser = {
            id: 'user_' + Date.now(),
            name,
            email,
            password: simpleHash(password),
            website: website || '',
            plan,
            createdAt: new Date().toISOString().split('T')[0],
            affiliateIds: {}
          };

          data.users.push(newUser);
          saveData(data);

          const token = createToken(newUser);
          const { password: pwd, ...userWithoutPassword } = newUser;
          const redirectPage = plan === 'pro' ? 'analytics' : (plan === 'creatorplus' ? 'integrations' : 'dashboard');
          
          response = {
            user: userWithoutPassword,
            token,
            redirectPage
          };
        }

        // User login
        else if (pathname === '/api/auth/login' && method === 'POST') {
          const { email, password } = JSON.parse(body);
          
          const user = data.users.find(u => u.email === email);
          if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No account found with this email address' }));
            return;
          }
          
          if (!verifyPassword(password, user.password)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Incorrect password for this email address' }));
            return;
          }

          const token = createToken(user);
          const { password: pwd, ...userWithoutPassword } = user;
          const redirectPage = user.plan === 'pro' ? 'analytics' : (user.plan === 'creatorplus' ? 'integrations' : (user.plan === 'agency' ? 'integrations' : 'dashboard'));
          
          response = {
            user: userWithoutPassword,
            token,
            redirectPage
          };
        }

        // Get user profile
        else if (pathname === '/api/user/profile' && method === 'GET') {
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access token required' }));
            return;
          }

          const payload = verifyToken(token);
          if (!payload) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
          }

          const user = data.users.find(u => u.id === payload.id);
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }

          const { password, ...userWithoutPassword } = user;
          response = userWithoutPassword;
        }

        // Get user blocks
        else if (pathname === '/api/blocks' && method === 'GET') {
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access token required' }));
            return;
          }

          const payload = verifyToken(token);
          if (!payload) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
          }

          const userBlocks = data.blocks.filter(b => b.userId === payload.id);
          response = userBlocks;
        }

        // Get user integrations
        else if (pathname === '/api/integrations' && method === 'GET') {
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access token required' }));
            return;
          }

          const payload = verifyToken(token);
          if (!payload) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
          }

          const userIntegrations = data.integrations.filter(i => i.userId === payload.id);
          response = userIntegrations;
        }

        // Get analytics
        else if (pathname === '/api/analytics' && method === 'GET') {
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access token required' }));
            return;
          }

          const payload = verifyToken(token);
          if (!payload) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
          }

          const userBlocks = data.blocks.filter(b => b.userId === payload.id);
          const totalClicks = userBlocks.reduce((sum, block) => sum + block.clicks, 0);
          const totalRevenue = userBlocks.reduce((sum, block) => sum + block.revenue, 0);
          const avgCTR = userBlocks.length > 0 ? (userBlocks.reduce((sum, block) => sum + block.ctr, 0) / userBlocks.length) : 0;
          const blocksCount = userBlocks.length;

          response = {
            totalClicks,
            totalRevenue,
            avgCTR: parseFloat(avgCTR.toFixed(2)),
            blocksCount,
            topBlock: userBlocks.length > 0 ? userBlocks[0].title : '',
            topProduct: userBlocks.length > 0 && userBlocks[0].productsList.length > 0 ? userBlocks[0].productsList[0].title : ''
          };
        }

        // Get product performance data from retailer APIs
        else if (pathname === '/api/products/performance' && method === 'GET') {
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access token required' }));
            return;
          }

          const payload = verifyToken(token);
          if (!payload) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
          }

          const { retailer, productIds } = parsedUrl.query;
          
          try {
            const performanceData = await getProductPerformanceData(retailer, productIds);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(performanceData));
            return;
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch performance data' }));
            return;
          }
        }

        // Get product search
        else if (pathname === '/api/products/search' && method === 'GET') {
          console.log('Product search endpoint hit');
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access token required' }));
            return;
          }

          const payload = verifyToken(token);
          if (!payload) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
          }

          const { retailer, query } = parsedUrl.query;
          
          try {
            console.log('Searching products for retailer:', retailer, 'query:', query);
            const searchResults = await searchRetailerProducts(retailer, query);
            console.log('Search results:', searchResults);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(searchResults));
            return;
          } catch (error) {
            console.error('Search error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to search products' }));
            return;
          }
        }

        // Get alerts
        else if (pathname === '/api/alerts' && method === 'GET') {
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.split(' ')[1];
          
          if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access token required' }));
            return;
          }

          const payload = verifyToken(token);
          if (!payload) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
            return;
          }

          const userBlocks = data.blocks.filter(b => b.userId === payload.id);
          const alerts = [];
          
          // Add low CTR alert for blocks with CTR < 2
          const lowCtrBlocks = userBlocks.filter(b => b.ctr < 2 && b.clicks > 10);
          lowCtrBlocks.forEach(block => {
            alerts.push({
              id: `alert_lowctr_${block.id}`,
              type: 'warning',
              title: 'Low Converting Block',
              message: `Your "${block.title}" block has a low CTR of ${block.ctr}%. Consider updating the product selection or CTA text.`,
              timestamp: new Date().toISOString()
            });
          });
          
          response = alerts;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));

      } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`KOTA PAL API server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
