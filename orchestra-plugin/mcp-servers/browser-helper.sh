#!/usr/bin/env bash
# Browser Helper Script
# Convenient wrapper for browser MCP operations

set -euo pipefail

BROWSER_URL="${BROWSER_MCP_URL:-http://localhost:9222}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function: Make API call
api_call() {
    local endpoint="$1"
    local data="${2:-}"

    if [ -z "$data" ]; then
        curl -s "$BROWSER_URL/$endpoint"
    else
        curl -s -X POST "$BROWSER_URL/$endpoint" \
            -H 'Content-Type: application/json' \
            -d "$data"
    fi
}

# Check if server is running
check_server() {
    if ! curl -s "$BROWSER_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}❌ Browser MCP server is not running${NC}" >&2
        echo "   Start it with: cd orchestra-plugin/mcp-servers && npm run browser" >&2
        exit 1
    fi
}

# Commands
case "${1:-help}" in
    init)
        check_server
        curl -s -X POST "$BROWSER_URL/init" | jq
        ;;

    navigate|nav|open)
        check_server
        URL="${2:-}"
        if [ -z "$URL" ]; then
            echo "Usage: $0 navigate <url>" >&2
            exit 1
        fi
        api_call "navigate" "{\"url\":\"$URL\"}" | jq
        ;;

    click)
        check_server
        SELECTOR="${2:-}"
        if [ -z "$SELECTOR" ]; then
            echo "Usage: $0 click <selector>" >&2
            exit 1
        fi
        api_call "click" "{\"selector\":\"$SELECTOR\"}" | jq
        ;;

    type|input)
        check_server
        SELECTOR="${2:-}"
        TEXT="${3:-}"
        PRESS_ENTER="${4:-false}"
        if [ -z "$SELECTOR" ] || [ -z "$TEXT" ]; then
            echo "Usage: $0 type <selector> <text> [pressEnter]" >&2
            exit 1
        fi
        api_call "type" "{\"selector\":\"$SELECTOR\",\"text\":\"$TEXT\",\"pressEnter\":$PRESS_ENTER}" | jq
        ;;

    auth|authenticate)
        check_server
        TYPE="${2:-}"
        PW_SELECTOR="${3:-input[type=password]}"
        SUBMIT_SELECTOR="${4:-}"
        if [ -z "$TYPE" ]; then
            echo "Usage: $0 auth <type> [passwordSelector] [submitSelector]" >&2
            echo "Types: shopify-store, staging, preview, or custom" >&2
            exit 1
        fi

        # Try auth without password first (check if env var exists)
        if [ -z "$SUBMIT_SELECTOR" ]; then
            RESPONSE=$(api_call "auth" "{\"type\":\"$TYPE\",\"passwordSelector\":\"$PW_SELECTOR\"}")
        else
            RESPONSE=$(api_call "auth" "{\"type\":\"$TYPE\",\"passwordSelector\":\"$PW_SELECTOR\",\"submitSelector\":\"$SUBMIT_SELECTOR\"}")
        fi

        # Check if password is needed
        NEEDS_PASSWORD=$(echo "$RESPONSE" | jq -r '.needsPassword // false')

        if [ "$NEEDS_PASSWORD" = "true" ]; then
            # Password required - prompt user
            PROMPT_MSG=$(echo "$RESPONSE" | jq -r '.prompt')
            ENV_VAR_NAME=$(echo "$RESPONSE" | jq -r '.envVarName')

            echo -e "${YELLOW}$PROMPT_MSG${NC}" >&2
            read -s -p "Password: " PASSWORD
            echo "" >&2

            # Retry with password
            if [ -z "$SUBMIT_SELECTOR" ]; then
                RESPONSE=$(api_call "auth" "{\"type\":\"$TYPE\",\"passwordSelector\":\"$PW_SELECTOR\",\"password\":\"$PASSWORD\"}")
            else
                RESPONSE=$(api_call "auth" "{\"type\":\"$TYPE\",\"passwordSelector\":\"$PW_SELECTOR\",\"submitSelector\":\"$SUBMIT_SELECTOR\",\"password\":\"$PASSWORD\"}")
            fi

            # Check if 2FA is required
            REQUIRES_2FA=$(echo "$RESPONSE" | jq -r '.requires2FA // false')

            if [ "$REQUIRES_2FA" = "true" ]; then
                echo -e "${YELLOW}⏳ 2FA detected. Please complete authentication in the browser window.${NC}" >&2
                echo -e "${YELLOW}   Waiting for 2FA completion (timeout: 2 minutes)...${NC}" >&2

                # Wait for 2FA completion
                WAIT_RESPONSE=$(curl -s -X POST "$BROWSER_URL/auth/wait-2fa" \
                    -H 'Content-Type: application/json' \
                    -d '{"timeout":120000}')

                COMPLETED=$(echo "$WAIT_RESPONSE" | jq -r '.completed // false')

                if [ "$COMPLETED" = "true" ]; then
                    echo -e "${GREEN}✅ 2FA completed successfully${NC}" >&2
                    RESPONSE="$WAIT_RESPONSE"
                else
                    echo -e "${RED}⏱️  2FA timeout - please complete authentication and try again${NC}" >&2
                fi
            fi

            # Check if we should save the password
            SHOULD_SAVE=$(echo "$RESPONSE" | jq -r '.shouldSavePassword // false')

            if [ "$SHOULD_SAVE" = "true" ]; then
                ENV_VAR_NAME=$(echo "$RESPONSE" | jq -r '.envVarName')
                echo -e "${YELLOW}Save this password to .env for future use? (y/n)${NC}" >&2
                read -p "> " SAVE_CHOICE

                if [ "$SAVE_CHOICE" = "y" ] || [ "$SAVE_CHOICE" = "Y" ]; then
                    # Save password to .env
                    SAVE_RESPONSE=$(curl -s -X POST "$BROWSER_URL/auth/save" \
                        -H 'Content-Type: application/json' \
                        -d "{\"envVarName\":\"$ENV_VAR_NAME\",\"password\":\"$PASSWORD\"}")

                    SAVE_OK=$(echo "$SAVE_RESPONSE" | jq -r '.ok // false')
                    if [ "$SAVE_OK" = "true" ]; then
                        echo -e "${GREEN}✅ Password saved to .env as $ENV_VAR_NAME${NC}" >&2
                    else
                        echo -e "${RED}❌ Failed to save password${NC}" >&2
                    fi
                fi
            fi
        fi

        echo "$RESPONSE" | jq
        ;;

    wait)
        check_server
        SELECTOR="${2:-}"
        TIMEOUT="${3:-15000}"
        if [ -z "$SELECTOR" ]; then
            echo "Usage: $0 wait <selector> [timeout_ms]" >&2
            exit 1
        fi
        api_call "wait" "{\"selector\":\"$SELECTOR\",\"timeout\":$TIMEOUT}" | jq
        ;;

    scrape)
        check_server
        SELECTOR="${2:-}"
        LIMIT="${3:-50}"
        if [ -z "$SELECTOR" ]; then
            echo "Usage: $0 scrape <selector> [limit]" >&2
            exit 1
        fi
        api_call "scrape" "{\"selector\":\"$SELECTOR\",\"limit\":$LIMIT}" | jq
        ;;

    screenshot|snap)
        check_server
        FILENAME="${2:-screenshot.png}"
        FULLPAGE="${3:-false}"
        api_call "screenshot" "{\"filename\":\"$FILENAME\",\"fullPage\":$FULLPAGE}" | jq
        ;;

    content|html)
        check_server
        curl -s -X POST "$BROWSER_URL/content" | jq
        ;;

    eval|evaluate)
        check_server
        EXPRESSION="${2:-}"
        if [ -z "$EXPRESSION" ]; then
            echo "Usage: $0 eval <javascript_expression>" >&2
            exit 1
        fi
        api_call "evaluate" "{\"expression\":\"$EXPRESSION\"}" | jq
        ;;

    close|quit)
        check_server
        curl -s -X POST "$BROWSER_URL/close" | jq
        ;;

    health|status)
        check_server
        curl -s "$BROWSER_URL/health" | jq
        ;;

    help|--help|-h)
        cat << EOF
