# Supabase Setup Guide

## Overview
Supabase is an open-source Firebase alternative that provides PostgreSQL database, authentication, and real-time features.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Click "Start your project" → "New Project"
3. Choose organization
4. Enter project name (e.g., "kota-platform")
5. Set database password
6. Choose region (closest to your users)
7. Click "Create new project"

### 2. Get API Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Service Role Key** (secret): For server-side operations
   - **Anon Key**: For client-side operations (we use Service Role)

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Optional: For client-side operations
SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Create Database Tables

Run this SQL in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  google_id TEXT,
  picture TEXT,
  website TEXT,
  plan TEXT DEFAULT 'starter',
  created_at TIMESTAMP DEFAULT NOW(),
  affiliate_ids JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}'
);

-- Blocks table
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  layout TEXT NOT NULL,
  cta_text TEXT,
  products INTEGER,
  products_list JSONB,
  clicks INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  ctr DECIMAL(5, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'draft',
  retailer TEXT,
  custom_css TEXT,
  custom_js TEXT,
  embed_code TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integrations table
CREATE TABLE integrations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  last_sync TEXT,
  affiliate_id TEXT,
  api_key TEXT,
  secret_key TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clicks table
CREATE TABLE clicks (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  block_id TEXT,
  product_id TEXT,
  retailer TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  ip TEXT,
  country TEXT
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_blocks_user_id ON blocks(user_id);
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_clicks_user_id ON clicks(user_id);
CREATE INDEX idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX idx_password_tokens_user_id ON password_reset_tokens(user_id);
```

### 5. Enable Row Level Security (Optional)

For production, set up RLS policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Similar policies for other tables...
```

## Migration from Local JSON

1. Start with Supabase configured
2. Data will be written to PostgreSQL
3. Use Supabase dashboard to import existing data

## Testing

Open Supabase Dashboard → Table Editor to see your data.

## Benefits

- **PostgreSQL**: Full SQL database with relationships
- **Real-time**: Subscriptions and changes streams
- **Auth**: Built-in authentication
- **Storage**: File storage included
- **Open Source**: Self-hostable if needed

## Troubleshooting

**Error: "Invalid API key"**
- Verify SUPABASE_URL format
- Check Service Role key is correct

**Error: "Cannot find module @supabase/supabase-js"**
- Run: `npm install`

**Tables not found**
- Run the SQL schema setup
- Check table names match exactly

