# Orchestra Architecture Documentation

This directory contains architectural decision records (ADRs) and design documentation for the Orchestra Plugin.

---

## Progress Tracking System Enhancement (2025-11-03)

### Overview

Complete architectural design for enhanced agent progress tracking system in Orchestra Plugin. Addresses visibility, metadata tracking, and concurrent agent support.

**Status**: Ready for Implementation
**Architect**: Kai
**Estimated Effort**: 8-11 hours
**Next Agent**: Skye (Implementation)

---

### Documents

#### 1. Executive Summary (START HERE)
**File**: [PROGRESS-TRACKING-EXECUTIVE-SUMMARY.md](./PROGRESS-TRACKING-EXECUTIVE-SUMMARY.md)

**Purpose**: Quick overview for decision-makers and reviewers

**Contents**:
- Problem statement and proposed solution
- Key features and benefits
- Implementation roadmap
- Success metrics
- Questions for review

**Read Time**: 5-10 minutes

---

#### 2. Architecture Decision Record (ADR-001)
**File**: [ADR-001-enhanced-progress-tracking-system.md](./ADR-001-enhanced-progress-tracking-system.md)

**Purpose**: Complete architectural analysis and decision documentation

**Contents**:
- Context and problem analysis
- Decision rationale
- Alternative approaches evaluated
- Implementation notes
- Consequences (positive, negative, neutral)
- Future enhancements
- JSON Schema definition (Appendix A)
- Display format examples (Appendix B)
- Hook integration pseudocode (Appendix C)

**Read Time**: 30-45 minutes

**Use Cases**:
- Understand design rationale
- Review alternative approaches
- Reference JSON Schema
- Understand trade-offs

---

#### 3. Implementation Guide
**File**: [PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md](./PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md)

**Purpose**: Detailed implementation specifications for developers (Skye)

**Contents**:
- Phase-by-phase implementation plan
- File structure and modifications
- Function specifications with pseudocode
- Testing strategy (unit, integration, manual)
- Performance targets
- Error handling strategy
- Migration strategy

**Read Time**: 20-30 minutes

**Use Cases**:
- Implement the system
- Write tests
- Understand file organization
- Reference function signatures

---

#### 4. Architecture Diagrams
**File**: [progress-tracking-architecture-diagram.md](./progress-tracking-architecture-diagram.md)

**Purpose**: Visual architecture documentation

**Contents**:
- System overview diagram
- Data flow sequence
- Concurrent agent execution flow
- Agent detection flow
- File locking mechanism
- Display format examples
- ANSI color palette
- Session lifecycle
- Error handling flow
- Performance optimization

**Read Time**: 15-20 minutes

**Use Cases**:
- Understand system architecture visually
- Debug data flow issues
- Reference concurrent behavior
- Understand error handling paths

---

#### 5. Before/After Comparison
**File**: [PROGRESS-TRACKING-COMPARISON.md](./PROGRESS-TRACKING-COMPARISON.md)

**Purpose**: Quantitative comparison of current vs proposed system

**Contents**:
- Side-by-side schema comparison
- Display format comparison
- Performance metrics comparison
- Functional feature comparison
- Visibility comparison
- Concurrency comparison
- Error handling comparison
- Migration path

**Read Time**: 10-15 minutes

**Use Cases**:
- Justify the redesign
- Understand improvements
- Compare before/after displays
- Assess performance impact

---

#### 6. JSON Schema Definition
**File**: [../.orchestra/schemas/progress-v2.schema.json](../../.orchestra/schemas/progress-v2.schema.json)

**Purpose**: Formal schema specification for validation

**Contents**:
- JSON Schema v7 definition
- Field descriptions and constraints
- Example data
- Enum values
- Required fields

**Use Cases**:
- Validate progress.json files
- Generate documentation
- IDE autocomplete support
- Schema validation tests

---

## Quick Navigation

### I want to...

**...understand the problem and solution quickly**
→ Read [Executive Summary](./PROGRESS-TRACKING-EXECUTIVE-SUMMARY.md)

**...review the full architectural decision**
→ Read [ADR-001](./ADR-001-enhanced-progress-tracking-system.md)

**...implement the system**
→ Read [Implementation Guide](./PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md)

**...see visual diagrams**
→ Read [Architecture Diagrams](./progress-tracking-architecture-diagram.md)

**...compare current vs proposed system**
→ Read [Comparison Document](./PROGRESS-TRACKING-COMPARISON.md)

**...validate progress.json format**
→ See [JSON Schema](../../.orchestra/schemas/progress-v2.schema.json)

**...write tests**
→ See "Testing Strategy" in [Implementation Guide](./PROGRESS-TRACKING-IMPLEMENTATION-GUIDE.md)

