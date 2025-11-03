#!/bin/bash

# Orchestra Progress Tracking - Utility Library
# Version: 2.0.0
# Provides shared functions for progress tracking system

# Valid Orchestra agent names
VALID_AGENTS=("Alex" "Blake" "Eden" "Finn" "Iris" "Kai" "Leo" "Mina" "Nova" "Riley" "Skye" "Theo")

# Agent emoji mapping (from .claude.json)
declare -A AGENT_EMOJI=(
    ["Alex"]="🙂"
    ["Blake"]="😎"
    ["Eden"]="🤓"
    ["Finn"]="😤"
    ["Iris"]="🤨"
    ["Kai"]="🤔"
    ["Leo"]="😌"
    ["Mina"]="😊"
    ["Nova"]="😄"
    ["Riley"]="🧐"
    ["Skye"]="😐"
    ["Theo"]="😬"
    ["Unknown"]="❓"
)

# Detect agent from todo fields using multi-strategy heuristic
# Arguments:
#   $1 - activeForm field from todo
#   $2 - content field from todo
#   $3 - progress file path (optional, for fallback)
# Returns: Agent name (or "Unknown" if detection fails)
detect_agent_from_todo() {
    local active_form="$1"
    local content="$2"
    local progress_file="${3:-}"

    # Strategy 1: Parse activeForm for agent name prefix (highest confidence)
    # Pattern: "Skye is implementing...", "Kai designing..."
    for agent in "${VALID_AGENTS[@]}"; do
        if [[ "$active_form" =~ ^$agent[[:space:]] ]] || [[ "$active_form" =~ ^$agent$ ]]; then
            echo "$agent"
            return 0
        fi
    done

    # Strategy 2: Parse content for bracketed agent (medium confidence)
    # Pattern: "[Nova] Build dashboard", "[Kai] Design API"
    if [[ "$content" =~ \[([A-Z][a-z]+)\] ]]; then
        local candidate="${BASH_REMATCH[1]}"
        if is_valid_agent "$candidate"; then
            echo "$candidate"
            return 0
        fi
    fi

    # Strategy 3: Parse content for parenthesized agent (medium confidence)
    # Pattern: "Design API (Kai)", "Build feature (Nova)"
    if [[ "$content" =~ \(([A-Z][a-z]+)\) ]]; then
        local candidate="${BASH_REMATCH[1]}"
        if is_valid_agent "$candidate"; then
            echo "$candidate"
            return 0
        fi
    fi

    # Strategy 4: Check for agent name anywhere in activeForm (lower confidence)
    for agent in "${VALID_AGENTS[@]}"; do
        if [[ "$active_form" == *"$agent"* ]]; then
            echo "$agent"
            return 0
        fi
    done

    # Strategy 5: Use last known agent from metadata (fallback)
    if [ -n "$progress_file" ] && [ -f "$progress_file" ]; then
        local last_agent=$(jq -r '.metadata.currentAgent // "Unknown"' "$progress_file" 2>/dev/null || echo "Unknown")
        if [ "$last_agent" != "null" ] && [ "$last_agent" != "Unknown" ]; then
            echo "$last_agent"
            return 0
        fi
    fi

    # Fallback: Unknown
    echo "Unknown"
    return 0
}

# Check if agent name is valid
# Arguments:
#   $1 - Agent name to validate
# Returns: 0 if valid, 1 if invalid
is_valid_agent() {
    local name="$1"
    for agent in "${VALID_AGENTS[@]}"; do
        if [ "$agent" = "$name" ]; then
            return 0
        fi
    done
    return 1
}

# Format duration in human-readable form
# Arguments:
#   $1 - Duration in milliseconds
# Returns: Formatted string (e.g., "3m 42s", "1h 23m")
format_duration() {
    local ms="$1"
    local seconds=$((ms / 1000))
    local minutes=$((seconds / 60))
    local hours=$((minutes / 60))

    if [ $hours -gt 0 ]; then
        echo "${hours}h $((minutes % 60))m"
    elif [ $minutes -gt 0 ]; then
        echo "${minutes}m $((seconds % 60))s"
    else
        echo "${seconds}s"
    fi
}

