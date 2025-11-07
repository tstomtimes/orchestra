#!/usr/bin/env bash
# Orchestra Plugin Setup Script
# One-command installation for all MCP servers and dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🎼 Orchestra Plugin Setup                          ║
║        AI-Powered Development Workflow Automation         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Detect project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}📂 Project root: ${PROJECT_ROOT}${NC}\n"

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8+ first.${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "${GREEN}✓ Python $(python3 --version)${NC}"

# Check jq (optional but recommended)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq is not installed. Browser helper will not format JSON output.${NC}"
    echo -e "${YELLOW}   Install with: brew install jq (macOS) or apt install jq (Linux)${NC}"
else
    echo -e "${GREEN}✓ jq $(jq --version)${NC}"
fi

echo ""

# Step 2: Create .env file if it doesn't exist
echo -e "${YELLOW}[2/7] Setting up environment configuration...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your API keys:${NC}"
    echo -e "${YELLOW}   - ELEVENLABS_API_KEY (for voice notifications)${NC}"
    echo -e "${YELLOW}   - ANTHROPIC_API_KEY (for AI features)${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""

# Step 3: Install MCP server dependencies
echo -e "${YELLOW}[3/7] Installing MCP server dependencies...${NC}"

cd "$PROJECT_ROOT/mcp-servers"

# Install Node.js dependencies
echo -e "${BLUE}Installing Node.js packages...${NC}"
npm install
echo -e "${GREEN}✓ Node.js packages installed${NC}"

# Install Playwright browsers
echo -e "${BLUE}Installing Playwright Chromium browser...${NC}"
npx playwright install chromium
echo -e "${GREEN}✓ Playwright browser installed${NC}"

# Set up Python virtual environment
echo -e "${BLUE}Setting up Python virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment and install dependencies
echo -e "${BLUE}Installing Python packages...${NC}"
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install elevenlabs requests python-dotenv > /dev/null 2>&1
echo -e "${GREEN}✓ Python packages installed${NC}"

echo ""

# Step 3.5: Validate Shopify configuration
echo -e "${YELLOW}[3.5/7] Validating Shopify MCP configuration...${NC}"

cd "$PROJECT_ROOT"

# Load .env for validation
if [ -f ".env" ]; then
    set -a
    source .env 2>/dev/null || true
    set +a
fi

# Check Shopify environment variables
SHOPIFY_STATUS="NONE"
if [[ -n "${SHOPIFY_ADMIN_TOKEN:-}" && -n "${SHOP_DOMAIN:-}" ]]; then
    SHOPIFY_STATUS="FULL"
    echo -e "${GREEN}✓ Shopify credentials configured (SHOPIFY_ADMIN_TOKEN + SHOP_DOMAIN)${NC}"
    echo -e "${BLUE}  Available servers:${NC}"
    echo -e "${BLUE}    - Shopify Dev MCP (docs, GraphQL validation, Liquid validation)${NC}"
    echo -e "${BLUE}    - Shopify Theme Server (theme management)${NC}"
    echo -e "${BLUE}    - Shopify App Server (products, orders, webhooks, GraphQL)${NC}"
elif [[ -n "${SHOPIFY_ADMIN_TOKEN:-}" || -n "${SHOP_DOMAIN:-}" ]]; then
    SHOPIFY_STATUS="PARTIAL"
    echo -e "${YELLOW}⚠️  Incomplete Shopify configuration${NC}"
    [[ -z "${SHOPIFY_ADMIN_TOKEN:-}" ]] && echo -e "${YELLOW}   Missing: SHOPIFY_ADMIN_TOKEN${NC}"
    [[ -z "${SHOP_DOMAIN:-}" ]] && echo -e "${YELLOW}   Missing: SHOP_DOMAIN${NC}"
    echo -e "${BLUE}  Available servers:${NC}"
    echo -e "${BLUE}    - Shopify Dev MCP only (docs, validation - no auth required)${NC}"
else
    SHOPIFY_STATUS="NONE"
    echo -e "${BLUE}ℹ️  No Shopify credentials configured${NC}"
    echo -e "${BLUE}  Available servers:${NC}"
    echo -e "${BLUE}    - Shopify Dev MCP only (docs, validation - no auth required)${NC}"
    echo -e "${YELLOW}  To enable Theme/App servers, add to .env:${NC}"
    echo -e "${YELLOW}    SHOPIFY_ADMIN_TOKEN=your_token${NC}"
    echo -e "${YELLOW}    SHOP_DOMAIN=your-store${NC}"
fi

echo ""

# Step 4.5: Make scripts executable
echo -e "${YELLOW}[4.5/7] Setting up executable permissions...${NC}"

cd "$PROJECT_ROOT"

# Make all shell scripts executable
chmod +x mcp-servers/*.sh
chmod +x hooks/*.sh
chmod +x .orchestra/scripts/*.sh 2>/dev/null || true
echo -e "${GREEN}✓ All scripts are now executable${NC}"

echo ""

# Step 4.5: Initialize Memory Bank
# Memory Bank provides persistent project knowledge that survives Claude Code session restarts.
# This step automatically creates a structured knowledge base in ~/memory-bank/orchestra/ with:
#   - project-overview.md  : High-level project context and current state
#   - tech-stack.md       : Technology stack, dependencies, and architecture
#   - decisions.md        : Important decisions log (lightweight ADR)
#   - progress.md         : Detailed progress tracking and milestones
#   - next-steps.md       : Immediate action items and roadmap
#
# Benefits:
#   - No more context re-explanation across sessions
#   - All Orchestra agents share the same project understanding
#   - Automatic documentation capture as you work
#   - Progress visibility and milestone tracking
#
# This initialization is non-blocking - if it fails, setup continues normally.
# You can run it manually later: bash .orchestra/scripts/init-memory-bank.sh
#
# Learn more: See MEMORY_BANK_GUIDE.md for complete documentation

echo -e "${YELLOW}[5/7] Initializing Memory Bank...${NC}"
echo -e "${BLUE}Memory Bank provides persistent project knowledge across Claude Code sessions${NC}"

MEMORY_BANK_SCRIPT="$PROJECT_ROOT/.orchestra/scripts/init-memory-bank.sh"
if [ -f "$MEMORY_BANK_SCRIPT" ] && [ -x "$MEMORY_BANK_SCRIPT" ]; then
    if bash "$MEMORY_BANK_SCRIPT"; then
        echo -e "${GREEN}✓ Memory Bank initialized successfully${NC}"
        echo -e "${BLUE}  Location: ~/memory-bank/orchestra/${NC}"
        echo -e "${BLUE}  Created: 5 structured template files (overview, tech-stack, decisions, progress, next-steps)${NC}"
    else
        echo -e "${YELLOW}⚠️  Memory Bank initialization failed (non-critical)${NC}"
        echo -e "${YELLOW}   Setup will continue. You can run initialization manually later:${NC}"
        echo -e "${YELLOW}   bash .orchestra/scripts/init-memory-bank.sh${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Memory Bank initialization script not found${NC}"
    echo -e "${YELLOW}   Expected at: ${MEMORY_BANK_SCRIPT}${NC}"
    echo -e "${YELLOW}   Memory Bank will not be available until script is restored${NC}"
fi

echo ""

# Step 5: Create artifacts directory and setup Claude hooks
echo -e "${YELLOW}[5.5/7] Setting up artifacts and hooks...${NC}"

mkdir -p "$PROJECT_ROOT/artifacts/browser"
mkdir -p "$PROJECT_ROOT/artifacts/commits"
echo -e "${GREEN}✓ Artifacts directories created${NC}"

# Create .claude directories and settings
mkdir -p "$PROJECT_ROOT/.claude/hooks"
mkdir -p "$PROJECT_ROOT/.claude/commands"

# Check .claude/settings.json (managed by git)
if [ -f "$PROJECT_ROOT/.claude/settings.json" ]; then
    echo -e "${GREEN}✓ .claude/settings.json found (git-managed)${NC}"
    echo -e "${BLUE}  Auto-approve enabled with safety guard hook${NC}"
else
    echo -e "${YELLOW}⚠️  .claude/settings.json not found${NC}"
    echo -e "${YELLOW}  This file is git-managed. Restore from repository or git checkout.${NC}"
fi

# Symlink safety guard hook
ln -sf "$PROJECT_ROOT/hooks/user-prompt-submit.sh" "$PROJECT_ROOT/.claude/hooks/user-prompt-submit.sh"
echo -e "${GREEN}✓ Safety guard hook installed${NC}"
echo -e "${BLUE}  (Auto-approve all tools - blocks dangerous commands via PreToolUse hook)${NC}"

# Symlink slash commands
ln -sf "$PROJECT_ROOT/commands/browser.md" "$PROJECT_ROOT/.claude/commands/browser.md"
ln -sf "$PROJECT_ROOT/commands/screenshot.md" "$PROJECT_ROOT/.claude/commands/screenshot.md"
ln -sf "$PROJECT_ROOT/commands/orchestra-setup.md" "$PROJECT_ROOT/.claude/commands/orchestra-setup.md"
echo -e "${GREEN}✓ Slash commands installed (/browser, /screenshot, /orchestra-setup)${NC}"

# Sync .claude.json settings to settings.local.json
echo -e "${BLUE}Syncing .claude.json settings to settings.local.json...${NC}"
if [ -f "$PROJECT_ROOT/hooks/sync-claude-settings.sh" ]; then
    chmod +x "$PROJECT_ROOT/hooks/sync-claude-settings.sh"
    if bash "$PROJECT_ROOT/hooks/sync-claude-settings.sh" false; then
        echo -e "${GREEN}✓ Settings synced successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Settings sync failed (non-critical)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  sync-claude-settings.sh not found, skipping sync${NC}"
fi

echo ""

# Step 6: Test installations
echo -e "${YELLOW}[6.5/7] Testing installations...${NC}"

# Test ElevenLabs server (if API key is set)
if grep -q "ELEVENLABS_API_KEY=sk-" "$PROJECT_ROOT/.env" 2>/dev/null; then
    echo -e "${BLUE}Testing ElevenLabs server...${NC}"
    cd "$PROJECT_ROOT/mcp-servers"
    source venv/bin/activate
    timeout 5 python3 elevenlabs-server.py test 2>/dev/null && echo -e "${GREEN}✓ ElevenLabs server works${NC}" || echo -e "${YELLOW}⚠️  ElevenLabs server needs configuration${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping ElevenLabs test (API key not configured)${NC}"
fi

echo ""

# Summary
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        ✅ Setup Complete!                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}📋 Next steps:${NC}\n"

echo -e "${YELLOW}1. Configure API keys in .env:${NC}"
echo -e "   ${BLUE}vim .env${NC}"
echo -e "   ${BLUE}# Required: GITHUB_TOKEN${NC}"
echo -e "   ${BLUE}# Optional: VERCEL_TOKEN, SHOPIFY_ADMIN_TOKEN, ELEVENLABS_API_KEY, etc.${NC}"
echo ""

echo -e "${YELLOW}2. Install the plugin in Claude Code:${NC}"
echo -e "   ${BLUE}In Claude Code, run the following commands:${NC}"
echo -e "   ${GREEN}/plugin marketplace add $PROJECT_ROOT${NC}"
echo -e "   ${GREEN}/plugin install orchestra${NC}"
echo ""

echo -e "${YELLOW}3. Restart Claude Code to activate all features${NC}"
echo ""

echo -e "${YELLOW}4. Available features after restart:${NC}"
echo -e "   ${BLUE}• /orchestra-setup - Re-run this setup if needed${NC}"
echo -e "   ${BLUE}• /browser - Start Browser MCP server${NC}"
echo -e "   ${BLUE}• /screenshot - Capture web screenshots${NC}"
echo -e "   ${BLUE}• 11 specialized AI agents (Riley, Skye, Finn, Eden, Kai, Leo, Iris, Nova, Mina, Theo, Blake) coordinated by main Claude Code${NC}"
echo -e "   ${BLUE}• Automated quality gates (before_task, before_pr, before_merge, before_deploy, after_deploy)${NC}"
echo -e "   ${BLUE}• Multi-agent orchestration with parallel execution${NC}"
echo ""
echo -e "${YELLOW}5. Memory Bank (Persistent Project Knowledge):${NC}"
echo -e "   ${BLUE}• Location: ~/memory-bank/orchestra/${NC}"
echo -e "   ${BLUE}• 5 structured files: overview, tech-stack, decisions, progress, next-steps${NC}"
echo -e "   ${BLUE}• Survives Claude Code session restarts${NC}"
echo -e "   ${BLUE}• All agents share the same project context${NC}"
echo -e "   ${BLUE}• Learn more: See MEMORY_BANK_GUIDE.md${NC}"
echo ""

echo -e "${GREEN}🎉 Setup complete! Install the plugin in Claude Code to start orchestrating!${NC}\n"

# Optional: Auto-start browser server
read -p "$(echo -e ${YELLOW}Would you like to start the Browser MCP server now? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if server is already running
    if curl -s http://localhost:9222/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Browser MCP server is already running on http://localhost:9222${NC}"
    else
        cd "$PROJECT_ROOT/mcp-servers"
        echo -e "${BLUE}Starting Browser MCP server...${NC}"
        npm run browser &
        sleep 3

        # Test health
        if curl -s http://localhost:9222/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Browser MCP server is running on http://localhost:9222${NC}"
        else
            echo -e "${RED}❌ Failed to start Browser MCP server${NC}"
            echo -e "${YELLOW}⚠️  Check if port 9222 is already in use: lsof -i :9222${NC}"
        fi
    fi
fi

echo ""
echo -e "${BLUE}For more information, see: ${PROJECT_ROOT}/README.md${NC}"
