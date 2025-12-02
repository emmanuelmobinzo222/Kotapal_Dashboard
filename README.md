# 🚀 Kota Smart Product Platform

A comprehensive SaaS platform for creating smart, SEO-friendly product blocks from major retailers and tracking affiliate performance.

## ✨ Features

- **Smart Product Blocks** - Create embeddable product blocks with customizable layouts
- **Multi-Retailer Support** - Amazon, Walmart, Shopify, Skimlinks
- **Analytics Dashboard** - Real-time click tracking, revenue estimation, and performance metrics
- **AI Assistant** - Generate product descriptions, pros/cons, FAQs, and alternatives
- **Offline Support** - Works completely offline with local database
- **User Authentication** - Secure JWT-based auth with Google OAuth support
- **Plan Management** - Starter, Pro, Creator+, and Agency plans

## 🏗️ Project Structure

```
.
├── src/                    # Backend source files
│   ├── store.js           # Database abstraction (Firebase/Supabase/Local)
│   ├── db.js              # Local JSON database
│   ├── affiliate-apis.js  # Retailer API integrations
│   ├── analytics.js       # Analytics engine
│   ├── embed-generator.js # SmartBlock embed code generator
│   ├── ai-service.js      # AI content generation
│   ├── auth-service.js    # Authentication services
│   ├── firebase-config.js # Firebase configuration
│   └── supabase-config.js # Supabase configuration
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/         # Application pages
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── docs/                  # Documentation
│   ├── setup-guides/      # Setup instructions
│   └── troubleshooting/   # Troubleshooting guides
├── scripts/               # Utility scripts
├── data/                  # Local database storage
├── public/                # Static files
├── server.js              # Main server file
├── package.json           # Backend dependencies
└── .env                   # Environment configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   cd frontend
   npm install
   cd ..
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration (optional for offline use)

3. **Start the application:**
   
   **Windows:**
   ```bash
   START_NOW_SIMPLE.bat
   ```
   
   **Linux/Mac:**
   ```bash
   ./start.sh
   ```
   
   **Manual:**
   ```bash
   # Terminal 1 - Backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

4. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs

## 📖 Documentation

- **Quick Start**: See `docs/QUICK_START.md`
- **Offline Setup**: See `docs/OFFLINE_LOGIN_SETUP.md`
- **Firebase Setup**: See `docs/setup-guides/FIREBASE_SETUP.md`
- **Troubleshooting**: See `docs/troubleshooting/TROUBLESHOOTING.md`
- **Dashboard Guide**: See `docs/DASHBOARD_ACCESS_GUIDE.md`

## 🔧 Configuration

### Required (Minimum)
```env
PORT=3000
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3001
BASE_URL=http://localhost:3000
```

### Optional (For Full Features)
- Firebase credentials (cloud database)
- Supabase credentials (alternative database)
- Affiliate API keys (Amazon, Walmart, Shopify, Skimlinks)
- OpenAI API key (AI features)
- Google OAuth credentials
- Email configuration (password reset)

## 🎯 Key Features

### Offline Support
- Works completely offline
- Local JSON database fallback
- No internet required for login/registration

### Authentication
- User registration and login
- Google OAuth support
- Password reset functionality
- JWT token management

### Dashboard
- Real-time analytics
- Performance metrics
- Click tracking
- Revenue estimation
- Performance alerts

### SmartBlocks
- Create product blocks
- Multiple layouts (Grid, Carousel, List)
- Custom CSS/JS support
- Embed code generation
- WordPress plugin support

## 📝 Available Scripts

- `npm start` - Start backend server
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run create-test-user` - Create test user for offline login
- `cd frontend && npm start` - Start frontend development server
- `cd frontend && npm run build` - Build frontend for production

## 🗂️ Database Options

1. **Local JSON** (Default) - Works offline, stored in `data/data.json`
2. **Firebase Firestore** - Cloud database (configure in `.env`)
3. **Supabase** - PostgreSQL database (configure in `.env`)

The app automatically falls back to local JSON if cloud databases aren't configured.

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input sanitization
- CORS protection
- Security headers (Helmet)

## 📊 Plans & Features

### Starter Plan
- 5 product blocks
- Amazon only
- Basic analytics

### Pro Plan
- 50 product blocks
- All retailers
- Full analytics dashboard

### Creator+ Plan
- Unlimited blocks
- AI features
- Advanced analytics
- Export reports

### Agency Plan
- Everything in Creator+
- White-label solution
- Multi-client management
- API access

## 🐛 Troubleshooting

See `docs/troubleshooting/` for detailed guides on:
- File access errors
- Login issues
- API connection problems
- Database errors

## 📄 License

MIT

## 👥 Support

For issues and questions, check the documentation in the `docs/` folder.

---

**Status**: ✅ **100% Working** - All features functional with offline support!
