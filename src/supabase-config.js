// Supabase Configuration and Client
const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let initialized = false;

function isSupabaseConfigured() {
  return !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_URL !== 'your-supabase-url' &&
    process.env.SUPABASE_SERVICE_KEY &&
    process.env.SUPABASE_SERVICE_KEY !== 'your-supabase-service-key'
  );
}

function initSupabase() {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured.');
    return false;
  }

  if (initialized) {
    return true;
  }

  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          persistSession: false // Using server-side auth
        }
      }
    );

    initialized = true;
    console.log('✓ Supabase initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error.message);
    initialized = false;
    return false;
  }
}

function getSupabase() {
  return supabase;
}

function isInitialized() {
  return initialized;
}

module.exports = {
  initSupabase,
  isSupabaseConfigured,
  getSupabase,
  isInitialized
};

