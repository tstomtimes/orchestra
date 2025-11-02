#!/usr/bin/env bash
# Helper script to run MCP servers with virtual environment

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VENV_DIR="$SCRIPT_DIR/venv"

# Load environment variables from .env file
ENV_FILE="$SCRIPT_DIR/../../.env"
if [ -f "$ENV_FILE" ]; then
    # Export all non-comment, non-empty lines from .env
    export $(grep -v '^#' "$ENV_FILE" | grep -E '=' | xargs)
fi

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "❌ Virtual environment not found. Please run ./install.sh first."
    exit 1
fi

# Check if a server script is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <server-script.py> [json-input]"
    echo ""
    echo "Examples:"
    echo "  $0 github-server.py '{\"command\":\"get_repo_status\",\"params\":{\"owner\":\"user\",\"repo\":\"repo\"}}'"
    echo "  echo '{\"command\":\"list_themes\",\"params\":{}}' | $0 shopify-server.py"
    exit 1
fi

SERVER_SCRIPT="$1"
shift

# Use virtual environment Python
PYTHON="$VENV_DIR/bin/python3"

# Run the server
if [ $# -eq 0 ]; then
    # Read from stdin
    "$PYTHON" "$SCRIPT_DIR/$SERVER_SCRIPT"
else
    # Use provided JSON
    echo "$1" | "$PYTHON" "$SCRIPT_DIR/$SERVER_SCRIPT"
fi
