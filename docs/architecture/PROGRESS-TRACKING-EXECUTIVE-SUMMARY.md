# Enhanced Progress Tracking System - Executive Summary

**Date**: 2025-11-03
**Architect**: Kai
**Status**: Ready for Implementation
**Estimated Effort**: 8-11 hours

---

## Problem Statement

Current progress tracking implementation has critical limitations:
- Progress information scrolls out of view in chat
- No agent assignment tracking
- Missing execution time and metadata
- No support for concurrent agent execution
- Poor visual scannability

## Proposed Solution

**Hybrid Enhanced Chat Display + Optional External Monitoring**

### Core Components

1. **Enhanced Schema (v2.0)**: Extended progress.json with agent, timing, step tracking, and audit trail
2. **Agent Detection**: Multi-strategy heuristic detection from TodoWrite parameters
3. **Atomic Updates**: File locking mechanism for concurrent agent support
4. **Rich Display**: ANSI-formatted progress with emojis, progress bars, and color coding
5. **External Monitoring**: Optional separate terminal monitoring for persistent visibility

### Architecture Overview

```
TodoWrite → PostToolUse Hook → update.sh (atomic) → progress.json
                              ↓
                         display.sh → Chat injection
                              ↓
                         export.sh → progress-status.txt (external monitor)
```

---

## Key Features

### 1. Enhanced Schema

**New Fields**:
- `agent`: Agent name (Skye, Nova, Kai, etc.)
- `startTime` / `lastUpdateTime`: Unix timestamps
- `currentStep` / `totalSteps`: Step-based progress
- `tags`: Categorization tags
- `metadata.activeAgents`: Currently active agents list
- `history[]`: Audit trail of events

### 2. Agent Detection (Multi-Strategy)

Priority order:
1. Parse `activeForm` field: "Skye is implementing..." → "Skye"
2. Parse `content` field: "[Nova] Build dashboard" → "Nova"
3. Use `metadata.currentAgent` as fallback
4. Default to "Unknown"

**Expected Accuracy**: 80-90%

### 3. Concurrent Agent Support

- **File Locking**: flock-based exclusive locking (5 second timeout)
- **Atomic Updates**: Read → Modify → Write in critical section
- **Graceful Degradation**: Log warning and skip update on lock timeout

### 4. Enhanced Display

**Compact Mode** (default):
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

**Features**:
- Agent emoji identifiers (from .claude.json)
- ASCII progress bars with percentage
- Duration formatting (3m 42s, 1h 23m)
- ANSI color coding (green=completed, yellow=in-progress, gray=pending)
- Task summary counts

### 5. External Monitoring (Optional)

**User Command**:
```bash
# Option 1: Watch (refreshes every second)
watch -n 1 cat .orchestra/cache/progress-status.txt

# Option 2: Tail (updates on write)
tail -f .orchestra/cache/progress-status.txt
```

**Benefits**:
- Always visible in separate terminal
- Real-time updates
- No setup required beyond running command

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (3-4 hours)
- Create `hooks/lib/progress-utils.sh` (utility functions)
- Create `hooks/progress-tracker-update.sh` (update logic with locking)
- Modify `hooks/post_code_write.sh` (integrate update call)
- Create `hooks/lib/progress-migrate.sh` (schema migration)

### Phase 2: Enhanced Display (2-3 hours)
- Rewrite `hooks/progress-tracker-display.sh` (ANSI formatting, progress bars)

### Phase 3: External Monitoring (1-2 hours)
- Create `hooks/progress-tracker-export.sh` (export to status file)
- Document user setup instructions

### Phase 4: Session Initialization (1 hour)
- Modify `hooks/session-start.sh` (initialize, migrate, archive)

---

## Technical Specifications

### File Structure

```
.orchestra/
├── cache/
│   ├── progress.json              # Enhanced v2.0 schema
│   ├── progress-status.txt        # External monitoring file
│   └── history/
│       └── session-*.json         # Archived sessions
├── schemas/
│   └── progress-v2.schema.json    # JSON Schema definition
└── logs/
    └── progress-tracker.log       # Execution logs

hooks/
├── post_code_write.sh             # Modified (add update call)
├── session-start.sh               # Modified (initialization)
├── progress-tracker-update.sh     # New (core update logic)
├── progress-tracker-display.sh    # Modified (enhanced formatting)
├── progress-tracker-export.sh     # New (external monitoring)
└── lib/
    ├── progress-utils.sh          # New (shared utilities)
    └── progress-migrate.sh        # New (schema migration)
```

### Performance Targets

- Hook execution: < 100ms (p95)
- File lock acquisition: < 50ms (p95)
- progress.json file size: < 50KB (100 tasks)
- jq processing: < 20ms per update

### Error Handling

**Principles**:
- Never block TodoWrite execution
- Degrade gracefully on errors
- Log all errors to progress-tracker.log
- Always release file lock (even on error)

**Scenarios**:
- jq not available → Skip update, log warning
- progress.json corrupted → Backup, reinitialize
- Lock timeout → Log warning, skip update
- Agent detection failure → Assign "Unknown", continue

---

## Trade-offs and Limitations

### Accepted Trade-offs

1. **Agent Detection Uncertainty**: Heuristic-based, 10-20% error rate
   - **Rationale**: No direct agent context available; acceptable for MVP
   - **Mitigation**: Multi-strategy detection, fallback mechanisms
   - **Future**: Request TodoWrite tool enhancement

