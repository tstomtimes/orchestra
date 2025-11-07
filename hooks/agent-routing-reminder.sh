#!/usr/bin/env bash
# Agent Auto-Routing Reminder Hook (minimal version)
# Simplified to avoid hook validation errors

set -euo pipefail

# Allow disabling via environment variable
if [ "${ORCHESTRA_DISABLE_PROMPT_HOOKS:-0}" = "1" ] || [ "${ORCHESTRA_DISABLE_ROUTING_HOOK:-0}" = "1" ]; then
    cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit"
  }
}
EOF
    exit 0
fi

# Read input and validate
INPUT_JSON=$(cat 2>/dev/null || echo '{}')

# Simple valid output
cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit"
  }
}
EOF

exit 0
