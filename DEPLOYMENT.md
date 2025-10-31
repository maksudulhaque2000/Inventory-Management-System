# Deployment Guide

## Vercel Deployment Steps

### 1. Prepare Your Code
- Ensure all code is committed to a Git repository (GitHub, GitLab, or Bitbucket)

### 2. Set Up MongoDB
- Create a MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- Create a new cluster (free tier is sufficient)
- Create a database user
- Whitelist IP addresses (use 0.0.0.0/0 for Vercel or specific Vercel IPs)
- Get your connection string (replace <password> with your actual password)

### 3. Deploy to Vercel
1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 4. Add Environment Variables
In Vercel project settings, add these environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventory-app?retryWrites=true&w=majority
NEXTAUTH_SECRET=generate-a-random-secret-key-here
NEXTAUTH_URL=https://your-project-name.vercel.app
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 5. Deploy
- Click "Deploy"
- Wait for the build to complete
- Your app will be live!

## Local Development Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd App
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
MONGODB_URI=mongodb://localhost:27017/inventory-app
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/inventory-app?retryWrites=true&w=majority

NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000

## Troubleshooting

### Build Fails
- Ensure all environment variables are set in Vercel
- Check MongoDB connection string format
- Verify Node.js version is 18+

### Database Connection Issues
- Check MongoDB Atlas IP whitelist
- Verify database user credentials
- Ensure connection string is correct

### Authentication Not Working
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your deployment URL

## Production Checklist

- [ ] MongoDB Atlas cluster is set up
- [ ] Database user is created
- [ ] IP addresses are whitelisted
- [ ] Environment variables are set in Vercel
- [ ] NEXTAUTH_SECRET is generated and set
- [ ] NEXTAUTH_URL matches deployment URL
- [ ] Build completes successfully
- [ ] Application is accessible

## Notes

- The application uses JWT tokens stored in localStorage for authentication
- For production, consider implementing more secure token storage
- MongoDB connection is handled with connection pooling for optimal performance
- All API routes require authentication token in headers

