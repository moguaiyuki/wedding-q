#!/bin/bash

# Wedding Quiz App - Deployment Script
# This script handles the deployment to Vercel

set -e  # Exit on error

echo "🚀 Starting deployment process for Wedding Quiz App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Vercel CLI is installed
if ! command_exists vercel; then
    echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "📝 Checking Vercel authentication..."
if ! vercel whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}Not logged in to Vercel. Please login:${NC}"
    vercel login
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix the errors and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}Build completed successfully!${NC}"

# Check environment variables
echo "🔐 Checking environment variables..."

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "ADMIN_PASSWORD"
    "NEXT_PUBLIC_APP_URL"
)

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}.env.production not found. Checking Vercel environment variables...${NC}"
    
    # List current environment variables in Vercel
    echo "Current Vercel environment variables:"
    vercel env ls
    
    echo ""
    echo "Required environment variables:"
    for var in "${REQUIRED_VARS[@]}"; do
        echo "  - $var"
    done
    
    echo ""
    read -p "Do you want to set environment variables now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for var in "${REQUIRED_VARS[@]}"; do
            echo "Setting $var..."
            read -p "Enter value for $var: " value
            echo "$value" | vercel env add "$var" production
        done
    fi
else
    echo -e "${GREEN}.env.production found.${NC}"
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."

# Check if this is first deployment or not
if [ ! -f .vercel/project.json ]; then
    echo "First deployment detected. Setting up Vercel project..."
    vercel --prod
else
    # Deploy to production
    vercel --prod --yes
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "")
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        echo -e "${GREEN}🌐 Your app is live at: https://$DEPLOYMENT_URL${NC}"
    else
        echo -e "${GREEN}🌐 Deployment complete! Check your Vercel dashboard for the URL.${NC}"
    fi
    
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "  1. Test the QR code login with TEST001"
    echo "  2. Verify admin login at /admin"
    echo "  3. Check real-time features are working"
    echo "  4. Test on mobile devices"
    echo ""
    echo "💡 Tips:"
    echo "  - View logs: vercel logs"
    echo "  - Open dashboard: vercel"
    echo "  - Rollback if needed: vercel rollback"
else
    echo -e "${RED}❌ Deployment failed. Please check the errors above.${NC}"
    exit 1
fi