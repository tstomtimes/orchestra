#!/bin/bash

# Orchestra Progress Tracker - Enhanced Display
# Version: 2.0.0
# Shows rich formatted progress in chat after TodoWrite updates

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
PROGRESS_FILE="$PROJECT_ROOT/.orchestra/cache/progress.json"

# Source utility library
if [ -f "$SCRIPT_DIR/lib/progress-utils.sh" ]; then
    source "$SCRIPT_DIR/lib/progress-utils.sh"
else
    echo "Warning: progress-utils.sh not found, using basic display" >&2
fi

# Check if progress file exists
if [ ! -f "$PROGRESS_FILE" ]; then
    # No progress to display
    exit 0
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "Warning: jq not found, cannot display progress" >&2
    exit 0
fi

# Get metadata
get_metadata() {
    local field="$1"
    jq -r ".metadata.$field // 0" "$PROGRESS_FILE" 2>/dev/null || echo "0"
}

# Display compact progress view
display_compact() {
    local total=$(get_metadata "totalTasks")
    local completed=$(get_metadata "completedTasks")
    local in_progress=$(get_metadata "inProgressTasks")
    local pending=$(get_metadata "pendingTasks")
    local completion_rate=$(get_metadata "completionRate")
    local active_agents_count=$(jq -r '.metadata.activeAgents | length' "$PROGRESS_FILE" 2>/dev/null || echo "0")

    # Skip display if no tasks
    if [ "$total" -eq 0 ]; then
        return 0
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🎯 ${COLOR_BOLD}PROGRESS${COLOR_RESET}  |  ${active_agents_count} agent(s)  |  ${completion_rate}% complete"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Display active (in-progress) tasks with agent info
    if [ "$in_progress" -gt 0 ]; then
        jq -r '.todos[] | select(.status == "in_progress") | @json' "$PROGRESS_FILE" 2>/dev/null | while IFS= read -r task_json; do
            local agent=$(echo "$task_json" | jq -r '.agent // "Unknown"')
            local content=$(echo "$task_json" | jq -r '.content')
            local active_form=$(echo "$task_json" | jq -r '.activeForm')
            local start_time=$(echo "$task_json" | jq -r '.startTime // 0')
            local current_step=$(echo "$task_json" | jq -r '.currentStep // null')
            local total_steps=$(echo "$task_json" | jq -r '.totalSteps // null')

            # Calculate elapsed time
            local current_time=$(get_timestamp_ms)
            local elapsed=$((current_time - start_time))
            local duration=$(format_duration "$elapsed")

            # Get agent emoji
            local emoji=$(get_agent_emoji "$agent")

            # Calculate progress percentage
            local progress_pct=0
            if [ "$current_step" != "null" ] && [ "$total_steps" != "null" ] && [ "$total_steps" -gt 0 ]; then
                progress_pct=$((current_step * 100 / total_steps))
            else
                # Default to 50% if no step info
                progress_pct=50
            fi

            # Format progress bar
            local progress_bar=$(format_progress_bar "$progress_pct")

            # Truncate content if too long
            local display_content="$content"
            if [ ${#display_content} -gt 50 ]; then
                display_content="${display_content:0:47}..."
            fi

            # Display task line
            echo -e "${COLOR_YELLOW}${emoji} ${agent}${COLOR_RESET}   ${progress_bar} ${progress_pct}%  ${display_content} (${duration})"
        done
        echo ""
    fi

    # Display summary line
    echo -e "${COLOR_GREEN}$SYMBOL_COMPLETED ${completed}${COLOR_RESET}  ${COLOR_YELLOW}$SYMBOL_IN_PROGRESS ${in_progress}${COLOR_RESET}  ${COLOR_GRAY}$SYMBOL_PENDING ${pending}${COLOR_RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Display detailed progress view (verbose mode)
display_detailed() {
    local total=$(get_metadata "totalTasks")
    local completed=$(get_metadata "completedTasks")
    local in_progress=$(get_metadata "inProgressTasks")
    local pending=$(get_metadata "pendingTasks")
    local completion_rate=$(get_metadata "completionRate")
    local session_start=$(get_metadata "sessionStartTime")

    # Skip display if no tasks
    if [ "$total" -eq 0 ]; then
        echo "No tasks tracked yet."
        return 0
    fi

    # Calculate session duration
    local current_time=$(get_timestamp_ms)
    local session_duration=$((current_time - session_start))
    local session_duration_str=$(format_duration "$session_duration")

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${COLOR_BOLD}🎯 ORCHESTRA PROGRESS TRACKER${COLOR_RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Session: $session_duration_str  |  Overall: $(format_progress_bar "$completion_rate" 20) $completion_rate% ($completed/$total tasks)"
    echo ""

    # Active agents section
    local active_agents=$(jq -r '.metadata.activeAgents[]' "$PROGRESS_FILE" 2>/dev/null)
    if [ -n "$active_agents" ]; then
        local agent_count=$(echo "$active_agents" | wc -l | tr -d ' ')
        echo -e "${COLOR_BOLD}👥 Active Agents ($agent_count)${COLOR_RESET}"
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
                local tags=$(echo "$task_json" | jq -r '.tags // [] | join(", ")')

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
                fi

                local progress_bar=$(format_progress_bar "$progress_pct")

                echo -e "${COLOR_YELLOW}${emoji} ${agent}${COLOR_RESET}"
                echo "   Task: $content"
                echo "   Progress: ${progress_bar} ${progress_pct}%${step_info}"
                echo "   Duration: ${duration}"
                if [ -n "$tags" ]; then
                    echo "   Tags: $tags"
                fi
                echo ""
            done
        done
    fi

    # Task summary section
    echo -e "${COLOR_BOLD}📋 Task Summary${COLOR_RESET}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Completed tasks
    if [ "$completed" -gt 0 ]; then
        echo -e "${COLOR_GREEN}$SYMBOL_COMPLETED Completed ($completed tasks)${COLOR_RESET}"
        jq -r '.todos[] | select(.status == "completed") | "   - " + .content' "$PROGRESS_FILE" 2>/dev/null | head -5
        if [ "$completed" -gt 5 ]; then
            echo "   ... and $((completed - 5)) more"
        fi
        echo ""
    fi

    # In-progress tasks
    if [ "$in_progress" -gt 0 ]; then
        echo -e "${COLOR_YELLOW}$SYMBOL_IN_PROGRESS In Progress ($in_progress tasks)${COLOR_RESET}"
        jq -r '.todos[] | select(.status == "in_progress") | "   - " + .content' "$PROGRESS_FILE" 2>/dev/null
        echo ""
    fi

    # Pending tasks
    if [ "$pending" -gt 0 ]; then
        echo -e "${COLOR_GRAY}$SYMBOL_PENDING Pending ($pending tasks)${COLOR_RESET}"
        jq -r '.todos[] | select(.status == "pending") | "   - " + .content' "$PROGRESS_FILE" 2>/dev/null | head -5
        if [ "$pending" -gt 5 ]; then
            echo "   ... and $((pending - 5)) more"
        fi
        echo ""
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Main execution
main() {
    # Check for verbose flag
    local verbose=false
    if [ "$1" = "--verbose" ] || [ "$1" = "-v" ]; then
        verbose=true
    fi

    # Check ORCHESTRA_PROGRESS_VERBOSE environment variable
    if [ "${ORCHESTRA_PROGRESS_VERBOSE:-0}" = "1" ]; then
        verbose=true
    fi

    # Display appropriate view
    if [ "$verbose" = true ]; then
        display_detailed
    else
        display_compact
    fi
}

# Run main function
main "$@"

exit 0
