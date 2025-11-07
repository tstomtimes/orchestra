# Orchestra Progress Tracker - Bug Report

**Date:** 2025-11-03
**Reporter:** Finn (QA & Testing Agent)
**Version:** 2.0.0
**Severity:** CRITICAL (Production Blocker)

---

## Bug #1: Timestamp Generation Fails on macOS

### Priority: P0 - BLOCKER

**Status:** 🔴 CRITICAL - System Broken on macOS

**Affected Files:**
- `/hooks/lib/progress-utils.sh` (line 142)

**Description:**
The `init_progress_file_if_missing()` function uses `date +%s%3N` to generate millisecond timestamps. This syntax is GNU-specific and does not work on macOS/BSD systems, which output the literal string "3N" instead of milliseconds.

**Impact:**
- Invalid JSON generated in all new progress.json files
- All JSON parsing fails downstream
- Migration script cannot initialize new files
- Update script cannot process data
- System is completely unusable on macOS

**Reproduction Steps:**
```bash
# On macOS
bash -c 'source hooks/lib/progress-utils.sh && init_progress_file_if_missing /tmp/test-progress.json'
cat /tmp/test-progress.json
```

**Expected Output:**
```json
{
  "schemaVersion": "2.0",
  "metadata": {
    "sessionStartTime": 1730640000000,
    "lastUpdateTime": 1730640000000
  }
}
```

**Actual Output:**
```json
{
  "schemaVersion": "2.0",
  "metadata": {
    "sessionStartTime": 17621765803N,
    "lastUpdateTime": 17621765803N
  }
}
```

**Error Messages:**
```
jq: parse error: Invalid numeric literal at line 5, column 37
```

**Root Cause:**
```bash
# Line 142 in init_progress_file_if_missing()
local timestamp=$(date +%s%3N)  # ❌ Broken on macOS
```

The `%N` format specifier is not supported by BSD `date` (used on macOS). The function already has a cross-platform `get_timestamp_ms()` utility but doesn't use it.

**Fix:**
```bash
# Replace line 142 with:
local timestamp=$(get_timestamp_ms)  # ✅ Cross-platform
```

**Verification:**
```bash
# After fix, run:
bash -c 'source hooks/lib/progress-utils.sh && init_progress_file_if_missing /tmp/test-fixed.json'
jq empty /tmp/test-fixed.json && echo "Valid JSON"
jq -r '.metadata.sessionStartTime' /tmp/test-fixed.json | grep -E '^[0-9]{13}$' && echo "Valid timestamp"
```

**Estimated Effort:** 5 minutes
**Risk Level:** LOW (simple one-line fix)

---

## Bug #2: PROJECT_ROOT Hardcoding Prevents Testing

### Priority: P0 - BLOCKER

**Status:** 🔴 CRITICAL - Cannot Test or Deploy

**Affected Files:**
- `/hooks/lib/progress-migrate.sh` (line 10)
- `/hooks/progress-tracker-update.sh` (line 11)
- `/hooks/progress-tracker-display.sh` (line 10)
- `/hooks/progress-tracker-export.sh` (line 10)

**Description:**
All hook scripts hardcode `PROJECT_ROOT` by calculating it from the script's location. This prevents:
1. Testing scripts in isolation
2. Running scripts from alternative directories
3. Integration testing with test workspaces
4. CI/CD pipeline execution

**Impact:**
- Migration tests fail (4/5 tests)
- Update tests fail (2/6 tests)
- Cannot verify bug fixes
- Cannot run integration tests
- Deployment risk due to lack of testing

**Reproduction Steps:**
```bash
# Try to test migration script with custom PROJECT_ROOT
mkdir -p /tmp/test-workspace/.orchestra/cache
PROJECT_ROOT=/tmp/test-workspace bash hooks/lib/progress-migrate.sh

# Result: Script ignores PROJECT_ROOT and uses hardcoded path
```

**Expected Behavior:**
Script should respect `PROJECT_ROOT` environment variable if set.

**Actual Behavior:**
Script always uses hardcoded path calculated from script location.

**Root Cause:**
```bash
# Example from progress-migrate.sh line 10
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"  # ❌ Hardcoded
```

**Fix:**
```bash
# Replace in all affected files:
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"  # ✅ Respects env var
```

This allows environment variable to override the default while maintaining backward compatibility.

