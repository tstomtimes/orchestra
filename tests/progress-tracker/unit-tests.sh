#!/bin/bash

# Orchestra Progress Tracker - Unit Tests
# Tests individual utility functions in progress-utils.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_DIR="$SCRIPT_DIR/test-workspace"
UTILS_LIB="$PROJECT_ROOT/hooks/lib/progress-utils.sh"

# Colors for test output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Source utility library
source "$UTILS_LIB"

# Test result reporting
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    echo -e "  Expected: $2"
    echo -e "  Got: $3"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

run_test() {
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Setup test workspace
setup() {
    mkdir -p "$TEST_DIR"
    export ORCHESTRA_DEBUG=0
}

# Cleanup test workspace
cleanup() {
    rm -rf "$TEST_DIR"
}

# ============================================================================
# TEST SUITE: Agent Detection
# ============================================================================

test_detect_agent_from_activeForm() {
    run_test
    local result=$(detect_agent_from_todo "Skye is implementing authentication" "Implement auth" "")
    if [ "$result" = "Skye" ]; then
        pass "detect_agent_from_todo - activeForm prefix detection"
    else
        fail "detect_agent_from_todo - activeForm prefix detection" "Skye" "$result"
    fi
}

test_detect_agent_from_bracketed_content() {
    run_test
    local result=$(detect_agent_from_todo "Designing API" "[Kai] Design REST API" "")
    if [ "$result" = "Kai" ]; then
        pass "detect_agent_from_todo - bracketed content detection"
    else
        fail "detect_agent_from_todo - bracketed content detection" "Kai" "$result"
    fi
}

test_detect_agent_from_parenthesized_content() {
    run_test
    local result=$(detect_agent_from_todo "Building UI" "Build dashboard (Nova)" "")
    if [ "$result" = "Nova" ]; then
        pass "detect_agent_from_todo - parenthesized content detection"
    else
        fail "detect_agent_from_todo - parenthesized content detection" "Nova" "$result"
    fi
}

test_detect_agent_fallback_unknown() {
    run_test
    local result=$(detect_agent_from_todo "Doing something generic" "Generic task" "")
    if [ "$result" = "Unknown" ]; then
        pass "detect_agent_from_todo - fallback to Unknown"
    else
        fail "detect_agent_from_todo - fallback to Unknown" "Unknown" "$result"
    fi
}

test_is_valid_agent() {
    run_test
    if is_valid_agent "Skye"; then
        pass "is_valid_agent - valid agent name"
    else
        fail "is_valid_agent - valid agent name" "true" "false"
    fi
}

test_is_valid_agent_invalid() {
    run_test
    if ! is_valid_agent "InvalidAgent"; then
        pass "is_valid_agent - invalid agent name"
    else
        fail "is_valid_agent - invalid agent name" "false" "true"
    fi
}

# ============================================================================
# TEST SUITE: Duration Formatting
# ============================================================================

test_format_duration_seconds() {
    run_test
    local result=$(format_duration 45000)  # 45 seconds
    if [ "$result" = "45s" ]; then
        pass "format_duration - seconds only"
    else
        fail "format_duration - seconds only" "45s" "$result"
    fi
}

test_format_duration_minutes() {
    run_test
    local result=$(format_duration 222000)  # 3m 42s
    if [ "$result" = "3m 42s" ]; then
        pass "format_duration - minutes and seconds"
    else
        fail "format_duration - minutes and seconds" "3m 42s" "$result"
    fi
}

test_format_duration_hours() {
    run_test
    local result=$(format_duration 5400000)  # 1h 30m
    if [ "$result" = "1h 30m" ]; then
        pass "format_duration - hours and minutes"
    else
        fail "format_duration - hours and minutes" "1h 30m" "$result"
    fi
}

# ============================================================================
# TEST SUITE: Progress Bar Formatting
# ============================================================================

test_format_progress_bar_0_percent() {
    run_test
    local result=$(format_progress_bar 0 10)
    if [ "$result" = "[░░░░░░░░░░]" ]; then
        pass "format_progress_bar - 0%"
    else
        fail "format_progress_bar - 0%" "[░░░░░░░░░░]" "$result"
    fi
}

test_format_progress_bar_50_percent() {
    run_test
    local result=$(format_progress_bar 50 10)
    if [ "$result" = "[▓▓▓▓▓░░░░░]" ]; then
        pass "format_progress_bar - 50%"
    else
        fail "format_progress_bar - 50%" "[▓▓▓▓▓░░░░░]" "$result"
    fi
}

test_format_progress_bar_100_percent() {
    run_test
    local result=$(format_progress_bar 100 10)
    if [ "$result" = "[▓▓▓▓▓▓▓▓▓▓]" ]; then
        pass "format_progress_bar - 100%"
    else
        fail "format_progress_bar - 100%" "[▓▓▓▓▓▓▓▓▓▓]" "$result"
    fi
}

test_format_progress_bar_bounds_checking() {
    run_test
    local result_over=$(format_progress_bar 150 10)
    local result_under=$(format_progress_bar -50 10)
    if [ "$result_over" = "[▓▓▓▓▓▓▓▓▓▓]" ] && [ "$result_under" = "[░░░░░░░░░░]" ]; then
        pass "format_progress_bar - bounds checking"
    else
        fail "format_progress_bar - bounds checking" "[▓▓▓▓▓▓▓▓▓▓] and [░░░░░░░░░░]" "$result_over and $result_under"
    fi
}

# ============================================================================
# TEST SUITE: File Initialization
# ============================================================================

test_init_progress_file() {
    run_test
    local test_file="$TEST_DIR/test-progress.json"

    init_progress_file_if_missing "$test_file"

    if [ -f "$test_file" ]; then
        # Validate JSON structure
        local schema_version=$(jq -r '.schemaVersion' "$test_file")
        if [ "$schema_version" = "2.0" ]; then
            pass "init_progress_file_if_missing - creates valid v2.0 schema"
        else
            fail "init_progress_file_if_missing - creates valid v2.0 schema" "2.0" "$schema_version"
        fi
    else
        fail "init_progress_file_if_missing - creates file" "file exists" "file not created"
    fi
}

test_init_progress_file_idempotent() {
    run_test
    local test_file="$TEST_DIR/test-progress-2.json"

    # Initialize once
    init_progress_file_if_missing "$test_file"
    local first_timestamp=$(jq -r '.metadata.sessionStartTime' "$test_file")

    # Try to initialize again
    sleep 0.1
    init_progress_file_if_missing "$test_file"
    local second_timestamp=$(jq -r '.metadata.sessionStartTime' "$test_file")

    if [ "$first_timestamp" = "$second_timestamp" ]; then
        pass "init_progress_file_if_missing - idempotent (doesn't overwrite)"
    else
        fail "init_progress_file_if_missing - idempotent" "same timestamp" "different timestamps"
    fi
}

# ============================================================================
# TEST SUITE: Timestamp Functions
# ============================================================================

test_get_timestamp_ms() {
    run_test
    local timestamp=$(get_timestamp_ms)

    # Check that timestamp is a reasonable value (13 digits for milliseconds)
    if [[ "$timestamp" =~ ^[0-9]{13}$ ]]; then
        pass "get_timestamp_ms - returns valid millisecond timestamp"
    else
        fail "get_timestamp_ms - returns valid millisecond timestamp" "13-digit number" "$timestamp"
    fi
}

test_get_timestamp_ms_increases() {
    run_test
    local ts1=$(get_timestamp_ms)
    sleep 0.1
    local ts2=$(get_timestamp_ms)

    if [ "$ts2" -gt "$ts1" ]; then
        pass "get_timestamp_ms - timestamp increases over time"
    else
        fail "get_timestamp_ms - timestamp increases over time" "ts2 > ts1" "ts2=$ts2, ts1=$ts1"
    fi
}

# ============================================================================
# TEST SUITE: Agent Emoji Mapping
# ============================================================================

test_get_agent_emoji() {
    run_test
    local emoji=$(get_agent_emoji "Skye")
    if [ "$emoji" = "😐" ]; then
        pass "get_agent_emoji - returns correct emoji"
    else
        fail "get_agent_emoji - returns correct emoji" "😐" "$emoji"
    fi
}

test_get_agent_emoji_unknown() {
    run_test
    local emoji=$(get_agent_emoji "Unknown")
    if [ "$emoji" = "❓" ]; then
        pass "get_agent_emoji - returns question mark for unknown"
    else
        fail "get_agent_emoji - returns question mark for unknown" "❓" "$emoji"
    fi
}

# ============================================================================
# TEST SUITE: Task Progress Calculation
# ============================================================================

test_calculate_task_progress() {
    run_test
    local result=$(calculate_task_progress 3 5)
    if [ "$result" = "60" ]; then
        pass "calculate_task_progress - correct percentage"
    else
        fail "calculate_task_progress - correct percentage" "60" "$result"
    fi
}

test_calculate_task_progress_zero_total() {
    run_test
    local result=$(calculate_task_progress 5 0)
    if [ "$result" = "0" ]; then
        pass "calculate_task_progress - handles zero total"
    else
        fail "calculate_task_progress - handles zero total" "0" "$result"
    fi
}

# ============================================================================
# TEST SUITE: Status Symbols and Colors
# ============================================================================

test_get_status_symbol() {
    run_test
    local completed=$(get_status_symbol "completed")
    local in_progress=$(get_status_symbol "in_progress")
    local pending=$(get_status_symbol "pending")

    if [ "$completed" = "✅" ] && [ "$in_progress" = "⚡" ] && [ "$pending" = "⏳" ]; then
        pass "get_status_symbol - returns correct symbols"
    else
        fail "get_status_symbol - returns correct symbols" "✅ ⚡ ⏳" "$completed $in_progress $pending"
    fi
}

# ============================================================================
# TEST SUITE: Metadata Updates
# ============================================================================

test_update_metadata() {
    run_test
    local test_file="$TEST_DIR/test-metadata.json"

    # Create test file with some tasks
    cat > "$test_file" << 'EOF'
{
  "schemaVersion": "2.0",
  "todos": [
    {"id": "1", "content": "Task 1", "activeForm": "Task 1", "status": "completed", "agent": "Skye", "startTime": 1000, "lastUpdateTime": 1000, "estimatedDuration": null, "currentStep": null, "totalSteps": null, "tags": []},
    {"id": "2", "content": "Task 2", "activeForm": "Task 2", "status": "in_progress", "agent": "Nova", "startTime": 2000, "lastUpdateTime": 2000, "estimatedDuration": null, "currentStep": null, "totalSteps": null, "tags": []},
    {"id": "3", "content": "Task 3", "activeForm": "Task 3", "status": "pending", "agent": "Kai", "startTime": 3000, "lastUpdateTime": 3000, "estimatedDuration": null, "currentStep": null, "totalSteps": null, "tags": []}
  ],
  "metadata": {
    "sessionStartTime": 1000,
    "lastUpdateTime": 1000,
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

    local timestamp=$(get_timestamp_ms)
    update_metadata "$test_file" "$timestamp"

    local total=$(jq -r '.metadata.totalTasks' "$test_file")
    local completed=$(jq -r '.metadata.completedTasks' "$test_file")
    local in_progress=$(jq -r '.metadata.inProgressTasks' "$test_file")
    local pending=$(jq -r '.metadata.pendingTasks' "$test_file")
    local completion_rate=$(jq -r '.metadata.completionRate' "$test_file")
    local active_agents=$(jq -r '.metadata.activeAgents | length' "$test_file")

    if [ "$total" = "3" ] && [ "$completed" = "1" ] && [ "$in_progress" = "1" ] && \
       [ "$pending" = "1" ] && [ "$completion_rate" = "33" ] && [ "$active_agents" = "1" ]; then
        pass "update_metadata - calculates statistics correctly"
    else
        fail "update_metadata - calculates statistics correctly" \
             "total=3, completed=1, in_progress=1, pending=1, rate=33, agents=1" \
             "total=$total, completed=$completed, in_progress=$in_progress, pending=$pending, rate=$completion_rate, agents=$active_agents"
    fi
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ORCHESTRA PROGRESS TRACKER - UNIT TESTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    setup

    # Run all tests
    echo -e "${YELLOW}Running Agent Detection Tests...${NC}"
    test_detect_agent_from_activeForm
    test_detect_agent_from_bracketed_content
    test_detect_agent_from_parenthesized_content
    test_detect_agent_fallback_unknown
    test_is_valid_agent
    test_is_valid_agent_invalid
    echo ""

    echo -e "${YELLOW}Running Duration Formatting Tests...${NC}"
    test_format_duration_seconds
    test_format_duration_minutes
    test_format_duration_hours
    echo ""

    echo -e "${YELLOW}Running Progress Bar Tests...${NC}"
    test_format_progress_bar_0_percent
    test_format_progress_bar_50_percent
    test_format_progress_bar_100_percent
    test_format_progress_bar_bounds_checking
    echo ""

    echo -e "${YELLOW}Running File Initialization Tests...${NC}"
    test_init_progress_file
    test_init_progress_file_idempotent
    echo ""

    echo -e "${YELLOW}Running Timestamp Tests...${NC}"
    test_get_timestamp_ms
    test_get_timestamp_ms_increases
    echo ""

    echo -e "${YELLOW}Running Agent Emoji Tests...${NC}"
    test_get_agent_emoji
    test_get_agent_emoji_unknown
    echo ""

    echo -e "${YELLOW}Running Task Progress Tests...${NC}"
    test_calculate_task_progress
    test_calculate_task_progress_zero_total
    echo ""

    echo -e "${YELLOW}Running Status Symbol Tests...${NC}"
    test_get_status_symbol
    echo ""

    echo -e "${YELLOW}Running Metadata Update Tests...${NC}"
    test_update_metadata
    echo ""

    cleanup

    # Print summary
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST RESULTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Total tests: $TESTS_RUN"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
        echo ""
        exit 0
    else
        echo -e "${RED}❌ SOME TESTS FAILED${NC}"
        echo ""
        exit 1
    fi
}

main
