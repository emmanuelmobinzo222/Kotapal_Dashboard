# Mock Data Models and Firebase Migration Notes

This project ships with in-memory mock data to enable local development without a database. Replace these with Firebase (or any DB) by swapping CRUD operations in `backend.js`.

## User
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "password": "bcrypt hash",
  "plan": "starter|pro|creatorplus",
  "createdAt": "YYYY-MM-DD",
  "affiliateIds": {
    "amazon": "string",
    "walmart": "string",
    "shopify": "string",
    "skimlinks": "string"
  },
  "website": "string (optional)"
}
```

Firebase suggestion: `collection('users').doc(userId)`; store hash in `password` field, or use Firebase Auth and drop local hashing.

## SmartBlock
```json
{
  "id": "string",
  "userId": "string",
  "title": "string",
  "layout": "grid|carousel|single",
  "ctaText": "string",
  "products": 0,
  "productsList": [
    {
      "id": "string",          // retailer-specific product id (e.g., amz_1)
      "title": "string",
      "image": "url",
      "price": 0,
      "retailer": "amazon|walmart|shopify|skimlinks"
    }
  ],
  "clicks": 0,
  "revenue": 0,
  "ctr": 0,
  "lastUpdated": "YYYY-MM-DD",
  "status": "draft|active",
  "retailer": "string"
}
```

Firebase suggestion: `collection('blocks').where('userId','==', uid)` with security rules to enforce ownership.

## Integration
```json
{
  "id": "amazon|walmart|shopify|skimlinks",
  "userId": "string",
  "name": "string",
  "status": "connected|disconnected",
  "lastSync": "string",
  "affiliateId": "string"
}
```

Firebase suggestion: `collection('integrations').doc(`${userId}_${id}`)`

## Click
```json
{
  "id": "string",
  "userId": "string",
  "blockId": "string",
  "productId": "string",
  "retailer": "string",
  "timestamp": "ISO",
  "referrer": "string|null",
  "userAgent": "string|null",
  "ip": "string|null"
}
```

Firebase suggestion: `collection('clicks')` with Cloud Functions for aggregation.

## Migration Steps
- Replace in-memory arrays `users`, `blocks`, `integrations`, `clicks` with Firestore collections.
- Replace create/read/update/delete handlers in `backend.js` with Firestore SDK calls.
- For authentication, use Firebase Auth JWTs and verify via Admin SDK, or keep current JWT and store user records in Firestore.
- Move analytics to a scheduled Cloud Function to compute aggregates into `analytics/{userId}` docs.

## Security Notes
- Always hash passwords (bcrypt) unless delegating to Firebase Auth.
- Validate and sanitize all inputs (already implemented in `backend.js`).
- Add per-IP and per-user rate limits at API gateway or Cloud Functions.


