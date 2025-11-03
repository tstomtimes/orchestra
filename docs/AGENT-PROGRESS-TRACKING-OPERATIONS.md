# Agent Progress Tracking - Operations Guide

**Version:** 2.0.0
**Last Updated:** 2025-11-04
**Audience:** System Operators, DevOps, Advanced Users

---

## System Overview

The Orchestra Plugin's agent progress tracking system provides real-time monitoring of agent task execution through an automated hook-based architecture.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       TodoWrite Tool                             │
│                  (Invoked by Agent)                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ PostToolUse Hook Trigger
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              post_code_write.sh (Hook Entry)                     │
│  1. Extract agent context from tool parameters                  │
│  2. Capture timestamp                                            │
│  3. Call progress-tracker-update.sh                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│         progress-tracker-update.sh (Logic Layer)                │
│  1. Parse TodoWrite parameters                                  │
│  2. Extract agent from heuristics                               │
│  3. Update progress.json atomically (with file locking)         │
│  4. Maintain activeAgents list                                  │
│  5. Calculate progress metrics                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ Update Schema
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              .orchestra/cache/progress.json                      │
│  Enhanced schema with agent, timing, progress metadata          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ Read & Display
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│       progress-tracker-display.sh (Display Layer)               │
│  1. Format enhanced progress display (chat)                     │
│  2. Generate status bar summary                                 │
│  3. Export to progress-status.txt                               │
│  4. Colorized, structured terminal output                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
   ┌─────────────────┐   ┌──────────────────────┐
   │  Chat Display   │   │  External Monitor    │
   │  (visible once) │   │  (tail -f / watch)   │
   └─────────────────┘   └──────────────────────┘
```

### Component Responsibilities

| Component | Location | Purpose | Trigger |
|-----------|----------|---------|---------|
| `post_code_write.sh` | `hooks/` | Hook entry point | PostToolUse:TodoWrite |
| `progress-tracker-update.sh` | `hooks/` | Core update logic | Called by post_code_write |
| `progress-tracker-display.sh` | `hooks/` | Format and display progress | Called by post_code_write |
| `progress-tracker-export.sh` | `hooks/` | Export to status file | Called by post_code_write |
| `progress-utils.sh` | `hooks/lib/` | Shared utility functions | Sourced by all scripts |
| `progress-migrate.sh` | `hooks/lib/` | Schema migration logic | Session start / on-demand |

---

## Schema Specification

### File: `.orchestra/cache/progress.json`

#### Schema Version 2.0

```json
{
  "schemaVersion": "2.0",
  "todos": [
    {
      "id": "unique-task-id",
      "content": "Task description (imperative form)",
      "activeForm": "Task description (present continuous)",
      "status": "pending|in_progress|completed",
      "parentId": "parent-task-id|null",

      // v2.0 Fields
      "agent": "Skye|Nova|Kai|...|Unknown",
      "startTime": 1730735123456,
      "lastUpdateTime": 1730735234567,
      "estimatedDuration": 600000,
      "currentStep": 3,
      "totalSteps": 5,
      "tags": ["backend", "database"]
    }
  ],
  "metadata": {
    "sessionStartTime": 1730730000000,
    "lastUpdateTime": 1730735234567,
    "activeAgents": ["Skye", "Nova"],
    "totalTokensEstimated": 12500,
    "completionRate": 67,
    "totalTasks": 15,
    "completedTasks": 10,
    "inProgressTasks": 3,
    "pendingTasks": 2,
    "currentAgent": "Skye"
  },
  "history": [
    {
      "timestamp": 1730735123456,
      "event": "task_started|task_completed|agent_assigned",
      "taskId": "task-123",
      "agent": "Skye",
      "details": "Additional context"
    }
  ]
}
```

### Field Definitions

#### Todo Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique task identifier (UUID) |
| `content` | string | Yes | Task description in imperative form |
| `activeForm` | string | Yes | Task description in present continuous form |
| `status` | enum | Yes | `pending`, `in_progress`, or `completed` |
| `parentId` | string\|null | No | Parent task ID for subtasks |
| `agent` | string | Yes | Agent name or "Unknown" |
| `startTime` | number | Yes | Unix timestamp in milliseconds |
| `lastUpdateTime` | number | Yes | Unix timestamp in milliseconds |
| `estimatedDuration` | number\|null | No | Estimated duration in milliseconds |
| `currentStep` | number\|null | No | Current step number (1-indexed) |
| `totalSteps` | number\|null | No | Total number of steps |
| `tags` | array | No | Categorization tags |

#### Metadata Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `sessionStartTime` | number | Session start timestamp (ms) |
| `lastUpdateTime` | number | Last progress update timestamp (ms) |
| `activeAgents` | array | List of agents with in-progress tasks |
| `totalTokensEstimated` | number | Estimated token consumption (not accurate) |
| `completionRate` | number | Overall completion percentage (0-100) |
| `totalTasks` | number | Total number of tasks |
| `completedTasks` | number | Number of completed tasks |
| `inProgressTasks` | number | Number of in-progress tasks |
| `pendingTasks` | number | Number of pending tasks |
| `currentAgent` | string | Last known active agent (for detection fallback) |

#### History Event Object

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | number | Event timestamp (ms) |
| `event` | string | Event type (see below) |
| `taskId` | string\|null | Associated task ID |
| `agent` | string\|null | Associated agent name |
| `details` | string\|null | Additional event context |

**Event Types:**
- `task_started` - New task created
- `task_completed` - Task marked as completed
- `agent_assigned` - Agent assigned to task
- `task_updated` - Task status or metadata updated

---

## File Structure

```
.orchestra/
├── cache/
│   ├── progress.json              # Active progress data (v2.0)
│   ├── progress-status.txt        # External monitoring export
│   └── history/                   # Archived session progress
│       └── session-20251104-143022.json
│
├── schemas/
│   └── progress-v2.schema.json    # JSON Schema validation (if needed)
│
└── logs/
    └── progress-tracker.log       # Execution logs

