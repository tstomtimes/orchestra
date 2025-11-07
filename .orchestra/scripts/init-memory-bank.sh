#!/usr/bin/env bash
# Memory Bank Initialization Script
# Automatically creates Memory Bank directory structure and template files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MEMORY_BANK_ROOT="${HOME}/memory-bank"
PROJECT_NAME="orchestra"
PROJECT_DIR="${MEMORY_BANK_ROOT}/${PROJECT_NAME}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function: Print info message
info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

# Function: Print success message
success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

# Function: Print warning message
warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

# Function: Print error message and exit
error() {
    echo -e "${RED}❌ ${1}${NC}" >&2
    exit 1
}

# Function: Check if project already exists
check_existing_project() {
    if [ -d "$PROJECT_DIR" ]; then
        local file_count=$(find "$PROJECT_DIR" -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$file_count" -gt 0 ]; then
            warning "Memory Bank project '${PROJECT_NAME}' already exists at: ${PROJECT_DIR}"
            warning "Found ${file_count} existing file(s). Skipping initialization to prevent data loss."
            info "To reinitialize, manually delete the directory: rm -rf ${PROJECT_DIR}"
            return 1
        fi
    fi
    return 0
}

# Function: Create directory structure
create_directories() {
    info "Creating Memory Bank directory structure..."

    if ! mkdir -p "$PROJECT_DIR"; then
        error "Failed to create directory: ${PROJECT_DIR}"
    fi

    success "Directory created: ${PROJECT_DIR}"
}

# Function: Generate project-overview.md template
create_project_overview() {
    local file="${PROJECT_DIR}/project-overview.md"

    cat > "$file" << 'EOF'
# Orchestra Plugin - Project Overview

**Created:** TIMESTAMP_PLACEHOLDER
**Project:** orchestra
**Type:** AI-Powered Development Workflow Automation System

---

## Purpose

The Orchestra Plugin is a comprehensive development workflow automation system that integrates with Claude Code. It provides:

1. **Multi-Agent Orchestration** - 11 specialized AI agents (Riley, Skye, Finn, Eden, Kai, Leo, Iris, Nova, Mina, Theo, Blake) that handle specific development tasks, coordinated by main Claude Code
2. **Automated Quality Gates** - Hooks for task clarity, PR validation, merge checks, deployment verification
3. **MCP Server Integration** - Browser automation, memory bank, and voice notifications via ElevenLabs
4. **Document-Driven Development** - Enforces documentation, architecture, and test-first workflows

---

## Current State

### Implementation Status
- ✅ Core plugin architecture with 12 agents
- ✅ Git hook system (before_task, before_pr, before_merge, before_deploy, after_deploy)
- ✅ MCP servers (Browser, Memory Bank, ElevenLabs)
- ✅ Slash commands (/browser, /screenshot, /orchestra-setup)
- ✅ Document-Driven Development framework (.orchestra/specs/)
- 🚧 Memory Bank integration (in progress)
- ⏳ Agent auto-routing enhancement (planned)

### Repository Structure
```
orchestra/
├── .orchestra/           # Document-Driven Development system
│   ├── specs/            # Requirements, architecture, data models
│   ├── scripts/          # Automation scripts (sync-validator, init-memory-bank)
│   └── config.json       # Workflow configuration
├── agents/               # 12 specialized AI agent definitions
├── commands/             # Slash command definitions
├── hooks/                # Git hooks for quality gates
├── mcp-servers/          # MCP server implementations
├── skills/               # Shared skills and guidelines
└── setup.sh              # One-command installation script
```

---

## Key Features

### 1. Agent System
- **Riley** - Requirements clarification and analysis
- **Skye** - Code implementation and refactoring
- **Finn** - Code review and quality assurance
- **Kai** - Architecture and system design
- **Eden** - Documentation and content
- **Leo** - Security and compliance
- **Iris** - Integration and API coordination
- **Nova** - UI/UX design and frontend
- **Mina** - Data engineering and database
- **Theo** - DevOps and infrastructure
- **Blake** - Performance and optimization

### 2. Quality Gates
- `before_task.sh` - Clarifies task requirements before starting work
- `before_pr.sh` - Validates PR quality (tests, docs, code standards)
- `before_merge.sh` - Final checks before merging to main
- `before_deploy.sh` - Pre-deployment validation
- `after_deploy.sh` - Post-deployment verification

### 3. MCP Servers
- **Browser MCP** - Automated web testing and interaction
- **Memory Bank** - Persistent project knowledge across sessions
- **ElevenLabs** - Voice notifications for long-running tasks

---

## Technology Stack

See: [tech-stack.md](./tech-stack.md)

---

## Recent Changes

_Update this section as major milestones are completed._

### Latest Updates
- Memory Bank initialization script created
- Document-Driven Development system established
- 12-agent orchestration system fully implemented
- Git hook automation deployed

---

## Goals

### Short-term (Current Sprint)
1. Complete Memory Bank integration
2. Enhance agent auto-routing system
3. Improve test coverage for critical paths
4. Refine documentation templates

### Medium-term (Next 2-4 Weeks)
1. Add performance benchmarking for agents
2. Implement agent collaboration protocols
3. Create usage analytics and metrics
4. Build example projects and tutorials

### Long-term (3-6 Months)
1. Plugin marketplace publication
2. Multi-language support
3. Advanced agent learning capabilities
4. Enterprise features (team management, audit logs)

---

## How to Use This File

This file provides a high-level overview of the Orchestra Plugin project. Update it when:

- Major milestones are reached
- Architecture changes significantly
- New features are added or removed
- Project goals or direction shifts

**Related Files:**
- [tech-stack.md](./tech-stack.md) - Detailed technology stack
- [decisions.md](./decisions.md) - Important decisions and rationale
- [progress.md](./progress.md) - Detailed progress tracking
- [next-steps.md](./next-steps.md) - Immediate action items

---

**Last Updated:** TIMESTAMP_PLACEHOLDER
EOF

    # Replace placeholder with actual timestamp
    sed -i.bak "s/TIMESTAMP_PLACEHOLDER/${TIMESTAMP}/g" "$file" && rm "${file}.bak"

    success "Created: project-overview.md"
}

# Function: Generate tech-stack.md template
create_tech_stack() {
    local file="${PROJECT_DIR}/tech-stack.md"

    cat > "$file" << 'EOF'
# Orchestra Plugin - Technology Stack

**Created:** TIMESTAMP_PLACEHOLDER
**Project:** orchestra

---

## Core Technologies

### Languages
- **TypeScript** - Primary language for plugin logic, MCP servers, and automation scripts
- **Bash** - Shell scripting for setup and hooks
- **Python** - MCP server implementation (ElevenLabs voice notifications)
- **Markdown** - Documentation and agent definitions

### Runtime Environments
- **Node.js v18+** - JavaScript runtime for TypeScript execution
- **Python 3.8+** - Python runtime for voice notification server

---

## Framework & Libraries

### Testing
- **Vitest** - Unit testing framework (chosen for speed and TypeScript support)
- **Playwright** - Browser automation for web testing
- **@types/node** - TypeScript definitions for Node.js

### Code Quality
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript Compiler (tsc)** - Type checking and compilation

### MCP Integration
- **@modelcontextprotocol/sdk** - Model Context Protocol SDK
- **Puppeteer/Playwright** - Browser automation backend
- **ElevenLabs SDK** - Text-to-speech API integration

---

## MCP Servers

### 1. Browser MCP Server
- **Language:** TypeScript
- **Framework:** Custom implementation using Playwright
- **Port:** 9222 (configurable)
- **Purpose:** Automated web interaction, testing, and screenshots

**Capabilities:**
- Page navigation and interaction
- Element selection and manipulation
- Screenshot capture
- Console log retrieval
- Accessibility tree snapshots

### 2. Memory Bank MCP Server
- **Language:** TypeScript
- **Framework:** Built-in Claude Code MCP server
- **Storage:** File-based (~/memory-bank/)
- **Purpose:** Persistent project knowledge across sessions

**Capabilities:**
- Project management (list, create, delete)
- File operations (read, write, update)
- Cross-session context preservation

### 3. ElevenLabs MCP Server
- **Language:** Python
- **Framework:** Flask (HTTP server)
- **API:** ElevenLabs Text-to-Speech
- **Purpose:** Voice notifications for long-running tasks

**Capabilities:**
- Text-to-speech conversion
- Voice selection and configuration
- Audio streaming

---

## Development Tools

### Package Management
- **npm** - Node.js package manager
- **pip** - Python package manager
- **venv** - Python virtual environment

### Version Control
- **Git** - Source control
- **Git Hooks** - Automated quality gates

### Build & Deployment
- **TypeScript Compiler** - Transpilation to JavaScript
- **chmod** - Script permission management
- **symlinks** - Hook and command installation

---

## Dependencies

### Node.js (package.json)
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "playwright": "^1.40.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Python (requirements.txt equivalent)
```
elevenlabs>=0.3.0
requests>=2.31.0
python-dotenv>=1.0.0
```

---

## Architecture Patterns

### 1. Multi-Agent System
- **Pattern:** Agent-based architecture
- **Communication:** CLI-based invocation via skills
- **Coordination:** Orchestra plugin routes requests to specialized agents

### 2. Hook System
- **Pattern:** Event-driven automation
- **Integration:** Git hooks + Claude Code lifecycle hooks
- **Validation:** Pre-flight checks before commits, PRs, deployments

### 3. Document-Driven Development
- **Pattern:** Specification-first development
- **Structure:** `.orchestra/specs/` with requirements, architecture, data models
- **Validation:** Sync validator ensures code-doc-test alignment

---

## Configuration Files

### .orchestra/config.json
Workflow configuration for document-driven development:
- Enforcement mode (strict vs lenient)
- Test-first requirements
- Linting and formatting rules
- Sync score thresholds

### .env
Environment variables for MCP servers:
- API keys (ElevenLabs, GitHub, etc.)
- Server configuration
- Feature flags

### .claude/settings.json
Claude Code settings:
- Tool auto-approval settings
- Memory Bank configuration
- Agent routing preferences

---

## External Services

### APIs
- **ElevenLabs** - Text-to-speech API
- **GitHub API** - Repository operations
- **Anthropic API** - Claude AI models

### Claude Code Integration
- **Plugin System** - Custom plugin architecture
- **MCP Protocol** - Model Context Protocol for tool integration
- **Skills Framework** - Reusable prompt libraries

---

## System Requirements

### Minimum
- macOS 10.15+ or Linux (Ubuntu 20.04+)
- Node.js 18+
- Python 3.8+
- 2GB RAM
- 1GB disk space

### Recommended
- macOS 14+ or Linux (Ubuntu 22.04+)
- Node.js 20+
- Python 3.11+
- 4GB RAM
- 2GB disk space

---

## How to Use This File

Update this file when:
- New dependencies are added or removed
- Technology choices change
- Architecture patterns evolve
- System requirements change

**Related Files:**
- [project-overview.md](./project-overview.md) - High-level project overview
- [decisions.md](./decisions.md) - Technology selection rationale
- `.orchestra/config.json` - Current workflow configuration

---

**Last Updated:** TIMESTAMP_PLACEHOLDER
EOF

    sed -i.bak "s/TIMESTAMP_PLACEHOLDER/${TIMESTAMP}/g" "$file" && rm "${file}.bak"
    success "Created: tech-stack.md"
}

# Function: Generate decisions.md template
create_decisions() {
    local file="${PROJECT_DIR}/decisions.md"

    cat > "$file" << 'EOF'
# Orchestra Plugin - Important Decisions

**Created:** TIMESTAMP_PLACEHOLDER
**Project:** orchestra

---

## Overview

This file tracks significant decisions made during the development of the Orchestra Plugin. Each decision includes context, alternatives considered, and rationale.

---

## Decision Log

### D-001: Multi-Agent Architecture
**Date:** 2025-11
**Status:** ✅ Implemented
**Context:**
Need for specialized expertise in different development domains (requirements, coding, review, architecture, etc.)

**Alternatives Considered:**
1. Single monolithic agent handling all tasks
2. Manual task routing by users
3. Multi-agent system with auto-routing

**Decision:**
Implement 12 specialized agents with auto-routing capabilities.

**Rationale:**
- Specialization improves output quality
- Auto-routing reduces cognitive load on users
- Easier to maintain and extend specific domain expertise
- Supports parallel execution of independent tasks

**Consequences:**
- Increased system complexity
- Need for agent coordination protocols
- Potential for routing errors (mitigated by before_task hook)

---

### D-002: Git Hook Integration
**Date:** 2025-11
**Status:** ✅ Implemented
**Context:**
Need to enforce quality gates at key development lifecycle points.

**Alternatives Considered:**
1. Manual quality checks
2. CI/CD-only validation
3. Git hooks + Claude Code lifecycle hooks

**Decision:**
Implement comprehensive hook system covering before_task, before_pr, before_merge, before_deploy, after_deploy.

**Rationale:**
- Catches issues early in development cycle
- Reduces CI/CD failures and wasted time
- Provides immediate feedback to developers
- Enforces consistent standards across team

**Consequences:**
- Requires hook installation during setup
- Can slow down development if hooks are too strict
- Need for lenient mode for rapid prototyping

---

### D-003: Memory Bank Integration
**Date:** 2025-11
**Status:** 🚧 In Progress
**Context:**
Need for persistent project knowledge that survives Claude Code session restarts.

**Alternatives Considered:**
1. Session-based context only (default Claude behavior)
2. File-based project documentation
3. Memory Bank MCP server integration

**Decision:**
Integrate Memory Bank MCP server with structured project knowledge files.

**Rationale:**
- Persists key project information across sessions
- Reduces need to re-explain project context
- Enables knowledge sharing between agents
- Structured format ensures consistency

**Consequences:**
- Requires Memory Bank setup and initialization
- Need to keep Memory Bank files synchronized with code
- Storage management for large projects

---

### D-004: Document-Driven Development
**Date:** 2025-11
**Status:** ✅ Implemented
**Context:**
Need to maintain alignment between documentation, tests, and code.

**Alternatives Considered:**
1. Code-first development with optional docs
2. Test-first development only
3. Document-driven with test-driven development

**Decision:**
Implement comprehensive Document-Driven Development framework with `.orchestra/specs/`.

**Rationale:**
- Reduces technical debt and misaligned implementations
- Improves team communication and onboarding
- Facilitates change management and impact analysis
- Supports compliance and audit requirements

**Consequences:**
- Increased upfront documentation effort
- Need for sync validation tooling
- Requires cultural shift in development practices

---

### D-005: TypeScript for Core Logic
**Date:** 2025-11
**Status:** ✅ Implemented
**Context:**
Need for type-safe, maintainable codebase for plugin and MCP servers.

**Alternatives Considered:**
1. Pure JavaScript
2. TypeScript
3. Python for all components

**Decision:**
Use TypeScript for plugin logic and MCP servers (except ElevenLabs).

**Rationale:**
- Strong type system catches errors at compile time
- Better IDE support and developer experience
- Easier to refactor and maintain
- Industry standard for Node.js applications

**Consequences:**
- Compilation step required
- Learning curve for team members unfamiliar with TypeScript
- Type definition maintenance overhead

---

### D-006: Vitest over Jest
**Date:** 2025-11
**Status:** ✅ Implemented
**Context:**
Need for fast, TypeScript-friendly testing framework.

**Alternatives Considered:**
1. Jest (most popular)
2. Mocha + Chai
3. Vitest (modern Vite-based)

**Decision:**
Use Vitest as primary testing framework.

**Rationale:**
- Native TypeScript support without configuration
- Faster execution than Jest
- Modern API compatible with Jest
- Better watch mode and developer experience

**Consequences:**
- Smaller ecosystem compared to Jest
- Need to ensure compatibility with existing Jest-based projects
- Potential migration effort if switching back to Jest

---

### D-007: Lenient Mode by Default
**Date:** 2025-11
**Status:** ✅ Implemented
**Context:**
Balance between quality enforcement and developer velocity.

**Alternatives Considered:**
1. Strict mode always enforced
2. Lenient mode with warnings only
3. Configurable mode per project

**Decision:**
Default to lenient mode with configurable strict mode option.

**Rationale:**
- Reduces friction during rapid prototyping
- Allows gradual adoption of best practices
- Provides warnings to educate developers
- Teams can enable strict mode when ready

**Consequences:**
- Risk of ignored warnings accumulating
- Need for clear migration path to strict mode
- Requires good warning messages and documentation

---

### D-008: File-based Memory Bank Storage
**Date:** 2025-11
**Status:** ✅ Implemented
**Context:**
Storage mechanism for Memory Bank project knowledge.

**Alternatives Considered:**
1. Database storage (SQLite, PostgreSQL)
2. File-based storage (Markdown files)
3. Cloud-based storage (S3, GitHub)

**Decision:**
Use file-based storage in `~/memory-bank/` directory.

**Rationale:**
- Simple to implement and maintain
- Human-readable and editable
- No database dependencies
- Easy to version control if needed

**Consequences:**
- Limited query capabilities compared to databases
- Need for file naming conventions
- Potential performance issues with large projects

---

## Decision Template

Use this template for new decisions:

```markdown
### D-XXX: [Decision Title]
**Date:** YYYY-MM
**Status:** 🚧 Proposed | ✅ Implemented | ❌ Rejected | 🔄 Revised
**Context:**
[Why is this decision needed? What problem are we solving?]

**Alternatives Considered:**
1. [Option 1]
2. [Option 2]
3. [Option 3]

**Decision:**
[What did we decide to do?]

**Rationale:**
- [Reason 1]
- [Reason 2]
- [Reason 3]

**Consequences:**
- [Positive consequence]
- [Negative consequence or trade-off]
- [Mitigation strategy]
```

---

## How to Use This File

Update this file when:
- Making significant architectural or technical decisions
- Choosing between competing alternatives
- Establishing project-wide conventions
- Reversing or revising previous decisions

**Related Files:**
- [project-overview.md](./project-overview.md) - High-level project overview
- [tech-stack.md](./tech-stack.md) - Technology choices
- `.orchestra/specs/architecture/` - Detailed ADRs

---

**Last Updated:** TIMESTAMP_PLACEHOLDER
EOF

    sed -i.bak "s/TIMESTAMP_PLACEHOLDER/${TIMESTAMP}/g" "$file" && rm "${file}.bak"
    success "Created: decisions.md"
}

# Function: Generate progress.md template
create_progress() {
    local file="${PROJECT_DIR}/progress.md"

    cat > "$file" << 'EOF'
# Orchestra Plugin - Progress Tracking

**Created:** TIMESTAMP_PLACEHOLDER
**Project:** orchestra

---

## Overview

This file tracks the detailed progress of the Orchestra Plugin project, including completed milestones, ongoing work, and blockers.

---

## Current Sprint (Week of CURRENT_WEEK)

### In Progress
- [ ] Memory Bank initialization script implementation
- [ ] Test suite for Memory Bank integration
- [ ] Documentation updates for Memory Bank usage

### Completed This Week
- ✅ Memory Bank directory structure design
- ✅ Template file specifications defined

### Blocked
_No blockers at this time._

---

## Milestones

### Phase 1: Core Infrastructure ✅
**Completed:** 2025-11
- [x] Project setup and repository structure
- [x] Basic plugin architecture
- [x] 12 specialized agent definitions
- [x] Git hook system implementation
- [x] Setup script (`setup.sh`) for one-command installation

### Phase 2: MCP Server Integration ✅
**Completed:** 2025-11
- [x] Browser MCP server implementation
- [x] Memory Bank MCP server integration
- [x] ElevenLabs voice notification server
- [x] MCP server startup and management scripts

### Phase 3: Document-Driven Development 🚧
**In Progress - 85% Complete**
- [x] `.orchestra/` directory structure
- [x] Specification templates (requirements, architecture, data models)
- [x] Sync validator script
- [x] Git hook integration for validation
- [ ] Memory Bank initialization automation
- [ ] Complete test coverage for sync validator
- [ ] Documentation and usage examples

### Phase 4: Quality & Testing (Upcoming)
**Target:** Early 2026
- [ ] Comprehensive unit test suite (target: 80% coverage)
- [ ] Integration tests for MCP servers
- [ ] End-to-end workflow tests
- [ ] Performance benchmarking
- [ ] Security audit

### Phase 5: Polish & Release (Upcoming)
**Target:** Mid 2026
- [ ] User documentation and tutorials
- [ ] Video demonstrations
- [ ] Plugin marketplace submission
- [ ] Community feedback integration
- [ ] Version 1.0 release

---

## Feature Status

### Implemented Features ✅
- Multi-agent orchestration system (12 agents)
- Automated task clarity reminders (before_task hook)
- Pull request quality validation (before_pr hook)
- Merge safety checks (before_merge hook)
- Deployment validation (before/after_deploy hooks)
- Browser automation via MCP
- Memory Bank persistent storage
- Voice notifications
- Document-Driven Development framework
- Slash commands (/browser, /screenshot, /orchestra-setup)

### In Development 🚧
- Memory Bank initialization automation
- Enhanced agent auto-routing
- Test coverage improvements
- Performance optimization

### Planned Features 📋
- Agent collaboration protocols
- Advanced Memory Bank query capabilities
- Multi-language support
- Team management features
- Usage analytics and metrics
- Agent learning and adaptation

---

## Metrics

### Code Quality
- **Total Lines of Code:** ~8,000
- **TypeScript Coverage:** 95%
- **Test Coverage:** 45% (target: 80%)
- **ESLint Errors:** 0
- **ESLint Warnings:** 3

### Documentation
- **Specification Documents:** 15
- **Agent Definitions:** 12
- **Slash Commands:** 3
- **Git Hooks:** 6

### MCP Servers
- **Total Servers:** 3
- **Active Connections:** Varies by session
- **Average Response Time:** < 100ms

---

## Known Issues

### High Priority
_No high-priority issues at this time._

### Medium Priority
1. **Memory Bank sync performance** - Slow for projects with >100 files
   - _Mitigation: Add file size limits and pagination_
2. **Test coverage gaps** - Some edge cases not covered
   - _Mitigation: Prioritize critical path tests_

### Low Priority
1. **ESLint warnings** - Minor style inconsistencies
2. **Documentation gaps** - Some advanced features lack examples

---

## Team Velocity

### Velocity Tracking (Story Points per Week)
- **Week 1:** 21 points
- **Week 2:** 18 points
- **Week 3:** 24 points
- **Week 4:** 20 points (current)

**Average:** 21 points/week

---

## Risk Register

### Active Risks
1. **Integration Complexity** (Medium)
   - Multiple MCP servers increase testing surface area
   - _Mitigation: Comprehensive integration test suite_

2. **Adoption Friction** (Low)
   - Users may resist document-driven workflow
   - _Mitigation: Lenient mode by default, gradual adoption path_

### Resolved Risks
- ~~**Hook Installation Complexity**~~ - Automated via setup.sh
- ~~**Agent Routing Errors**~~ - before_task hook provides clarity

---

## Weekly Updates

### Week of 2025-11-03
**Progress:**
- Started Memory Bank initialization implementation
- Defined template file structures
- Reviewed setup.sh integration points

**Blockers:**
_None_

**Next Week:**
- Complete Memory Bank initialization script
- Implement test suite
- Update setup.sh integration

---

## How to Use This File

Update this file:
- **Daily:** Add completed tasks to "Completed This Week"
- **Weekly:** Update metrics, velocity, and weekly updates
- **Per Milestone:** Update milestone progress and feature status
- **As Needed:** Track new blockers and risks

**Related Files:**
- [next-steps.md](./next-steps.md) - Immediate action items
- [project-overview.md](./project-overview.md) - High-level status
- [decisions.md](./decisions.md) - Key decisions impacting progress

---

**Last Updated:** TIMESTAMP_PLACEHOLDER
EOF

    # Replace timestamp and current week
    local current_week=$(date '+%Y-%m-%d')
    sed -i.bak "s/TIMESTAMP_PLACEHOLDER/${TIMESTAMP}/g" "$file" && rm "${file}.bak"
    sed -i.bak "s/CURRENT_WEEK/${current_week}/g" "$file" && rm "${file}.bak"

    success "Created: progress.md"
}

# Function: Generate next-steps.md template
create_next_steps() {
    local file="${PROJECT_DIR}/next-steps.md"

    cat > "$file" << 'EOF'
# Orchestra Plugin - Next Steps

**Created:** TIMESTAMP_PLACEHOLDER
**Project:** orchestra

---

## Immediate Actions (This Week)

### High Priority 🔴
1. **Complete Memory Bank initialization script**
   - Implement init-memory-bank.sh with all requirements
   - Add error handling and existing project protection
   - Generate all template files with proper structure
   - **Owner:** Skye
   - **Status:** In Progress
   - **Deadline:** 2025-11-05

2. **Implement Memory Bank test suite**
   - Create test-memory-bank-init.sh script
   - Test new environment setup
   - Test existing project protection
   - Verify all template files
   - **Owner:** Skye
   - **Status:** Pending
   - **Deadline:** 2025-11-05

3. **Integrate Memory Bank into setup.sh**
   - Add step 4.5 for Memory Bank initialization
   - Implement error handling
   - Update success output
   - **Owner:** Skye
   - **Status:** Pending
   - **Deadline:** 2025-11-05

### Medium Priority 🟡
1. **Update Orchestra documentation**
   - Add Memory Bank usage guide
   - Update setup instructions
   - Document template file purposes

2. **Test end-to-end setup flow**
   - Fresh installation on clean system
   - Verify all MCP servers start correctly
   - Test Memory Bank integration

### Low Priority 🟢
1. **Code cleanup**
   - Fix remaining ESLint warnings
   - Update outdated comments
   - Refactor duplicate code sections

---

## Short-term Goals (Next 2 Weeks)

### Week 1: Memory Bank & Testing
- [ ] Complete Memory Bank initialization (see Immediate Actions)
- [ ] Write unit tests for sync-validator.ts
- [ ] Add integration tests for git hooks
- [ ] Document Memory Bank best practices

### Week 2: Agent Enhancement
- [ ] Improve agent auto-routing logic
- [ ] Add agent collaboration examples
- [ ] Optimize agent response times
- [ ] Create agent performance benchmarks

---

## Medium-term Goals (Next Month)

### Documentation & Examples
- [ ] Create video tutorial for Orchestra Plugin
- [ ] Write 5 example workflows (feature dev, bug fix, refactor, etc.)
- [ ] Document advanced agent usage patterns
- [ ] Build interactive demo project

### Quality & Performance
- [ ] Achieve 80% test coverage
- [ ] Reduce average agent response time by 20%
- [ ] Optimize Memory Bank file operations
- [ ] Implement caching for frequently accessed data

### Feature Development
- [ ] Add agent collaboration protocols
- [ ] Implement advanced Memory Bank queries
- [ ] Build usage analytics dashboard
- [ ] Create agent learning capabilities

---

## Long-term Vision (Next Quarter)

### Q1 2026
- [ ] Plugin marketplace publication
- [ ] Multi-language support (Japanese, Spanish, French)
- [ ] Team management features
- [ ] Advanced agent orchestration patterns

### Q2 2026
- [ ] Enterprise features (audit logs, compliance)
- [ ] Agent marketplace (community-contributed agents)
- [ ] Cloud-based Memory Bank option
- [ ] Performance optimization at scale

---

## Dependencies & Blockers

### External Dependencies
- **Claude Code Updates:** New MCP protocol versions may require updates
- **Playwright Releases:** Browser automation may need compatibility fixes
- **ElevenLabs API:** Voice notifications depend on API stability

### Current Blockers
_No blockers at this time._

### Potential Risks
1. **Test Coverage Gap:** Need dedicated time for test suite development
2. **Documentation Debt:** Growing faster than we can document
3. **Performance at Scale:** Untested with large projects (>10k files)

---

## Quick Wins

These can be completed in < 1 hour each:

- [ ] Fix remaining 3 ESLint warnings
- [ ] Add more examples to Memory Bank templates
- [ ] Update README.md with Memory Bank section
- [ ] Add troubleshooting guide for common setup issues
- [ ] Create .github/ISSUE_TEMPLATE for bug reports
- [ ] Add CONTRIBUTING.md for community contributions

---

## Ideas & Backlog

### Feature Ideas
- **Agent Playground:** Interactive UI for testing agents
- **Visual Workflow Builder:** Drag-and-drop agent orchestration
- **Smart Notifications:** Context-aware alerts for important events
- **Code Review AI:** Automated PR review with suggestions
- **Dependency Scanner:** Security and update recommendations

### Research & Exploration
- LangChain integration for advanced agent capabilities
- Vector database for semantic code search
- AI-powered test generation
- Predictive analytics for project health

---

## How to Use This File

Update this file:
- **Daily:** Mark completed items, add new urgent tasks
- **Weekly:** Review and reprioritize items, move completed to progress.md
- **Monthly:** Update medium-term goals based on completed work
- **Quarterly:** Review long-term vision and adjust roadmap

### Priority Guidelines
- 🔴 **High Priority:** Must be done this week, blocks other work
- 🟡 **Medium Priority:** Should be done soon, impacts quality or velocity
- 🟢 **Low Priority:** Nice to have, improves polish or DX

**Related Files:**
- [progress.md](./progress.md) - Track completed work
- [project-overview.md](./project-overview.md) - Current project state
- [decisions.md](./decisions.md) - Context for why certain steps exist

---

**Last Updated:** TIMESTAMP_PLACEHOLDER
EOF

    sed -i.bak "s/TIMESTAMP_PLACEHOLDER/${TIMESTAMP}/g" "$file" && rm "${file}.bak"
    success "Created: next-steps.md"
}

# Function: Set file permissions
set_permissions() {
    info "Setting file permissions..."

    # Make all markdown files readable
    chmod 644 "${PROJECT_DIR}"/*.md 2>/dev/null || true

    success "File permissions set (644 for documentation)"
}

# Function: Display summary
display_summary() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Memory Bank Initialization Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📁 Project Location:${NC}"
    echo -e "   ${PROJECT_DIR}"
    echo ""
    echo -e "${BLUE}📄 Template Files Created:${NC}"
    echo -e "   ✓ project-overview.md - Project overview and current state"
    echo -e "   ✓ tech-stack.md       - Technology stack and dependencies"
    echo -e "   ✓ decisions.md        - Important decisions and rationale"
    echo -e "   ✓ progress.md         - Detailed progress tracking"
    echo -e "   ✓ next-steps.md       - Immediate action items"
    echo ""
    echo -e "${BLUE}🔧 Usage:${NC}"
    echo -e "   Memory Bank files can be accessed via Claude Code's Memory Bank MCP tools:"
    echo -e "   ${YELLOW}• mcp__memory-bank__list_projects${NC}"
    echo -e "   ${YELLOW}• mcp__memory-bank__list_project_files projectName=orchestra${NC}"
    echo -e "   ${YELLOW}• mcp__memory-bank__memory_bank_read projectName=orchestra fileName=project-overview.md${NC}"
    echo ""
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo -e "   1. Review and customize template files in: ${PROJECT_DIR}"
    echo -e "   2. Update files as project evolves"
    echo -e "   3. Use Memory Bank tools in Claude Code to access persistent context"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🎼 Orchestra Plugin - Memory Bank Initialization${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Check for existing project
    if ! check_existing_project; then
        echo ""
        info "Memory Bank initialization skipped."
        exit 0
    fi

    # Create directory structure
    create_directories

    # Generate template files
    info "Generating template files..."
    create_project_overview
    create_tech_stack
    create_decisions
    create_progress
    create_next_steps

    # Set permissions
    set_permissions

    # Display summary
    display_summary
}

# Run main function
main