2. **No Persistent In-Chat Display**: Scrolls out of view
   - **Rationale**: Claude Code architectural limitation
   - **Mitigation**: External monitoring option
   - **Future**: IDE extensions with dedicated UI

3. **Manual External Monitor Setup**: User must run watch/tail
   - **Rationale**: No way to auto-launch separate terminal
   - **Mitigation**: Clear documentation, session-start instructions
   - **Future**: IDE integration

4. **No Token Usage Tracking**: Estimates only
   - **Rationale**: No API access to actual token counts
   - **Mitigation**: Document as estimated
   - **Future**: If Claude Code exposes API

### Known Limitations

- **Lock Contention**: Multiple concurrent agents may experience brief delays (< 5s)
- **File I/O Overhead**: ~50ms per update (mitigated with tmpfs optimization)
- **Display Scrolling**: Still visible only once (not persistent in chat)

---

## Success Metrics

### Technical Metrics
- [ ] Hook execution < 100ms (p95)
- [ ] Agent detection accuracy > 80%
- [ ] Zero data loss under concurrent updates (100 parallel tests)
- [ ] Schema migration success rate 100%

### User Experience Metrics
- [ ] Visibility: Users can track progress in real-time (external monitor)
- [ ] Information density: Agent, task, progress, duration visible at a glance
- [ ] Minimal friction: No configuration required for basic usage
- [ ] Clear documentation: Setup instructions < 5 steps

### Functional Metrics
- [ ] Concurrent agent support: 3+ agents tracked simultaneously
- [ ] Session persistence: Progress survives session restarts (archived)
- [ ] Audit trail: All task events recorded in history

---

## Testing Strategy

### Unit Tests (shellspec)
- Agent detection (20+ patterns)
- Duration formatting (edge cases)
- Progress bar rendering
- Metadata calculation

### Integration Tests
- TodoWrite → hook → progress.json flow
- Concurrent update (10 parallel executions)
- Schema migration (v1.0 → v2.0)
- Lock timeout and recovery

### Manual Testing
- Single agent workflow
- Multi-agent concurrent workflow
- Long-running session (100+ TodoWrite calls)
- Session restart and resume
- External monitor setup and accuracy

---

## Future Enhancements (Post-MVP)

### Phase 5: Token Usage Tracking
- Hook into Claude Code API (if exposed)
- Display actual token consumption

### Phase 6: Agent Performance Analytics
- Track average task duration per agent
- Identify bottleneck agents
- Export to CSV for analysis

### Phase 7: Web Dashboard
- Optional HTTP server (port 3001)
- WebSocket updates for live refresh
- D3.js visualizations (Gantt chart, timeline)

### Phase 8: IDE Integration
- VS Code extension with sidebar view
- JetBrains plugin with tool window
- Sublime Text status bar integration

### Phase 9: TodoWrite Tool Enhancement
- Submit PR to add `agent` parameter to TodoWrite
- Eliminates heuristic detection uncertainty

### Phase 10: External Notifications
- Slack/Discord integration
- Desktop notifications
- Email summaries

---

## Questions for Review

Before implementation, please confirm:

1. **Display Preference**: Compact mode as default? (Recommended: Yes)
2. **External Monitoring**: Include setup instructions in session-start? (Recommended: Yes, with dismiss option)
3. **Agent Detection**: Acceptable to have 10-20% "Unknown" assignments? (Recommended: Yes for MVP)
4. **Testing Framework**: Preference for shellspec vs bats? (Recommended: shellspec)
5. **Phase Prioritization**: Any phases to defer? (Recommended: Defer Phase 3 if time-constrained)

---

## Handoff to Implementation (Skye)

**Ready for Implementation**: ✅

**Documentation Provided**:
- [ADR-001: Complete Architectural Analysis](./ADR-001-enhanced-progress-tracking-system.md) (15,000+ words)
- [Implementation Guide](./PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md) (detailed specs, pseudocode)
- [Architecture Diagrams](./progress-tracking-architecture-diagram.md) (visual flows)
- [JSON Schema](../.orchestra/schemas/progress-v2.schema.json) (formal specification)

**Recommended Implementation Order**:
1. Phase 1.1: Utility library (foundation)
2. Phase 1.4: Schema migration (prerequisite)
3. Phase 1.2: Update script (core logic)
4. Phase 1.3: Hook integration (wire up)
5. Phase 2.1: Enhanced display (user-facing)
6. Phase 4.1: Session initialization (polish)
7. Phase 3.1: External monitoring (optional)

**Estimated Total Effort**: 8-11 hours

**Token Budget Used**: ~17,000 tokens (within target)

---

## Approval Signatures

**Architect (Kai)**: ✅ Design Complete - 2025-11-03

**Awaiting Approval**:
- [ ] User/Product Owner (confirm requirements)
- [ ] Implementation Agent (Skye) (confirm feasibility)

**Next Steps**:
1. User reviews and approves design
2. Skye begins Phase 1 implementation
3. Leo prepares test suite alongside implementation

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Related Documents**:
- ADR-001: Enhanced Progress Tracking System
- PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md
- progress-tracking-architecture-diagram.md
- .orchestra/schemas/progress-v2.schema.json
