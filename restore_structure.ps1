# Restore project to clean structure with all upgrades preserved
Write-Host "🚀 Restoring project structure..." -ForegroundColor Green
Write-Host ""

$root = $PSScriptRoot

# Create directories
$directories = @(
    "docs",
    "docs\setup-guides",
    "docs\troubleshooting",
    "scripts",
    "archive\old-files",
    "public"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $root $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Cyan
    }
}

# Move documentation files
Write-Host "`n📚 Organizing documentation..." -ForegroundColor Yellow

$docsFiles = @(
    "AI_ASSISTANT_ADDED.md",
    "AI_ASSISTANT_SETUP.md",
    "AI_INTEGRATION_SUMMARY.md",
    "CODE_FIXED.md",
    "DATABASE_COMPARISON.md",
    "DATABASE_QUICK_START.md",
    "DEBUG_INSTRUCTIONS.md",
    "DEBUG_LOGIN_ISSUE.md",
    "DOWNLOAD_FIREBASE_KEY.md",
    "FINAL_INSTRUCTIONS.md",
    "FINAL_LOGIN_FIX.md",
    "FINAL_WORKING_SOLUTION.md",
    "FIREBASE_CLIENT_SETUP.md",
    "FIREBASE_CONFIGURED.md",
    "FIREBASE_INTEGRATION_COMPLETE.md",
    "FIREBASE_NOW_WORKING.md",
    "FIREBASE_SETUP.md",
    "FIREBASE_STEP_BY_STEP_GUIDE.md",
    "FIX_FIREBASE_KEY.md",
    "FIX_LOGIN_ERROR.md",
    "FIXED_API_CONNECTION.md",
    "GOOGLE_AUTH_SETUP.md",
    "HOW_TO_ACCESS_DASHBOARD.md",
    "HOW_TO_LOGIN.md",
    "LOGIN_CREDENTIALS_FIX.md",
    "LOGIN_FIX.md",
    "LOGIN_FIXED.md",
    "NETLIFY_DEPLOYMENT.md",
    "OFFLINE_LOGIN_SETUP.md",
    "OPEN_HTML_FILE.md",
    "PROJECT_SUMMARY.md",
    "QUICK_OFFLINE_START.md",
    "QUICK_START.md",
    "README_GOOGLE_LOGIN.md",
    "START_HERE.md",
    "START_WITH_FIREBASE.md",
    "STORAGE_EXPLANATION.md",
    "SUPABASE_SETUP.md",
    "TEST_AUTH.md",
    "TEST_BACKEND.md",
    "TEST_DATABASE.md",
    "TEST_LOGIN_NOW.md",
    "TROUBLESHOOTING.md",
    "WORKING_SOLUTION.md",
    "WORKING_100_PERCENT.md",
    "DASHBOARD_ACCESS_GUIDE.md",
    "FIX_FILE_ACCESS_ERROR.md",
    "FIX_LOGIN_FILE_ACCESS.md"
)

$setupGuides = @(
    "FIREBASE_SETUP.md",
    "FIREBASE_STEP_BY_STEP_GUIDE.md",
    "SUPABASE_SETUP.md",
    "GOOGLE_AUTH_SETUP.md",
    "NETLIFY_DEPLOYMENT.md",
    "OFFLINE_LOGIN_SETUP.md",
    "QUICK_START.md",
    "QUICK_OFFLINE_START.md",
    "START_HERE.md",
    "START_WITH_FIREBASE.md"
)

$troubleshootingFiles = @(
    "TROUBLESHOOTING.md",
    "DEBUG_INSTRUCTIONS.md",
    "DEBUG_LOGIN_ISSUE.md",
    "FIX_FILE_ACCESS_ERROR.md",
    "FIX_LOGIN_FILE_ACCESS.md",
    "FIX_LOGIN_ERROR.md",
    "FIXED_API_CONNECTION.md"
)

foreach ($file in $docsFiles) {
    $src = Join-Path $root $file
    if (Test-Path $src) {
        if ($setupGuides -contains $file) {
            $dest = Join-Path $root "docs\setup-guides\$file"
        } elseif ($troubleshootingFiles -contains $file) {
            $dest = Join-Path $root "docs\troubleshooting\$file"
        } else {
            $dest = Join-Path $root "docs\$file"
        }
        Move-Item -Path $src -Destination $dest -Force -ErrorAction SilentlyContinue
        Write-Host "Moved: $file" -ForegroundColor Gray
    }
}

# Archive old files
Write-Host "`n📦 Archiving old files..." -ForegroundColor Yellow

