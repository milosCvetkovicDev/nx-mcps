#!/bin/bash

# Test script for affected MCP server detection

set -e

echo "🔍 Testing affected MCP server detection..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get base commit (default to HEAD~1)
BASE=${1:-HEAD~1}
HEAD=${2:-HEAD}

echo -e "${BLUE}Base:${NC} $BASE"
echo -e "${BLUE}Head:${NC} $HEAD"
echo ""

# Test NX affected detection
echo "1. Testing NX affected detection:"
echo -e "${YELLOW}Running: nx show projects --affected --base=$BASE --head=$HEAD --type app${NC}"
AFFECTED_APPS=$(nx show projects --affected --base=$BASE --head=$HEAD --type app 2>/dev/null || echo "")

if [ -z "$AFFECTED_APPS" ]; then
    echo -e "${RED}No affected applications found${NC}"
else
    echo -e "${GREEN}Affected applications:${NC} $AFFECTED_APPS"
fi

echo ""

# Test MCP server filtering
echo "2. Testing MCP server filtering:"
if [ -n "$AFFECTED_APPS" ]; then
    MCP_SERVERS=""
    # Process apps line by line (NX 19+ format)
    while IFS= read -r app; do
        app=$(echo "$app" | xargs) # Trim whitespace
        if [ -n "$app" ]; then
            echo -n "  Checking $app... "
            TAGS=$(nx show project "$app" --json 2>/dev/null | jq -r '.tags[]?' 2>/dev/null || echo "")
            if echo "$TAGS" | grep -q "mcp-server"; then
                echo -e "${GREEN}✓ MCP server${NC}"
                if [ -z "$MCP_SERVERS" ]; then
                    MCP_SERVERS="$app"
                else
                    MCP_SERVERS="$MCP_SERVERS,$app"
                fi
            else
                echo -e "${YELLOW}✗ Not an MCP server${NC}"
            fi
        fi
    done <<< "$AFFECTED_APPS"
    echo ""
    
    if [ -z "$MCP_SERVERS" ]; then
        echo -e "${YELLOW}No affected MCP servers found${NC}"
    else
        echo -e "${GREEN}Affected MCP servers:${NC} $MCP_SERVERS"
    fi
else
    echo -e "${YELLOW}No applications to check${NC}"
fi

echo ""

# Test configuration generation
echo "3. Testing configuration generation:"
# Get script directory and navigate to terraform
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/../terraform"

if [ -x "scripts/generate-affected-config.js" ]; then
    echo -e "${YELLOW}Running configuration generator...${NC}"
    node scripts/generate-affected-config.js --base=$BASE --head=$HEAD --env=test
    
    echo ""
    echo "Generated files:"
    for file in affected-apps.tf affected-apps-variables.tf affected-apps-outputs.tf affected-apps.auto.tfvars affected-apps.json; do
        if [ -f "$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file ($(wc -l < "$file") lines)"
        else
            echo -e "  ${RED}✗${NC} $file"
        fi
    done
    
    if [ -f "affected-apps.json" ]; then
        echo ""
        echo "Affected apps from generated config:"
        jq -r '.apps[]? | "  - \(.name) (\(.root))"' affected-apps.json 2>/dev/null || echo "  (empty)"
    fi
else
    echo -e "${RED}Configuration generator not found or not executable${NC}"
fi

echo ""
echo "✨ Test complete!"
echo ""
echo "To deploy affected MCP servers:"
echo "  npm run deploy:affected:dev       # Deploy to dev"
echo "  npm run deploy:affected:staging   # Deploy to staging"
echo "  npm run deploy:affected:production # Deploy to production" 