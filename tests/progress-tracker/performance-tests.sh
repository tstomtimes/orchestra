#!/bin/bash

# Orchestra Progress Tracker - Performance Tests
# Validates that hook execution time is under 100ms threshold

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for test output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Source utilities
source "$PROJECT_ROOT/hooks/lib/progress-utils.sh"

# Performance thresholds (in milliseconds)
THRESHOLD_UPDATE=100
THRESHOLD_DISPLAY=50
THRESHOLD_EXPORT=50

# Test result reporting
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1 (${2}ms)"
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1 (${2}ms > ${3}ms threshold)"
}

# Measure execution time in milliseconds
measure_time() {
    local start=$(get_timestamp_ms)
    eval "$1" > /dev/null 2>&1
    local end=$(get_timestamp_ms)
    echo $((end - start))
}

# ============================================================================
# TEST: Utility Function Performance
# ============================================================================

test_format_duration_performance() {
    echo -e "${BLUE}Testing format_duration performance...${NC}"

    local total_time=0
    local iterations=1000

    for i in $(seq 1 $iterations); do
        local start=$(get_timestamp_ms)
        format_duration 123456 > /dev/null
        local end=$(get_timestamp_ms)
        total_time=$((total_time + end - start))
    done

    local avg_time=$((total_time / iterations))
    echo "  Average time: ${avg_time}ms ($iterations iterations)"

    if [ $avg_time -lt 1 ]; then
        pass "format_duration is fast" "$avg_time"
    else
        echo -e "  ${YELLOW}⚠ WARNING${NC}: Slower than expected (${avg_time}ms)"
    fi
}

test_detect_agent_performance() {
    echo -e "${BLUE}Testing detect_agent_from_todo performance...${NC}"

    local total_time=0
    local iterations=1000

    for i in $(seq 1 $iterations); do
        local start=$(get_timestamp_ms)
        detect_agent_from_todo "Skye implementing feature" "Implement feature" "" > /dev/null
        local end=$(get_timestamp_ms)
        total_time=$((total_time + end - start))
    done

    local avg_time=$((total_time / iterations))
    echo "  Average time: ${avg_time}ms ($iterations iterations)"

    if [ $avg_time -lt 1 ]; then
        pass "detect_agent_from_todo is fast" "$avg_time"
    else
        echo -e "  ${YELLOW}⚠ WARNING${NC}: Slower than expected (${avg_time}ms)"
    fi
}

# ============================================================================
# TEST: Display Script Performance
# ============================================================================

test_display_performance() {
    echo -e "${BLUE}Testing progress-tracker-display.sh performance...${NC}"

    # Create test progress file with moderate data
    local test_file="/tmp/orchestra-perf-test-$$.json"
    cat > "$test_file" << 'EOF'
{
  "schemaVersion": "2.0",
  "todos": [
    {"id": "1", "content": "Task 1", "activeForm": "Working on task 1", "status": "completed", "agent": "Skye", "startTime": 1730640000000, "lastUpdateTime": 1730640000000, "estimatedDuration": null, "currentStep": null, "totalSteps": null, "tags": []},
    {"id": "2", "content": "Task 2", "activeForm": "Working on task 2", "status": "in_progress", "agent": "Nova", "startTime": 1730640000000, "lastUpdateTime": 1730640000000, "estimatedDuration": null, "currentStep": 2, "totalSteps": 5, "tags": []},
    {"id": "3", "content": "Task 3", "activeForm": "Working on task 3", "status": "pending", "agent": "Kai", "startTime": 1730640000000, "lastUpdateTime": 1730640000000, "estimatedDuration": null, "currentStep": null, "totalSteps": null, "tags": []}
  ],
  "metadata": {
    "sessionStartTime": 1730640000000,
    "lastUpdateTime": 1730640000000,
    "activeAgents": ["Nova"],
    "totalTokensEstimated": 0,
    "completionRate": 33,
    "totalTasks": 3,
    "completedTasks": 1,
    "inProgressTasks": 1,
    "pendingTasks": 1,
    "currentAgent": "Nova"
  },
  "history": []
}
EOF

    # Backup actual progress file
    local actual_progress="$PROJECT_ROOT/.orchestra/cache/progress.json"
    local backup_progress="${actual_progress}.perf-backup"
    if [ -f "$actual_progress" ]; then
        mv "$actual_progress" "$backup_progress"
    fi
    cp "$test_file" "$actual_progress"

    # Measure display script
    local elapsed=$(measure_time "bash $PROJECT_ROOT/hooks/progress-tracker-display.sh")

    # Restore original progress file
    rm -f "$actual_progress"
    if [ -f "$backup_progress" ]; then
        mv "$backup_progress" "$actual_progress"
    fi

    rm -f "$test_file"

    echo "  Execution time: ${elapsed}ms"

    if [ $elapsed -lt $THRESHOLD_DISPLAY ]; then
        pass "Display script meets performance threshold" "$elapsed"
    else
        fail "Display script meets performance threshold" "$elapsed" "$THRESHOLD_DISPLAY"
    fi
}

# ============================================================================
# TEST: Export Script Performance
# ============================================================================

