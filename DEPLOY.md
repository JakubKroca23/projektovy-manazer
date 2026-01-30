# Deployment Guide - ProjectHub

## Prerequisites

1. **Supabase Project**
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Note down URL and anon key

2. **Vercel Account**
   - Create account at [vercel.com](https://vercel.com)
   - Install Vercel CLI (optional): `npm i -g vercel`

## Step 1: Setup Supabase Database

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy content from `supabase/migrations/0001_initial_schema.sql`
4. Paste and run in SQL Editor
5. Verify tables were created in Table Editor

## Step 2: Configure Authentication

### Enable Email Auth
1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)

### Enable Google OAuth (Optional)
1. Create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`

2. In Supabase:
   - Go to Authentication → Providers
   - Enable Google
   - Add Client ID and Secret

## Step 3: Get Supabase Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 4: Deploy to Vercel

### Option A: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   - Click "Environment Variables"
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL = <your-supabase-url>
     NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-anon-key>
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your live site!

### Option B: Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 5: Configure Supabase Redirect URLs

1. Go to Supabase → Authentication → URL Configuration
2. Add your Vercel domain to:
   - Site URL: `https://your- app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

## Step 6: Test Your Application

1. **Visit your app**: `https://your-app.vercel.app`
2. **Test signup**: Create new account
3. **Test login**: Login with credentials
4. **Test OAuth**: Login with Google (if enabled)
5. **Test features**:
   - Create project
   - Create tasks
   - View Kanban board

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify Supabase migrations ran successfully
- Check build logs in Vercel dashboard

### Authentication Not Working
- Verify redirect URLs in Supabase
- Check environment variables
- Clear browser cookies and try again

### Database Connection Issues
- Verify Supabase project is active
- Check RLS policies are enabled
- Test with Supabase SQL Editor

## Continuous Deployment

Once set up with GitHub integration:
1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically deploys
4. Check deployment status in Vercel dashboard

## Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update Supabase redirect URLs with new domain

## Monitoring

- **Vercel Analytics**: Enable in project settings
- **Supabase Logs**: Check authentication and database logs
- **Error Tracking**: Consider adding Sentry or similar

## Security Checklist

- ✅ Environment variables set in Vercel (not in code)
- ✅ RLS policies enabled on all tables
- ✅ HTTPS enforced (automatic with Vercel)
- ✅ Redirect URLs configured in Supabase
- ✅ No sensitive data committed to Git

## Support

For issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/ docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Deployment Time**: ~10-15 minutes  
**Cost**: Free tier available on both Vercel and Supabase
