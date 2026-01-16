# KOTA PAL - AI Coding Assistant Instructions

## Project Overview
KOTA PAL is an affiliate marketing platform that helps content creators monetize their content through product recommendations. The platform allows users to create "blocks" of products from various retailers (Amazon, Walmart, Shopify, Skimlinks) and track performance through analytics.

## Architecture
- **Backend**: Node.js Express API (`backend.js`) with JWT authentication and in-memory mock database
- **Frontend**: Static HTML/CSS/JavaScript single-page application (`dashboard.html` for admin, `index.html` for landing page)
- **Data Flow**: Users create product blocks → embed in content → clicks tracked via redirect endpoint → affiliate commissions earned

## Key Components

### User Management
- Plans: `starter` (5 blocks, 3 products), `pro` (50 blocks, 10 products), `creatorplus` (unlimited)
- Authentication via JWT tokens stored in localStorage
- Profile management with affiliate IDs per retailer

### Blocks System
- Product display units with configurable layouts: `grid`, `carousel`, `single`
- Each block contains multiple products with titles, images, prices, ratings
- Status: `draft` or `active`
- CTA text customization

### Affiliate Integrations
- Supported retailers: Amazon, Walmart, Shopify, Skimlinks
- Affiliate ID management per user/retailer
- Mock product search APIs (replace with real integrations in production)

### Analytics & Tracking
- Click tracking via `/r/:userId/:blockId/:productId` redirect endpoint
- Metrics: clicks, revenue, CTR (click-through rate)
- Performance alerts for low/high performing blocks

## Development Workflow

### Running the Application
```bash
# Install dependencies (no package.json exists - create one)
npm install express cors body-parser bcrypt jwt uuid dotenv

# Start backend server
node backend.js
# Server runs on port 3000 (configurable via PORT env var)

# Open frontend
# - Landing page: index.html
# - Dashboard: dashboard.html (requires login)
```

### Environment Setup
- Copy `env.txt` to `.env`
- Set `JWT_SECRET` to a secure random string
- Configure `NODE_ENV=development`

### Database Migration (Future)
- Currently uses in-memory arrays: `users[]`, `blocks[]`, `integrations[]`, `clicks[]`
- Replace with Firebase/MongoDB/PostgreSQL for production
- Mock data in `loadMockData()` function should be removed

## Code Patterns & Conventions

### API Endpoints Structure
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/blocks` - List user's blocks
- `POST /api/blocks` - Create new block
- `PUT /api/blocks/:id` - Update block
- `DELETE /api/blocks/:id` - Delete block
- `GET /api/integrations` - List affiliate integrations
- `POST /api/integrations` - Create/update integration
- `GET /api/products/search` - Search products by retailer
- `GET /r/:userId/:blockId/:productId` - Click tracking redirect

### Block Creation Flow
1. Select retailer from dropdown
2. Search products using retailer API
3. Select products (respect plan limits)
4. Choose layout (grid/carousel/single)
5. Set CTA text
6. Save as draft or publish as active

### Affiliate URL Generation
```javascript
// Pattern: affiliate URLs generated based on retailer
switch (retailer) {
  case 'amazon': url = `https://www.amazon.com/dp/${productId}?tag=${affiliateId}`;
  case 'walmart': url = `https://www.walmart.com/ip/${productId}?affid=${affiliateId}`;
  case 'shopify': url = `https://store.shopify.com/products/${productId}?ref=${affiliateId}`;
  case 'skimlinks': url = `https://skimlinks.com/redirect/${productId}?affid=${affiliateId}`;
}
```

### Error Handling
- API returns `{ error: "message" }` for client errors (400/401/403/404)
- Server errors (500) logged to console
- Frontend shows user-friendly error messages

### Security Considerations
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire in 24 hours
- Input validation on all API endpoints
- CORS enabled for cross-origin requests

## Common Tasks

### Adding New Retailer Support
1. Add retailer to `integrations[]` mock data
2. Implement product search in `/api/products/search` endpoint
3. Add affiliate URL generation in `/r/` redirect endpoint
4. Update frontend retailer dropdown and search logic

### Modifying Plan Limits
Update plan limits in block creation endpoint:
```javascript
switch (user.plan) {
  case 'starter': maxBlocks = 5; maxProducts = 3;
  case 'pro': maxBlocks = 50; maxProducts = 10;
  case 'creatorplus': maxBlocks = Infinity; maxProducts = 20;
}
```

### Adding New Block Layout
1. Add layout option to frontend (`.layout-btn` elements)
2. Update block creation form validation
3. Implement layout rendering in embed code (future feature)

## Testing & Validation
- No formal test suite exists
- Manually test API endpoints with tools like Postman
- Validate affiliate redirects work correctly
- Check plan limits are enforced
- Test cross-browser compatibility (Chrome/Firefox/Safari)

## Deployment Considerations
- Static frontend files served from `/public` directory
- Backend requires Node.js 14+
- Environment variables must be set securely
- Database migration required for production
- CDN recommended for static assets
- SSL required for affiliate tracking

## Future Enhancements
- Real database integration
- Actual retailer API integrations
- Block embedding JavaScript SDK
- Advanced analytics with charts
- Multi-user collaboration features
- A/B testing for block layouts</content>
<parameter name="filePath">/Users/karrelmobinzo/Library/CloudStorage/Dropbox/KotaPal simple copy/.github/copilot-instructions.md