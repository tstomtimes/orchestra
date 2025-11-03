# Orchestra Progress Tracking - Implementation Guide

**Status**: Ready for Implementation
**Architect**: Kai
**Date**: 2025-11-03
**Next Agent**: Skye (Implementation)

## Quick Summary

This guide provides implementation specifications for the enhanced Orchestra Plugin progress tracking system. The design addresses visibility, metadata tracking, and concurrent agent support issues in the current implementation.

## Architecture Decision

See [ADR-001: Enhanced Progress Tracking System](./ADR-001-enhanced-progress-tracking-system.md) for complete architectural analysis.

**Selected Approach**: Hybrid Enhanced Chat Display + Optional External Monitoring

## Implementation Phases

### Phase 1: Core Infrastructure (Priority: HIGH)

**Duration Estimate**: 3-4 hours

#### 1.1 Create Utility Library

**File**: `/hooks/lib/progress-utils.sh`

**Required Functions**:
```bash
detect_agent_from_todo()      # Multi-strategy agent detection
is_valid_agent()               # Agent name validation
format_duration()              # Human-readable duration (3m 42s)
format_progress_bar()          # ASCII progress bar [▓▓▓░░░]
init_progress_file_if_missing() # Schema initialization
update_metadata()              # Recalculate metadata fields
add_history_entry()            # Append to audit trail
log_event()                    # Centralized logging
```

**Agent Detection Strategies** (ordered by priority):
1. Parse `activeForm` field for agent name prefix (e.g., "Skye is implementing...")
2. Parse `content` field for bracketed/parenthesized agent (e.g., "[Nova]", "(Kai)")
3. Use `metadata.currentAgent` as fallback
4. Default to "Unknown" if all strategies fail

**Testing Requirements**:
- Unit tests for all functions (shellspec or bats)
- Agent detection test suite with 20+ patterns
- Duration formatting edge cases (0s, 999h)

---

#### 1.2 Create Update Script

**File**: `/hooks/progress-tracker-update.sh`

**Responsibilities**:
- Parse TodoWrite tool parameters from environment/stdin
- Detect agent for each task using `detect_agent_from_todo()`
- Implement atomic file updates with `flock` locking
- Update task metadata (agent, timestamps, status)
- Recalculate session metadata
- Append history entries

**Locking Strategy**:
```bash
# Acquire exclusive lock (max 5 second wait)
(
    flock -w 5 200 || exit 1
    # Critical section: read → modify → write
    jq '...' progress.json > progress.json.tmp
    mv progress.json.tmp progress.json
) 200>/tmp/orchestra-progress.lock
```

