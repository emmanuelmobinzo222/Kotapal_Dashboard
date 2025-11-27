// Simple JSON file database for persistence
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data.json');

function ensureDataFile() {
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
        },
        {
          id: 'blk_2',
          userId: 'user_123',
          title: 'Top Smart TVs',
          layout: 'carousel',
          ctaText: 'Check Price',
          products: 2,
          clicks: 892,
          revenue: 67.85,
          ctr: 2.8,
          lastUpdated: '2024-05-14',
          status: 'active',
          retailer: 'walmart',
          productsList: [
            { id: 'wlm_1', title: 'Samsung 55" Crystal UHD', image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=500&q=80', price: 499.99 },
            { id: 'wlm_2', title: 'Dyson V11 Vacuum', image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80', price: 599.0 }
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

function load() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  state = JSON.parse(raw);
}

function save() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), 'utf8');
}

let state = { users: [], blocks: [], integrations: [], clicks: [] };
load();

module.exports = {
  state,
  load,
  save,
  DATA_PATH
};