hooks/
├── post_code_write.sh             # Hook entry point (modified)
├── session-start.sh               # Session initialization (modified)
├── progress-tracker-update.sh     # Core update logic
├── progress-tracker-display.sh    # Display formatting
├── progress-tracker-export.sh     # External monitoring export
└── lib/
    ├── progress-utils.sh          # Shared utilities
    └── progress-migrate.sh        # Schema migration
```

---

## Agent Detection Mechanism

### Multi-Strategy Heuristic Detection

The system uses a prioritized detection strategy since TodoWrite does not pass explicit agent context:

#### Strategy 1: ActiveForm Prefix (Highest Confidence)
```bash
# Pattern: "Skye is implementing..."
activeForm="Skye implementing authentication"
# Detected: Skye
```

#### Strategy 2: Bracketed Content (Medium Confidence)
```bash
# Pattern: "[Nova] Build dashboard"
content="[Nova] Build user dashboard"
# Detected: Nova
```

#### Strategy 3: Parenthesized Content (Medium Confidence)
```bash
# Pattern: "Design API (Kai)"
content="Design REST API (Kai)"
# Detected: Kai
```

#### Strategy 4: ActiveForm Substring (Lower Confidence)
```bash
# Pattern: Agent name appears anywhere
activeForm="Working with Skye on backend"
# Detected: Skye
```

#### Strategy 5: Fallback to Last Known Agent
```bash
# Use metadata.currentAgent
# If no match, return "Unknown"
```

### Expected Accuracy

- **Strategy 1:** 95% accuracy
- **Strategy 2-3:** 85% accuracy
- **Strategy 4:** 70% accuracy
- **Overall:** 80-90% accuracy

### Improving Detection Accuracy

**Best Practices for Agent Routing:**
1. Use clear agent names in task descriptions
2. Prefix tasks with agent names: `[Skye] Implement feature`
3. Ensure TodoWrite activeForm includes agent name

**Limitation:**
This is a heuristic approach. 100% accuracy requires TodoWrite tool enhancement (future work).

---

## File Locking Mechanism

### Directory-Based Locking

The system uses `mkdir`-based atomic locking for cross-platform compatibility:

```bash
LOCK_FILE="/tmp/orchestra-progress-lock-${USER}"

