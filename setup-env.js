// Script to create/update .env file with Firebase configuration
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'env.example');

console.log('\n🔧 Setting up .env file for Firebase...\n');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  
  // Read current .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if Firebase config is present
  const hasFirebaseProjectId = envContent.includes('FIREBASE_PROJECT_ID=kotapal-1e8f6');
  const hasFirebaseCredentials = envContent.includes('GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json');
  
  if (hasFirebaseProjectId && hasFirebaseCredentials) {
    console.log('✅ Firebase configuration is already set in .env file');
    console.log('   FIREBASE_PROJECT_ID=kotapal-1e8f6');
    console.log('   GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json\n');
    process.exit(0);
  } else {
    console.log('⚠️ .env file exists but Firebase configuration may be missing or incorrect');
    
    // Update .env file
    let updatedContent = envContent;
    
    if (!hasFirebaseProjectId) {
      if (envContent.includes('FIREBASE_PROJECT_ID=')) {
        updatedContent = updatedContent.replace(
          /FIREBASE_PROJECT_ID=.*/,
          'FIREBASE_PROJECT_ID=kotapal-1e8f6'
        );
      } else {
        updatedContent += '\n# Firebase Configuration\nFIREBASE_PROJECT_ID=kotapal-1e8f6\n';
      }
      console.log('✅ Added FIREBASE_PROJECT_ID=kotapal-1e8f6');
    }
    
    if (!hasFirebaseCredentials) {
      if (envContent.includes('GOOGLE_APPLICATION_CREDENTIALS=')) {
        updatedContent = updatedContent.replace(
          /GOOGLE_APPLICATION_CREDENTIALS=.*/,
          'GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json'
        );
      } else {
        updatedContent += 'GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json\n';
      }
      console.log('✅ Added GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json');
    }
    
    fs.writeFileSync(envPath, updatedContent);
    console.log('\n✅ .env file updated with Firebase configuration\n');
    process.exit(0);
  }
} else {
  // Create new .env file from env.example if it exists
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Creating .env file from env.example...');
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Update Firebase config
    envContent = envContent.replace(
      /FIREBASE_PROJECT_ID=.*/,
      'FIREBASE_PROJECT_ID=kotapal-1e8f6'
    );
    envContent = envContent.replace(
      /GOOGLE_APPLICATION_CREDENTIALS=.*/,
      'GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json'
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created with Firebase configuration');
    console.log('   FIREBASE_PROJECT_ID=kotapal-1e8f6');
    console.log('   GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json\n');
  } else {
    // Create minimal .env file
    const envContent = `# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (Change in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Firebase Configuration
FIREBASE_PROJECT_ID=kotapal-1e8f6
GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json

# Frontend URL
FRONTEND_URL=http://localhost:3001
BASE_URL=http://localhost:3000
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created with Firebase configuration');
    console.log('   FIREBASE_PROJECT_ID=kotapal-1e8f6');
    console.log('   GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json\n');
  }
  
  console.log('✅ Setup complete! Run "npm run check-firebase" to verify configuration.\n');
  process.exit(0);
}

