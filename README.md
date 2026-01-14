# Mobile Web Component

A full-stack mobile-responsive web application built with React, Tailwind CSS, Node.js, Express, and Supabase.

## Features

- React 18 with Vite
- Tailwind CSS for responsive design
- Node.js/Express REST API
- Supabase for database and authentication
- Mobile-first responsive design

## Setup

1. Install dependencies:
   ```bash
   npm run install-all
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` in both `client` and `server` folders
   - Add your Supabase credentials

3. Run the development servers:
   ```bash
   npm run dev
   ```

## Render Deployment

### Step 1: Deploy the API (using Blueprint)

1. Push this repo to GitHub.
2. In Render dashboard, create **New → Blueprint**.
3. Connect your GitHub repo (main branch). Render will detect `render.yaml`.
4. Configure the API service environment variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_KEY` - Your Supabase service role key (keep secret!)
   - `CLIENT_URL` - Will be your static site URL (set after Step 2)
   - `ALLOWED_ORIGINS` - Same as CLIENT_URL (comma-separated for multiple)
   - `NODE_ENV` - Already set to `production` in render.yaml
5. Click **Apply** to deploy the API. Note the API URL (e.g., `https://mobile-web-api.onrender.com`).

### Step 2: Deploy the Client (Static Site)

1. In Render dashboard, create **New → Static Site**.
2. Connect the same GitHub repo.
3. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL (same as API)
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - `VITE_API_URL` - The API URL from Step 1
5. Click **Create Static Site** and wait for the build to complete.
6. Note the static site URL (e.g., `https://mobile-web-client.onrender.com`).

### Step 3: Update CORS Configuration

1. Go back to your API service in Render.
2. Update environment variables:
   - `CLIENT_URL` - Set to your static site URL from Step 2
   - `ALLOWED_ORIGINS` - Set to your static site URL from Step 2
3. Save changes. The API will automatically redeploy.

### Step 4: Verify

- API health check: `curl https://<your-api-url>/healthz` → `{"status":"ok"}`
- Open your static site URL and test login/register
- Check browser console for CORS errors (should be none)

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
└── package.json     # Root package configuration
```

## Environment Variables

### Client (.env)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001)

### Server (.env)
- `PORT` - Server port (default: 3001)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key
- `CLIENT_URL` - Primary frontend origin for CORS
- `ALLOWED_ORIGINS` - Comma-separated origins allowed by CORS
# DKN-System
# DKN-System
