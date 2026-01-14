# Supabase Setup Guide

This document provides step-by-step instructions to set up Supabase for your mobile web component application.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in Supabase

## Setup Steps

### 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`) - Keep this secret!

### 2. Configure Environment Variables

#### Client (.env)
Create `client/.env` file (copy from `.env.example`):
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:3001
```

#### Server (.env)
Create `server/.env` file (copy from `.env.example`):
```env
PORT=3001
SUPABASE_URL=your_project_url_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
NODE_ENV=development
```

### 3. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire content from `server/database/schema.sql`
5. Click **Run** to execute the SQL script

This will create:
- `profiles` table for user profiles
- `items` table for application data
- Row Level Security (RLS) policies
- Necessary indexes
- A trigger to auto-create profiles on user signup

### 4. Enable Authentication

1. Navigate to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. Optional: Configure additional providers (Google, GitHub, etc.)

### 5. Configure Email Templates (Optional)

1. Navigate to **Authentication** → **Email Templates**
2. Customize the following templates:
   - Confirmation email
   - Magic link email
   - Password reset email

### 6. Set Up Storage (Optional)

If you need file uploads:

1. Navigate to **Storage**
2. Create a new bucket (e.g., `avatars`, `documents`)
3. Configure bucket policies

Example policy for public avatars:
```sql
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 7. Test the Setup

1. Install dependencies:
   ```bash
   npm run install-all
   ```

2. Start the development servers:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173)
4. Try to register a new user
5. Check if the user appears in **Authentication** → **Users**
6. Check if a profile was created in the `profiles` table

## Database Schema Overview

### Tables

#### profiles
- `id` - UUID (references auth.users)
- `name` - User's display name
- `avatar_url` - Profile picture URL
- `bio` - User biography
- `created_at` - Timestamp
- `updated_at` - Timestamp

#### items
- `id` - UUID (primary key)
- `user_id` - UUID (references auth.users)
- `name` - Item name (required)
- `description` - Item description
- `status` - Item status (pending/active/completed)
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Security

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Service role key should never be exposed to the client
- Use anon key in the frontend, service key in the backend

## Troubleshooting

### Authentication Issues
- Verify your Supabase URL and keys are correct
- Check if email confirmation is required in Auth settings
- Look at browser console and network tab for errors

### Database Issues
- Make sure RLS policies are properly set up
- Check if the schema.sql ran successfully
- Verify user permissions in Supabase dashboard

### CORS Issues
- Update the `cors` configuration in `server/index.js`
- Add your frontend URL to allowed origins

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
