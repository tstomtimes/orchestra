#!/usr/bin/env bash
# hooks/before_task.sh
# Non-interactive task clarity reminder
set -euo pipefail

# Get language setting from environment
LANG="${ORCHESTRA_LANGUAGE:-en}"

# Read JSON input from stdin
INPUT_JSON=$(cat)

# Extract prompt from JSON
USER_PROMPT=$(echo "$INPUT_JSON" | jq -r '.prompt // empty' 2>/dev/null || echo "")

# Skip if no prompt (shouldn't happen in UserPromptSubmit)
if [ -z "$USER_PROMPT" ]; then
  exit 0
fi

# Only show reminder for substantial requests (skip simple queries)
PROMPT_LOWER=$(echo "$USER_PROMPT" | tr '[:upper:]' '[:lower:]')
if echo "$PROMPT_LOWER" | grep -qE "(what|how|why|show|explain|tell).*\?"; then
  # This looks like a question, not a task
  exit 0
fi

# Build context message based on language
if [ "$LANG" = "ja" ]; then
  CONTEXT=$(cat <<EOF

💡 タスク明確化のベストプラクティス
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

実装開始前に、タスクに以下が含まれることを確認：
   ✓ 明確な完了基準
   ✓ 定義されたスコープと境界
   ✓ 成功指標またはテストケース

EOF
)

  # Check for ambiguous language in the prompt
  if echo "$PROMPT_LOWER" | grep -qE "(fast|faster|slow|slower|easy|simple|clean|better|improve|optimize)"; then
    CONTEXT+=$(cat <<EOF
⚠️  主観的な表現を検出：Rileyエージェントに明確化を依頼することを検討

EOF
)
  fi

  # Check if task file exists for formal task tracking
  TASK_FILE=".claude/current-task.md"
  if [ -f "$TASK_FILE" ]; then
    CONTEXT+=$(cat <<EOF
📋 タスク定義ファイル：$TASK_FILE

EOF
)

    TASK_CONTENT=$(cat "$TASK_FILE")

    # Quick validation
    has_issues=false

    if ! echo "$TASK_CONTENT" | grep -qiE "(acceptance criteria|AC:|done when|success criteria|完了基準|受け入れ基準)"; then
      CONTEXT+="   ⚠️  完了基準が不足"$'\n'
      has_issues=true
    fi

    if ! echo "$TASK_CONTENT" | grep -qiE "(scope|in scope|out of scope|boundaries|スコープ|範囲)"; then
      CONTEXT+="   ⚠️  スコープ定義が不足"$'\n'
      has_issues=true
    fi

    if ! echo "$TASK_CONTENT" | grep -qiE "(test|testing|verify|validation|テスト|検証)"; then
      CONTEXT+="   ⚠️  テスト計画が不足"$'\n'
      has_issues=true
    fi

    if [ "$has_issues" = false ]; then
      CONTEXT+="   ✅ タスク定義は良好"$'\n'
    fi
    CONTEXT+=$'\n'
  fi

  CONTEXT+=$(cat <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
)
else
  CONTEXT=$(cat <<EOF

💡 Task Clarity Best Practice
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before starting implementation, ensure your task has:
   ✓ Clear acceptance criteria
   ✓ Defined scope and boundaries
   ✓ Success metrics or test cases

EOF
)

  # Check for ambiguous language in the prompt
  if echo "$PROMPT_LOWER" | grep -qE "(fast|faster|slow|slower|easy|simple|clean|better|improve|optimize)"; then
    CONTEXT+=$(cat <<EOF
⚠️  Detected subjective language: Consider clarifying with Riley agent

EOF
)
  fi

  # Check if task file exists for formal task tracking
  TASK_FILE=".claude/current-task.md"
  if [ -f "$TASK_FILE" ]; then
    CONTEXT+=$(cat <<EOF
📋 Task definition found: $TASK_FILE

EOF
)

    TASK_CONTENT=$(cat "$TASK_FILE")

    # Quick validation
    has_issues=false

    if ! echo "$TASK_CONTENT" | grep -qiE "(acceptance criteria|AC:|done when|success criteria)"; then
      CONTEXT+="   ⚠️  Missing acceptance criteria"$'\n'
      has_issues=true
    fi

    if ! echo "$TASK_CONTENT" | grep -qiE "(scope|in scope|out of scope|boundaries)"; then
      CONTEXT+="   ⚠️  Missing scope definition"$'\n'
      has_issues=true
    fi

    if ! echo "$TASK_CONTENT" | grep -qiE "(test|testing|verify|validation)"; then
      CONTEXT+="   ⚠️  Missing test plan"$'\n'
      has_issues=true
    fi

    if [ "$has_issues" = false ]; then
      CONTEXT+="   ✅ Task definition looks good"$'\n'
    fi
    CONTEXT+=$'\n'
  fi

  CONTEXT+=$(cat <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
)
fi

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