# Acquire lock
acquire_lock() {
    local timeout=5
    local elapsed=0

    while ! mkdir "$LOCK_FILE" 2>/dev/null; do
        sleep 0.1
        elapsed=$((elapsed + 1))
        if [ $elapsed -ge $((timeout * 10)) ]; then
            log_event "ERROR" "Lock timeout after ${timeout}s"
            return 1
        fi
    done

    # Set trap to ensure cleanup
    trap "rmdir '$LOCK_FILE' 2>/dev/null" EXIT
    return 0
}

# Release lock
release_lock() {
    rmdir "$LOCK_FILE" 2>/dev/null
}
```

### Lock Properties

- **Type:** Advisory lock (directory creation)
- **Timeout:** 5 seconds
- **Scope:** Per-user (using `${USER}` in lock path)
- **Cleanup:** Automatic via EXIT trap
- **Behavior on timeout:** Log warning, skip update (non-blocking)

### Why Not flock?

Directory-based locking was chosen over `flock` for:
- Better cross-platform compatibility (macOS, Linux)
- Atomic operation guarantees
- Simpler cleanup mechanism
- No dependency on file descriptor management

---

## Migration System

### Schema Version Migration

The system automatically migrates old progress.json files to the current schema version.

#### Migration Script: `hooks/lib/progress-migrate.sh`

**Triggered:**
- Automatically on session start (via `session-start.sh`)
- Manually via direct execution

**Migration Path:**
```
progress.json (no version) → v1.0 → v2.0
```

#### Migration Process

1. **Detect current schema version**
   ```bash
   version=$(jq -r '.schemaVersion // "1.0"' progress.json)
   ```

2. **Create backup**
   ```bash
   cp progress.json progress.json.v1.backup-$(date +%Y%m%d-%H%M%S)
   ```

3. **Add v2.0 fields with defaults**
   - `agent: "Unknown"`
   - `startTime: current_timestamp`
   - `lastUpdateTime: current_timestamp`
   - All optional fields: `null` or `[]`

4. **Update schemaVersion**
   ```bash
   jq '.schemaVersion = "2.0"' progress.json
   ```

5. **Validate result**
   - Verify JSON is valid
   - Check all required fields present

### Manual Migration

```bash
# Run migration manually
bash hooks/lib/progress-migrate.sh

# Verify migration succeeded
jq '.schemaVersion' .orchestra/cache/progress.json
# Should output: "2.0"
```

### Rollback

If migration fails or produces unexpected results:

```bash
# Restore from backup
cp .orchestra/cache/progress.json.v1.backup-TIMESTAMP .orchestra/cache/progress.json

# Or reinitialize
rm .orchestra/cache/progress.json
bash hooks/lib/progress-migrate.sh
```

---

## Performance Characteristics

### Benchmark Results (As of v2.0.0)

**Test Environment:**
- macOS Darwin 24.6.0
- Apple Silicon M-series
- SSD storage

| Operation | Small (3 tasks) | Medium (20 tasks) | Large (100 tasks) |
|-----------|----------------|-------------------|-------------------|
| Update Script | 45ms | 78ms | 342ms |
| Display Script | 109ms | 254ms | 1,543ms |
| Export Script | 126ms | 198ms | 1,274ms |
| Utility Functions | 22ms | 22ms | 22ms |

### Performance Targets vs. Actual

| Metric | Target | Actual (Small) | Actual (Large) | Status |
|--------|--------|----------------|----------------|--------|
| Hook execution | < 100ms | 109ms | 1,543ms | ⚠️ Exceeds |
| Lock acquisition | < 50ms | ~15ms | ~15ms | ✅ Pass |
| File I/O | < 20ms | ~10ms | ~45ms | ✅ Pass |

### Known Performance Issues

**Issue:** O(n²) complexity in display/export scripts with 100+ tasks

**Root Cause:**
- Multiple jq invocations in loops
- Repeated JSON parsing for each task

**Mitigation (Current):**
- Use compact display mode (default)
- Avoid verbose mode with large task lists

**Future Optimization:**
- Parse JSON once, use bash arrays
- Batch jq operations
- Consider Python rewrite for complex operations

### Performance Optimization Tips

1. **Keep task count reasonable** (< 50 active tasks)
2. **Archive completed tasks periodically**
3. **Use compact mode** (avoid verbose unless needed)
4. **Consider tmpfs for cache directory** (advanced):
   ```bash
   # Mount .orchestra/cache in RAM (Linux)
   sudo mount -t tmpfs -o size=10M tmpfs .orchestra/cache
   ```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Progress File Corruption

**Symptom:** Invalid JSON errors, cannot parse progress.json

**Diagnosis:**
```bash
# Validate JSON
jq . .orchestra/cache/progress.json