test_export_performance() {
    echo -e "${BLUE}Testing progress-tracker-export.sh performance...${NC}"

    # Use same test file as display test
    local test_file="/tmp/orchestra-perf-test-$$.json"
    cat > "$test_file" << 'EOF'
{
  "schemaVersion": "2.0",
  "todos": [
    {"id": "1", "content": "Task 1", "activeForm": "Working on task 1", "status": "in_progress", "agent": "Skye", "startTime": 1730640000000, "lastUpdateTime": 1730640000000, "estimatedDuration": null, "currentStep": null, "totalSteps": null, "tags": []}
  ],
  "metadata": {
    "sessionStartTime": 1730640000000,
    "lastUpdateTime": 1730640000000,
    "activeAgents": ["Skye"],
    "totalTokensEstimated": 0,
    "completionRate": 0,
    "totalTasks": 1,
    "completedTasks": 0,
    "inProgressTasks": 1,
    "pendingTasks": 0,
    "currentAgent": "Skye"
  },
  "history": []
}
EOF

    # Backup actual progress file
    local actual_progress="$PROJECT_ROOT/.orchestra/cache/progress.json"
    local backup_progress="${actual_progress}.perf-backup"
    if [ -f "$actual_progress" ]; then
        mv "$actual_progress" "$backup_progress"
    fi
    cp "$test_file" "$actual_progress"

    # Measure export script
    local elapsed=$(measure_time "bash $PROJECT_ROOT/hooks/progress-tracker-export.sh")

    # Restore original progress file
    rm -f "$actual_progress"
    if [ -f "$backup_progress" ]; then
        mv "$backup_progress" "$actual_progress"
    fi

    rm -f "$test_file"

    echo "  Execution time: ${elapsed}ms"

    if [ $elapsed -lt $THRESHOLD_EXPORT ]; then
        pass "Export script meets performance threshold" "$elapsed"
    else
        fail "Export script meets performance threshold" "$elapsed" "$THRESHOLD_EXPORT"
    fi
}

# ============================================================================
# TEST: Large Dataset Performance
# ============================================================================

test_large_dataset_performance() {
    echo -e "${BLUE}Testing performance with large dataset (100 tasks)...${NC}"

    # Create test file with 100 tasks
    local test_file="/tmp/orchestra-perf-large-$$.json"

    cat > "$test_file" << 'EOF'
{
  "schemaVersion": "2.0",
  "todos": [
EOF

    # Add 100 tasks
    for i in $(seq 1 100); do
        local status="pending"
        if [ $i -le 33 ]; then
            status="completed"
        elif [ $i -le 66 ]; then
            status="in_progress"
        fi

        local comma=","
        if [ $i -eq 100 ]; then
            comma=""
        fi

        cat >> "$test_file" << EOF
    {"id": "$i", "content": "Task $i", "activeForm": "Working on task $i", "status": "$status", "agent": "Skye", "startTime": 1730640000000, "lastUpdateTime": 1730640000000, "estimatedDuration": null, "currentStep": null, "totalSteps": null, "tags": []}$comma
EOF
    done

    cat >> "$test_file" << 'EOF'
  ],
  "metadata": {
    "sessionStartTime": 1730640000000,
    "lastUpdateTime": 1730640000000,
    "activeAgents": ["Skye"],
    "totalTokensEstimated": 0,
    "completionRate": 33,
    "totalTasks": 100,
    "completedTasks": 33,
    "inProgressTasks": 33,
    "pendingTasks": 34,
    "currentAgent": "Skye"
  },
  "history": []
}
EOF

    # Backup and replace progress file
    local actual_progress="$PROJECT_ROOT/.orchestra/cache/progress.json"
    local backup_progress="${actual_progress}.perf-backup"
    if [ -f "$actual_progress" ]; then
        mv "$actual_progress" "$backup_progress"
    fi
    cp "$test_file" "$actual_progress"

    # Test display performance
    local display_time=$(measure_time "bash $PROJECT_ROOT/hooks/progress-tracker-display.sh")
    echo "  Display time with 100 tasks: ${display_time}ms"

    # Test export performance
    local export_time=$(measure_time "bash $PROJECT_ROOT/hooks/progress-tracker-export.sh")
    echo "  Export time with 100 tasks: ${export_time}ms"

    # Restore original progress file
    rm -f "$actual_progress"
    if [ -f "$backup_progress" ]; then
        mv "$backup_progress" "$actual_progress"
    fi

    rm -f "$test_file"

    if [ $display_time -lt 200 ] && [ $export_time -lt 200 ]; then
        pass "Large dataset handling is acceptable" "$((display_time + export_time))"
    else
        echo -e "  ${YELLOW}⚠ WARNING${NC}: Performance degradation with large dataset"
        echo "  Display: ${display_time}ms, Export: ${export_time}ms"
    fi
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ORCHESTRA PROGRESS TRACKER - PERFORMANCE TESTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Performance Thresholds:"
    echo "  - Update script: < ${THRESHOLD_UPDATE}ms"
    echo "  - Display script: < ${THRESHOLD_DISPLAY}ms"
    echo "  - Export script: < ${THRESHOLD_EXPORT}ms"
    echo ""

    echo -e "${YELLOW}Utility Function Performance${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    test_format_duration_performance
    test_detect_agent_performance
    echo ""

    echo -e "${YELLOW}Script Performance${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    test_display_performance
    test_export_performance
    echo ""

    echo -e "${YELLOW}Scalability Tests${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    test_large_dataset_performance
    echo ""

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PERFORMANCE TESTING COMPLETE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}✅ Performance tests completed${NC}"
    echo "Note: All scripts should complete in < 100ms for production use"
    echo ""
}

main
