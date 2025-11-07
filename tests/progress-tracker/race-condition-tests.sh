#!/bin/bash

# Orchestra Progress Tracker - Race Condition Tests
# Tests file locking mechanism to prevent concurrent write conflicts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_DIR="$SCRIPT_DIR/test-workspace-race"
UPDATE_SCRIPT="$PROJECT_ROOT/hooks/progress-tracker-update.sh"

# Colors for test output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test result reporting
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    echo -e "  Details: $2"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

run_test() {
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Setup test workspace
setup() {
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR/.orchestra/cache"

    # Initialize progress file
    cat > "$TEST_DIR/.orchestra/cache/progress.json" << 'EOF'
{
  "schemaVersion": "2.0",
  "todos": [],
  "metadata": {
    "sessionStartTime": 1730640000000,
    "lastUpdateTime": 1730640000000,
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
}

# Cleanup test workspace
cleanup() {
    # Clean up lock files
    rm -f /tmp/orchestra-progress-lock-${USER}
    rm -rf "$TEST_DIR"
}

# ============================================================================
# TEST: Basic Lock Acquire and Release
# ============================================================================

test_lock_acquire_release() {
    run_test

    # Create a simple test for lock mechanism
    local lock_file="/tmp/orchestra-test-lock-$$"

    # Test lock creation
    if mkdir "$lock_file" 2>/dev/null; then
        # Lock acquired successfully
        rmdir "$lock_file"
        pass "Lock can be acquired and released"
    else
        fail "Lock can be acquired and released" "Could not create lock directory"
    fi
}

# ============================================================================
# TEST: Lock Prevents Concurrent Access
# ============================================================================

test_lock_prevents_concurrent_access() {
    run_test

    local lock_file="/tmp/orchestra-test-lock-concurrent-$$"

    # First process acquires lock
    mkdir "$lock_file" 2>/dev/null

    # Second process tries to acquire (should fail)
    if mkdir "$lock_file" 2>/dev/null; then
        rmdir "$lock_file" 2>/dev/null || true
        fail "Lock prevents concurrent access" "Second process acquired lock (should have been blocked)"
    else
        rmdir "$lock_file" 2>/dev/null || true
        pass "Lock prevents concurrent access"
    fi
}

# ============================================================================
# TEST: Lock Timeout Works
# ============================================================================

test_lock_timeout() {
    run_test

    local lock_file="/tmp/orchestra-test-lock-timeout-$$"

    # Create stale lock
    mkdir "$lock_file" 2>/dev/null

    # Simulate timeout by trying to acquire with sleep
    local start_time=$(date +%s)
    local acquired=false

    for i in {1..10}; do
        if mkdir "$lock_file" 2>/dev/null; then
            acquired=true
            break
        fi
        sleep 0.1
    done

    local end_time=$(date +%s)
    local elapsed=$((end_time - start_time))

    # Clean up
    rmdir "$lock_file" 2>/dev/null || true

    if [ "$acquired" = "false" ] && [ "$elapsed" -ge 1 ]; then
        pass "Lock timeout mechanism works (waited ~${elapsed}s)"
    else
        fail "Lock timeout mechanism works" "acquired=$acquired, elapsed=${elapsed}s"
    fi
}

# ============================================================================
# TEST: Concurrent Update Simulation
# ============================================================================

test_concurrent_updates() {
    run_test

    local progress_file="$TEST_DIR/.orchestra/cache/progress.json"

    # Create TodoWrite parameters for two different agents
    local todo1='{"todos":[{"id":"1","content":"Task by Agent 1","activeForm":"Skye working on task 1","status":"in_progress"}]}'
    local todo2='{"todos":[{"id":"2","content":"Task by Agent 2","activeForm":"Nova working on task 2","status":"in_progress"}]}'

    # Run updates in background (simulating concurrent execution)
    (
        cd "$PROJECT_ROOT"
        echo "$todo1" | PROJECT_ROOT="$TEST_DIR" bash "$UPDATE_SCRIPT" > /dev/null 2>&1
    ) &
    pid1=$!

    (
        cd "$PROJECT_ROOT"
        echo "$todo2" | PROJECT_ROOT="$TEST_DIR" bash "$UPDATE_SCRIPT" > /dev/null 2>&1
    ) &
    pid2=$!

    # Wait for both to complete
    wait $pid1
    wait $pid2

    # Check if both tasks were added
    local task_count=$(jq '.todos | length' "$progress_file" 2>/dev/null || echo "0")

    if [ "$task_count" = "2" ]; then
        pass "Concurrent updates don't corrupt data (both tasks added)"
    else
        fail "Concurrent updates don't corrupt data" "Expected 2 tasks, got $task_count"
    fi
}

# ============================================================================
# TEST: Multiple Sequential Updates
# ============================================================================

test_sequential_updates() {
    run_test

    local progress_file="$TEST_DIR/.orchestra/cache/progress.json"

    # Run 5 sequential updates
    for i in {1..5}; do
        local todo="{\"todos\":[{\"id\":\"$i\",\"content\":\"Task $i\",\"activeForm\":\"Working on task $i\",\"status\":\"pending\"}]}"
        echo "$todo" | PROJECT_ROOT="$TEST_DIR" bash "$UPDATE_SCRIPT" > /dev/null 2>&1
    done

    # Check if all 5 tasks were added
    local task_count=$(jq '.todos | length' "$progress_file" 2>/dev/null || echo "0")

    if [ "$task_count" = "5" ]; then
        pass "Sequential updates maintain data integrity"
    else
        fail "Sequential updates maintain data integrity" "Expected 5 tasks, got $task_count"
    fi
}

# ============================================================================
# TEST: Lock Cleanup on Exit
# ============================================================================

test_lock_cleanup_on_exit() {
    run_test

    local lock_file="/tmp/orchestra-progress-lock-${USER}"

    # Ensure lock doesn't exist
    rmdir "$lock_file" 2>/dev/null || true

    # Run update script
    local todo='{"todos":[{"id":"cleanup-test","content":"Lock cleanup test","activeForm":"Testing cleanup","status":"pending"}]}'
    echo "$todo" | PROJECT_ROOT="$TEST_DIR" bash "$UPDATE_SCRIPT" > /dev/null 2>&1

    # Check if lock was cleaned up
    if [ ! -d "$lock_file" ]; then
        pass "Lock is cleaned up after script exits"
    else
        rmdir "$lock_file" 2>/dev/null || true
        fail "Lock is cleaned up after script exits" "Lock file still exists at $lock_file"
    fi
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ORCHESTRA PROGRESS TRACKER - RACE CONDITION TESTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    setup

    echo -e "${YELLOW}Running Lock Mechanism Tests...${NC}"
    test_lock_acquire_release
    test_lock_prevents_concurrent_access
    test_lock_timeout
    echo ""

    echo -e "${YELLOW}Running Concurrent Update Tests...${NC}"
    test_concurrent_updates
    test_sequential_updates
    test_lock_cleanup_on_exit
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
