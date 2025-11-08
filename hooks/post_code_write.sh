#!/bin/bash

# Post Code Write Hook
# Runs after TodoWrite tool usage
# Performs: Progress tracking update, display, auto-linting, code formatting

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="${PROJECT_ROOT:-$( cd "$SCRIPT_DIR/../.." && pwd )}"

# Read hook JSON input from stdin if available
HOOK_INPUT=""
if [ ! -t 0 ]; then
    HOOK_INPUT=$(cat 2>/dev/null || echo "")
fi

# Extract tool name from hook input
TOOL_NAME=""
if [ -n "$HOOK_INPUT" ] && command -v jq &> /dev/null; then
    TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")
fi

# Only proceed if this is a TodoWrite tool call
if [ "$TOOL_NAME" != "TodoWrite" ]; then
    exit 0
fi

# Function to update progress data
update_progress_data() {
    # Debug log file
    local debug_log="$PROJECT_ROOT/.orchestra/cache/hook-debug.log"

    # Use the HOOK_INPUT that was already read from stdin
    local hook_input="$HOOK_INPUT"

    # Log hook input for debugging
    if [ -n "$hook_input" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Hook input received" >> "$debug_log"
        echo "$hook_input" >> "$debug_log"
    fi

    # Extract tool_input from hook JSON
    local tool_params=""
    if [ -n "$hook_input" ]; then
        # Parse tool_input from hook JSON using jq
        if command -v jq &> /dev/null; then
            tool_params=$(echo "$hook_input" | jq -c '.tool_input' 2>/dev/null || echo "")
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Extracted tool_input: $tool_params" >> "$debug_log"
        fi
    fi

    # Fallback to CLAUDE_TOOL_PARAMS environment variable
    if [ -z "$tool_params" ] || [ "$tool_params" = "null" ]; then
        tool_params="${CLAUDE_TOOL_PARAMS:-}"
        if [ -n "$tool_params" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Using CLAUDE_TOOL_PARAMS: $tool_params" >> "$debug_log"
        fi
    fi

    # Update progress data if we have parameters
    if [ -n "$tool_params" ] && [ "$tool_params" != "{}" ] && [ "$tool_params" != "null" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Calling progress-tracker-update.sh" >> "$debug_log"
        if [ -f "$PROJECT_ROOT/hooks/progress-tracker-update.sh" ]; then
            echo "$tool_params" | bash "$PROJECT_ROOT/hooks/progress-tracker-update.sh" || true
        fi
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] No tool params to process" >> "$debug_log"
    fi
}

# Function to display progress tracker output
display_progress_tracking() {
    # Run the progress display hook
    if [ -f "$PROJECT_ROOT/hooks/progress-tracker-display.sh" ]; then
        bash "$PROJECT_ROOT/hooks/progress-tracker-display.sh"
    fi
}

# Function to run linting/formatting
run_code_quality_checks() {
    ORCHESTRA_CONFIG=".orchestra/config.json"

    if [ ! -f "$ORCHESTRA_CONFIG" ]; then
        return 0
    fi

    CHANGED_FILE="$1"
    AUTO_LINT=$(jq -r '.workflow.autoLint // false' "$ORCHESTRA_CONFIG" 2>/dev/null || echo "false")
    AUTO_FIX_LINT=$(jq -r '.workflow.autoFixLint // false' "$ORCHESTRA_CONFIG" 2>/dev/null || echo "false")

    if [ "$AUTO_LINT" = "true" ] || [ "$AUTO_FIX_LINT" = "true" ]; then
        echo "🔧 Running linting and formatting..."

        # TypeScript/JavaScript files
        if [[ "$CHANGED_FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
            if command -v eslint &> /dev/null; then
                if [ "$AUTO_FIX_LINT" = "true" ]; then
                    echo "   Applying ESLint fixes..."
                    eslint --fix "$CHANGED_FILE" 2>/dev/null || true
                else
                    echo "   Checking with ESLint..."
                    eslint "$CHANGED_FILE" 2>/dev/null || true
                fi
            fi

            if command -v prettier &> /dev/null; then
                echo "   Applying Prettier formatting..."
                prettier --write "$CHANGED_FILE" 2>/dev/null || true
            fi
        fi

        # Python files
        if [[ "$CHANGED_FILE" =~ \.py$ ]]; then
            if command -v black &> /dev/null; then
                echo "   Applying Black formatting..."
                black "$CHANGED_FILE" 2>/dev/null || true
            fi

            if command -v isort &> /dev/null; then
                echo "   Sorting imports with isort..."
                isort "$CHANGED_FILE" 2>/dev/null || true
            fi
        fi

        echo "✅ Linting and formatting complete"
    fi
}

# Function to extract agent and play voice notification
play_voice_notification() {
    # Only if voice is enabled
    if [ "${VOICE_ENABLED:-false}" != "true" ]; then
        return 0
    fi

    # Get most recently completed task from progress data
    local progress_file="$PROJECT_ROOT/.orchestra/cache/progress.json"

    if [ ! -f "$progress_file" ]; then
        return 0
    fi

    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        return 0
    fi

    # Extract recently completed tasks (status changed to completed)
    local completed_tasks=$(jq -r '.tasks[] | select(.status == "completed") | .content' "$progress_file" 2>/dev/null || echo "")

    if [ -z "$completed_tasks" ]; then
        return 0
    fi

    # Get the last completed task
    local last_completed=$(echo "$completed_tasks" | tail -1)

    # Extract agent name from task content (format: [Agent] task description)
    local agent_name=$(echo "$last_completed" | grep -oE '\[([A-Z][a-z]+)\]' | tr -d '[]' | tr '[:upper:]' '[:lower:]' || echo "")

    if [ -z "$agent_name" ]; then
        return 0
    fi

    # Extract task description (remove [Agent] prefix)
    local task_desc=$(echo "$last_completed" | sed 's/\[[^]]*\]\s*//')

    # Play voice notification in background
    local voice_script="$PROJECT_ROOT/mcp-servers/play-voice.sh"
    if [ -f "$voice_script" ] && [ -x "$voice_script" ]; then
        "$voice_script" "$agent_name" "$task_desc" 2>/dev/null &
    fi
}

# Main execution
# Lightweight mode: Only display progress, skip heavy processing

# 1. Display updated progress (lightweight)
display_progress_tracking

# Skip: Update progress data (heavy processing)
# Skip: Voice notifications (ElevenLabs API calls)
# Skip: Export progress (file I/O)
# Skip: Code quality checks (linting/formatting)

exit 0
