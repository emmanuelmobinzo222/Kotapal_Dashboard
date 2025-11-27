# Netlify Deployment Guide

This project ships with a full-stack workspace, but the production build that
Netlify needs lives under the `frontend/` folder. The repo now includes a
`netlify.toml` so Netlify knows to install dependencies inside `frontend/`,
run the CRA build, and serve the generated static bundle.

## Prerequisites

1. Node 18.x locally (matches the value configured for Netlify).
2. Access to the backend/API that the app should call in production.
3. The value for `REACT_APP_API_URL`, which must point to a publicly reachable
   HTTPS endpoint that implements the `/api/*` routes expected by the UI.

## Build Locally (optional but recommended)

```bash
cd frontend
npm install
npm run build
```

The compiled assets live in `frontend/build/` and are exactly what Netlify will
serve after CI finishes.

## Configure Netlify

1. Create a new Netlify site and connect it to this repository (or upload a zip
   of the entire project directory).
2. Netlify picks up `netlify.toml` automatically. Confirm that it shows:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `build`
3. Under **Site settings → Build & deploy → Environment**, add:
   - `REACT_APP_API_URL=https://<your-api-domain>/api`
   - Any other keys (Firebase, Supabase, etc.) that you need at runtime.
4. Save the variables and trigger **Deploy site**.

## Client-Side Routing

Single page apps need every unknown route to resolve to `index.html`. The new
`frontend/public/_redirects` file contains `/* /index.html 200`, which Netlify
uses to keep client-side routing working across refreshes or deep links.

## Manual Deploy (drag & drop)

If you prefer to upload a build artifact instead of connecting a repo:

1. Run the local build steps above.
2. Zip the contents of `frontend/build/` (zip the *contents*, not the folder
   itself) and drag the archive into Netlify’s Deploys UI.

This path skips the build phase entirely, so remember to rebuild and re-upload
whenever the code changes.