# Generate ASCII progress bar
# Arguments:
#   $1 - Percentage (0-100)
#   $2 - Width (optional, default 10)
# Returns: Progress bar string [▓▓▓░░░]
format_progress_bar() {
    local percentage="${1:-0}"
    local width="${2:-10}"

    # Ensure percentage is within bounds
    if [ "$percentage" -lt 0 ]; then percentage=0; fi
    if [ "$percentage" -gt 100 ]; then percentage=100; fi

    local filled=$((percentage * width / 100))
    local empty=$((width - filled))

    printf "["
    for ((i=0; i<filled; i++)); do printf "▓"; done
    for ((i=0; i<empty; i++)); do printf "░"; done
    printf "]"
}

# Initialize progress file with empty v2.0 schema
# Arguments:
#   $1 - Progress file path
# Returns: 0 on success
init_progress_file_if_missing() {
    local file="$1"

    # Create parent directory if needed
    mkdir -p "$(dirname "$file")"

    if [ ! -f "$file" ]; then
        local timestamp=$(date +%s%3N)
        cat > "$file" << EOF
{
  "schemaVersion": "2.0",
  "todos": [],
  "metadata": {
    "sessionStartTime": $timestamp,
    "lastUpdateTime": $timestamp,
    "activeAgents": [],
    "totalTokensEstimated": 0,
    "completionRate": 0,
    "totalTasks": 0,
    "completedTasks": 0,
    "inProgressTasks": 0,
    "pendingTasks": 0,
    "currentAgent": "Unknown"
  },
  "history": []
}
EOF
        return 0
    fi

    return 0
}

# Update metadata section with calculated statistics
# Arguments:
#   $1 - Progress file path
#   $2 - Current timestamp (milliseconds)
# Returns: 0 on success
update_metadata() {
    local file="$1"
    local timestamp="$2"

    local temp_file="${file}.meta.tmp"

    jq --argjson timestamp "$timestamp" '
        .metadata.lastUpdateTime = $timestamp |
        .metadata.totalTasks = (.todos | length) |
        .metadata.completedTasks = ([.todos[] | select(.status == "completed")] | length) |
        .metadata.inProgressTasks = ([.todos[] | select(.status == "in_progress")] | length) |
        .metadata.pendingTasks = ([.todos[] | select(.status == "pending")] | length) |
        .metadata.completionRate = (
            if .metadata.totalTasks > 0 then
                ((.metadata.completedTasks * 100 / .metadata.totalTasks) | floor)
            else 0 end
        ) |
        .metadata.activeAgents = ([.todos[] | select(.status == "in_progress") | .agent] | unique)
    ' "$file" > "$temp_file" && mv "$temp_file" "$file"

    return $?
}

# Add history entry to audit trail
# Arguments:
#   $1 - Progress file path
#   $2 - Timestamp (milliseconds)
#   $3 - Event type
#   $4 - Task ID (optional, use "null" for session events)
#   $5 - Agent name (optional)
#   $6 - Details (optional)
# Returns: 0 on success
add_history_entry() {
    local file="$1"
    local timestamp="$2"
    local event="$3"
    local task_id="${4:-null}"
    local agent="${5:-null}"
    local details="${6:-null}"

    local temp_file="${file}.history.tmp"

    # Sanitize inputs for JSON
    if [ "$task_id" = "null" ] || [ -z "$task_id" ]; then
        task_id="null"
    else
        task_id="\"$task_id\""
    fi

    if [ "$agent" = "null" ] || [ -z "$agent" ]; then
        agent="null"
    else
        agent="\"$agent\""
    fi

    if [ "$details" = "null" ] || [ -z "$details" ]; then
        details="null"
    else
        # Escape quotes in details
        details=$(echo "$details" | sed 's/"/\\"/g')
        details="\"$details\""
    fi

    jq --argjson timestamp "$timestamp" \
       --arg event "$event" \
       ".history += [{
           timestamp: \$timestamp,
           event: \$event,
           taskId: $task_id,
           agent: $agent,
           details: $details
       }]" "$file" > "$temp_file" && mv "$temp_file" "$file"

    return $?
}

