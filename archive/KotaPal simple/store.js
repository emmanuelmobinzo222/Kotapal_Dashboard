
// Store abstraction: Firebase Firestore when configured, else local JSON db
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
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    firestore = admin.firestore();
    FieldValue = admin.firestore.FieldValue;
    useFirebase = true;
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

// Blocks
async function listBlocksByUser(userId) {
  if (useFirebase) {
    const snap = await firestore.collection('blocks').where('userId', '==', userId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return db.state.blocks.filter(b => b.userId === userId);
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

module.exports = {
  initFirebase,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  listBlocksByUser,
  createBlock,
  updateBlock,
  deleteBlock,
  listIntegrations,
  upsertIntegration,
  addClick
};


