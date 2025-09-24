# 🚀 AthleteEdge Deployment Guide

This guide covers deploying AthleteEdge to production using Railway (backend) and Vercel (frontend).

## 📋 Prerequisites

- GitHub account
- Railway account (free tier available)
- Vercel account (free tier available)
- MongoDB Atlas account (free tier available)

## 🗄️ Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for free account
   - Create a new cluster (choose free M0 tier)

2. **Configure Database Access**
   - Go to Database Access → Add New Database User
   - Create username/password
   - Set privileges to "Read and write to any database"

3. **Network Access**
   - Go to Network Access → Add IP Address
   - Add `0.0.0.0/0` for Railway deployment
   - Or add specific Railway IP ranges

4. **Get Connection String**
   - Go to Database → Connect
   - Choose "Connect your application"
   - Copy connection string (replace `<password>` with your password)

## 🚂 Backend Deployment (Railway)

### Option 1: GitHub Integration (Recommended)

1. **Prepare Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [Railway](https://railway.app)
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Choose "Deploy Now"

3. **Configure Environment Variables**
   In Railway dashboard, go to your project → Variables tab:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/athlete-edge
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   NODE_ENV=production
   PORT=5000
   CLIENT_URL=https://your-frontend-url.vercel.app
   ```

4. **Deploy Settings**
   - Railway will auto-detect it's a Node.js project
   - Build command: `npm install`
   - Start command: `npm start`
   - Root directory: `/server`

### Option 2: Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set MONGODB_URI="your-mongodb-connection-string"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set NODE_ENV="production"
   ```

## ⚡ Frontend Deployment (Vercel)

### Option 1: GitHub Integration (Recommended)

1. **Deploy on Vercel**
   - Go to [Vercel](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Set Root Directory to `/client`

2. **Configure Build Settings**
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Environment Variables**
   In Vercel dashboard, go to Settings → Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

### Option 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd client
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add REACT_APP_API_URL
   ```

## 🔧 Production Configuration

### Backend Environment Variables
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/athlete-edge
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-url.vercel.app
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Frontend Environment Variables
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### Update API Configuration

Update `client/src/services/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## 🧪 Testing Deployment

1. **Test Backend**
   ```bash
   curl https://your-backend-url.railway.app/api/health
   ```

2. **Test Frontend**
   - Visit your Vercel URL
   - Try creating an account
   - Test the login flow

3. **Test Database Connection**
   - Create a test user account
   - Verify data is saved to MongoDB Atlas

## 🔒 Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] MongoDB user has limited permissions
- [ ] Environment variables are set correctly
- [ ] CORS is configured for production URLs
- [ ] HTTPS is enabled (automatic with Railway/Vercel)

## 📊 Monitoring

### Railway
- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts for errors

### Vercel
- View analytics in Vercel dashboard
- Monitor performance metrics
- Check build logs

## 🔄 Updates and Maintenance

### Backend Updates
1. Push changes to GitHub
2. Railway auto-deploys from main branch
3. Monitor deployment logs

### Frontend Updates
1. Push changes to GitHub
2. Vercel auto-deploys from main branch
3. Check build status in dashboard

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check environment variables are set
- Verify MongoDB connection string
- Check Railway logs for errors

**Frontend can't connect to backend:**
- Verify REACT_APP_API_URL is correct
- Check CORS configuration
- Ensure backend is running

**Database connection fails:**
- Check MongoDB Atlas network access
- Verify connection string format
- Check user permissions

**Build failures:**
- Check package.json dependencies
- Verify build commands
- Check for TypeScript errors

## 💰 Cost Estimation

### Free Tier Limits
- **Railway**: $5 credit monthly (usually covers small apps)
- **Vercel**: 100GB bandwidth, unlimited deployments
- **MongoDB Atlas**: 512MB storage, shared clusters

### Paid Tiers (when scaling)
- **Railway**: $5/month per service
- **Vercel Pro**: $20/month for advanced features
- **MongoDB Atlas**: $9/month for M10 cluster

## 🎯 Next Steps

1. **Set up monitoring** with services like Sentry
2. **Configure backups** for MongoDB Atlas
3. **Set up CI/CD** pipelines
4. **Add custom domain** names
5. **Implement caching** with Redis
6. **Add CDN** for static assets

---

Your AthleteEdge application should now be live and accessible to users worldwide! 🚀