**Files to Update:**
1. `/hooks/lib/progress-migrate.sh` - Line 10
2. `/hooks/progress-tracker-update.sh` - Line 11
3. `/hooks/progress-tracker-display.sh` - Line 10
4. `/hooks/progress-tracker-export.sh` - Line 10

**Verification:**
```bash
# After fix, run:
mkdir -p /tmp/test-custom/.orchestra/cache
PROJECT_ROOT=/tmp/test-custom bash hooks/lib/progress-migrate.sh
ls /tmp/test-custom/.orchestra/cache/progress.json  # Should exist
```

**Estimated Effort:** 30 minutes (4 files + testing)
**Risk Level:** LOW (simple pattern substitution)

---

## Bug #3: Performance Degradation with Large Datasets

### Priority: P1 - HIGH

**Status:** 🟡 MAJOR - Impacts User Experience

**Affected Files:**
- `/hooks/progress-tracker-display.sh` (lines 60-96, 147-178)
- `/hooks/progress-tracker-export.sh` (lines 91-123)

**Description:**
Display and export scripts exhibit severe performance degradation with larger datasets, exceeding acceptable thresholds by 10-15x with just 100 tasks.

**Performance Measurements:**

| Dataset Size | Display Time | Export Time | Combined | Status |
|-------------|-------------|-------------|----------|--------|
| 3 tasks | 109ms | 126ms | 235ms | ❌ Over threshold |
| 100 tasks | 1,543ms | 1,274ms | 2,817ms | ❌ Unacceptable |
| **Threshold** | **< 50ms** | **< 50ms** | **< 100ms** | Target |

**Impact:**
- Noticeable delays after every TodoWrite operation
- Poor user experience with realistic workloads
- System becomes unusable with 100+ tasks
- Hook overhead creates bottleneck in development flow

**Root Cause Analysis:**

**Problem 1: Multiple jq Invocations in Loops**
```bash
# progress-tracker-display.sh lines 60-96
jq -r '.todos[] | select(.status == "in_progress") | @json' "$PROGRESS_FILE" | while IFS= read -r task_json; do
    local agent=$(echo "$task_json" | jq -r '.agent')      # jq call 1
    local content=$(echo "$task_json" | jq -r '.content')  # jq call 2
    local start_time=$(echo "$task_json" | jq -r '.startTime')  # jq call 3
    # ... more jq calls
done
```

With 100 tasks, this creates **500+ jq process spawns**, each with startup overhead.

**Problem 2: Repeated File Reads**
```bash
# Multiple reads of the same file
jq -r '.todos[]' "$PROGRESS_FILE"  # Read 1
jq -r '.metadata.activeAgents[]' "$PROGRESS_FILE"  # Read 2
jq -r '.todos[] | select(...)' "$PROGRESS_FILE"  # Read 3
```

**Problem 3: O(n²) Complexity**
For each active agent (outer loop), iterate through all in-progress tasks (inner loop).

**Recommended Fix:**

**Option 1: Single jq Pass (Best Performance)**
```bash
# Parse once, output all needed fields
jq -r '.todos[] | select(.status == "in_progress") |
       [.agent, .content, .startTime, .currentStep, .totalSteps] | @tsv' "$PROGRESS_FILE" | \
while IFS=$'\t' read -r agent content start_time current_step total_steps; do
    # Process pre-parsed data
done
```

**Option 2: In-Memory Parsing**
```bash
# Load entire JSON once
PROGRESS_DATA=$(cat "$PROGRESS_FILE")

# Extract fields from in-memory data
echo "$PROGRESS_DATA" | jq -r '...'
```

**Option 3: Switch to Python for Complex Operations**
```python
# Python is ~10x faster for complex JSON operations
import json

with open(progress_file) as f:
    data = json.load(f)

# Process in memory, output once
```

**Estimated Effort:** 4-8 hours (refactor + testing)
**Risk Level:** MEDIUM (significant refactoring, extensive testing required)

---

## Bug #4: Utility Function Performance Below Target

### Priority: P2 - MEDIUM

**Status:** 🟡 MINOR - Acceptable but Suboptimal

**Affected Files:**
- `/hooks/lib/progress-utils.sh` (various functions)

**Description:**
Core utility functions are ~20x slower than target performance (22ms vs < 1ms per 1000 calls).

**Measurements:**
- `format_duration`: 22ms/1000 iterations (target: < 1ms)
- `detect_agent_from_todo`: 22ms/1000 iterations (target: < 1ms)

