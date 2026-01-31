# Deploying Vextor Grid to Netlify

## Prerequisites
- GitHub account (recommended) or direct deployment
- Netlify account (free tier works great)
- Access to your domain DNS settings for vextorgrid.com

## Method 1: Deploy via GitHub (Recommended)

### Step 1: Push to GitHub
1. Create a new repository on GitHub
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit - Vextor Grid"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Connect to Netlify
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select your Vextor Grid repository
5. Netlify will auto-detect the build settings from `netlify.toml`
6. Before deploying, add environment variables:
   - Click "Show advanced"
   - Add environment variables:
     - `VITE_SUPABASE_URL` = `https://nilozzlswfhbtyuuwwnk.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbG96emxzd2ZoYnR5dXV3d25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzgwMjAsImV4cCI6MjA4MjIxNDAyMH0.glav0fdYY6txiThmfgc-lyuYvHu4L3F3tiEhLvZPDg0`
7. Click "Deploy site"

### Step 3: Connect Custom Domain
1. Once deployed, go to "Site settings" → "Domain management"
2. Click "Add custom domain"
3. Enter `vextorgrid.com`
4. Netlify will provide DNS settings
5. Go to your domain registrar (GoDaddy, Namecheap, etc.)
6. Update DNS records as instructed by Netlify:
   - Usually: Add A record pointing to Netlify's IP
   - Or: Update nameservers to Netlify's DNS
7. Add `www.vextorgrid.com` as well (recommended)
8. Wait for DNS propagation (can take up to 48 hours, usually faster)
9. Netlify will automatically provision SSL certificate

## Method 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login and Deploy
```bash
netlify login
netlify init
netlify deploy --prod
```

### Step 3: Set Environment Variables
```bash
netlify env:set VITE_SUPABASE_URL "https://nilozzlswfhbtyuuwwnk.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbG96emxzd2ZoYnR5dXV3d25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MzgwMjAsImV4cCI6MjA4MjIxNDAyMH0.glav0fdYY6txiThmfgc-lyuYvHu4L3F3tiEhLvZPDg0"
```

### Step 4: Connect Custom Domain
Follow Step 3 from Method 1 above.

## Method 3: Drag and Drop (Quick Test)

1. Run `npm run build` locally
2. Go to https://app.netlify.com
3. Drag the `dist` folder onto the Netlify dashboard
4. Note: You'll need to manually add environment variables in site settings
5. Follow Step 3 from Method 1 to connect your domain

## Important: Update Supabase Settings

After deployment, update your Supabase project:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Authentication" → "URL Configuration"
4. Add your production URL to "Site URL": `https://vextorgrid.com`
5. Add redirect URLs:
   - `https://vextorgrid.com/**`
   - `https://www.vextorgrid.com/**`

## Verify Deployment

1. Visit https://vextorgrid.com
2. Test signup/login functionality
3. Check that all styles load correctly
4. Test responsive design on mobile

## Continuous Deployment

With GitHub connected, every push to your main branch will automatically deploy to Netlify!

## Troubleshooting

**Build fails:**
- Check that environment variables are set correctly in Netlify

**Authentication doesn't work:**
- Verify Supabase redirect URLs include your production domain
- Check browser console for errors

**DNS not working:**
- DNS can take time to propagate (up to 48 hours)
- Use https://dnschecker.org to check propagation status
- Clear browser cache

**SSL certificate issues:**
- Netlify auto-provisions SSL after domain is verified
- May take a few minutes after DNS propagation
