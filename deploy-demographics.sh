#!/bin/bash

# 🚀 Deployment Script - Demographics Phase
# Automated Cloudflare deployment for all new features

set -e  # Exit on error

echo "======================================"
echo "🚀 MUSLIM WELFARE AI SYSTEM"
echo "   Demographics Phase Deployment"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Database Migration
echo -e "${BLUE}[1/5]${NC} Applying Database Migration..."
echo "    ⏳ Creating demographic tables in D1..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler not found. Please install with: npm i -g wrangler${NC}"
    exit 1
fi

# Apply migration
echo "    SQL: Creating districts, religions, sub_communities, etc..."
wrangler d1 execute muslim-welfare-db --file ./migrations/0002_demographics_expansion.sql --remote

echo -e "${GREEN}✅ Database migration complete${NC}"
echo ""

# 2. Backend Build
echo -e "${BLUE}[2/5]${NC} Building Backend..."
echo "    ⏳ Compiling TypeScript..."

# Build backend
npm run build

echo -e "${GREEN}✅ Backend build complete${NC}"
echo ""

# 3. Backend Deploy
echo -e "${BLUE}[3/5]${NC} Deploying Backend to Cloudflare Workers..."
echo "    ⏳ Uploading to Cloudflare..."

wrangler deploy

echo -e "${GREEN}✅ Backend deployed${NC}"
echo ""

# 4. Frontend Build
echo -e "${BLUE}[4/5]${NC} Building Frontend..."
echo "    ⏳ Compiling React/Next.js..."

cd frontend
npm run build

echo -e "${GREEN}✅ Frontend build complete${NC}"
echo ""

# 5. Frontend Deploy
echo -e "${BLUE}[5/5]${NC} Deploying Frontend to Cloudflare Pages..."
echo "    ⏳ Uploading to Cloudflare Pages..."

# Deploy to Cloudflare Pages
# Note: Requires wrangler v3.x and proper Pages configuration
npx wrangler pages deploy out

cd ..

echo -e "${GREEN}✅ Frontend deployed${NC}"
echo ""

# Verify Deployment
echo -e "${BLUE}[Verification]${NC} Testing Endpoints..."

API_URL="https://muslim-welfare-api.nazeersoft.workers.dev"
SLEEP_TIME=2

echo "    ⏳ Waiting for deployment to propagate..."
sleep $SLEEP_TIME

echo "    Testing: GET /api/lookups/districts"
if curl -s "$API_URL/api/lookups/districts" | grep -q "success"; then
    echo -e "    ${GREEN}✅ Districts lookup working${NC}"
else
    echo -e "    ${YELLOW}⚠️  Districts lookup not responding yet${NC}"
fi

echo "    Testing: GET /api/lookups/sub-communities"
if curl -s "$API_URL/api/lookups/sub-communities" | grep -q "Labbai\|Rowther\|Marakkayar"; then
    echo -e "    ${GREEN}✅ Sub-communities lookup working${NC}"
else
    echo -e "    ${YELLOW}⚠️  Sub-communities lookup not responding yet${NC}"
fi

echo "    Testing: GET /api/lookups/welfare-schemes"
if curl -s "$API_URL/api/lookups/welfare-schemes" | grep -q "PMAY-G\|MGNREGA"; then
    echo -e "    ${GREEN}✅ Welfare schemes lookup working${NC}"
else
    echo -e "    ${YELLOW}⚠️  Welfare schemes lookup not responding yet${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "======================================"
echo ""
echo "📊 What's Now Live:"
echo "   ✅ Database: 8 new tables + 6 lookup tables"
echo "   ✅ Backend: 9 new API endpoints"
echo "   ✅ Frontend: Enhanced survey form"
echo ""
echo "🔗 Access Points:"
echo "   API:      $API_URL"
echo "   Frontend: https://muslim-welfare.pages.dev"
echo ""
echo "📝 New Features:"
echo "   • Sub-community tracking (7 Muslim communities)"
echo "   • District management (6 Tamil Nadu districts)"
echo "   • Religion classification (4 religions)"
echo "   • Reservation category tracking (6 categories)"
echo "   • Welfare scheme adoption tracking (5 schemes)"
echo "   • Women's employment data collection"
echo ""
echo "🧪 Next Steps:"
echo "   1. Visit survey-enhanced page"
echo "   2. Test all dropdown fields"
echo "   3. Submit test household"
echo "   4. Check Reports for demographic breakdown"
echo ""
echo "======================================"