**Impact:**
- Minor overhead in hook execution
- Acceptable for production but not optimal
- Could be optimized for better performance

**Root Cause:**
Likely due to:
1. Subshell spawning in loops
2. Multiple regex operations
3. String manipulation overhead

**Recommended Fix:**
- Profile to identify hotspots
- Optimize regex patterns
- Reduce subshell usage
- Consider caching for repeated calls

**Estimated Effort:** 2-4 hours
**Risk Level:** LOW (isolated functions, well-tested)

---

## Bug #5: No Input Validation for Agent Names

### Priority: P3 - LOW

**Status:** 🟢 MINOR - Edge Case

**Affected Files:**
- `/hooks/progress-tracker-update.sh` (line 56)

**Description:**
The `detect_agent_from_todo()` function doesn't validate that detected agent names are in the valid list before using them.

**Impact:**
- Could create tasks with invalid agent names like "Working" or "Implementing"
- Schema validation would catch this, but better to prevent
- Low impact as pattern matching is fairly strict

**Example:**
```bash
# Input: "Working is implementing feature"
# Detection: Could incorrectly extract "Working" as agent name
```

**Fix:**
Add validation after detection:
```bash
local detected=$(detect_agent_from_todo "$active_form" "$content")
if is_valid_agent "$detected"; then
    agent="$detected"
else
    agent="Unknown"
fi
```

**Estimated Effort:** 30 minutes
**Risk Level:** LOW

---

## Summary of Bugs

| ID | Description | Severity | Impact | Effort | Status |
|----|-------------|----------|--------|--------|--------|
| #1 | Timestamp generation fails on macOS | P0 | System broken | 5 min | 🔴 Open |
| #2 | PROJECT_ROOT hardcoding | P0 | Cannot test | 30 min | 🔴 Open |
| #3 | Performance degradation | P1 | Poor UX | 4-8 hrs | 🟡 Open |
| #4 | Utility function performance | P2 | Minor overhead | 2-4 hrs | 🟡 Open |
| #5 | No agent name validation | P3 | Edge case | 30 min | 🟢 Open |

---

## Recommended Fix Order

### Phase 1: Critical Blockers (Required for any deployment)
1. **Bug #1** - Fix timestamp generation (5 min)
2. **Bug #2** - Fix PROJECT_ROOT hardcoding (30 min)
3. **Re-run test suite** - Verify 100% pass rate (15 min)

**Total Phase 1:** ~50 minutes
**Result:** System functional but slow

### Phase 2: Performance (Recommended for production)
4. **Bug #3** - Optimize display/export scripts (4-8 hrs)
5. **Performance testing** - Verify < 100ms threshold (1 hr)

**Total Phase 2:** 5-9 hours
**Result:** Production-ready performance

### Phase 3: Polish (Nice to have)
6. **Bug #4** - Optimize utility functions (2-4 hrs)
7. **Bug #5** - Add agent validation (30 min)

**Total Phase 3:** 2.5-4.5 hours
**Result:** Optimized and robust

---

## Testing Plan After Fixes

**After Phase 1 (Critical Fixes):**
```bash
# Re-run all tests
bash tests/progress-tracker/unit-tests.sh          # Expect: 23/23 pass
bash tests/progress-tracker/migration-tests.sh     # Expect: 5/5 pass
bash tests/progress-tracker/race-condition-tests.sh # Expect: 6/6 pass
bash tests/progress-tracker/performance-tests.sh   # Still expect failures
```

**After Phase 2 (Performance Fixes):**
```bash
# Re-run performance tests
bash tests/progress-tracker/performance-tests.sh   # Expect: 5/5 pass
```

**Integration Testing:**
```bash
# Test full workflow
# 1. Initialize session
# 2. Use TodoWrite tool
# 3. Verify progress.json updated
# 4. Check display output
# 5. Verify export file
```

---

## Deployment Blocker Status

**Current Status:** 🔴 BLOCKED

**Required for Deployment:**
- ✅ Fix Bug #1 (timestamp)
- ✅ Fix Bug #2 (PROJECT_ROOT)
- ✅ All tests pass
- ⚠️ Performance optimization (RECOMMENDED)

**Minimum Time to Deployable:** ~1 hour (Phase 1 only)
**Recommended Time to Production-Ready:** ~6-10 hours (Phase 1 + 2)

---

**Report Generated:** 2025-11-03
**Reporter:** Finn (QA Engineer)
**Status:** Awaiting fixes from development team