# Check for syntax errors
cat .orchestra/cache/progress.json | json_verify
```

**Recovery:**
```bash
# Option 1: Restore from backup
cp .orchestra/cache/progress.json.v1.backup-LATEST .orchestra/cache/progress.json

# Option 2: Reinitialize
rm .orchestra/cache/progress.json
bash hooks/lib/progress-migrate.sh
```

#### 2. Lock File Stuck

**Symptom:** Repeated "Lock timeout" warnings

**Diagnosis:**
```bash
# Check if lock directory exists
ls -la /tmp/orchestra-progress-lock-${USER}
```

**Recovery:**
```bash
# Manually remove stale lock
rmdir /tmp/orchestra-progress-lock-${USER}

# Or force remove if directory is not empty
rm -rf /tmp/orchestra-progress-lock-${USER}
```

**Prevention:**
- Lock cleanup is automatic via EXIT trap
- Stale locks typically indicate script crash/kill

#### 3. Agent Detection Fails

**Symptom:** All agents show as "Unknown"

**Diagnosis:**
```bash
# Check task content patterns
jq '.todos[] | {content, activeForm, agent}' .orchestra/cache/progress.json

# Enable debug mode
export ORCHESTRA_DEBUG=1
```

**Solutions:**
- Ensure task descriptions include agent names
- Use standard patterns: `[Agent] Task` or `Task (Agent)`
- Manually set `metadata.currentAgent` as fallback

#### 4. Performance Degradation

**Symptom:** Hooks take > 1 second to execute

**Diagnosis:**
```bash
# Count tasks
jq '.todos | length' .orchestra/cache/progress.json

# Profile hook execution
time bash hooks/progress-tracker-display.sh
```

**Solutions:**
- Archive old tasks if count > 50
- Use compact mode only
- Check disk I/O (SSD recommended)

#### 5. Timestamp Generation Issues

**Symptom:** Invalid timestamps in JSON (e.g., "17621765803N")

**Platform:** macOS (BSD date command)

**Diagnosis:**
```bash
# Test timestamp generation
bash -c 'source hooks/lib/progress-utils.sh && get_timestamp_ms'
```

**Fix:**
Ensure `get_timestamp_ms()` function is used instead of direct `date +%s%3N`:

```bash
# Correct implementation (in progress-utils.sh)
get_timestamp_ms() {
    if date +%s%3N 2>/dev/null | grep -q 'N'; then
        # BSD date (macOS) - fallback to seconds * 1000
        echo $(($(date +%s) * 1000))
    else
        # GNU date (Linux) - native millisecond support
        date +%s%3N
    fi
}
```

---

## Maintenance Tasks

### Regular Maintenance

#### Daily (Automated)
- Lock cleanup (automatic via EXIT trap)
- Progress updates (automatic on TodoWrite)

#### Weekly (Manual)
```bash
# Review log size
ls -lh .orchestra/logs/progress-tracker.log

