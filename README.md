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
# DKN-System
# DKN-System
