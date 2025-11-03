#!/bin/bash

# Orchestra Progress Tracker - Update Script
# Version: 2.0.0
# Handles atomic updates to progress.json with file locking
# Called from post_code_write.sh after TodoWrite tool execution

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
PROGRESS_FILE="$PROJECT_ROOT/.orchestra/cache/progress.json"
LOCK_FILE="/tmp/orchestra-progress-lock-${USER}"

# Source utility library
if [ -f "$SCRIPT_DIR/lib/progress-utils.sh" ]; then
    source "$SCRIPT_DIR/lib/progress-utils.sh"
else
    echo "ERROR: progress-utils.sh not found" >&2
    exit 1
fi

# Parse TodoWrite parameters from stdin or argument
parse_tool_params() {
    local params="$1"

    # If params is empty, try to read from stdin
    if [ -z "$params" ]; then
        if [ ! -t 0 ]; then
            params=$(cat)
        fi
    fi

    echo "$params"
}

# Process a single todo item
process_todo() {
    local todo_json="$1"
    local timestamp="$2"

    # Extract fields from todo
    local task_id=$(echo "$todo_json" | jq -r '.id // empty')
    local content=$(echo "$todo_json" | jq -r '.content // empty')
    local active_form=$(echo "$todo_json" | jq -r '.activeForm // empty')
    local status=$(echo "$todo_json" | jq -r '.status // "pending"')
    local parent_id=$(echo "$todo_json" | jq -r '.parentId // null')

    # Validate required fields
    if [ -z "$task_id" ] || [ -z "$content" ]; then
        log_event "WARN" "Skipping todo with missing required fields"
        return 0
    fi

    # Detect agent
    local agent=$(detect_agent_from_todo "$active_form" "$content" "$PROGRESS_FILE")

    log_event "DEBUG" "Processing task $task_id: agent=$agent, status=$status"

    # Check if task already exists
    local existing=$(jq --arg id "$task_id" '.todos[] | select(.id == $id)' "$PROGRESS_FILE" 2>/dev/null || echo "")

    local temp_file="${PROGRESS_FILE}.task.tmp"

    if [ -z "$existing" ]; then
        # New task: add with full metadata
        log_event "INFO" "Creating new task: $task_id (Agent: $agent)"

        jq --arg id "$task_id" \
           --arg content "$content" \
           --arg activeForm "$active_form" \
           --arg status "$status" \
           --arg agent "$agent" \
           --argjson startTime "$timestamp" \
           --argjson lastUpdateTime "$timestamp" \
           --arg parentId "$parent_id" \
           '.todos += [{
               id: $id,
               content: $content,
               activeForm: $activeForm,
               status: $status,
               parentId: (if $parentId == "null" then null else $parentId end),
               agent: $agent,
               startTime: $startTime,
               lastUpdateTime: $lastUpdateTime,
               estimatedDuration: null,
               currentStep: null,
               totalSteps: null,
               tags: []
           }]' "$PROGRESS_FILE" > "$temp_file"

        mv "$temp_file" "$PROGRESS_FILE"

        # Add history entry for new task
        add_history_entry "$PROGRESS_FILE" "$timestamp" "task_started" "$task_id" "$agent" "Task created"
    else
        # Existing task: update status and lastUpdateTime
        local old_status=$(echo "$existing" | jq -r '.status')

        log_event "DEBUG" "Updating task $task_id: $old_status -> $status"

        jq --arg id "$task_id" \
           --arg status "$status" \
           --arg agent "$agent" \
           --arg activeForm "$active_form" \
           --argjson lastUpdateTime "$timestamp" \
           '(.todos[] | select(.id == $id)) |= (. + {
               status: $status,
               agent: $agent,
               activeForm: $activeForm,
               lastUpdateTime: $lastUpdateTime
           })' "$PROGRESS_FILE" > "$temp_file"

        mv "$temp_file" "$PROGRESS_FILE"

        # Log status change in history
        if [ "$old_status" != "$status" ]; then
            local event_type="task_updated"
            if [ "$status" = "completed" ]; then
                event_type="task_completed"
            fi

            log_event "INFO" "Task $task_id: $old_status → $status (Agent: $agent)"
            add_history_entry "$PROGRESS_FILE" "$timestamp" "$event_type" "$task_id" "$agent" "$old_status -> $status"
        fi
    fi

    # Update currentAgent in metadata
    jq --arg agent "$agent" \
       '.metadata.currentAgent = $agent' "$PROGRESS_FILE" > "$temp_file"
    mv "$temp_file" "$PROGRESS_FILE"
}

# Main update logic with file locking
main() {
    local tool_params=$(parse_tool_params "$1")

    # If no params provided, exit silently
    if [ -z "$tool_params" ] || [ "$tool_params" = "{}" ] || [ "$tool_params" = "null" ]; then
        log_event "DEBUG" "No TodoWrite parameters provided, skipping update"
        exit 0
    fi

    log_event "DEBUG" "Starting progress update with params: ${tool_params:0:100}..."

    # Ensure progress file exists
    if [ ! -f "$PROGRESS_FILE" ]; then
        log_event "INFO" "Initializing progress.json"
        init_progress_file_if_missing "$PROGRESS_FILE"
    fi

    # Acquire exclusive lock with timeout (cross-platform approach)
    # Try to create lock file, wait if it exists
    local lock_attempts=0
    local max_attempts=50  # 5 seconds (50 * 0.1s)

    while [ $lock_attempts -lt $max_attempts ]; do
        if mkdir "$LOCK_FILE" 2>/dev/null; then
            # Lock acquired
            break
        fi
        # Lock exists, wait a bit
        sleep 0.1
        lock_attempts=$((lock_attempts + 1))
    done

    if [ $lock_attempts -ge $max_attempts ]; then
        log_event "ERROR" "Failed to acquire lock for progress update (timeout)"
        exit 1
    fi

    # Ensure lock is released on exit
    trap "rmdir '$LOCK_FILE' 2>/dev/null || true" EXIT

    log_event "DEBUG" "Lock acquired successfully"

    # Get current timestamp
    local timestamp=$(get_timestamp_ms)

    # Parse todos array from parameters
    local todos=$(echo "$tool_params" | jq -c '.todos // []' 2>/dev/null || echo "[]")

    if [ "$todos" = "[]" ] || [ -z "$todos" ]; then
        log_event "DEBUG" "No todos in parameters"
        rmdir "$LOCK_FILE" 2>/dev/null || true
        exit 0
    fi

    # Process each todo
    echo "$todos" | jq -c '.[]' 2>/dev/null | while IFS= read -r todo; do
        if [ -n "$todo" ]; then
            process_todo "$todo" "$timestamp"
        fi
    done

    # Update metadata (task counts, completion rate, active agents)
    log_event "DEBUG" "Updating metadata"
    update_metadata "$PROGRESS_FILE" "$timestamp"

    log_event "INFO" "Progress update completed successfully"

    # Release lock
    rmdir "$LOCK_FILE" 2>/dev/null || true

    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        log_event "ERROR" "Progress update failed with exit code $exit_code"
    fi

    exit $exit_code
}

# Error handling
trap 'log_event "ERROR" "Update script terminated unexpectedly: $?"' ERR

# Run main function
main "$@"