# Rotate logs if > 10MB
if [ $(stat -f%z .orchestra/logs/progress-tracker.log) -gt 10485760 ]; then
    mv .orchestra/logs/progress-tracker.log \
       .orchestra/logs/progress-tracker-$(date +%Y%m%d).log
fi
```

#### Monthly (Manual)
```bash
# Archive old session histories
mkdir -p .orchestra/cache/history/archive-$(date +%Y%m)
mv .orchestra/cache/history/session-*.json \
   .orchestra/cache/history/archive-$(date +%Y%m)/

# Clean up old logs
find .orchestra/logs -name "progress-tracker-*.log" -mtime +30 -delete
```

### Session Cleanup

Before starting a new major session or release:

```bash
# 1. Archive current progress
cp .orchestra/cache/progress.json \
   .orchestra/cache/history/release-1.0-progress.json

# 2. Reset progress
rm .orchestra/cache/progress.json
bash hooks/lib/progress-migrate.sh

# 3. Verify clean state
jq '.todos | length' .orchestra/cache/progress.json
# Should output: 0
```

---

## Security Considerations

### Data Sensitivity

**What's Stored:**
- Task descriptions (may contain feature names, API endpoints)
- Agent names (public information)
- Timestamps (non-sensitive)
- No credentials, API keys, or secrets

**File Permissions:**
```bash
# Recommended permissions
chmod 644 .orchestra/cache/progress.json      # Owner write, all read
chmod 600 /tmp/orchestra-progress-lock-*      # Owner only
chmod 644 .orchestra/logs/progress-tracker.log
```

### Sensitive Data Handling

**Do NOT log:**
- API keys or credentials
- User passwords
- Personally identifiable information (PII)
- Production database connection strings

**If sensitive data appears in task descriptions:**
```bash
# Sanitize before sharing logs
jq 'del(.todos[].content, .todos[].activeForm)' .orchestra/cache/progress.json
```

### Lock File Security

- Lock files use `${USER}` suffix to prevent cross-user conflicts
- Lock directories are created in `/tmp` with user-only permissions
- No setuid/setgid concerns

---

## Monitoring and Observability

### Log File: `.orchestra/logs/progress-tracker.log`

**Format:**
```
[2025-11-04T10:30:45Z] [INFO] Creating new task: task-123 (Agent: Skye)
[2025-11-04T10:31:02Z] [DEBUG] Processing task task-123: agent=Skye, status=in_progress
[2025-11-04T10:35:12Z] [WARN] Agent detection fallback for task-456
[2025-11-04T10:40:00Z] [ERROR] Lock timeout after 5s
```

### Log Levels

| Level | Usage | Recommended Action |
|-------|-------|-------------------|
| DEBUG | Detailed execution trace | Ignore (only in debug mode) |
| INFO | Normal operations | Monitor for patterns |
| WARN | Non-critical issues | Investigate if frequent |
| ERROR | Operation failures | Investigate immediately |

### Monitoring Commands

```bash
# Follow log in real-time
tail -f .orchestra/logs/progress-tracker.log

# Count errors
grep -c ERROR .orchestra/logs/progress-tracker.log

# View recent warnings
grep WARN .orchestra/logs/progress-tracker.log | tail -20

# Monitor lock contention
grep "Lock timeout" .orchestra/logs/progress-tracker.log | wc -l
```

### Alerting (Optional)

Set up alerts for critical issues:

```bash
# Example: Email on repeated errors
#!/bin/bash
error_count=$(grep ERROR .orchestra/logs/progress-tracker.log | wc -l)
if [ $error_count -gt 10 ]; then
    echo "Progress tracker: $error_count errors detected" | \
        mail -s "Orchestra Progress Alert" admin@example.com
fi
```

---

## Advanced Operations

### Manual Progress Manipulation

**Use Case:** Fix incorrect agent assignment or task status

```bash
# Update specific task
jq '(.todos[] | select(.id == "task-123")).agent = "Skye"' \
   .orchestra/cache/progress.json > /tmp/progress-tmp.json
mv /tmp/progress-tmp.json .orchestra/cache/progress.json

