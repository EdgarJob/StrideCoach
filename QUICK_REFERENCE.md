# 🚀 StrideCoach Quick Reference

## 📍 Current Status
- **Live App:** [Your Netlify URL] (check Netlify dashboard)
- **Main Branch:** Production-ready, stable version
- **Development Branch:** Ready for new features

## 🔄 Daily Workflow

### **To Add New Features:**
```bash
# Make sure you're on development branch
git checkout development

# Make your changes
# ... edit files ...

# Test locally
npm start

# Commit and push
git add -A
git commit -m "feat: Add new feature"
git push origin development
```

### **To Deploy to Production:**
```bash
# Switch to main branch
git checkout main

# Merge development changes
git merge development

# Push to trigger Netlify deployment
git push origin main
```

## 🛠️ Common Commands

```bash
# Start development server
npm start

# Build for web (test locally)
npm run build:web

# Install dependencies
npm install --legacy-peer-deps

# Check current branch
git branch

# Switch branches
git checkout main
git checkout development
```

## 🔧 Troubleshooting

### **Build Fails on Netlify:**
1. Check Netlify build logs
2. Test locally: `npm run build:web`
3. Fix issues on development branch
4. Merge to main when fixed

### **Dependencies Issues:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### **App Not Loading:**
1. Check environment variables in Netlify
2. Verify Supabase connection
3. Check browser console for errors

## 📱 Next Steps

1. **Test the live app** - Make sure everything works
2. **Add features** - Work on development branch
3. **Mobile app** - Use Expo EAS Build
4. **Custom domain** - Add your own domain

## 🎯 Key Files

- `netlify.toml` - Deployment configuration
- `package.json` - Dependencies and scripts
- `src/` - All your app code
- `DEPLOYMENT_SUCCESS.md` - Full success story
- `NETLIFY_DEPLOYMENT.md` - Deployment guide
