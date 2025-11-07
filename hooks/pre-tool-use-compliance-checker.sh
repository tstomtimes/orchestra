#!/usr/bin/env bash
# Agent Routing Compliance Checker
# Enforces agent routing rules by checking if Task tool was called first
#
# This hook ensures Claude follows the mandatory routing workflow

set -euo pipefail

# Allow disabling via environment variable for troubleshooting
if [ "${ORCHESTRA_DISABLE_PROMPT_HOOKS:-0}" = "1" ] || [ "${ORCHESTRA_DISABLE_ROUTING_HOOK:-0}" = "1" ]; then
    exit 0
fi

# jq is required to inspect tool payload; if unavailable, skip
if ! command -v jq >/dev/null 2>&1; then
    exit 0
fi

# Get language setting from environment
LANG="${ORCHESTRA_LANGUAGE:-en}"

# Read JSON input from stdin
INPUT_JSON=$(cat)

# Extract tool details from JSON
TOOL_NAME=$(echo "$INPUT_JSON" | jq -r '.tool_name // empty' 2>/dev/null || echo "")

# Get the routing flag for this process
TEMP_DIR="${TMPDIR:-/tmp}"
ROUTING_FLAG="$TEMP_DIR/orchestra_routing_required"
NOTICE_FILE="$TEMP_DIR/orchestra_routing_notified"

# Check if routing reminder is active
if [ -f "$ROUTING_FLAG" ]; then
    REQUIRED_AGENT=$(cat "$ROUTING_FLAG")

    # If routing reminder is active and tool is NOT Task, warn Claude
    if [ "$TOOL_NAME" != "Task" ]; then
        if [ ! -f "$NOTICE_FILE" ]; then
            if [ "$LANG" = "ja" ]; then
                cat <<EOF
💡 まず Task ツールで subagent_type="orchestra:$REQUIRED_AGENT" を呼び出すとスムーズです。
エージェントからの対応を受け取った後に他のツールを使ってください。
EOF
            else
                cat <<EOF
💡 Start with Task tool using subagent_type="orchestra:$REQUIRED_AGENT" for smoother coordination.
Follow-up tools are fine after that agent's response.
EOF
            fi
            echo "$REQUIRED_AGENT" > "$NOTICE_FILE"
        fi
        exit 0

    else
        # Task tool was used - check if it's the correct agent
        SUBAGENT_TYPE=$(echo "$INPUT_JSON" | jq -r '.tool_input.subagent_type // empty' 2>/dev/null || echo "")

        if echo "$SUBAGENT_TYPE" | grep -q "$REQUIRED_AGENT"; then
            # Correct agent called - clear the flag
            rm -f "$ROUTING_FLAG" "$NOTICE_FILE"

            if [ "$LANG" = "ja" ]; then
                echo "✅ コンプライアンスチェック通過：正しいエージェントが呼び出されました"
            else
                echo "✅ Compliance check passed: Correct agent invoked"
            fi
        else
            # Wrong agent - warn
            if [ "$LANG" = "ja" ]; then
                echo "⚠️ subagent_type に \"$REQUIRED_AGENT\" を含めて呼び出してください。"
            else
                echo "⚠️ Please include \"$REQUIRED_AGENT\" in subagent_type for the Task call."
            fi
        fi
    fi
fi

# Always approve (we're just adding warnings, not blocking)
exit 0
