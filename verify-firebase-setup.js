#!/usr/bin/env node

/**
 * Firebase Setup Verification Script
 * 
 * This script helps verify that your Firebase and GitHub setup is correct.
 * Run with: node verify-firebase-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Firebase Hosting Setup...\n');

let allGood = true;
const errors = [];
const warnings = [];

// Check 1: .firebaserc file exists and has correct project ID
console.log('1. Checking .firebaserc file...');
try {
  const firebasercPath = path.join(__dirname, '.firebaserc');
  if (fs.existsSync(firebasercPath)) {
    const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
    const projectId = firebaserc.projects?.default;
    
    if (projectId === 'KotaPal-1e8f6') {
      console.log('   ✅ Project ID is correctly set to: KotaPal-1e8f6\n');
    } else if (projectId === 'your-firebase-project-id') {
      errors.push('   ❌ Project ID in .firebaserc is still set to placeholder');
      allGood = false;
    } else {
      warnings.push(`   ⚠️  Project ID is set to: ${projectId} (expected: KotaPal-1e8f6)`);
    }
  } else {
    errors.push('   ❌ .firebaserc file not found');
    allGood = false;
  }
} catch (error) {
  errors.push(`   ❌ Error reading .firebaserc: ${error.message}`);
  allGood = false;
}

// Check 2: firebase.json exists
console.log('2. Checking firebase.json file...');
try {
  const firebaseJsonPath = path.join(__dirname, 'firebase.json');
  if (fs.existsSync(firebaseJsonPath)) {
    const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
    if (firebaseJson.hosting) {
      console.log('   ✅ firebase.json is properly configured\n');
    } else {
      errors.push('   ❌ firebase.json missing hosting configuration');
      allGood = false;
    }
  } else {
    errors.push('   ❌ firebase.json file not found');
    allGood = false;
  }
} catch (error) {
  errors.push(`   ❌ Error reading firebase.json: ${error.message}`);
  allGood = false;
}

// Check 3: GitHub workflow files exist
console.log('3. Checking GitHub Actions workflows...');
const workflowPath = path.join(__dirname, '.github', 'workflows');
if (fs.existsSync(workflowPath)) {
  const workflows = fs.readdirSync(workflowPath);
  const hasDeployWorkflow = workflows.some(f => f.includes('firebase-deploy'));
  if (hasDeployWorkflow) {
    console.log('   ✅ GitHub Actions workflow files found\n');
  } else {
    warnings.push('   ⚠️  No firebase-deploy workflow found');
  }
} else {
  warnings.push('   ⚠️  .github/workflows directory not found');
}

// Check 4: index.html exists
console.log('4. Checking index.html file...');
const indexHtmlPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  console.log('   ✅ index.html found\n');
} else {
  errors.push('   ❌ index.html not found');
  allGood = false;
}

// Check 5: .firebaseignore exists
console.log('5. Checking .firebaseignore file...');
const firebaseIgnorePath = path.join(__dirname, '.firebaseignore');
if (fs.existsSync(firebaseIgnorePath)) {
  console.log('   ✅ .firebaseignore found\n');
} else {
  warnings.push('   ⚠️  .firebaseignore not found (optional but recommended)');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📋 VERIFICATION SUMMARY');
console.log('='.repeat(50) + '\n');

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(w => console.log(w));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(e => console.log(e));
  console.log('');
  allGood = false;
}

if (allGood && warnings.length === 0) {
  console.log('✅ All checks passed! Your Firebase setup looks good.\n');
  console.log('📝 Next Steps:');
  console.log('   1. Set up GitHub Secrets (see GITHUB_SECRETS_SETUP.md)');
  console.log('   2. Push to main/master branch to trigger deployment');
  console.log('   3. Check Firebase Console for deployment status\n');
} else if (allGood) {
  console.log('✅ Core setup is correct, but review warnings above.\n');
} else {
  console.log('❌ Please fix the errors above before deploying.\n');
}

console.log('📚 For detailed setup instructions, see:');
console.log('   - GITHUB_SECRETS_SETUP.md');
console.log('   - FIREBASE_SETUP.md\n');

process.exit(allGood ? 0 : 1);