**...understand migration path**
→ See "Migration Strategy" in [ADR-001](./ADR-001-enhanced-progress-tracking-system.md#implementation-notes)

---

## Document Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                   Executive Summary                             │
│              (High-level overview)                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
┌──────────────┐ ┌──────────┐ ┌──────────────────┐
│  ADR-001     │ │ Diagrams │ │   Comparison     │
│ (Complete    │ │ (Visual  │ │ (Before/After)   │
│  Analysis)   │ │  Flows)  │ │                  │
└──────┬───────┘ └────┬─────┘ └──────────────────┘
       │              │
       ▼              │
┌──────────────────┐  │
│ Implementation   │◄─┘
│     Guide        │
│ (Detailed Specs) │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   JSON Schema    │
│  (Validation)    │
└──────────────────┘
```

---

## Key Concepts

### Enhanced Schema v2.0
- Extended task metadata (agent, timing, steps, tags)
- Session-level metadata (active agents, completion rate)
- Audit trail (history array)
- Automatic migration from v1.0

### Agent Detection
- Multi-strategy heuristic approach
- Parse activeForm and content fields
- 80-90% accuracy
- Fallback to "Unknown"

### Concurrent Agent Support
- File locking with flock
- Atomic read-modify-write operations
- 5-second lock timeout
- Graceful degradation on timeout

### Display Enhancement
- Rich ANSI formatting (colors, progress bars)
- Agent emoji identifiers
- Duration tracking
- Compact and verbose modes

### External Monitoring
- Optional separate terminal monitoring
- Real-time updates via watch/tail
- Persistent visibility

---

## Implementation Status

| Phase | Status | Estimated Time | Assigned To |
|-------|--------|----------------|-------------|
| Phase 1: Core Infrastructure | 🔵 Not Started | 3-4 hours | Skye |
| Phase 2: Enhanced Display | 🔵 Not Started | 2-3 hours | Skye |
| Phase 3: External Monitoring | 🔵 Not Started | 1-2 hours | Skye |
| Phase 4: Session Initialization | 🔵 Not Started | 1 hour | Skye |

**Total Estimated Time**: 8-11 hours

---

## Approval Status

| Stakeholder | Status | Date | Notes |
|-------------|--------|------|-------|
| Architect (Kai) | ✅ Approved | 2025-11-03 | Design complete |
| User/Product Owner | ⏳ Pending | - | Awaiting review |
| Implementation Agent (Skye) | ⏳ Pending | - | Awaiting approval |
| QA Agent (Leo) | ⏳ Pending | - | Awaiting test plan review |

---

## Related Files

### Modified Files (Implementation)
- `hooks/post_code_write.sh` - Add update call
- `hooks/session-start.sh` - Add initialization
- `hooks/progress-tracker-display.sh` - Enhance formatting

### New Files (Implementation)
- `hooks/progress-tracker-update.sh` - Core update logic
- `hooks/progress-tracker-export.sh` - External monitor export
- `hooks/lib/progress-utils.sh` - Shared utilities
- `hooks/lib/progress-migrate.sh` - Schema migration

### Data Files
- `.orchestra/cache/progress.json` - Main progress data
- `.orchestra/cache/progress-status.txt` - External monitor file
- `.orchestra/cache/history/session-*.json` - Archived sessions
- `.orchestra/logs/progress-tracker.log` - Execution logs

### Schema Files
- `.orchestra/schemas/progress-v2.schema.json` - JSON Schema definition

---

## Testing Documentation

### Unit Tests
Location: `tests/unit/progress-utils.spec.sh`

Coverage:
- Agent detection (20+ test cases)
- Duration formatting
- Progress bar rendering
- Metadata calculation
- JSON escaping

### Integration Tests
Location: `tests/integration/progress-tracking.test.sh`

Coverage:
- TodoWrite → hook → progress.json flow
- Concurrent update simulation
- Schema migration
- Lock timeout and recovery
- Error handling

### Manual Testing
Location: Implementation Guide, "Testing Strategy" section

Checklist:
- [ ] Single agent workflow
- [ ] Multi-agent concurrent workflow
- [ ] Long-running session (100+ TodoWrite)
- [ ] Session restart and resume
- [ ] External monitor setup
- [ ] Agent detection accuracy
- [ ] Display formatting in various terminals
- [ ] Performance benchmarks

---

## Performance Benchmarks

### Target Metrics
- Hook execution time: < 100ms (p95)
- File lock acquisition: < 50ms (p95)
- progress.json file size: < 50KB (100 tasks)
- jq processing: < 20ms per update

### Optimization Strategies
1. Use tmpfs for cache directory (-80% I/O latency)
2. Optimize jq queries (-50% processing time)
3. Short lock timeout (5s max)
4. Batch metadata updates

---

## Future Enhancements (Post-MVP)

### Phase 5: Token Usage Tracking
- Integrate with Claude Code API (if exposed)
- Display actual token consumption

### Phase 6: Agent Performance Analytics
- Track average task duration per agent
- Identify bottleneck agents
- Export analytics to CSV

### Phase 7: Web Dashboard
- HTTP server with WebSocket updates
- D3.js visualizations (Gantt chart, timeline)
- Real-time monitoring in browser

### Phase 8: IDE Integration
- VS Code extension
- JetBrains plugin
- Sublime Text integration

### Phase 9: TodoWrite Enhancement
- Submit PR to add `agent` parameter
- Eliminate heuristic detection

### Phase 10: External Notifications
- Slack/Discord integration
- Desktop notifications
- Email summaries

---

## Questions and Support

### Common Questions

**Q: Why not use Claude Code's status line?**
A: Status line is static and evaluated only at session start. No dynamic update mechanism exists.

**Q: Why heuristic agent detection instead of direct parameter?**
A: TodoWrite tool doesn't currently expose agent context. Heuristics are MVP solution; future enhancement will request TodoWrite API change.

**Q: What happens if two agents update simultaneously?**
A: File locking ensures atomic updates. Second agent waits (max 5s) for lock. No data loss.

**Q: What's the performance impact?**
A: Minimal. ~50-100ms hook execution time (vs 50ms current). Optimizations available (tmpfs) if needed.

**Q: Is external monitoring required?**
A: No, it's optional. Chat display works without it. External monitor provides persistent visibility for power users.

### Contact

**Architecture Questions**: Kai (current agent)
**Implementation Questions**: Skye (implementation agent)
**Testing Questions**: Leo (QA agent)
**Documentation Questions**: Mina (documentation agent)

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-03 | Kai | Initial architecture design |

---

## License

Same as Orchestra Plugin (see main repository LICENSE file)

---

**Last Updated**: 2025-11-03
**Maintained By**: Kai (Systems Architect)
**Status**: Ready for Review → Implementation