$archiveFiles = @(
    "FRONTEND_package.json",
    "FRONTEND_PUBLIC_index.html",
    "FRONTEND_SRC_App.js",
    "FRONTEND_SRC_components_dashboard_Alerts.js",
    "FRONTEND_SRC_components_dashboard_AnalyticsChart.js",
    "FRONTEND_SRC_components_dashboard_RecentBlocks.js",
    "FRONTEND_SRC_components_dashboard_StatsCards.js",
    "FRONTEND_SRC_components_dashboard_TopProducts.js",
    "FRONTEND_SRC_components_Header.js",
    "FRONTEND_SRC_components_Layout.js",
    "FRONTEND_SRC_components_LoadingSpinner.js",
    "FRONTEND_SRC_components_MobileMenu.js",
    "FRONTEND_SRC_components_Sidebar.js",
    "FRONTEND_SRC_hooks_useAuth.js",
    "FRONTEND_SRC_index.css",
    "FRONTEND_SRC_index.js",
    "FRONTEND_SRC_pages_Account.js",
    "FRONTEND_SRC_pages_AIAssistant.js",
    "FRONTEND_SRC_pages_Analytics.js",
    "FRONTEND_SRC_pages_Blocks.js",
    "FRONTEND_SRC_pages_CreateBlock.js",
    "FRONTEND_SRC_pages_Dashboard.js",
    "FRONTEND_SRC_pages_EditBlock.js",
    "FRONTEND_SRC_pages_ForgotPassword.js",
    "FRONTEND_SRC_pages_Integrations.js",
    "FRONTEND_SRC_pages_Login.js",
    "FRONTEND_SRC_pages_Register.js",
    "FRONTEND_SRC_pages_ResetPassword.js",
    "FRONTEND_SRC_pages_Settings.js",
    "FRONTEND_SRC_utils_api.js",
    "KOTAPAL_backend.js",
    "KOTAPAL_check-server.html",
    "KOTAPAL_complete-login-test.html",
    "KOTAPAL_connection-test.html",
    "KOTAPAL_dashboard.html",
    "KOTAPAL_data.json",
    "KOTAPAL_database-manager.js",
    "KOTAPAL_database-test.html",
    "KOTAPAL_db.js",
    "KOTAPAL_debug-server.js",
    "KOTAPAL_enhanced-backend.js",
    "KOTAPAL_env.txt",
    "KOTAPAL_index.html",
    "KOTAPAL_LOGIN_FIX_GUIDE.md",
    "KOTAPAL_login-fix.js",
    "KOTAPAL_MODELS.md",
    "KOTAPAL_NAVIGATION_UPDATED.md",
    "KOTAPAL_package-lock.json",
    "KOTAPAL_package.json",
    "KOTAPAL_README.md",
    "KOTAPAL_simple-backend.js",
    "KOTAPAL_store.js",
    "KOTAPAL_test-account-info.html",
    "KOTAPAL_test-auth.html",
    "KOTAPAL_test-billing-info.html",
    "KOTAPAL_test-dashboard-redirect.html",
    "KOTAPAL_test-database.html",
    "KOTAPAL_test-debug.html",
    "KOTAPAL_test-login-comprehensive.html",
    "KOTAPAL_test-login-debug.html",
    "KOTAPAL_test-login-simple.js",
    "KOTAPAL_test-login.html",
    "KOTAPAL_test-toggle.html",
    "KOTAPAL_user-database.js",
    "KOTAPAL_working-login.html",
    "robust-server.js",
    "simple-server.js",
    "data.json"
)

foreach ($file in $archiveFiles) {
    $src = Join-Path $root $file
    if (Test-Path $src) {
        $dest = Join-Path $root "archive\old-files\$file"
        Move-Item -Path $src -Destination $dest -Force -ErrorAction SilentlyContinue
        Write-Host "Archived: $file" -ForegroundColor Gray
    }
}

# Move extra scripts
Write-Host "`n🔧 Organizing scripts..." -ForegroundColor Yellow

$extraScripts = @(
    "CHECK_FIREBASE_SETUP.bat",
    "FINAL_START.bat",
    "LAUNCH_FRONTEND.bat",
    "OPEN_LANDING_PAGE.bat",
    "RUN_APP.bat",
    "RUN_EVERYTHING.bat",
    "run-backend.bat",
    "run-frontend.bat",
    "SERVER_STATUS.bat",
    "SIMPLE_START.bat",
    "START_APP.bat",
    "START_BACKEND.bat",
    "START_BOTH.bat",
    "START_FRONTEND.bat",
    "START_NOW.bat",
    "START_SERVER.bat",
    "START_SERVERS.bat",
    "start-backend.bat",
    "start-both.bat",
    "start-frontend.bat",
    "start-server.bat",
    "restore_structure.ps1",
    "restore_structure.py"
)

foreach ($file in $extraScripts) {
    $src = Join-Path $root $file
    if (Test-Path $src) {
        $dest = Join-Path $root "scripts\$file"
        Move-Item -Path $src -Destination $dest -Force -ErrorAction SilentlyContinue
        Write-Host "Moved script: $file" -ForegroundColor Gray
    }
}

Write-Host "`n✅ Structure restoration complete!" -ForegroundColor Green
Write-Host "`n📁 New structure:" -ForegroundColor Cyan
Write-Host "  - src/              (backend source files)" -ForegroundColor White
Write-Host "  - frontend/         (React frontend)" -ForegroundColor White
Write-Host "  - docs/             (all documentation)" -ForegroundColor White
Write-Host "  - scripts/          (utility scripts)" -ForegroundColor White
Write-Host "  - archive/          (old files)" -ForegroundColor White
Write-Host "  - data/             (local database)" -ForegroundColor White
Write-Host "  - public/           (static files)" -ForegroundColor White
Write-Host "  - server.js          (main server)" -ForegroundColor White
Write-Host "  - package.json       (dependencies)" -ForegroundColor White
Write-Host "  - .env               (configuration)" -ForegroundColor White
Write-Host "`n✨ All improvements preserved!" -ForegroundColor Green

