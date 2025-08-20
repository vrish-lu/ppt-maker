# Railway Backend Deployment Guide

## 🚀 Deploy Your Backend to Railway

This guide will walk you through deploying your NewGamma backend API to Railway, a modern platform for deploying Node.js applications.

## Prerequisites

- ✅ GitHub repository with your backend code
- ✅ Railway account (free tier available)
- ✅ Environment variables ready

## Step 1: Prepare Your Backend

### 1.1 Verify Backend Structure
Your backend should have this structure:
```
backend/
├── package.json          # Dependencies and scripts
├── index.js             # Main server file
├── railway.json         # Railway configuration
├── src/                 # Source code
└── .env                 # Environment variables (don't commit this!)
```

### 1.2 Check Package.json
Ensure your `package.json` has:
```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Step 2: Deploy to Railway

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended)
3. Complete account setup

### 2.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `vrish-lu/ppt-maker`
4. Select the **`backend`** folder (important!)

### 2.3 Configure Build Settings
Railway will automatically detect it's a Node.js project. The `railway.json` file handles the configuration:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 3: Configure Environment Variables

### 3.1 Required Environment Variables
In Railway dashboard, go to **Variables** tab and add:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Brave Search API
BRAVE_API_KEY=your_brave_api_key

# Frontend URL (your Vercel app)
FRONTEND_URL=https://your-app.vercel.app

# Port (Railway sets this automatically)
PORT=3000

# Environment
NODE_ENV=production
```

### 3.2 How to Get These Values

#### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Open your project dashboard
3. Go to **Settings** → **API**
4. Copy the values

#### OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to **API Keys**
3. Create or copy existing key

#### JWT Secret
Generate a secure random string:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Brave API Key
1. Go to [brave.com/search/api](https://brave.com/search/api)
2. Sign up for API access
3. Get your API key

## Step 4: Deploy and Test

### 4.1 Deploy
1. Railway will automatically start building
2. Monitor the build logs
3. Wait for deployment to complete

### 4.2 Test Your API
Once deployed, test these endpoints:

```bash
# Health check
curl https://your-app.railway.app/health

# API health check
curl https://your-app.railway.app/api/health

# Test presentation generation
curl -X POST https://your-app.railway.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "AI in Healthcare"}'
```

## Step 5: Update Frontend Configuration

### 5.1 Update API Base URL
In your frontend code, update the API base URL to point to Railway:

```typescript
// src/services/api.ts
const API_BASE_URL = 'https://your-app.railway.app';
```

### 5.2 Update Vercel Environment Variables
Add this to your Vercel project:
```
VITE_API_BASE_URL=https://your-app.railway.app
```

## Step 6: Monitor and Maintain

### 6.1 Railway Dashboard Features
- **Deployments**: View deployment history
- **Logs**: Monitor application logs
- **Metrics**: CPU, memory, and network usage
- **Variables**: Manage environment variables
- **Settings**: Configure custom domains, etc.

### 6.2 Health Monitoring
Railway automatically monitors your `/health` endpoint and will restart the service if it fails.

### 6.3 Scaling
- **Free Tier**: 500 hours/month
- **Pro Plan**: Unlimited deployments, custom domains
- **Team Plan**: Collaboration features

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Railway dashboard
# Verify package.json has correct scripts
# Ensure all dependencies are listed
```

#### Environment Variable Issues
```bash
# Verify all required variables are set
# Check variable names match exactly
# Restart deployment after adding variables
```

#### Port Issues
```bash
# Railway sets PORT automatically
# Don't hardcode port in your code
# Use: const PORT = process.env.PORT || 3000;
```

#### CORS Issues
```bash
# Ensure FRONTEND_URL is set correctly
# Check CORS configuration in your backend
# Verify frontend domain matches
```

### Debug Commands
```bash
# View logs
railway logs

# Check environment variables
railway variables

# Restart service
railway service restart
```

## Best Practices

### 1. Security
- ✅ Never commit `.env` files
- ✅ Use strong JWT secrets
- ✅ Enable CORS properly
- ✅ Validate all inputs

### 2. Performance
- ✅ Use connection pooling for database
- ✅ Implement rate limiting
- ✅ Cache frequently accessed data
- ✅ Monitor memory usage

### 3. Monitoring
- ✅ Set up logging
- ✅ Monitor API response times
- ✅ Track error rates
- ✅ Set up alerts

## Cost Optimization

### Free Tier Limits
- 500 hours/month
- 1GB RAM
- Shared CPU
- Perfect for development/testing

### Pro Plan Benefits
- Unlimited hours
- Custom domains
- Better performance
- Priority support

## Next Steps

1. **Deploy to Railway** using this guide
2. **Test all API endpoints** thoroughly
3. **Update frontend** to use Railway URL
4. **Monitor performance** and logs
5. **Set up custom domain** (optional)

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues**: Report bugs in your repository

Your backend will be running on Railway in no time! 🚀
