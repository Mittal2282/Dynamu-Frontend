#!/bin/bash

# Frontend Deployment Script for Vite + S3
# Run this in your Vite project root directory
# Usage: bash deploy-frontend.sh

set -e

echo "=========================================="
echo "🚀 Frontend Deployment Script"
echo "=========================================="

# Configuration
BUCKET_NAME="mp-app-fe-24-04-2026"
REGION="us-east-2"
CLOUDFRONT_DISTRIBUTION_ID="EIC6GO7D2F8W6"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from your Vite project root directory"
    exit 1
fi

echo -e "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🔨 Step 2: Building Vite app...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: dist folder not created${NC}"
    exit 1
fi

echo -e "${YELLOW}📤 Step 3: Uploading to S3...${NC}"
aws s3 sync dist/ s3://${BUCKET_NAME} --delete --region ${REGION}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ S3 upload successful${NC}"
else
    echo -e "${RED}❌ S3 upload failed${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Step 4: Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation \
  --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
  --paths '/*' \
  --region ${REGION}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
else
    echo -e "${RED}❌ CloudFront invalidation failed${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Frontend deployment complete!${NC}"
echo "=========================================="
echo ""
echo "Your app is live at:"
echo -e "${GREEN}  https://dynamuai.com${NC}"
echo ""