Browser Helper Script - Convenient wrapper for browser MCP operations

Usage: $0 <command> [arguments]

Commands:
  init                          Initialize browser session
  navigate <url>                Navigate to URL
  click <selector>              Click element
  type <selector> <text> [enter] Type text into element
  auth <type> [pwSelector] [submitSelector] Authenticate with password
  wait <selector> [timeout]     Wait for element to appear
  scrape <selector> [limit]     Scrape text content from elements
  screenshot [filename] [full]  Take screenshot
  content                       Get page HTML content
  evaluate <expression>         Evaluate JavaScript
  close                         Close browser session
  health                        Check server status

Auth Types (Built-in):
  shopify-store                 Use SHOPIFY_STORE_PASSWORD env var
  staging                       Use STAGING_PASSWORD env var
  preview                       Use PREVIEW_PASSWORD env var
  <custom-type>                 Use {CUSTOM_TYPE}_PASSWORD env var
                                (e.g., 'my-site' → MY_SITE_PASSWORD)

Interactive Authentication:
  If password not in .env, you will be prompted to enter it.
  After successful login, you can save it to .env for future use.

Examples:
  $0 init
  $0 navigate https://example.com
  $0 wait "main"
  $0 screenshot homepage.png true
  $0 scrape "h2.title" 20
  $0 evaluate "document.title"

  # Authentication (will prompt if password not in .env)
  $0 auth shopify-store "input[type=password]" "button[type=submit]"
  $0 auth my-custom-site  # Uses MY_CUSTOM_SITE_PASSWORD

  $0 close

Environment Variables:
  BROWSER_MCP_URL              Browser MCP server URL (default: http://localhost:3030)

See: orchestra-plugin/agents/skills/web-browse.md for full documentation
EOF
        ;;

    *)
        echo -e "${RED}Unknown command: $1${NC}" >&2
        echo "Run '$0 help' for usage" >&2
        exit 1
        ;;
esac
