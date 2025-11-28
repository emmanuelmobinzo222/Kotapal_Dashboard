// Enhanced JSON file database for persistence
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'data.json');

function ensureDataFile() {
  // Ensure data directory exists
  const dataDir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DATA_PATH)) {
    const seed = {
      users: [
        {
          id: 'user_123',
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          plan: 'pro',
          createdAt: '2024-01-15',
          affiliateIds: { 
            amazon: 'john-20', 
            walmart: 'walmart-123', 
            shopify: 'shopify-store', 
            skimlinks: 'skim-456' 
          },
          settings: {
            notifications: true,
            theme: 'light'
          }
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
          customCSS: '',
          customJS: '',
          embedCode: '',
          createdAt: '2024-05-15',
          productsList: [
            { 
              id: 'amz_1', 
              title: 'Sony WH-1000XM5', 
              image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80', 
              price: 299.99,
              retailer: 'amazon',
              asin: 'B09XYZ1234'
            },
            { 
              id: 'amz_2', 
              title: 'Bose QuietComfort 45', 
              image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=500&q=80', 
              price: 279.99,
              retailer: 'amazon',
              asin: 'B08XYZ5678'
            },
            { 
              id: 'amz_3', 
              title: 'Apple AirPods Max', 
              image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&w=500&q=80', 
              price: 549.0,
              retailer: 'amazon',
              asin: 'B09XYZ9012'
            }
          ]
        }
      ],
      integrations: [
        { 
          id: 'amazon', 
          userId: 'user_123', 
          name: 'Amazon Associates', 
          status: 'connected', 
          lastSync: '2 hours ago', 
          affiliateId: 'john-20',
          apiKey: '',
          secretKey: ''
        },
        { 
          id: 'walmart', 
          userId: 'user_123', 
          name: 'Walmart Affiliate', 
          status: 'connected', 
          lastSync: '1 day ago', 
          affiliateId: 'walmart-123',
          apiKey: '',
          secretKey: ''
        },
        { 
          id: 'shopify', 
          userId: 'user_123', 
          name: 'Shopify Partner', 
          status: 'disconnected', 
          lastSync: 'Never', 
          affiliateId: '',
          apiKey: '',
          secretKey: ''
        },
        { 
          id: 'skimlinks', 
          userId: 'user_123', 
          name: 'Skimlinks', 
          status: 'connected', 
          lastSync: '3 hours ago', 
          affiliateId: 'skim-456',
          apiKey: '',
          secretKey: ''
        }
      ],
      clicks: [],
      analytics: {
        dailyMetrics: {},
        userStats: {}
      }
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(seed, null, 2), 'utf8');
  }
}

function load() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  state = JSON.parse(raw);
}

function save() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), 'utf8');
}

let state = { users: [], blocks: [], integrations: [], clicks: [], analytics: { dailyMetrics: {}, userStats: {} } };
load();

module.exports = {
  state,
  load,
  save,
  ensureDataFile,
  DATA_PATH
};
