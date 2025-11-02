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
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

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
echo -e "${YELLOW}[2/6] Setting up environment configuration...${NC}"

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
echo -e "${YELLOW}[3/6] Installing MCP server dependencies...${NC}"

cd "$PROJECT_ROOT/orchestra-plugin/mcp-servers"

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

# Step 4: Make scripts executable
echo -e "${YELLOW}[4/6] Setting up executable permissions...${NC}"

cd "$PROJECT_ROOT"

# Make all shell scripts executable
chmod +x orchestra-plugin/mcp-servers/*.sh
chmod +x orchestra-plugin/hooks/*.sh
echo -e "${GREEN}✓ All scripts are now executable${NC}"

echo ""

# Step 5: Create artifacts directory and setup Claude hooks
echo -e "${YELLOW}[5/6] Setting up artifacts and hooks...${NC}"

mkdir -p "$PROJECT_ROOT/artifacts/browser"
mkdir -p "$PROJECT_ROOT/artifacts/commits"
echo -e "${GREEN}✓ Artifacts directories created${NC}"

# Create .claude directories and symlink Orchestra Plugin components
mkdir -p "$PROJECT_ROOT/.claude/hooks"
mkdir -p "$PROJECT_ROOT/.claude/commands"

# Symlink auto-approve hook
ln -sf "$PROJECT_ROOT/orchestra-plugin/hooks/user-prompt-submit.sh" "$PROJECT_ROOT/.claude/hooks/user-prompt-submit.sh"
echo -e "${GREEN}✓ Auto-approve hook installed${NC}"
echo -e "${BLUE}  (Enable autonomous operation - blocks dangerous commands only)${NC}"

# Symlink slash commands
ln -sf "$PROJECT_ROOT/orchestra-plugin/.claude/commands/browser.md" "$PROJECT_ROOT/.claude/commands/browser.md"
ln -sf "$PROJECT_ROOT/orchestra-plugin/.claude/commands/screenshot.md" "$PROJECT_ROOT/.claude/commands/screenshot.md"
echo -e "${GREEN}✓ Slash commands installed (/browser, /screenshot)${NC}"

echo ""

# Step 6: Test installations
echo -e "${YELLOW}[6/6] Testing installations...${NC}"

# Test ElevenLabs server (if API key is set)
if grep -q "ELEVENLABS_API_KEY=sk-" "$PROJECT_ROOT/.env" 2>/dev/null; then
    echo -e "${BLUE}Testing ElevenLabs server...${NC}"
    cd "$PROJECT_ROOT/orchestra-plugin/mcp-servers"
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
echo ""

echo -e "${YELLOW}2. Start the Browser MCP server:${NC}"
echo -e "   ${BLUE}cd orchestra-plugin/mcp-servers${NC}"
echo -e "   ${BLUE}npm run browser &${NC}"
echo ""

echo -e "${YELLOW}3. Test browser automation:${NC}"
echo -e "   ${BLUE}./orchestra-plugin/mcp-servers/browser-helper.sh init${NC}"
echo -e "   ${BLUE}./orchestra-plugin/mcp-servers/browser-helper.sh navigate https://example.com${NC}"
echo -e "   ${BLUE}./orchestra-plugin/mcp-servers/browser-helper.sh screenshot example.png true${NC}"
echo -e "   ${BLUE}./orchestra-plugin/mcp-servers/browser-helper.sh close${NC}"
echo ""

echo -e "${YELLOW}4. Test voice notifications (if ELEVENLABS_API_KEY is set):${NC}"
echo -e "   ${BLUE}./orchestra-plugin/mcp-servers/play-voice.sh alex task${NC}"
echo ""

echo -e "${YELLOW}5. Test auto-commit:${NC}"
echo -e "   ${BLUE}./orchestra-plugin/mcp-servers/auto-commit.sh feat \"to add new feature\" \"Add cool functionality\" \"Alex\"${NC}"
echo ""

echo -e "${GREEN}🎉 Happy orchestrating!${NC}\n"

# Optional: Auto-start browser server
read -p "$(echo -e ${YELLOW}Would you like to start the Browser MCP server now? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$PROJECT_ROOT/orchestra-plugin/mcp-servers"
    echo -e "${BLUE}Starting Browser MCP server...${NC}"
    npm run browser &
    sleep 3

    # Test health
    if curl -s http://localhost:3030/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Browser MCP server is running on http://localhost:3030${NC}"
    else
        echo -e "${RED}❌ Failed to start Browser MCP server${NC}"
    fi
fi

echo ""
echo -e "${BLUE}For more information, see: ${PROJECT_ROOT}/README.md${NC}"
