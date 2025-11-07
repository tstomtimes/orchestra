#!/usr/bin/env bash
# MCP Servers Installation Script

set -euo pipefail

echo "🚀 Installing Orchestra Plugin MCP Servers..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Found Python $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
VENV_DIR="$SCRIPT_DIR/venv"
if [ ! -d "$VENV_DIR" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv "$VENV_DIR" || {
        echo "❌ Failed to create virtual environment"
        exit 1
    }
    echo "✅ Virtual environment created"
fi

# Activate virtual environment and install dependencies
echo ""
echo "📦 Installing Python dependencies in virtual environment..."
source "$VENV_DIR/bin/activate"

pip install -r "$SCRIPT_DIR/requirements.txt" --quiet || {
    echo "❌ Failed to install Python dependencies"
    echo ""
    echo "💡 Tip: If this fails, try manually:"
    echo "   cd $SCRIPT_DIR"
    echo "   source venv/bin/activate"
    echo "   pip install -r requirements.txt"
    deactivate
    exit 1
}

deactivate
echo "✅ Python dependencies installed in virtual environment"

# Make MCP servers executable
echo ""
echo "🔧 Making MCP servers executable..."
chmod +x "$SCRIPT_DIR"/github-server.py
chmod +x "$SCRIPT_DIR"/shopify-server.py
chmod +x "$SCRIPT_DIR"/shopify-app-server.py
chmod +x "$SCRIPT_DIR"/vercel-server.py
chmod +x "$SCRIPT_DIR"/slack-server.py
chmod +x "$SCRIPT_DIR"/elevenlabs-server.py
echo "✅ MCP servers are now executable"

# Check for .env file
ENV_FILE="$SCRIPT_DIR/../../.env"
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "⚠️  No .env file found. Creating from .env.example..."
    if [ -f "$SCRIPT_DIR/../../.env.example" ]; then
        cp "$SCRIPT_DIR/../../.env.example" "$ENV_FILE"
        echo "✅ Created .env file. Please edit it with your API tokens."
    else
        echo "❌ .env.example not found. Please create a .env file manually."
    fi
else
    echo ""
    echo "✅ .env file exists"
fi

# Test MCP servers
echo ""
echo "🧪 Testing MCP servers..."

test_server() {
    local server_name=$1
    local server_script=$2
    local requires_shopify_env=$3

    if [ -f "$SCRIPT_DIR/$server_script" ]; then
        if [[ "$requires_shopify_env" == "true" ]]; then
            # Check if Shopify environment variables are set
            if [[ -n "${SHOPIFY_ADMIN_TOKEN:-}" && -n "${SHOP_DOMAIN:-}" ]]; then
                echo "  ✅ $server_name: Ready (credentials configured)"
            else
                echo "  ⚠️  $server_name: Available but needs credentials"
                echo "     Missing: SHOPIFY_ADMIN_TOKEN and/or SHOP_DOMAIN"
            fi
        else
            # No environment variables required
            echo "  ✅ $server_name: Ready"
        fi
    else
        echo "  ❌ $server_name: Script not found"
    fi
}

# Load .env for validation
if [ -f "$SCRIPT_DIR/../.env" ]; then
    set -a
    source "$SCRIPT_DIR/../.env" 2>/dev/null || true
    set +a
fi

test_server "GitHub MCP Server" "github-server.py" "false"
test_server "Shopify Theme MCP Server" "shopify-server.py" "true"
test_server "Shopify App MCP Server" "shopify-app-server.py" "true"
test_server "Vercel MCP Server" "vercel-server.py" "false"
test_server "Slack MCP Server" "slack-server.py" "false"
test_server "ElevenLabs TTS MCP Server" "elevenlabs-server.py" "false"

echo ""
echo "ℹ️  Shopify Dev MCP (@shopify/dev-mcp) is always available via npx"
echo "   No credentials required for documentation and validation features"

echo ""
echo "✅ MCP Servers installation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env file with your API tokens"
echo "   2. Configure Claude Code to use these MCP servers"
echo "   3. Test the servers with your actual API credentials"
echo ""
echo "📚 Usage examples:"
echo "   # GitHub: List PRs"
echo "   echo '{\"command\":\"list_prs\",\"params\":{\"owner\":\"owner\",\"repo\":\"repo\"}}' | python3 $SCRIPT_DIR/github-server.py"
echo ""
echo "   # Shopify Theme: List themes"
echo "   echo '{\"command\":\"list_themes\",\"params\":{}}' | python3 $SCRIPT_DIR/shopify-server.py"
echo ""
echo "   # Shopify App: List products"
echo "   echo '{\"command\":\"list_products\",\"params\":{\"limit\":10}}' | python3 $SCRIPT_DIR/shopify-app-server.py"
echo ""
echo "   # Vercel: List deployments"
echo "   echo '{\"command\":\"list_deployments\",\"params\":{}}' | python3 $SCRIPT_DIR/vercel-server.py"
echo ""
echo "   # Slack: Send message"
echo "   echo '{\"command\":\"send_message\",\"params\":{\"channel\":\"#general\",\"text\":\"Hello!\"}}' | python3 $SCRIPT_DIR/slack-server.py"
echo ""
echo "   # ElevenLabs: Agent voice notification (requires VOICE_ENABLED=true)"
echo "   echo '{\"command\":\"announce_task_complete\",\"params\":{\"agent_name\":\"blake\",\"task_description\":\"deployment complete\"}}' | python3 $SCRIPT_DIR/elevenlabs-server.py"
echo ""
