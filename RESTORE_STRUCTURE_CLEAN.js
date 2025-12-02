// Restore project to clean structure with all upgrades preserved
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Directories to create
const directories = [
  'docs',
  'docs/setup-guides',
  'docs/troubleshooting',
  'scripts',
  'archive/old-files',
  'public'
];

// Files to move to docs
const docsFiles = [
  'AI_ASSISTANT_ADDED.md',
  'AI_ASSISTANT_SETUP.md',
  'AI_INTEGRATION_SUMMARY.md',
  'CODE_FIXED.md',
  'DATABASE_COMPARISON.md',
  'DATABASE_QUICK_START.md',
  'DEBUG_INSTRUCTIONS.md',
  'DEBUG_LOGIN_ISSUE.md',
  'DOWNLOAD_FIREBASE_KEY.md',
  'FINAL_INSTRUCTIONS.md',
  'FINAL_LOGIN_FIX.md',
  'FINAL_WORKING_SOLUTION.md',
  'FIREBASE_CLIENT_SETUP.md',
  'FIREBASE_CONFIGURED.md',
  'FIREBASE_INTEGRATION_COMPLETE.md',
  'FIREBASE_NOW_WORKING.md',
  'FIREBASE_SETUP.md',
  'FIREBASE_STEP_BY_STEP_GUIDE.md',
  'FIX_FIREBASE_KEY.md',
  'FIX_LOGIN_ERROR.md',
  'FIXED_API_CONNECTION.md',
  'GOOGLE_AUTH_SETUP.md',
  'HOW_TO_ACCESS_DASHBOARD.md',
  'HOW_TO_LOGIN.md',
  'LOGIN_CREDENTIALS_FIX.md',
  'LOGIN_FIX.md',
  'LOGIN_FIXED.md',
  'NETLIFY_DEPLOYMENT.md',
  'OFFLINE_LOGIN_SETUP.md',
  'OPEN_HTML_FILE.md',
  'PROJECT_SUMMARY.md',
  'QUICK_OFFLINE_START.md',
  'QUICK_START.md',
  'README_GOOGLE_LOGIN.md',
  'START_HERE.md',
  'START_WITH_FIREBASE.md',
  'STORAGE_EXPLANATION.md',
  'SUPABASE_SETUP.md',
  'TEST_AUTH.md',
  'TEST_BACKEND.md',
  'TEST_DATABASE.md',
  'TEST_LOGIN_NOW.md',
  'TROUBLESHOOTING.md',
  'WORKING_SOLUTION.md',
  'WORKING_100_PERCENT.md',
  'DASHBOARD_ACCESS_GUIDE.md',
  'FIX_FILE_ACCESS_ERROR.md',
  'FIX_LOGIN_FILE_ACCESS.md'
];

// Files to move to docs/setup-guides
const setupGuides = [
  'FIREBASE_SETUP.md',
  'FIREBASE_STEP_BY_STEP_GUIDE.md',
  'SUPABASE_SETUP.md',
  'GOOGLE_AUTH_SETUP.md',
  'NETLIFY_DEPLOYMENT.md',
  'OFFLINE_LOGIN_SETUP.md',
  'QUICK_START.md',
  'QUICK_OFFLINE_START.md',
  'START_HERE.md',
  'START_WITH_FIREBASE.md'
];

// Files to move to docs/troubleshooting
const troubleshootingFiles = [
  'TROUBLESHOOTING.md',
  'DEBUG_INSTRUCTIONS.md',
  'DEBUG_LOGIN_ISSUE.md',
  'FIX_FILE_ACCESS_ERROR.md',
  'FIX_LOGIN_FILE_ACCESS.md',
  'FIX_LOGIN_ERROR.md',
  'FIXED_API_CONNECTION.md'
];

