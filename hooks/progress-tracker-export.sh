#!/bin/bash

# Orchestra Progress Tracker - Export Script
# Version: 2.0.0
# Exports formatted progress to .orchestra/cache/progress-status.txt for external monitoring

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
PROGRESS_FILE="$PROJECT_ROOT/.orchestra/cache/progress.json"
STATUS_FILE="$PROJECT_ROOT/.orchestra/cache/progress-status.txt"

# Source utility library
if [ -f "$SCRIPT_DIR/lib/progress-utils.sh" ]; then
    source "$SCRIPT_DIR/lib/progress-utils.sh"
fi

# Check if progress file exists
if [ ! -f "$PROGRESS_FILE" ]; then
    # Create empty status file
    echo "No progress data available" > "$STATUS_FILE"
    exit 0
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "jq not available - cannot export progress" > "$STATUS_FILE"
    exit 0
fi

# Get metadata
get_metadata() {
    local field="$1"
    jq -r ".metadata.$field // 0" "$PROGRESS_FILE" 2>/dev/null || echo "0"
}

# Export formatted progress
export_progress() {
    local total=$(get_metadata "totalTasks")
    local completed=$(get_metadata "completedTasks")
    local in_progress=$(get_metadata "inProgressTasks")
    local pending=$(get_metadata "pendingTasks")
    local completion_rate=$(get_metadata "completionRate")
    local session_start=$(get_metadata "sessionStartTime")
    local last_update=$(get_metadata "lastUpdateTime")

    # Skip if no tasks
    if [ "$total" -eq 0 ]; then
        cat > "$STATUS_FILE" << 'EOF'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ORCHESTRA PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No tasks tracked yet.

Start working to see progress here!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
        return 0
    fi

    # Calculate session duration
    local current_time=$(get_timestamp_ms)
    local session_duration=$((current_time - session_start))
    local session_duration_str=$(format_duration "$session_duration")

    # Time since last update
    local update_elapsed=$((current_time - last_update))
    local update_elapsed_str=$(format_duration "$update_elapsed")

    # Start building output
    {
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎯 ORCHESTRA PROGRESS TRACKER"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Session: $session_duration_str  |  Last update: ${update_elapsed_str} ago"
        echo "Overall: $(format_progress_bar "$completion_rate" 20) $completion_rate% ($completed/$total tasks)"
        echo ""

        # Active agents section
        local active_agents=$(jq -r '.metadata.activeAgents[]' "$PROGRESS_FILE" 2>/dev/null)
        if [ -n "$active_agents" ]; then
            local agent_count=$(echo "$active_agents" | wc -l | tr -d ' ')
            echo "👥 Active Agents ($agent_count)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""

            # Display each active agent's tasks
            echo "$active_agents" | while IFS= read -r agent; do
                local emoji=$(get_agent_emoji "$agent")

                # Get in-progress tasks for this agent
                jq -r --arg agent "$agent" '.todos[] | select(.status == "in_progress" and .agent == $agent) | @json' "$PROGRESS_FILE" 2>/dev/null | while IFS= read -r task_json; do
                    local content=$(echo "$task_json" | jq -r '.content')
                    local start_time=$(echo "$task_json" | jq -r '.startTime // 0')
                    local current_step=$(echo "$task_json" | jq -r '.currentStep // null')
                    local total_steps=$(echo "$task_json" | jq -r '.totalSteps // null')

                    # Calculate elapsed time
                    local current_time=$(get_timestamp_ms)
                    local elapsed=$((current_time - start_time))
                    local duration=$(format_duration "$elapsed")

                    # Calculate progress
                    local progress_pct=0
                    local step_info=""
                    if [ "$current_step" != "null" ] && [ "$total_steps" != "null" ] && [ "$total_steps" -gt 0 ]; then
                        progress_pct=$((current_step * 100 / total_steps))
                        step_info="  (Step $current_step/$total_steps)"
                    else
                        progress_pct=50
                    fi

                    local progress_bar=$(format_progress_bar "$progress_pct")

                    echo "${emoji} ${agent}   ${progress_bar} ${progress_pct}%${step_info}"
                    echo "   ${content}"
                    echo "   Duration: ${duration}"
                    echo ""
                done
            done
        fi

        # Task summary
        echo "📋 Task Summary"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "✅ Completed: $completed"
        echo "⚡ In Progress: $in_progress"
        echo "⏳ Pending: $pending"
        echo ""

        # Show recent completed tasks (last 3)
        if [ "$completed" -gt 0 ]; then
            echo "Recent completions:"
            jq -r '.todos[] | select(.status == "completed") | "   - " + .content' "$PROGRESS_FILE" 2>/dev/null | tail -3
            echo ""
        fi

        # Show all in-progress tasks
        if [ "$in_progress" -gt 0 ]; then
            echo "Currently working on:"
            jq -r '.todos[] | select(.status == "in_progress") | "   - " + .content' "$PROGRESS_FILE" 2>/dev/null
            echo ""
        fi

        # Show next pending tasks (up to 3)
        if [ "$pending" -gt 0 ]; then
            echo "Coming up next:"
            jq -r '.todos[] | select(.status == "pending") | "   - " + .content' "$PROGRESS_FILE" 2>/dev/null | head -3
            if [ "$pending" -gt 3 ]; then
                echo "   ... and $((pending - 3)) more"
            fi
            echo ""
        fi

        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "💡 Monitor this file with: watch -n 1 cat .orchestra/cache/progress-status.txt"
        echo ""

    } > "$STATUS_FILE"
}

# Main execution
export_progress

exit 0
