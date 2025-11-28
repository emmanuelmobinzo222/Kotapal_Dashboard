// Enhanced Store abstraction: Firebase Firestore when configured, else local JSON db
const path = require('path');
let useFirebase = false;
let firestore = null;
let FieldValue = null;

function hasFirebaseEnv() {
  return !!process.env.FIREBASE_PROJECT_ID && !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

async function initFirebase() {
  if (!hasFirebaseEnv()) return false;
  try {
    const admin = require('firebase-admin');
    let credential;
    
    // Try to load service account from file path
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      credential = admin.credential.cert(serviceAccount);
    }
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: credential || admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    firestore = admin.firestore();
    FieldValue = admin.firestore.FieldValue;
    useFirebase = true;
    console.log('✓ Firebase initialized successfully');
    return true;
  } catch (e) {
    console.warn('Firebase init failed, falling back to local db:', e.message);
    useFirebase = false;
    return false;
  }
}

// Local fallback
const db = require('./db');

// Users
async function getUserByEmail(email) {
  if (useFirebase) {
    const snap = await firestore.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  return db.state.users.find(u => u.email === email) || null;
}

async function getUserById(id) {
  if (useFirebase) {
    const doc = await firestore.collection('users').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }
  return db.state.users.find(u => u.id === id) || null;
}

async function createUser(user) {
  if (useFirebase) {
    const ref = await firestore.collection('users').add(user);
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  }
  db.state.users.push(user);
  db.save();
  return user;
}

async function updateUser(id, updates) {
  if (useFirebase) {
    await firestore.collection('users').doc(id).set(updates, { merge: true });
    const doc = await firestore.collection('users').doc(id).get();
    return { id: doc.id, ...doc.data() };
  }
  const idx = db.state.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  db.state.users[idx] = { ...db.state.users[idx], ...updates };
  db.save();
  const { password, ...safe } = db.state.users[idx];
  return safe;
}

async function getAllUsers() {
  if (useFirebase) {
    const snap = await firestore.collection('users').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return db.state.users;
}

async function updateDailyMetrics(userId, date, metrics) {
  if (useFirebase) {
    await firestore.collection('dailyMetrics').doc(`${userId}_${date}`).set({
      userId,
      date,
      ...metrics,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  }
  
  if (!db.state.dailyMetrics) {
    db.state.dailyMetrics = [];
  }
  
  const idx = db.state.dailyMetrics.findIndex(m => m.userId === userId && m.date === date);
  const metricData = {
    userId,
    date,
    ...metrics,
    updatedAt: new Date().toISOString()
  };
  
  if (idx === -1) {
    db.state.dailyMetrics.push(metricData);
  } else {
    db.state.dailyMetrics[idx] = metricData;
  }
  db.save();
  return true;
}

// Blocks
async function listBlocksByUser(userId) {
  if (useFirebase) {
    const snap = await firestore.collection('blocks').where('userId', '==', userId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return db.state.blocks.filter(b => b.userId === userId);
}

async function getBlockById(blockId) {
  if (useFirebase) {
    const doc = await firestore.collection('blocks').doc(blockId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }
  return db.state.blocks.find(b => b.id === blockId) || null;
}

async function createBlock(block) {
  if (useFirebase) {
    const ref = await firestore.collection('blocks').add(block);
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() };
  }
  db.state.blocks.push(block);
  db.save();
  return block;
}

async function updateBlock(userId, id, updates) {
  if (useFirebase) {
    const docRef = firestore.collection('blocks').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== userId) return null;
    await docRef.set(updates, { merge: true });
    const newDoc = await docRef.get();
    return { id: newDoc.id, ...newDoc.data() };
  }
  const idx = db.state.blocks.findIndex(b => b.id === id && b.userId === userId);
  if (idx === -1) return null;
  db.state.blocks[idx] = { ...db.state.blocks[idx], ...updates };
  db.save();
  return db.state.blocks[idx];
}

async function deleteBlock(userId, id) {
  if (useFirebase) {
    const docRef = firestore.collection('blocks').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== userId) return null;
    await docRef.delete();
    return { id };
  }
  const idx = db.state.blocks.findIndex(b => b.id === id && b.userId === userId);
  if (idx === -1) return null;
  const removed = db.state.blocks.splice(idx, 1)[0];
  db.save();
  return removed;
}

// Integrations
async function listIntegrations(userId) {
  if (useFirebase) {
    const snap = await firestore.collection('integrations').where('userId', '==', userId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return db.state.integrations.filter(i => i.userId === userId);
}

async function upsertIntegration(integration) {
  if (useFirebase) {
    const ref = firestore.collection('integrations').doc(`${integration.userId}_${integration.id}`);
    await ref.set(integration, { merge: true });
    const doc = await ref.get();
    return { id: integration.id, ...doc.data() };
  }
  const idx = db.state.integrations.findIndex(i => i.id === integration.id && i.userId === integration.userId);
  if (idx === -1) db.state.integrations.push(integration);
  else db.state.integrations[idx] = { ...db.state.integrations[idx], ...integration };
  db.save();
  return integration;
}

// Clicks
async function addClick(click) {
  if (useFirebase) {
    await firestore.collection('clicks').add(click);
    return click;
  }
  db.state.clicks.push(click);
  db.save();
  return click;
}

// Password reset tokens
async function createPasswordResetToken(userId, token, expiresAt) {
  if (useFirebase) {
    await firestore.collection('passwordResetTokens').add({
      userId,
      token,
      expiresAt,
      createdAt: new Date().toISOString()
    });
    return { userId, token, expiresAt };
  }
  
  if (!db.state.passwordResetTokens) {
    db.state.passwordResetTokens = [];
  }
  
  db.state.passwordResetTokens.push({
    userId,
    token,
    expiresAt,
    createdAt: new Date().toISOString()
  });
  db.save();
  return { userId, token, expiresAt };
}

async function getPasswordResetToken(token) {
  if (useFirebase) {
    const snap = await firestore.collection('passwordResetTokens')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    
    // Check if token is expired
    if (new Date(data.expiresAt) < new Date()) {
      return null;
    }
    
    return data;
  }
  
  if (!db.state.passwordResetTokens) return null;
  
  const tokenData = db.state.passwordResetTokens.find(t => t.token === token);
  if (!tokenData) return null;
  
  // Check if token is expired
  if (new Date(tokenData.expiresAt) < new Date()) {
    return null;
  }
  
  return tokenData;
}

async function deletePasswordResetToken(token) {
  if (useFirebase) {
    const snap = await firestore.collection('passwordResetTokens')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (!snap.empty) {
      await snap.docs[0].ref.delete();
    }
    return true;
  }
  
  if (!db.state.passwordResetTokens) return true;
  
  const index = db.state.passwordResetTokens.findIndex(t => t.token === token);
  if (index !== -1) {
    db.state.passwordResetTokens.splice(index, 1);
    db.save();
  }
  return true;
}

async function getClicksByUser(userId, filters = {}) {
  if (useFirebase) {
    let query = firestore.collection('clicks').where('userId', '==', userId);
    
    if (filters.startDate) {
      query = query.where('timestamp', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('timestamp', '<=', filters.endDate);
    }
    if (filters.retailer) {
      query = query.where('retailer', '==', filters.retailer);
    }
    if (filters.blockId) {
      query = query.where('blockId', '==', filters.blockId);
    }
    
    const snap = await query.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  
  let clicks = db.state.clicks.filter(c => c.userId === userId);
  
  if (filters.startDate) {
    clicks = clicks.filter(c => c.timestamp >= filters.startDate);
  }
  if (filters.endDate) {
    clicks = clicks.filter(c => c.timestamp <= filters.endDate);
  }
  if (filters.retailer) {
    clicks = clicks.filter(c => c.retailer === filters.retailer);
  }
  if (filters.blockId) {
    clicks = clicks.filter(c => c.blockId === filters.blockId);
  }
  
  return clicks;
}

// Analytics
async function getAnalyticsData(userId, filters = {}) {
  const clicks = await getClicksByUser(userId, filters);
  const blocks = await listBlocksByUser(userId);
  
  return {
    clicks,
    blocks,
    totalClicks: clicks.length,
    totalRevenue: clicks.reduce((sum, click) => sum + (click.revenue || 0), 0),
    avgCTR: blocks.length > 0 ? blocks.reduce((sum, block) => sum + block.ctr, 0) / blocks.length : 0,
    topBlocks: blocks.sort((a, b) => b.clicks - a.clicks).slice(0, 5),
    clicksByRetailer: clicks.reduce((acc, click) => {
      acc[click.retailer] = (acc[click.retailer] || 0) + 1;
      return acc;
    }, {}),
    clicksByDay: clicks.reduce((acc, click) => {
      const day = click.timestamp.split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {})
  };
}

module.exports = {
  initFirebase,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getAllUsers,
  listBlocksByUser,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
  listIntegrations,
  upsertIntegration,
  addClick,
  getClicksByUser,
  getAnalyticsData,
  createPasswordResetToken,
  getPasswordResetToken,
  deletePasswordResetToken,
  updateDailyMetrics
};
