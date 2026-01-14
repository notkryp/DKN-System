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

This repository includes a `render.yaml` for a two-service deployment (API + static client).

1. Push this repo to GitHub and create a **Blueprint** on Render pointing to it.
2. Render will read `render.yaml` and provision:
   - **mobile-web-api** (Node web service) at `/healthz` for health checks.
   - **mobile-web-client** (static site) publishing `client/dist`.
3. Set environment variables in Render dashboard:
   - API: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CLIENT_URL`, `ALLOWED_ORIGINS` (use the static site URL), `NODE_ENV=production`.
   - Client: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anonymous/public), `VITE_API_URL` (Render auto-fills from the API service; verify after first deploy).
4. Trigger a deploy. The API will honor the allow-list in `ALLOWED_ORIGINS` for CORS.

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
