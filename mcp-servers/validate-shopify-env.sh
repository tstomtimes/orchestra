#!/usr/bin/env bash
# Shopify Environment Variable Validation Script
#
# Purpose: Check if required Shopify environment variables are configured
# Returns: FULL, PARTIAL, or NONE
#
# FULL    - Both SHOPIFY_ADMIN_TOKEN and SHOP_DOMAIN are set
# PARTIAL - Only one of the required variables is set
# NONE    - Neither variable is set
#
# Usage:
#   bash validate-shopify-env.sh
#
# Example:
#   SHOPIFY_STATUS=$(bash validate-shopify-env.sh)
#   if [[ "$SHOPIFY_STATUS" == "FULL" ]]; then
#       echo "All Shopify MCP servers available"
#   fi

set -euo pipefail

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load .env if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    # Export variables from .env without exposing values in logs
    set -a
    source "$PROJECT_ROOT/.env" 2>/dev/null || true
    set +a
fi

# Check environment variables
has_token=false
has_domain=false

[[ -n "${SHOPIFY_ADMIN_TOKEN:-}" ]] && has_token=true
[[ -n "${SHOP_DOMAIN:-}" ]] && has_domain=true

# Return status based on what's configured
if [[ "$has_token" == true && "$has_domain" == true ]]; then
    echo "FULL"
elif [[ "$has_token" == true || "$has_domain" == true ]]; then
    echo "PARTIAL"
else
    echo "NONE"
fi
