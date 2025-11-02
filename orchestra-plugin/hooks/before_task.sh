# hooks/before_task.sh
#!/usr/bin/env bash
set -euo pipefail
echo "[before_task] Checking clarity & acceptance criteria..."

# Extract task information from context
TASK_DESCRIPTION="${TASK_DESCRIPTION:-}"
TASK_FILE="${TASK_FILE:-.claude/current-task.md}"

# Check if task context exists
if [ -z "$TASK_DESCRIPTION" ] && [ ! -f "$TASK_FILE" ]; then
  echo "⚠️  No task description provided."
  echo ""
  echo "Before starting work, please ensure the task has:"
  echo "  • Clear acceptance criteria"
  echo "  • Defined scope and boundaries"
  echo "  • Success metrics or test cases"
  echo ""
  echo "Would you like to proceed without a formal task definition? (y/N)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Task blocked. Please define task requirements first."
    exit 1
  fi
  exit 0
fi

# Read task from file if available
if [ -f "$TASK_FILE" ]; then
  TASK_CONTENT=$(cat "$TASK_FILE")
else
  TASK_CONTENT="$TASK_DESCRIPTION"
fi

echo "→ Analyzing task clarity..."

# Required elements for a well-defined task
has_acceptance_criteria=false
has_scope_definition=false
has_test_plan=false
missing_elements=()

# Check for acceptance criteria
if echo "$TASK_CONTENT" | grep -qiE "(acceptance criteria|AC:|done when|success criteria)"; then
  has_acceptance_criteria=true
  echo "  ✅ Acceptance criteria defined"
else
  missing_elements+=("Acceptance criteria")
  echo "  ❌ Missing acceptance criteria"
fi

# Check for scope definition
if echo "$TASK_CONTENT" | grep -qiE "(scope|in scope|out of scope|boundaries|requirements)"; then
  has_scope_definition=true
  echo "  ✅ Scope defined"
else
  missing_elements+=("Scope definition")
  echo "  ❌ Missing scope definition"
fi

# Check for test plan or test cases
if echo "$TASK_CONTENT" | grep -qiE "(test|testing|test plan|test case|verify|validation)"; then
  has_test_plan=true
  echo "  ✅ Test plan mentioned"
else
  missing_elements+=("Test plan")
  echo "  ❌ Missing test plan"
fi

# Warning for ambiguous language
if echo "$TASK_CONTENT" | grep -qiE "(maybe|possibly|might|could|should probably|if needed)"; then
  echo "  ⚠️  Warning: Task contains ambiguous language (maybe, possibly, might, could)"
fi

# Report missing elements
if [ ${#missing_elements[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  Task clarity issues detected:"
  printf '   - %s\n' "${missing_elements[@]}"
  echo ""
  echo "Recommendations:"
  echo "  • Add specific acceptance criteria (e.g., 'Done when all tests pass')"
  echo "  • Define clear scope boundaries (what's in/out of scope)"
  echo "  • Include test cases or validation steps"
  echo ""
  echo "Continue anyway? (y/N)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Task blocked. Please clarify requirements first."
    exit 1
  fi
fi

# Check for related context
if [ -f "docs/ARCHITECTURE.md" ]; then
  echo "  ℹ️  Tip: Review docs/ARCHITECTURE.md for context"
fi

if [ -f "CONTRIBUTING.md" ]; then
  echo "  ℹ️  Tip: Review CONTRIBUTING.md for guidelines"
fi

# Voice notification (Alex announces task ready)
VOICE_SCRIPT="$(dirname "$0")/../mcp-servers/play-voice.sh"
if [ -f "$VOICE_SCRIPT" ]; then
  "$VOICE_SCRIPT" "alex" "task scoping" 2>/dev/null || true
fi

echo ""
echo "✅ Task clarity check complete. Proceeding with work..."
echo ""
echo "Task Summary:"
echo "─────────────────────────────────────"
echo "$TASK_CONTENT" | head -10
echo "─────────────────────────────────────"

# Auto-commit task scoping analysis (Alex)
AUTO_COMMIT_SCRIPT="$(dirname "$0")/../mcp-servers/auto-commit.sh"
if [ -f "$AUTO_COMMIT_SCRIPT" ] && [ -x "$AUTO_COMMIT_SCRIPT" ]; then
  "$AUTO_COMMIT_SCRIPT" \
    "docs" \
    "to document task requirements" \
    "Complete task clarity analysis and scoping" \
    "Alex" 2>/dev/null || true
fi