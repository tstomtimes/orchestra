#!/usr/bin/env bash
# hooks/before_task.sh
# Non-interactive task clarity reminder
set -euo pipefail

# Allow disabling via environment variable for troubleshooting
if [ "${ORCHESTRA_DISABLE_PROMPT_HOOKS:-0}" = "1" ] || [ "${ORCHESTRA_DISABLE_TASK_HOOK:-0}" = "1" ]; then
  exit 0
fi

# Get language setting from environment
LANG="${ORCHESTRA_LANGUAGE:-en}"

# Read JSON input from stdin
INPUT_JSON=$(cat)

# Extract prompt from JSON
USER_PROMPT=$(echo "$INPUT_JSON" | jq -r '.prompt // empty' 2>/dev/null || echo "")

# Skip if no prompt (shouldn't happen in UserPromptSubmit)
if [ -z "$USER_PROMPT" ]; then
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit"
  }
}
EOF
  exit 0
fi

# Only show reminder for substantial requests (skip questions or very short asks)
PROMPT_LOWER=$(echo "$USER_PROMPT" | tr '[:upper:]' '[:lower:]')
if echo "$PROMPT_LOWER" | grep -qE "(what|how|why|show|explain|tell).*\?"; then
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit"
  }
}
EOF
  exit 0
fi
if [ "$(echo "$PROMPT_LOWER" | wc -w | tr -d ' ')" -lt 6 ]; then
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit"
  }
}
EOF
  exit 0
fi

# Build concise reminder text
TASK_FILE=".claude/current-task.md"
case "$LANG" in
  "ja")
    CONTEXT=$'💡 タスク開始前チェック\n- 完了基準\n- スコープ\n- テスト方法\n'
    if echo "$PROMPT_LOWER" | grep -qE "(fast|faster|slow|slower|easy|simple|clean|better|improve|optimize)"; then
      CONTEXT+=$'⚠️ 曖昧な用語あり：必要なら Riley に相談。\n'
    fi
    if [ -f "$TASK_FILE" ]; then
      CONTEXT+=$"📋 参照: $TASK_FILE\n"
    fi
    ;;
  *)
    CONTEXT=$'💡 Task readiness check\n- Acceptance criteria\n- Scope & boundaries\n- Test plan\n'
    if echo "$PROMPT_LOWER" | grep -qE "(fast|faster|slow|slower|easy|simple|clean|better|improve|optimize)"; then
      CONTEXT+=$'⚠️ Subjective wording spotted—consider looping in Riley.\n'
    fi
    if [ -f "$TASK_FILE" ]; then
      CONTEXT+=$"📋 Reference: $TASK_FILE\n"
    fi
    ;;
esac

# Output JSON format for Claude's context
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": $(echo "$CONTEXT" | jq -Rs .)
  }
}
EOF

# Always approve - this is just informational
exit 0