**Error Handling**:
- If lock timeout: Log warning, skip update (don't block TodoWrite)
- If jq missing: Log error, skip update gracefully
- If progress.json corrupted: Reinitialize with empty schema

**Testing Requirements**:
- Concurrent update test (10 parallel executions)
- Lock timeout simulation
- Schema migration test (v1.0 → v2.0)

---

#### 1.3 Modify Hook Entry Point

**File**: `/hooks/post_code_write.sh`

**Changes Required**:
```bash
# After line 17 (existing progress display call)
# Add before display:

# Extract TodoWrite parameters (if available)
TOOL_PARAMS="${CLAUDE_TOOL_PARAMS:-}"

# Update progress data
if [ -n "$TOOL_PARAMS" ]; then
    if [ -f "$PROJECT_ROOT/hooks/progress-tracker-update.sh" ]; then
        bash "$PROJECT_ROOT/hooks/progress-tracker-update.sh" "$TOOL_PARAMS" || true
    fi
fi

# Display updated progress (existing call)
display_progress_tracking
```

**Testing Requirements**:
- Integration test: TodoWrite → hook → progress.json update
- Verify CLAUDE_TOOL_PARAMS environment variable availability

---

#### 1.4 Schema Migration

**File**: `/hooks/lib/progress-migrate.sh`

**Migration Logic**:
```bash
migrate_progress_schema() {
    local version=$(jq -r '.schemaVersion // "1.0"' progress.json)

    if [[ "$version" == "1.0" ]]; then
        # Backup original
        cp progress.json progress.json.v1.backup

        # Transform to v2.0
        jq '
            .schemaVersion = "2.0" |
            .metadata = {
                sessionStartTime: now * 1000,
                lastUpdateTime: now * 1000,
                activeAgents: [],
                totalTokensEstimated: 0,
                currentAgent: "Unknown"
            } |
            .history = [] |
            .todos |= map(. + {
                agent: "Unknown",
                startTime: now * 1000,
                lastUpdateTime: now * 1000,
                estimatedDuration: null,
                currentStep: null,
                totalSteps: null,
                tags: []
            })
        ' progress.json > progress.json.tmp

        mv progress.json.tmp progress.json
    fi
}
```

**Invocation**: Call from `session-start.sh` or first `progress-tracker-update.sh` run

**Testing Requirements**:
- Test migration with real v1.0 sample data
- Verify backup creation
- Validate v2.0 schema compliance with JSON Schema

---

### Phase 2: Enhanced Display (Priority: HIGH)

**Duration Estimate**: 2-3 hours

#### 2.1 Rewrite Display Script

**File**: `/hooks/progress-tracker-display.sh`

**Display Format** (compact mode):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PROGRESS  |  3 agents  |  67% complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
😐 Skye   [▓▓▓▓▓▓▓░░░] 70%  Auth middleware (3m 42s)
😄 Nova   [▓▓▓▓▓░░░░░] 50%  Dashboard UI (5m 12s)
😌 Leo    [▓▓▓▓▓▓▓▓░░] 80%  Integration tests (2m 15s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 8  ⚡ 3  ⏳ 4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**ANSI Color Codes**:
- Green (`\e[32m`): Completed tasks
- Yellow (`\e[33m`): In-progress tasks
- Gray (`\e[90m`): Pending tasks
- Bold (`\e[1m`): Headers and agent names
- Reset (`\e[0m`): End of colored section

**Agent Emoji Mapping** (from `.claude.json`):
```bash
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
```

**Verbose Mode** (optional flag):
- Full task list with tags
- Historical completed tasks
- Performance metrics (avg duration, token estimate)
- See ADR-001 Appendix B for full format

**Testing Requirements**:
- Visual regression test (compare screenshots)
- Test with 0 tasks, 1 task, 100 tasks
- Test with multiple concurrent agents
- Test with unknown agent

---

### Phase 3: External Monitoring (Priority: MEDIUM)

**Duration Estimate**: 1-2 hours

#### 3.1 Create Export Script

**File**: `/hooks/progress-tracker-export.sh`

**Purpose**: Generate `.orchestra/cache/progress-status.txt` for external monitoring

**Format**: Same as enhanced display (compact or verbose)

**Invocation**: Called from `post_code_write.sh` after display

**User Instructions** (add to docs):
```bash
# Option 1: Watch command (refreshes every 1 second)
watch -n 1 cat .orchestra/cache/progress-status.txt

# Option 2: Tail command (updates on write)
tail -f .orchestra/cache/progress-status.txt
```

**Testing Requirements**:
- Verify file updates on each TodoWrite
- Test with watch/tail commands
- Measure file size growth over 1000 updates

---

### Phase 4: Session Initialization (Priority: MEDIUM)

**Duration Estimate**: 1 hour

#### 4.1 Modify Session Start Hook

**File**: `/hooks/session-start.sh`

**Changes Required**:
```bash
# After welcome message, initialize progress tracking

# Initialize progress.json if missing
if [ ! -f "$PROJECT_ROOT/.orchestra/cache/progress.json" ]; then
    bash "$PROJECT_ROOT/hooks/lib/progress-utils.sh" init_progress_file_if_missing
fi

# Migrate schema if needed
bash "$PROJECT_ROOT/hooks/lib/progress-migrate.sh"

# Set session start time
jq --argjson timestamp "$(date +%s%3N)" \
   '.metadata.sessionStartTime = $timestamp' \
   .orchestra/cache/progress.json > .orchestra/cache/progress.json.tmp
mv .orchestra/cache/progress.json.tmp .orchestra/cache/progress.json

# Archive previous session (if exists and has tasks)
PREV_SESSION_TASKS=$(jq '.todos | length' .orchestra/cache/progress.json)
if [ "$PREV_SESSION_TASKS" -gt 0 ]; then
    mkdir -p .orchestra/cache/history
    mv .orchestra/cache/progress.json \
       .orchestra/cache/history/session-$(date +%Y%m%d-%H%M%S).json
fi

# Display monitoring instructions (once per 10 sessions)
if should_show_monitoring_tip; then
    echo ""
    echo "💡 Tip: For real-time progress monitoring in a separate terminal:"
    echo "   watch -n 1 cat .orchestra/cache/progress-status.txt"
    echo ""
fi
```

**Testing Requirements**:
- Test session initialization flow
- Test session archival
- Verify monitoring tip display logic

---

## File Structure

```
orchestra/
├── .orchestra/
│   ├── cache/
│   │   ├── progress.json              # Current session progress (v2.0 schema)
│   │   ├── progress-status.txt        # Formatted status for external monitoring
│   │   └── history/
│   │       └── session-*.json         # Archived session history
│   ├── schemas/
│   │   └── progress-v2.schema.json    # JSON Schema definition
│   └── logs/
│       └── progress-tracker.log       # Hook execution logs
├── hooks/
│   ├── post_code_write.sh             # MODIFY: Add update call before display
│   ├── session-start.sh               # MODIFY: Add initialization logic
│   ├── progress-tracker-update.sh     # NEW: Core update logic with locking
│   ├── progress-tracker-display.sh    # MODIFY: Enhanced formatting
│   ├── progress-tracker-export.sh     # NEW: Export to status file
│   └── lib/
│       ├── progress-utils.sh          # NEW: Shared utility functions
│       └── progress-migrate.sh        # NEW: Schema migration logic
└── docs/
    └── architecture/
        ├── ADR-001-enhanced-progress-tracking-system.md  # Complete ADR
        └── PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md     # This file
```

## Schema Reference

See `.orchestra/schemas/progress-v2.schema.json` for complete JSON Schema definition.

**Key Fields Added**:
- `agent`: Agent name (Skye, Nova, Kai, etc.)
- `startTime`: Unix timestamp in milliseconds
- `lastUpdateTime`: Unix timestamp in milliseconds
- `estimatedDuration`: Estimated duration in milliseconds (nullable)
- `currentStep` / `totalSteps`: Step-based progress (nullable)
- `tags`: Array of categorization tags
- `metadata.activeAgents`: List of agents with in-progress tasks
- `metadata.sessionStartTime`: Session start timestamp
- `history`: Audit trail of events

## Performance Targets

- Hook execution time: < 100ms (p95)
- File lock acquisition: < 50ms (p95)
- progress.json file size: < 50KB (100 tasks)
- jq processing: < 20ms per update

## Testing Strategy

### Unit Tests (shellspec)

**File**: `/tests/unit/progress-utils.spec.sh`

```bash
Describe 'progress-utils.sh'
  Describe 'detect_agent_from_todo()'
    It 'detects agent from activeForm prefix'
      When call detect_agent_from_todo "Skye is implementing API" "Implement API"
      The output should equal "Skye"
    End

    It 'detects agent from content brackets'
      When call detect_agent_from_todo "Implementing API" "[Nova] Implement API"
      The output should equal "Nova"
    End

    It 'returns Unknown for undetectable agent'
      When call detect_agent_from_todo "Doing stuff" "Do stuff"
      The output should equal "Unknown"
    End
  End

  Describe 'format_duration()'
    It 'formats seconds correctly'
      When call format_duration 45000
      The output should equal "45s"
    End

    It 'formats minutes and seconds correctly'
      When call format_duration 222000
      The output should equal "3m 42s"
    End

    It 'formats hours and minutes correctly'
      When call format_duration 5034000
      The output should equal "1h 23m"
    End
  End
End
```

### Integration Tests

**File**: `/tests/integration/progress-tracking.test.sh`

```bash
#!/bin/bash

# Test 1: TodoWrite → Hook → progress.json update
test_todowrite_integration() {
    # Simulate TodoWrite call
    CLAUDE_TOOL_PARAMS='{"todos":[{"id":"1","content":"Test task","activeForm":"Testing task","status":"in_progress"}]}'
    export CLAUDE_TOOL_PARAMS

    # Trigger hook
    bash hooks/post_code_write.sh

    # Verify progress.json updated
    assert_file_exists ".orchestra/cache/progress.json"
    assert_jq '.todos[0].id' equals "1"
    assert_jq '.todos[0].status' equals "in_progress"
}

# Test 2: Concurrent updates
test_concurrent_updates() {
    # Spawn 10 parallel update processes
    for i in {1..10}; do
        (
            TOOL_PARAMS="{\"todos\":[{\"id\":\"$i\",\"content\":\"Task $i\",\"activeForm\":\"Testing\",\"status\":\"in_progress\"}]}"
            bash hooks/progress-tracker-update.sh "$TOOL_PARAMS"
        ) &
    done

    wait

    # Verify all tasks recorded
    TASK_COUNT=$(jq '.todos | length' .orchestra/cache/progress.json)
    assert_equals "$TASK_COUNT" "10"
}

# Test 3: Schema migration
test_schema_migration() {
    # Create v1.0 progress.json
    echo '{"todos":[{"id":"1","content":"Old task","status":"completed"}]}' > .orchestra/cache/progress.json

    # Run migration
    bash hooks/lib/progress-migrate.sh

    # Verify v2.0 schema
    assert_jq '.schemaVersion' equals "2.0"
    assert_jq '.metadata | has("sessionStartTime")' equals "true"
    assert_jq '.todos[0] | has("agent")' equals "true"
}
```

### Manual Testing Checklist

- [ ] Single agent task execution
- [ ] Multiple concurrent agents (3+)
- [ ] Long-running session (100+ TodoWrite calls)
- [ ] Session restart and resume
- [ ] External monitoring with `watch` command
- [ ] External monitoring with `tail -f` command
- [ ] Agent detection accuracy (sample 20 tasks)
- [ ] Display formatting in iTerm2, Terminal.app, and VS Code terminal
- [ ] Performance: Hook execution time < 100ms

## Known Limitations and Future Enhancements

### Limitations

1. **Agent Detection Uncertainty**: Heuristic-based, ~10-20% misidentification rate
2. **No Persistent In-Chat Display**: Claude Code architectural limitation
3. **Manual External Monitor Setup**: User must run watch/tail command
4. **No Token Usage Tracking**: No API access to actual token counts

### Future Enhancements

**Phase 5** (Post-MVP):
- Token usage tracking (if Claude Code exposes API)
- Agent performance analytics dashboard
- Web-based real-time monitoring (HTTP server + WebSocket)
- IDE extensions (VS Code, JetBrains, Sublime)
- TodoWrite tool enhancement PR (add agent parameter)
- Slack/Discord notifications integration
- AI-powered duration estimation from historical data

## Handoff to Skye (Implementation Agent)

**Recommended Implementation Order**:
1. Phase 1.1: Utility library (foundation)
2. Phase 1.4: Schema migration (prerequisite)
3. Phase 1.2: Update script (core logic)
4. Phase 1.3: Hook integration (wire everything up)
5. Phase 2.1: Enhanced display (user-facing improvement)
6. Phase 4.1: Session initialization (polish)
7. Phase 3.1: External monitoring (optional feature)

**Estimated Total Time**: 8-11 hours

**Testing Strategy**:
- Write unit tests alongside each function (TDD approach)
- Run integration tests after Phase 1 completion
- Manual testing after Phase 2 completion

**Rollout Strategy**:
- Deploy to Orchestra Plugin repository
- Test in Orchestra project itself (dogfooding)
- Document in README.md and getting-started.md
- Announce in release notes

## Questions for User

Before implementation begins, please confirm:

1. **Display Preference**: Do you prefer compact or verbose display format by default?
2. **External Monitoring**: Should we include setup instructions in session-start welcome message?
3. **Agent Detection**: Is 10-20% misidentification acceptable, or should we request TodoWrite tool enhancement?
4. **Testing Framework**: Preference for shellspec vs bats for unit tests?
5. **Phase Prioritization**: Any phases you want to defer or expedite?

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Architect**: Kai
**Status**: Ready for Review → Implementation