# Mark all in-progress tasks as pending
jq '(.todos[] | select(.status == "in_progress")).status = "pending"' \
   .orchestra/cache/progress.json > /tmp/progress-tmp.json
mv /tmp/progress-tmp.json .orchestra/cache/progress.json
```

### Bulk Operations

```bash
# Remove all completed tasks
jq '.todos |= map(select(.status != "completed"))' \
   .orchestra/cache/progress.json > /tmp/progress-tmp.json
mv /tmp/progress-tmp.json .orchestra/cache/progress.json

# Export task summary to CSV
jq -r '.todos[] | [.agent, .status, .content, .startTime] | @csv' \
   .orchestra/cache/progress.json > tasks-export.csv
```

### Integration with CI/CD

**Example: Export progress at end of CI run**

```yaml
# .github/workflows/build.yml
- name: Export progress summary
  if: always()
  run: |
    bash hooks/progress-tracker-display.sh --verbose > progress-summary.txt

- name: Upload progress artifact
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: progress-summary
    path: progress-summary.txt
```

---

## Known Limitations

### Current Version (2.0.0)

1. **Agent Detection Accuracy: 80-90%**
   - Heuristic-based, not guaranteed
   - Future: Request TodoWrite tool enhancement

2. **Performance with 100+ tasks: Degraded**
   - Display: 1.5 seconds
   - Export: 1.3 seconds
   - Future: Refactor with batch jq operations

3. **No Token Usage Tracking: Estimates Only**
   - No API access to actual token counts
   - Future: If Claude Code exposes API

4. **No Real-Time Updates: On TodoWrite Only**
   - Progress updates only when TodoWrite is called
   - Cannot track long-running operations between TodoWrite calls

5. **Single Project Support**
   - Progress tracking is per-project
   - No cross-project aggregation

### Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| macOS | ✅ Supported | Tested on Darwin 24.6.0 |
| Linux | ✅ Supported | Tested on Ubuntu 22.04 |
| Windows | ⚠️ WSL Required | Use Windows Subsystem for Linux |
| BSD | ❓ Untested | Should work (similar to macOS) |

---

## Future Enhancements

### Planned Improvements

**Phase 1: Performance Optimization (Priority: High)**
- Refactor display/export scripts to use single jq parse
- Target: < 100ms for 100 tasks

**Phase 2: Enhanced Accuracy (Priority: Medium)**
- Request TodoWrite tool to accept `agent` parameter
- Eliminate heuristic detection uncertainty

**Phase 3: Web Dashboard (Priority: Low)**
- Optional HTTP server with real-time updates
- D3.js visualizations (Gantt chart, timeline)

**Phase 4: IDE Integration (Priority: Low)**
- VS Code extension with sidebar view
- JetBrains plugin with tool window

### Contributing

Feature requests and bug reports welcome at the Orchestra Plugin repository.

---

## Appendix: Schema Validation

### JSON Schema (Draft-07)

For automated validation, use the JSON schema definition:

**Location:** `.orchestra/schemas/progress-v2.schema.json` (if needed)

**Validation:**
```bash
# Using ajv-cli
npm install -g ajv-cli
ajv validate -s .orchestra/schemas/progress-v2.schema.json \
             -d .orchestra/cache/progress.json
```

---

## Support and Contact

**Documentation Issues:**
- Author: Eden (Documentation Lead)
- Review Date: 2025-11-04

**Technical Issues:**
- Check logs in `.orchestra/logs/progress-tracker.log`
- Review ADR-001 for architectural decisions
- File issues at Orchestra Plugin repository

**Emergency Procedures:**
If progress tracking completely fails:
1. Disable by setting `ORCHESTRA_PROGRESS_DISABLE=1`
2. Continue working (does not affect agent functionality)
3. Debug and restore when convenient

---

**Document Version:** 1.0
**Author:** Eden (Documentation Lead)
**Technical Review:** Finn (QA), Skye (Implementation)
**Next Review:** After performance optimization (Phase 1)
