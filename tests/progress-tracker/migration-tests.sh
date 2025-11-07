#!/bin/bash

# Orchestra Progress Tracker - Schema Migration Tests
# Tests v1.0 to v2.0 migration and initialization

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEST_DIR="$SCRIPT_DIR/test-workspace-migration"
MIGRATE_SCRIPT="$PROJECT_ROOT/hooks/lib/progress-migrate.sh"

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
    export PROJECT_ROOT="$TEST_DIR"
}

# Cleanup test workspace
cleanup() {
    rm -rf "$TEST_DIR"
}

# ============================================================================
# TEST: Initialize Empty Progress File
# ============================================================================

test_initialize_empty() {
    run_test
    local test_progress="$TEST_DIR/.orchestra/cache/progress.json"

    # Ensure file doesn't exist
    rm -f "$test_progress"

    # Run migration script (should initialize)
    PROJECT_ROOT="$TEST_DIR" bash "$MIGRATE_SCRIPT" > /dev/null 2>&1

    if [ -f "$test_progress" ]; then
        local schema_version=$(jq -r '.schemaVersion' "$test_progress" 2>/dev/null || echo "invalid")
        if [ "$schema_version" = "2.0" ]; then
            pass "Initialize empty progress.json with v2.0 schema"
        else
            fail "Initialize empty progress.json with v2.0 schema" "Schema version is $schema_version"
        fi
    else
        fail "Initialize empty progress.json with v2.0 schema" "File was not created"
    fi
}

# ============================================================================
# TEST: Migrate from v1.0 to v2.0
# ============================================================================

test_migrate_v1_to_v2() {
    run_test
    local test_progress="$TEST_DIR/.orchestra/cache/progress.json"

    # Create v1.0 progress file
    mkdir -p "$(dirname "$test_progress")"
    cat > "$test_progress" << 'EOF'
{
  "todos": [
    {
      "id": "1",
      "content": "Test task 1",
      "activeForm": "Testing task 1",
      "status": "completed"
    },
    {
      "id": "2",
      "content": "Test task 2",
      "activeForm": "Testing task 2",
      "status": "in_progress"
    }
  ]
}
EOF

    # Run migration
    PROJECT_ROOT="$TEST_DIR" bash "$MIGRATE_SCRIPT" > /dev/null 2>&1

    # Check migration results
    local schema_version=$(jq -r '.schemaVersion' "$test_progress" 2>/dev/null || echo "invalid")
    local has_metadata=$(jq -r 'has("metadata")' "$test_progress" 2>/dev/null || echo "false")
    local has_history=$(jq -r 'has("history")' "$test_progress" 2>/dev/null || echo "false")
    local task1_has_agent=$(jq -r '.todos[0] | has("agent")' "$test_progress" 2>/dev/null || echo "false")
    local task1_content=$(jq -r '.todos[0].content' "$test_progress" 2>/dev/null || echo "")

    if [ "$schema_version" = "2.0" ] && [ "$has_metadata" = "true" ] && \
       [ "$has_history" = "true" ] && [ "$task1_has_agent" = "true" ] && \
       [ "$task1_content" = "Test task 1" ]; then
        pass "Migrate v1.0 to v2.0 preserving existing data"
    else
        fail "Migrate v1.0 to v2.0 preserving existing data" \
             "schema=$schema_version, metadata=$has_metadata, history=$has_history, agent=$task1_has_agent, content=$task1_content"
    fi
}

# ============================================================================
# TEST: Migration Creates Backup
# ============================================================================

test_migration_creates_backup() {
    run_test
    local test_progress="$TEST_DIR/.orchestra/cache/progress.json"

    # Create v1.0 progress file
    mkdir -p "$(dirname "$test_progress")"
    cat > "$test_progress" << 'EOF'
{
  "todos": [
    {"id": "1", "content": "Backup test", "activeForm": "Testing backup", "status": "pending"}
  ]
}
EOF

    # Run migration
    PROJECT_ROOT="$TEST_DIR" bash "$MIGRATE_SCRIPT" > /dev/null 2>&1

    # Check for backup file
    local backup_count=$(ls "$TEST_DIR/.orchestra/cache/" | grep -c "progress.json.v1.backup" || echo "0")

    if [ "$backup_count" -gt 0 ]; then
        pass "Migration creates backup file"
    else
        fail "Migration creates backup file" "No backup file found in $TEST_DIR/.orchestra/cache/"
    fi
}

# ============================================================================
# TEST: Idempotent Migration (v2.0 -> v2.0)
# ============================================================================

test_migration_idempotent() {
    run_test
    local test_progress="$TEST_DIR/.orchestra/cache/progress.json"

    # Create v2.0 progress file
    mkdir -p "$(dirname "$test_progress")"
    cat > "$test_progress" << 'EOF'
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

    local original_timestamp=$(jq -r '.metadata.sessionStartTime' "$test_progress")

    # Run migration (should skip)
    PROJECT_ROOT="$TEST_DIR" bash "$MIGRATE_SCRIPT" > /dev/null 2>&1

    local after_timestamp=$(jq -r '.metadata.sessionStartTime' "$test_progress")
    local schema_version=$(jq -r '.schemaVersion' "$test_progress")

    if [ "$schema_version" = "2.0" ] && [ "$original_timestamp" = "$after_timestamp" ]; then
        pass "Migration is idempotent (v2.0 unchanged)"
    else
        fail "Migration is idempotent (v2.0 unchanged)" \
             "schema=$schema_version, original_ts=$original_timestamp, after_ts=$after_timestamp"
    fi
}

# ============================================================================
# TEST: Malformed JSON Handling
# ============================================================================

test_malformed_json_handling() {
    run_test
    local test_progress="$TEST_DIR/.orchestra/cache/progress.json"

    # Create malformed JSON
    mkdir -p "$(dirname "$test_progress")"
    echo "{ invalid json }" > "$test_progress"

    # Run migration (should reinitialize)
    PROJECT_ROOT="$TEST_DIR" bash "$MIGRATE_SCRIPT" > /dev/null 2>&1

    # Check if file was reinitialized
    local is_valid=$(jq empty "$test_progress" 2>/dev/null && echo "true" || echo "false")
    local schema_version=$(jq -r '.schemaVersion' "$test_progress" 2>/dev/null || echo "invalid")

    if [ "$is_valid" = "true" ] && [ "$schema_version" = "2.0" ]; then
        pass "Malformed JSON is reinitialized with v2.0 schema"
    else
        fail "Malformed JSON is reinitialized with v2.0 schema" \
             "is_valid=$is_valid, schema=$schema_version"
    fi
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ORCHESTRA PROGRESS TRACKER - MIGRATION TESTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    setup

    echo -e "${YELLOW}Running Initialization Tests...${NC}"
    test_initialize_empty
    echo ""

    echo -e "${YELLOW}Running Migration Tests...${NC}"
    test_migrate_v1_to_v2
    test_migration_creates_backup
    test_migration_idempotent
    echo ""

    echo -e "${YELLOW}Running Error Handling Tests...${NC}"
    test_malformed_json_handling
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