# Centralized logging function
# Arguments:
#   $1 - Log level (INFO, WARN, ERROR, DEBUG)
#   $2 - Log message
# Returns: 0 on success
log_event() {
    local level="$1"
    local message="$2"

    # Determine project root (traverse up from script location)
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_root="$(cd "$script_dir/../.." && pwd)"
    local log_file="$project_root/.orchestra/logs/progress-tracker.log"

    # Create log directory if needed
    mkdir -p "$(dirname "$log_file")"

    # Write log entry
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [$level] $message" >> "$log_file"

    # Also output to stderr if DEBUG mode enabled
    if [ "${ORCHESTRA_DEBUG:-0}" = "1" ]; then
        echo "[PROGRESS-UTILS] [$level] $message" >&2
    fi

    return 0
}

# Get agent emoji for display
# Arguments:
#   $1 - Agent name
# Returns: Emoji character
get_agent_emoji() {
    local agent="$1"
    echo "${AGENT_EMOJI[$agent]:-❓}"
}

# Calculate task progress percentage
# Arguments:
#   $1 - Current step
#   $2 - Total steps
# Returns: Percentage (0-100)
calculate_task_progress() {
    local current="${1:-0}"
    local total="${2:-0}"

    if [ "$total" -eq 0 ] || [ "$current" -eq 0 ]; then
        echo "0"
        return 0
    fi

    local percentage=$((current * 100 / total))
    echo "$percentage"
}

# Sanitize string for JSON inclusion
# Arguments:
#   $1 - Input string
# Returns: Sanitized string
sanitize_json_field() {
    local input="$1"

    # Escape backslashes, quotes, newlines, tabs
    echo "$input" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\n/\\n/g; s/\t/\\t/g'
}

# Get current timestamp in milliseconds
# Returns: Unix timestamp in milliseconds
get_timestamp_ms() {
    date +%s%3N
}

# ANSI color codes for terminal formatting
export COLOR_RESET='\e[0m'
export COLOR_BOLD='\e[1m'
export COLOR_GREEN='\e[32m'
export COLOR_YELLOW='\e[33m'
export COLOR_GRAY='\e[90m'
export COLOR_BLUE='\e[34m'
export COLOR_RED='\e[31m'

# Status indicator symbols
export SYMBOL_COMPLETED="✅"
export SYMBOL_IN_PROGRESS="⚡"
export SYMBOL_PENDING="⏳"
export SYMBOL_FAILED="❌"

# Get status symbol
# Arguments:
#   $1 - Status (completed, in_progress, pending)
# Returns: Status symbol
get_status_symbol() {
    case "$1" in
        completed)
            echo "$SYMBOL_COMPLETED"
            ;;
        in_progress)
            echo "$SYMBOL_IN_PROGRESS"
            ;;
        pending)
            echo "$SYMBOL_PENDING"
            ;;
        failed)
            echo "$SYMBOL_FAILED"
            ;;
        *)
            echo "•"
            ;;
    esac
}

# Get status color
# Arguments:
#   $1 - Status (completed, in_progress, pending)
# Returns: ANSI color code
get_status_color() {
    case "$1" in
        completed)
            echo "$COLOR_GREEN"
            ;;
        in_progress)
            echo "$COLOR_YELLOW"
            ;;
        pending)
            echo "$COLOR_GRAY"
            ;;
        failed)
            echo "$COLOR_RED"
            ;;
        *)
            echo "$COLOR_RESET"
            ;;
    esac
}

# Export functions for use in other scripts
export -f detect_agent_from_todo
export -f is_valid_agent
export -f format_duration
export -f format_progress_bar
export -f init_progress_file_if_missing
export -f update_metadata
export -f add_history_entry
export -f log_event
export -f get_agent_emoji
export -f calculate_task_progress
export -f sanitize_json_field
export -f get_timestamp_ms
export -f get_status_symbol
export -f get_status_color
