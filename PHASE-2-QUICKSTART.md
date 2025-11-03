# Phase 2 Quick Start Guide

**Status**: Ready for Day 1 Implementation
**Duration**: 14 working days (3 weeks)
**Team**: 8 agents, 25 person-days

---

## Overview

Transform Phase 1 foundation into a fully functional TDD workflow automation tool with project detection, configuration management, and core commands.

---

## Day 1: Getting Started (You Are Here)

### Installation Commands

```bash
# Install core dependencies
cd /Users/tstomtimes/Documents/GitHub/orchestra/packages/core
pnpm add glob fast-glob cosmiconfig fs-extra
pnpm add -D @types/fs-extra memfs

# Install CLI dependencies
cd ../cli
pnpm add chokidar enquirer ora execa

# Build and verify
cd ../..
pnpm build
pnpm test
```

### Directory Structure to Create

```bash
# In packages/core/src/
mkdir -p detection config fs plugins

# In packages/cli/src/
mkdir -p templates

# In packages/core/tests/
mkdir -p fixtures/vitest-project fixtures/jest-project fixtures/mocha-project
```

### Key Deliverables

**Phase 2 will implement**:
1. Detection Engine - Auto-detect project type and framework
2. Configuration System - Load and validate `.tddai.json`
3. File System Operations - Robust file reading/writing
4. Commands - `init`, `generate`, `validate`, `config`, `watch`
5. Plugin System - Dynamic plugin loading
6. Templates - Test file generation templates

---

## Agent Assignments

| Agent | Days | Primary Focus |
|-------|------|---------------|
| Skye | 10 | Core implementation (detection, config, commands) |
| Finn | 4 | Testing (unit, integration, performance) |
| Leo | 2 | Schema design (types, validation) |
| Mina | 3 | File operations, cross-platform support |
| Eden | 2 | Documentation, examples |
| Kai | 2 | Architecture reviews, ADRs |
| Iris | 1 | Security audit |
| Alex | 14 | Coordination, quality gates, sign-offs |

---

## Success Criteria (Must Meet)

- [ ] All 5 commands functional (init, generate, validate, config, watch)
- [ ] Config detection and loading <2s
- [ ] Project detection >95% accuracy
- [ ] Test generation creates valid test files
- [ ] All tests passing (>85% coverage)
- [ ] Zero TypeScript/lint errors
- [ ] Cross-platform compatibility
- [ ] Documentation complete

---

## Critical Milestones

| Day | Milestone | Gate |
|-----|-----------|------|
| Day 4 | Detection Engine Complete | Alex review |
| Day 7 | Config + File Ops Complete | Alex review |
| Day 10 | All Commands Complete | Alex review |
| Day 12 | Plugin System + Watch Complete | Alex review |
| Day 14 | Documentation + Final Sign-off | Alex + Finn + Iris |

---

## Parallel Execution Windows

### Window 1 (Days 2-4): Detection Engine
- Skye: Package parser, framework detector
- Leo: Detection types
- Finn: Unit tests

### Window 2 (Days 5-7): Config & File Ops
- Leo: Config schema
- Skye: Config loader
- Mina: File operations

### Window 3 (Days 8-10): Commands
- Skye: Init, generate, validate, config
- Finn: Integration tests
- Eden: Documentation

### Window 4 (Days 11-12): Plugin & Watch
- Skye: Plugin loader, watch command
- Kai: ADRs
- Mina: Integration

### Window 5 (Days 13-14): Polish & Release
- Finn: Integration + performance tests
- Eden: Examples, README updates
- Iris: Security audit
- Alex: Final review

---

## Next Steps

**Immediate Actions**:
1. Run installation commands (above)
2. Create directory structure (above)
3. Read full plan: `PHASE-2-IMPLEMENTATION-PLAN.md`
4. Begin Day 2: Detection Engine implementation

**Questions?**
- Scope questions: Ask Alex
- Architecture questions: Ask Kai
- Technical blockers: Ask Skye

---

## Key Documents

- **Full Plan**: `/Users/tstomtimes/Documents/GitHub/orchestra/PHASE-2-IMPLEMENTATION-PLAN.md`
- **Phase 1 Report**: `/Users/tstomtimes/Documents/GitHub/orchestra/IMPLEMENTATION-COMPLETE.md`
- **Architecture**: `/Users/tstomtimes/Documents/GitHub/orchestra/.orchestra/specs/architecture/`

---

## Risk Mitigation

**Top 3 Risks**:
1. Detection accuracy <95% → Test with real projects, provide manual override
2. Cross-platform issues → Use `fs-extra`, test on Linux CI
3. Scope creep → Strict enforcement by Alex, defer AI to Phase 4

---

## Token Budget Awareness

**Estimated Token Usage**:
- Day 1-7: ~50K tokens
- Day 8-14: ~60K tokens
- Total: ~110K tokens (within 200K budget)

**Efficiency Strategies**:
- Targeted file reads (not entire directories)
- Focused testing (not exhaustive exploration)
- Clear acceptance criteria (avoid over-engineering)

---

**Ready to start? Begin with Day 1 setup, then proceed to Day 2: Detection Engine!**