// Old/duplicate files to archive
const archiveFiles = [
  'FRONTEND_package.json',
  'FRONTEND_PUBLIC_index.html',
  'FRONTEND_SRC_App.js',
  'FRONTEND_SRC_components_dashboard_Alerts.js',
  'FRONTEND_SRC_components_dashboard_AnalyticsChart.js',
  'FRONTEND_SRC_components_dashboard_RecentBlocks.js',
  'FRONTEND_SRC_components_dashboard_StatsCards.js',
  'FRONTEND_SRC_components_dashboard_TopProducts.js',
  'FRONTEND_SRC_components_Header.js',
  'FRONTEND_SRC_components_Layout.js',
  'FRONTEND_SRC_components_LoadingSpinner.js',
  'FRONTEND_SRC_components_MobileMenu.js',
  'FRONTEND_SRC_components_Sidebar.js',
  'FRONTEND_SRC_hooks_useAuth.js',
  'FRONTEND_SRC_index.css',
  'FRONTEND_SRC_index.js',
  'FRONTEND_SRC_pages_Account.js',
  'FRONTEND_SRC_pages_AIAssistant.js',
  'FRONTEND_SRC_pages_Analytics.js',
  'FRONTEND_SRC_pages_Blocks.js',
  'FRONTEND_SRC_pages_CreateBlock.js',
  'FRONTEND_SRC_pages_Dashboard.js',
  'FRONTEND_SRC_pages_EditBlock.js',
  'FRONTEND_SRC_pages_ForgotPassword.js',
  'FRONTEND_SRC_pages_Integrations.js',
  'FRONTEND_SRC_pages_Login.js',
  'FRONTEND_SRC_pages_Register.js',
  'FRONTEND_SRC_pages_ResetPassword.js',
  'FRONTEND_SRC_pages_Settings.js',
  'FRONTEND_SRC_utils_api.js',
  'KOTAPAL_backend.js',
  'KOTAPAL_check-server.html',
  'KOTAPAL_complete-login-test.html',
  'KOTAPAL_connection-test.html',
  'KOTAPAL_dashboard.html',
  'KOTAPAL_data.json',
  'KOTAPAL_database-manager.js',
  'KOTAPAL_database-test.html',
  'KOTAPAL_db.js',
  'KOTAPAL_debug-server.js',
  'KOTAPAL_enhanced-backend.js',
  'KOTAPAL_env.txt',
  'KOTAPAL_index.html',
  'KOTAPAL_LOGIN_FIX_GUIDE.md',
  'KOTAPAL_login-fix.js',
  'KOTAPAL_MODELS.md',
  'KOTAPAL_NAVIGATION_UPDATED.md',
  'KOTAPAL_package-lock.json',
  'KOTAPAL_package.json',
  'KOTAPAL_README.md',
  'KOTAPAL_simple-backend.js',
  'KOTAPAL_store.js',
  'KOTAPAL_test-account-info.html',
  'KOTAPAL_test-auth.html',
  'KOTAPAL_test-billing-info.html',
  'KOTAPAL_test-dashboard-redirect.html',
  'KOTAPAL_test-database.html',
  'KOTAPAL_test-debug.html',
  'KOTAPAL_test-login-comprehensive.html',
  'KOTAPAL_test-login-debug.html',
  'KOTAPAL_test-login-simple.js',
  'KOTAPAL_test-login.html',
  'KOTAPAL_test-toggle.html',
  'KOTAPAL_user-database.js',
  'KOTAPAL_working-login.html',
  'robust-server.js',
  'simple-server.js',
  'data.json'
];

// Scripts to organize
const scriptsToKeep = [
  'start.bat',
  'start.sh',
  'START_NOW_SIMPLE.bat',
  'START_DASHBOARD.bat',
  'CREATE_TEST_USER.js'
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

function moveFile(src, dest) {
  if (fs.existsSync(src)) {
    ensureDir(path.dirname(dest));
    try {
      fs.renameSync(src, dest);
      console.log(`Moved: ${src} -> ${dest}`);
    } catch (error) {
      console.error(`Error moving ${src}:`, error.message);
    }
  }
}

function restoreStructure() {
  console.log('🚀 Restoring project structure...\n');

  // Create directories
  directories.forEach(dir => {
    ensureDir(path.join(ROOT, dir));
  });

  // Move documentation files
  console.log('\n📚 Organizing documentation...');
  docsFiles.forEach(file => {
    const src = path.join(ROOT, file);
    let dest;
    
    if (setupGuides.includes(file)) {
      dest = path.join(ROOT, 'docs', 'setup-guides', file);
    } else if (troubleshootingFiles.includes(file)) {
      dest = path.join(ROOT, 'docs', 'troubleshooting', file);
    } else {
      dest = path.join(ROOT, 'docs', file);
    }
    
    moveFile(src, dest);
  });

  // Archive old files
  console.log('\n📦 Archiving old files...');
  archiveFiles.forEach(file => {
    const src = path.join(ROOT, file);
    const dest = path.join(ROOT, 'archive', 'old-files', file);
    moveFile(src, dest);
  });

  // Move extra batch files to scripts
  console.log('\n🔧 Organizing scripts...');
  const extraScripts = [
    'CHECK_FIREBASE_SETUP.bat',
    'FINAL_START.bat',
    'LAUNCH_FRONTEND.bat',
    'OPEN_LANDING_PAGE.bat',
    'RUN_APP.bat',
    'RUN_EVERYTHING.bat',
    'run-backend.bat',
    'run-frontend.bat',
    'SERVER_STATUS.bat',
    'SIMPLE_START.bat',
    'START_APP.bat',
    'START_BACKEND.bat',
    'START_BOTH.bat',
    'START_FRONTEND.bat',
    'START_HERE.md',
    'START_NOW.bat',
    'START_SERVER.bat',
    'START_SERVERS.bat',
    'start-backend.bat',
    'start-both.bat',
    'start-frontend.bat',
    'start-server.bat',
    'restore_structure.ps1',
    'restore_structure.py'
  ];

  extraScripts.forEach(file => {
    const src = path.join(ROOT, file);
    if (fs.existsSync(src)) {
      const dest = path.join(ROOT, 'scripts', file);
      moveFile(src, dest);
    }
  });

  console.log('\n✅ Structure restoration complete!');
  console.log('\n📁 New structure:');
  console.log('  - src/              (backend source files)');
  console.log('  - frontend/         (React frontend)');
  console.log('  - docs/             (all documentation)');
  console.log('  - scripts/          (utility scripts)');
  console.log('  - archive/          (old files)');
  console.log('  - data/             (local database)');
  console.log('  - public/           (static files)');
  console.log('  - server.js         (main server)');
  console.log('  - package.json      (dependencies)');
  console.log('  - .env              (configuration)');
  console.log('\n✨ All improvements preserved!');
}

// Run restoration
restoreStructure();

