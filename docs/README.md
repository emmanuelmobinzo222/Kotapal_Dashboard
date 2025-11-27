# Kota - Smart Product Embed + Affiliate Analytics Platform

A comprehensive SaaS platform that lets creators generate smart, SEO-friendly product blocks from Amazon, Walmart, Shopify, and other supported retailers. Users can track clicks, performance, and affiliate revenue.

## 🚀 Features

### Smart Product Blocks ("SmartBlocks")
- Auto-fetch product title, image, price, and link from affiliate APIs
- Users can customize headlines, CTAs, layouts
- Embed via universal JS snippet or WordPress plugin
- Multiple layout options: Grid, Carousel, List

### Affiliate Link Integration
- **Amazon**: Product Advertising API integration
- **Walmart**: Open API integration
- **Shopify**: Storefront API integration
- **Skimlinks**: Universal affiliate network
- Users input their own affiliate IDs for each platform
- Link tracking handled via Kota redirector

### Click + Sales Analytics
- All clicks logged per user/product/block
- Sales analytics shown only for platforms that allow it
- Amazon: clicks + estimated earnings only (no item-level sales info)
- Real-time performance metrics
- Revenue projections and growth tracking

### Dashboard & Analytics
- **Metrics**: Clicks, Estimated Revenue, CTR, Best-performing blocks
- **Filters**: Date range, Retailer, Block name, Page/post
- **Alerts**: "Low-converting blocks", "Top performer this week"
- Interactive charts and visualizations

### AI Integration (Optional)
- Auto-generate product blurbs
- Suggest alternative products
- Email optimization based on user's top links

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Authentication**: JWT-based auth system
- **Database**: Firebase Firestore (with local JSON fallback)
- **APIs**: RESTful API with comprehensive endpoints
- **Security**: Helmet, rate limiting, input sanitization
- **Analytics**: Real-time click tracking and performance metrics

### Frontend (React + TailwindCSS)
- **Framework**: React 18 with React Router
- **Styling**: TailwindCSS with custom design system
- **State Management**: React Query for server state
- **UI Components**: Custom components with Lucide React icons
- **Responsive**: Mobile-first design approach

### Key Components
- **SmartBlock Generator**: Creates embeddable product blocks
- **Click Tracker**: Tracks all outbound clicks with analytics
- **Affiliate APIs**: Integrates with major affiliate networks
- **Analytics Engine**: Processes and visualizes performance data

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- (Optional) Firebase project for production database

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kota-smart-product-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key
   
   # Optional: Firebase for production
   FIREBASE_PROJECT_ID=your-firebase-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   
   # Affiliate API Keys
   AMAZON_ACCESS_KEY=your-amazon-access-key
   AMAZON_SECRET_KEY=your-amazon-secret-key
   AMAZON_PARTNER_TAG=your-amazon-partner-tag
   
   WALMART_API_KEY=your-walmart-api-key
   SHOPIFY_STORE_URL=https://your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
   SKIMLINKS_API_KEY=your-skimlinks-api-key
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

The application will be available at:
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Blocks Management
- `GET /api/blocks` - Get user blocks
- `POST /api/blocks` - Create new block
- `PUT /api/blocks/:id` - Update block
- `DELETE /api/blocks/:id` - Delete block

### Product Search
- `GET /api/products/search` - Search products by retailer
- `GET /api/products/:id` - Get product details

### Analytics
- `GET /api/analytics` - Get analytics data
- `GET /api/alerts` - Get performance alerts

### Integrations
- `GET /api/integrations` - Get user integrations
- `POST /api/integrations` - Create/update integration

### Click Tracking
- `GET /r/:userId/:blockId/:productId` - Click tracking redirect
- `GET /api/embed/:blockId` - Get embed code

## 🎯 Usage

### Creating SmartBlocks

1. **Search Products**: Use the product search to find items from supported retailers
2. **Create Block**: Select products and configure block settings (title, layout, CTA)
3. **Customize**: Add custom CSS/JS for advanced styling
4. **Embed**: Copy the generated embed code to your website

### Embedding SmartBlocks

#### Universal JavaScript Snippet
```html
<!-- Kota Universal Embed Snippet -->
<script>
  (function() {
    const kotaScript = document.createElement('script');
    kotaScript.src = 'https://your-domain.com/js/kota-embed.js';
    kotaScript.async = true;
    document.head.appendChild(kotaScript);
  })();
</script>
```

#### WordPress Plugin
```php
[kota_block id="your-block-id"]
```

### Analytics & Tracking

- **Real-time Tracking**: All clicks are tracked automatically
- **Performance Metrics**: CTR, revenue, and conversion rates
- **Alerts**: Get notified of performance changes
- **Reports**: Export data for external analysis

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Sanitization**: Protects against XSS attacks
- **CORS Protection**: Configurable cross-origin policies
- **Helmet Security**: Additional security headers

## 📊 Analytics & Monitoring

### Key Metrics
- **Click-through Rate (CTR)**: Percentage of clicks per impression
- **Revenue Tracking**: Estimated earnings from affiliate links
- **Performance Alerts**: Automated notifications for significant changes
- **Growth Metrics**: Week-over-week and month-over-month comparisons

### Dashboard Features
- **Real-time Updates**: Live performance data
- **Interactive Charts**: Visual representation of trends
- **Filtering**: Date range, retailer, and block-specific filters
- **Export Options**: Download reports in various formats

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-production-jwt-secret
   FIREBASE_PROJECT_ID=your-firebase-project
   ```

2. **Database Configuration**
   - Use Firebase Firestore for production
   - Configure service account credentials
   - Set up proper security rules

3. **Frontend Build**
   ```bash
   cd frontend
   npm run build
   ```

4. **Server Deployment**
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@kotapal.com or join our Discord community.

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core platform functionality
- ✅ Basic analytics
- ✅ Amazon & Walmart integration
- ✅ React frontend

### Phase 2 (Upcoming)
- 🔄 Advanced analytics dashboard
- 🔄 Shopify & Skimlinks integration
- 🔄 AI-powered recommendations
- 🔄 WordPress plugin

### Phase 3 (Future)
- 📋 Mobile app
- 📋 Advanced AI features
- 📋 White-label solutions
- 📋 Enterprise features

---

**Built with ❤️ by the Kota Team**
