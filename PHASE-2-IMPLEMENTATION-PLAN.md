# Phase 2 Implementation Plan: Core Functionality

**Project**: Orchestra - TDD.ai CLI
**Phase**: 2 (Core Functionality)
**Duration**: 14 working days (3 weeks)
**Start Date**: 2025-11-04
**Target Completion**: 2025-11-25
**Status**: Planning Complete - Ready for Implementation

---

## 1. Executive Summary

### Overview

Phase 2 transforms the Phase 1 foundation (monorepo structure, CLI framework, type system) into a **fully functional TDD workflow automation tool**. This phase implements the core detection, configuration, and command execution engines that enable developers to use TDD.ai in real projects.

### Key Objectives

1. **Project Detection Engine**: Automatically detect project type, framework, and testing setup with >95% accuracy
2. **Configuration System**: Load, validate, and merge `.tddai.json` configurations with intelligent defaults
3. **Functional Commands**: Implement `init`, `generate`, `validate`, `config`, and `watch` commands
4. **File System Operations**: Robust file reading/writing with template generation and cross-platform support
5. **Plugin Integration**: Enable dynamic plugin loading for framework-specific behavior (React, Vue, etc.)

### Success Metrics

- ✅ All 5 commands fully functional
- ✅ Config detection and loading working in <2s
- ✅ Project type detection accuracy >95%
- ✅ Test generation creates valid, runnable test files
- ✅ All tests passing with >85% coverage
- ✅ Zero TypeScript errors and lint violations
- ✅ Cross-platform compatibility (macOS, Linux, Windows)

### Phase Deliverables

- 20+ new source files (~3,000 LOC)
- 25+ test files (~2,500 LOC test code)
- Configuration schema and validation
- Detection engine with pattern matching
- Template system for test generation
- File system utilities
- Plugin loader implementation
- Complete API documentation
- 2 ADRs (Architecture Decision Records)

---

## 2. Scope Definition

### What's IN Scope

#### 2.1 Detection Engine (`packages/core/src/detection/`)

**Files to Create**:
- `project-detector.ts` - Main detection orchestrator
- `framework-detector.ts` - Test framework detection (Jest, Vitest, Mocha)
- `package-json-parser.ts` - Extract dependencies and metadata
- `file-system-scanner.ts` - Find config files, test directories
- `pattern-matcher.ts` - Regex patterns for detection

**Functionality**:
- Parse `package.json` to detect dependencies
- Scan project root for config files (`.tddai.json`, `vitest.config.ts`, etc.)
- Detect test framework (Vitest, Jest, Mocha)
- Identify TypeScript vs JavaScript
- Detect build tools (Vite, Webpack, etc.)
- Suggest plugins based on detected stack

**Success Criteria**:
- Detect Vitest projects: 100% accuracy
- Detect Jest projects: 95% accuracy
- Detect Mocha projects: 90% accuracy
- Handle edge cases (monorepos, missing package.json): gracefully fallback
- Performance: <2 seconds for detection

#### 2.2 Configuration System (`packages/core/src/config/`)

**Files to Create**:
- `config-loader.ts` - Load and merge configurations
- `config-validator.ts` - Zod schema validation
- `config-defaults.ts` - Framework-specific defaults
- `config-writer.ts` - Write `.tddai.json` files
- `config-resolver.ts` - Resolve paths and merge strategies

**Functionality**:
- Search for `.tddai.json` in current/parent directories
- Merge user config with defaults
- Validate against Zod schema
- Support environment-specific overrides
- Handle monorepo configurations (workspace roots)

**Success Criteria**:
- Load config in <100ms
- Validate with clear error messages
- Support config inheritance (workspace → package)
- Handle missing config gracefully (use defaults)

#### 2.3 File System Operations (`packages/core/src/fs/`)

**Files to Create**:
- `file-operations.ts` - Read, write, copy, move operations
- `directory-scanner.ts` - Recursive directory traversal
- `template-engine.ts` - Simple template rendering
- `path-resolver.ts` - Cross-platform path handling
- `safe-writer.ts` - Atomic writes with backups

**Functionality**:
- Read/write files with UTF-8 encoding
- Create directories recursively
- Template variable substitution (`{{testName}}`, `{{filePath}}`)
- Atomic file writes (write to temp, then rename)
- Cross-platform path normalization

**Success Criteria**:
- Works on macOS, Linux, Windows
- Handles special characters in filenames
- Never corrupts existing files
- Proper error handling for permissions/EACCES

#### 2.4 Command Implementations (`packages/cli/src/commands/`)

##### `init.ts` - Project Initialization
```bash
tddai init [options]
```

**Options**:
- `--force` - Overwrite existing config
- `--yes` - Skip prompts, use defaults
- `--framework <name>` - Specify framework (vitest|jest|mocha)

**Behavior**:
1. Detect project type
2. Prompt for configuration (or use `--yes`)
3. Generate `.tddai.json`
4. Install recommended plugins (if not present)
5. Create `.tddai/` directory for templates
6. Display setup summary

**Success Criteria**:
- Creates valid config file
- Detects framework correctly
- Interactive prompts work
- Non-interactive mode (`--yes`) works
- Idempotent (safe to run multiple times)

##### `generate.ts` - Test Generation
```bash
tddai generate <file> [options]
```

**Options**:
- `--type <type>` - Test type (unit|integration|e2e)
- `--force` - Overwrite existing test
- `--template <path>` - Custom template

**Behavior**:
1. Validate source file exists
2. Detect test location (colocated or separate)
3. Load template (custom or default)
4. Generate test file with boilerplate
5. Add basic test structure (describe, test blocks)
6. Report success/failure

**Success Criteria**:
- Generates syntactically valid test files
- Respects naming conventions (config.generation.naming)
- Handles TypeScript and JavaScript
- Template variables correctly substituted
- Creates parent directories as needed

##### `validate.ts` - Configuration Validation
```bash
tddai validate [options]
```

**Options**:
- `--fix` - Auto-fix issues
- `--strict` - Enable strict mode

**Behavior**:
1. Load `.tddai.json`
2. Validate against schema
3. Check for common issues:
   - Test directory exists
   - Framework is installed
   - Plugins are valid
4. Report validation results
5. Suggest fixes for issues

**Success Criteria**:
- Detects missing dependencies
- Validates config structure
- Clear error messages
- Suggests actionable fixes

##### `config.ts` - Configuration Management
```bash
tddai config <action> [key] [value]
```

**Actions**:
- `get <key>` - Read config value
- `set <key> <value>` - Update config value
- `list` - Show all config values
- `reset` - Reset to defaults

**Behavior**:
1. Load current config
2. Perform action (get/set/list/reset)
3. Validate changes
4. Write updated config
5. Display result

**Success Criteria**:
- Supports nested keys (`generation.naming`)
- Validates values before writing
- Atomic updates (all or nothing)
- Displays formatted output

##### `watch.ts` - File Watcher (Basic)
```bash
tddai watch [options]
```

**Options**:
- `--pattern <glob>` - Files to watch
- `--debounce <ms>` - Debounce delay (default: 300ms)

**Behavior**:
1. Start file watcher on source files
2. Detect changes
3. Run validation or re-generate tests
4. Display notifications
5. Handle watch errors gracefully

**Success Criteria**:
- Detects file changes reliably
- Debounces rapid changes
- Low CPU usage when idle
- Graceful shutdown (Ctrl+C)

#### 2.5 Plugin System (`packages/core/src/plugins/`)

**Files to Create**:
- `plugin-loader.ts` - Dynamic plugin loading
- `plugin-registry.ts` - Track loaded plugins
- `plugin-validator.ts` - Validate plugin structure
- `plugin-types.ts` - Enhanced plugin interfaces

**Functionality**:
- Load plugins from `node_modules` or local paths
- Validate plugin exports match interface
- Register plugin hooks (onDetect, onGenerate, etc.)
- Handle plugin errors gracefully
- Support plugin configuration

**Success Criteria**:
- Load plugins dynamically
- Validate plugin structure
- Handle missing plugins gracefully
- Support plugin dependencies

#### 2.6 Template System (`packages/cli/src/templates/`)

**Files to Create**:
- `templates/vitest.template.ts` - Vitest test template
- `templates/jest.template.ts` - Jest test template
- `templates/mocha.template.ts` - Mocha test template
- `template-manager.ts` - Template loading and rendering

**Templates Include**:
- Variable substitution (`{{testName}}`, `{{importPath}}`)
- Framework-specific imports
- Basic test structure (describe/test blocks)
- TypeScript and JavaScript variants

**Success Criteria**:
- Templates generate valid syntax
- Variables correctly substituted
- Framework-specific boilerplate included

### What's OUT of Scope (Future Phases)

- ❌ AI test generation (Phase 4)
- ❌ Advanced documentation generation (Phase 5)
- ❌ Pre-commit hook integration (Phase 6)
- ❌ CI/CD pipeline integration (Phase 7)
- ❌ Web dashboard (Phase 8)
- ❌ Advanced plugin APIs (Phase 3 will enhance)

### Modified Files (Phase 1 → Phase 2)

**Updates Required**:
- `packages/core/src/types/config.ts` - Add detection-related types
- `packages/core/src/types/detection.ts` - Expand ProjectInfo interface
- `packages/core/src/types/plugin.ts` - Add plugin hooks
- `packages/cli/src/commands/*.ts` - Replace stubs with implementations

---

## 3. Technical Stack

### 3.1 Existing Dependencies (Reuse)

From Phase 1 `package.json`:
- ✅ `zod` (^3.22.4) - Schema validation
- ✅ `commander` (^12.0.0) - CLI framework
- ✅ `chalk` (^5.3.0) - Terminal colors
- ✅ `typescript` (^5.6.0) - TypeScript compiler
- ✅ `vitest` (^2.1.2) - Test framework

### 3.2 New Dependencies (Phase 2)

#### Production Dependencies

```json
{
  "name": "New dependencies to add",
  "dependencies": [
    {
      "name": "glob",
      "version": "^10.3.10",
      "reason": "File pattern matching for test discovery and config search",
      "package": "@tddai/core"
    },
    {
      "name": "chokidar",
      "version": "^3.5.3",
      "reason": "File watching for watch command (cross-platform)",
      "package": "@tddai/cli"
    },
    {
      "name": "fast-glob",
      "version": "^3.3.2",
      "reason": "Fast directory scanning for project detection",
      "package": "@tddai/core"
    },
    {
      "name": "cosmiconfig",
      "version": "^9.0.0",
      "reason": "Config file discovery (.tddai.json, .tddairc, etc.)",
      "package": "@tddai/core"
    },
    {
      "name": "enquirer",
      "version": "^2.4.1",
      "reason": "Interactive prompts for init command",
      "package": "@tddai/cli"
    },
    {
      "name": "ora",
      "version": "^8.0.1",
      "reason": "Spinners and progress indicators",
      "package": "@tddai/cli"
    },
    {
      "name": "execa",
      "version": "^8.0.1",
      "reason": "Run shell commands (npm install, etc.)",
      "package": "@tddai/cli"
    },
    {
      "name": "fs-extra",
      "version": "^11.2.0",
      "reason": "Enhanced file system operations with atomic writes",
      "package": "@tddai/core"
    },
    {
      "name": "picocolors",
      "version": "^1.0.0",
      "reason": "Lightweight color library (alternative to chalk)",
      "package": "@tddai/core",
      "note": "Only if we need lighter alternative to chalk"
    }
  ]
}
```

#### Development Dependencies

```json
{
  "devDependencies": [
    {
      "name": "@types/fs-extra",
      "version": "^11.0.4",
      "reason": "TypeScript types for fs-extra",
      "package": "@tddai/core"
    },
    {
      "name": "memfs",
      "version": "^4.6.0",
      "reason": "In-memory file system for testing file operations",
      "package": "@tddai/core"
    },
    {
      "name": "mock-fs",
      "version": "^5.2.0",
      "reason": "Mock file system for testing (alternative to memfs)",
      "package": "@tddai/core"
    }
  ]
}
```

### 3.3 Dependency Installation Commands

```bash
# Core package (detection, config, file operations)
cd packages/core
pnpm add glob fast-glob cosmiconfig fs-extra
pnpm add -D @types/fs-extra memfs

# CLI package (commands, prompts, spinners)
cd packages/cli
pnpm add chokidar enquirer ora execa

# Root (if shared across packages)
pnpm add -w glob fast-glob
```

### 3.4 Alternative Considerations

| Use Case | Primary Choice | Alternative | Rationale |
|----------|---------------|-------------|-----------|
| File watching | chokidar | node:fs.watch | Chokidar is cross-platform, more reliable |
| Prompts | enquirer | inquirer | Enquirer is lighter, modern ESM support |
| Globbing | fast-glob | glob | fast-glob is faster for large directories |
| Config discovery | cosmiconfig | Manual | cosmiconfig handles multiple formats |
| Colors | chalk | picocolors | Chalk already in use, picocolors if size matters |

---

## 4. Day-by-Day Breakdown (14 Days)

### Week 1: Foundation & Detection (Days 1-5)

#### **Day 1: Setup & Architecture**
**Owner**: Alex + Kai

**Tasks**:
- ✅ Create Phase 2 implementation plan (this document)
- ✅ Install new dependencies in all packages
- ✅ Update `package.json` files
- ✅ Create directory structure:
  - `packages/core/src/detection/`
  - `packages/core/src/config/`
  - `packages/core/src/fs/`
  - `packages/core/src/plugins/`
- ✅ Document architectural decisions (ADR)
- ✅ Setup testing fixtures (sample projects for detection)

**Deliverables**:
- All dependencies installed
- Directory structure created
- ADR-002: "Phase 2 Architecture - Detection and Config System"
- Test fixtures ready

**Acceptance**:
- `pnpm install` succeeds
- TypeScript compilation passes
- No breaking changes to Phase 1 code

---

#### **Day 2-3: Detection Engine (Part 1)**
**Owner**: Skye + Leo

**Tasks**:
- Implement `package-json-parser.ts`:
  - Parse `dependencies`, `devDependencies`
  - Extract script commands
  - Detect TypeScript presence
- Implement `framework-detector.ts`:
  - Detect Vitest (config files, dependencies)
  - Detect Jest (config files, dependencies)
  - Detect Mocha (config files, dependencies)
  - Fallback logic for unknown frameworks
- Write unit tests:
  - `package-json-parser.test.ts` (15 tests)
  - `framework-detector.test.ts` (20 tests)

**Test Fixtures**:
- `fixtures/vitest-project/` - Sample Vitest project
- `fixtures/jest-project/` - Sample Jest project
- `fixtures/mocha-project/` - Sample Mocha project

**Deliverables**:
- 2 source files (~400 LOC)
- 2 test files (~300 LOC)
- 35 tests passing
- 90%+ coverage

**Acceptance**:
- Detects Vitest correctly in fixture
- Detects Jest correctly in fixture
- Detects Mocha correctly in fixture
- Handles missing `package.json` gracefully

---

#### **Day 3-4: Detection Engine (Part 2)**
**Owner**: Skye + Mina

**Tasks**:
- Implement `file-system-scanner.ts`:
  - Scan for config files (`.tddai.json`, `vite.config.ts`, etc.)
  - Find test directories
  - Detect build tools (Vite, Webpack)
- Implement `pattern-matcher.ts`:
  - Regex patterns for file detection
  - Glob pattern matching
- Implement `project-detector.ts`:
  - Orchestrate all detection logic
  - Return `ProjectInfo` object
  - Cache detection results
- Write tests:
  - `file-system-scanner.test.ts` (15 tests)
  - `pattern-matcher.test.ts` (10 tests)
  - `project-detector.test.ts` (20 tests)

**Deliverables**:
- 3 source files (~500 LOC)
- 3 test files (~400 LOC)
- 45 tests passing
- Detection engine fully functional

**Acceptance**:
- Detects all config files correctly
- Pattern matching works for globs
- Integration tests pass on real projects
- Performance <2s on large monorepo

---

#### **Day 5: Configuration System**
**Owner**: Leo + Skye

**Tasks**:
- Implement `config-loader.ts`:
  - Use `cosmiconfig` to find config files
  - Search hierarchy (current → parent → home)
  - Handle multiple config formats (.json, .js, .ts)
- Implement `config-validator.ts`:
  - Extend Zod schema from Phase 1
  - Add detection-related fields
  - Custom error messages
- Implement `config-defaults.ts`:
  - Framework-specific defaults (Vitest, Jest, Mocha)
  - Merge user config with defaults
- Implement `config-resolver.ts`:
  - Resolve relative paths
  - Merge strategies (deep merge vs shallow)
- Write tests:
  - `config-loader.test.ts` (15 tests)
  - `config-validator.test.ts` (12 tests)
  - `config-resolver.test.ts` (10 tests)

**Deliverables**:
- 4 source files (~600 LOC)
- 3 test files (~350 LOC)
- 37 tests passing
- Config system fully functional

**Acceptance**:
- Loads config from `.tddai.json`
- Validates config with clear errors
- Merges user config with defaults correctly
- Handles missing config (uses defaults)

---

### Week 2: Commands & File Operations (Days 6-10)

#### **Day 6-7: File System Operations**
**Owner**: Mina + Skye

**Tasks**:
- Implement `file-operations.ts`:
  - Read/write files with UTF-8 encoding
  - Atomic writes (temp file + rename)
  - Error handling (permissions, ENOENT)
- Implement `directory-scanner.ts`:
  - Recursive directory traversal
  - Glob pattern filtering
  - Symlink handling
- Implement `template-engine.ts`:
  - Simple variable substitution (`{{var}}`)
  - Conditional blocks (optional)
  - Multi-line templates
- Implement `path-resolver.ts`:
  - Cross-platform path normalization
  - Resolve relative paths
  - Join paths safely
- Implement `safe-writer.ts`:
  - Backup before overwrite
  - Rollback on error
  - Verify writes
- Write tests (using `memfs` or `mock-fs`):
  - `file-operations.test.ts` (20 tests)
  - `directory-scanner.test.ts` (12 tests)
  - `template-engine.test.ts` (15 tests)
  - `path-resolver.test.ts` (10 tests)
  - `safe-writer.test.ts` (8 tests)

**Deliverables**:
- 5 source files (~700 LOC)
- 5 test files (~500 LOC)
- 65 tests passing
- File system utilities fully functional

**Acceptance**:
- Works on macOS, Linux, Windows
- Atomic writes never corrupt files
- Template engine substitutes variables correctly
- Safe writer creates backups

---

#### **Day 8: Init Command**
**Owner**: Skye + Eden

**Tasks**:
- Implement `init.ts`:
  - Use detection engine to analyze project
  - Prompt for configuration (using `enquirer`)
  - Generate `.tddai.json`
  - Create `.tddai/` directory for templates
  - Display setup summary (using `chalk` + `ora`)
- Handle options:
  - `--force` - Overwrite existing config
  - `--yes` - Skip prompts, use defaults
  - `--framework <name>` - Specify framework
- Write tests:
  - `init.test.ts` (20 tests)
  - Test interactive mode (mock prompts)
  - Test non-interactive mode (`--yes`)
  - Test error handling

**Deliverables**:
- 1 source file (~250 LOC)
- 1 test file (~300 LOC)
- 20 tests passing
- Init command fully functional

**Acceptance**:
- Creates valid `.tddai.json`
- Interactive prompts work
- `--yes` mode works
- `--force` overwrites existing config
- Error messages are clear

---

#### **Day 9: Generate Command**
**Owner**: Skye + Finn

**Tasks**:
- Implement `generate.ts`:
  - Validate source file exists
  - Detect test location (config.testDir, config.generation.colocate)
  - Load template (framework-specific)
  - Generate test file
  - Create parent directories
  - Display success message
- Handle options:
  - `--type <type>` - Test type (unit|integration|e2e)
  - `--force` - Overwrite existing test
  - `--template <path>` - Custom template
- Implement templates:
  - `templates/vitest.template.ts`
  - `templates/jest.template.ts`
  - `templates/mocha.template.ts`
- Write tests:
  - `generate.test.ts` (25 tests)
  - Test template rendering
  - Test file generation
  - Test error cases (invalid source file, etc.)

**Deliverables**:
- 1 command file (~300 LOC)
- 3 template files (~200 LOC)
- 1 template manager (~150 LOC)
- 2 test files (~400 LOC)
- 25 tests passing

**Acceptance**:
- Generates valid test files (TypeScript + JavaScript)
- Templates include framework-specific boilerplate
- Variables correctly substituted
- Creates parent directories as needed
- Respects naming conventions

---

#### **Day 10: Validate & Config Commands**
**Owner**: Skye + Iris

**Tasks**:
- Implement `validate.ts`:
  - Load config
  - Validate schema
  - Check test directory exists
  - Check framework installed
  - Check plugins valid
  - Display validation report
  - `--fix` option for auto-fixes
- Implement `config.ts`:
  - `get <key>` - Read config value
  - `set <key> <value>` - Update config
  - `list` - Show all values
  - `reset` - Reset to defaults
  - Support nested keys (`generation.naming`)
- Write tests:
  - `validate.test.ts` (15 tests)
  - `config.test.ts` (18 tests)

**Deliverables**:
- 2 command files (~350 LOC)
- 2 test files (~300 LOC)
- 33 tests passing

**Acceptance**:
- Validate detects common issues
- Config commands work with nested keys
- Error messages are actionable
- `--fix` mode repairs common issues

---

### Week 3: Plugin System & Polish (Days 11-14)

#### **Day 11: Plugin System**
**Owner**: Skye + Kai

**Tasks**:
- Implement `plugin-loader.ts`:
  - Load plugins from `node_modules` (e.g., `@tddai/plugin-react`)
  - Load plugins from local paths
  - Validate plugin structure
  - Handle missing plugins gracefully
- Implement `plugin-registry.ts`:
  - Track loaded plugins
  - Register plugin hooks
  - Execute hooks in order
- Implement `plugin-validator.ts`:
  - Validate plugin exports
  - Check required methods
- Update `plugin-types.ts`:
  - Add hook interfaces (onDetect, onGenerate, etc.)
  - Add plugin configuration types
- Write tests:
  - `plugin-loader.test.ts` (20 tests)
  - `plugin-registry.test.ts` (12 tests)
  - `plugin-validator.test.ts` (8 tests)
- Create mock plugin for testing:
  - `fixtures/mock-plugin/`

**Deliverables**:
- 3 source files (~500 LOC)
- 1 type file update (~100 LOC)
- 3 test files (~350 LOC)
- 40 tests passing
- Plugin system fully functional

**Acceptance**:
- Loads plugins dynamically
- Validates plugin structure
- Handles missing plugins gracefully
- Executes plugin hooks correctly

---

#### **Day 12: Watch Command**
**Owner**: Skye + Mina

**Tasks**:
- Implement `watch.ts`:
  - Use `chokidar` to watch source files
  - Debounce changes (default: 300ms)
  - Trigger validation on change
  - Display notifications (using `ora`)
  - Handle Ctrl+C gracefully
- Handle options:
  - `--pattern <glob>` - Files to watch
  - `--debounce <ms>` - Debounce delay
- Write tests:
  - `watch.test.ts` (12 tests)
  - Mock file system events
  - Test debouncing
  - Test error handling

**Deliverables**:
- 1 command file (~200 LOC)
- 1 test file (~250 LOC)
- 12 tests passing

**Acceptance**:
- Watches files correctly
- Debounces rapid changes
- Low CPU usage when idle
- Graceful shutdown

---

#### **Day 13: Integration Testing & Bug Fixes**
**Owner**: Finn + Skye

**Tasks**:
- Create integration tests:
  - `integration/init-flow.test.ts` - Full init workflow
  - `integration/generate-flow.test.ts` - Generate + run test
  - `integration/config-flow.test.ts` - Config management
  - `integration/detect-flow.test.ts` - Detection on real projects
- Test on real projects:
  - Vitest project
  - Jest project
  - Mocha project
- Fix bugs discovered during integration testing
- Performance profiling:
  - Detection speed
  - Config loading speed
  - File generation speed
- Write performance tests:
  - `performance/detection.perf.test.ts`
  - `performance/generation.perf.test.ts`

**Deliverables**:
- 4 integration test files (~600 LOC)
- 2 performance test files (~200 LOC)
- Bug fixes (~100 LOC changes)
- 30 integration tests passing

**Acceptance**:
- All integration tests pass
- No regressions in Phase 1 functionality
- Performance meets targets (<2s detection)
- Cross-platform tests pass (if available)

---

#### **Day 14: Documentation & Release Preparation**
**Owner**: Eden + Alex

**Tasks**:
- Update API documentation:
  - JSDoc comments on all public APIs
  - Type definitions exported correctly
- Update README files:
  - `packages/core/README.md` - Core API docs
  - `packages/cli/README.md` - CLI usage guide
  - Root `README.md` - Quick start guide
- Create Architecture Decision Records:
  - `ADR-002-detection-engine.md` - Detection architecture
  - `ADR-003-config-system.md` - Config management
- Create usage examples:
  - `examples/init-project/` - Init example
  - `examples/generate-test/` - Generate example
  - `examples/custom-plugin/` - Plugin example
- Update CHANGELOG:
  - Document Phase 2 changes
  - Migration guide from Phase 1
- Create demo video/GIF:
  - Show init → generate → validate workflow
- Final review:
  - Code review checklist
  - Security review (Iris)
  - Performance review (Finn)

**Deliverables**:
- 3 README files updated
- 2 ADRs created
- 3 example projects
- CHANGELOG updated
- Demo materials

**Acceptance**:
- All documentation accurate
- Examples run successfully
- ADRs explain design decisions
- CHANGELOG complete

---

## 5. Agent Delegation Map

### 5.1 Primary Ownership

| Agent | Role | Responsibilities | Estimated Days |
|-------|------|-----------------|----------------|
| **Alex** | Project Conductor | Overall coordination, planning, quality gates, final approvals | 14 (oversight) |
| **Kai** | Architect | Architecture reviews, ADRs, design decisions, plugin API design | 2 |
| **Skye** | Code Implementer | Core implementation (detection, config, commands, file ops) | 10 |
| **Leo** | Data/Schema | Config schema design, type definitions, validation rules | 2 |
| **Mina** | Integrator | File system operations, cross-platform compatibility, plugin loading | 3 |
| **Finn** | QA/Testing | Test planning, integration tests, performance tests, bug validation | 4 |
| **Eden** | Documentation | API docs, README updates, ADRs, examples, usage guides | 2 |
| **Iris** | Security | Security review, input validation, file operation safety, dependency audit | 1 |

### 5.2 Detailed Task Assignments

#### **Alex (Project Conductor)**
- [x] Create Phase 2 implementation plan
- [ ] Daily standup reviews (track progress)
- [ ] Quality gate reviews (end of each week)
- [ ] Coordinate parallel work streams
- [ ] Resolve blockers and scope questions
- [ ] Final phase 2 sign-off

#### **Kai (Architect)**
- Day 1: Review Phase 2 architecture
- Day 1: Create ADR-002 (Detection Engine Architecture)
- Day 5: Review config system design
- Day 11: Review plugin system architecture
- Day 11: Create ADR-003 (Plugin System Design)
- Day 14: Final architecture review

#### **Skye (Code Implementer)**
- Days 2-3: Detection engine (package parser, framework detector)
- Days 3-4: File system scanner, pattern matcher, project detector
- Day 5: Config loader, validator, resolver
- Days 6-7: File operations, template engine, path resolver
- Day 8: Init command
- Day 9: Generate command
- Day 10: Validate & config commands
- Day 11: Plugin loader, registry
- Day 12: Watch command
- Day 13: Bug fixes from integration testing

#### **Leo (Data/Schema)**
- Day 1: Design detection result types
- Day 5: Design config schema extensions
- Day 5: Implement config validation rules
- Day 11: Design plugin interface types
- Day 13: Review all type definitions

#### **Mina (Integrator)**
- Days 3-4: File system scanner implementation
- Days 6-7: File operations (read/write/atomic)
- Days 6-7: Directory scanner, safe writer
- Day 11: Plugin loader integration
- Day 12: Watch command file system integration
- Day 13: Cross-platform testing

#### **Finn (QA/Testing)**
- Days 2-13: Write unit tests alongside implementation
- Day 9: Test generation command (ensure generated tests are valid)
- Day 13: Integration testing (full workflows)
- Day 13: Performance testing
- Day 13: Bug reporting and validation
- Day 14: Final QA sign-off

#### **Eden (Documentation)**
- Day 8: Document init command usage
- Day 9: Document generate command usage
- Day 10: Document validate & config commands
- Day 11: Document plugin system
- Day 14: Update all README files
- Day 14: Create ADRs (with Kai)
- Day 14: Create usage examples

#### **Iris (Security)**
- Day 7: Review file operations security (path traversal, permissions)
- Day 10: Review validate command (command injection, etc.)
- Day 11: Review plugin loading security
- Day 13: Final security audit
- Day 14: Document security considerations

### 5.3 Parallel Work Windows

#### **Window 1: Days 2-4 (Detection Engine)**
- **Skye**: Package parser, framework detector, file scanner
- **Leo**: Detection result types
- **Finn**: Unit tests for detection
- **Dependencies**: None (independent work)

#### **Window 2: Days 5-7 (Config & File Ops)**
- **Skye**: Config loader, validator
- **Leo**: Config schema design
- **Mina**: File operations, atomic writes
- **Finn**: Unit tests for config and file ops
- **Dependencies**: Detection types from Window 1

#### **Window 3: Days 8-10 (Commands)**
- **Skye**: Init, generate, validate, config commands
- **Finn**: Command integration tests
- **Eden**: Command documentation (as implemented)
- **Dependencies**: Config system and file ops from Window 2

#### **Window 4: Days 11-12 (Plugin System & Watch)**
- **Skye**: Plugin loader, watch command
- **Kai**: Plugin architecture review
- **Mina**: Plugin loading integration
- **Finn**: Plugin tests
- **Dependencies**: Commands from Window 3

#### **Window 5: Days 13-14 (Integration & Documentation)**
- **Finn**: Integration testing, performance testing
- **Eden**: Documentation, examples, ADRs
- **Iris**: Security audit
- **Alex**: Final review and sign-off
- **Dependencies**: All implementation complete

---

## 6. Acceptance Criteria

### 6.1 Functional Requirements

- [ ] **Detection Engine**
  - [ ] Detects Vitest projects with 100% accuracy
  - [ ] Detects Jest projects with 95% accuracy
  - [ ] Detects Mocha projects with 90% accuracy
  - [ ] Handles edge cases (missing package.json, monorepos) gracefully
  - [ ] Performance: <2 seconds for detection on large projects

- [ ] **Configuration System**
  - [ ] Loads `.tddai.json` from current/parent directories
  - [ ] Validates config against Zod schema
  - [ ] Merges user config with framework-specific defaults
  - [ ] Handles missing config (uses defaults)
  - [ ] Config loading completes in <100ms

- [ ] **Init Command**
  - [ ] Creates valid `.tddai.json` file
  - [ ] Interactive prompts work correctly
  - [ ] Non-interactive mode (`--yes`) works
  - [ ] `--force` overwrites existing config safely
  - [ ] Displays helpful setup summary

- [ ] **Generate Command**
  - [ ] Generates syntactically valid test files (TypeScript + JavaScript)
  - [ ] Respects naming conventions from config
  - [ ] Creates parent directories as needed
  - [ ] Template variables correctly substituted
  - [ ] Framework-specific boilerplate included
  - [ ] `--force` overwrites existing tests safely

- [ ] **Validate Command**
  - [ ] Detects missing dependencies
  - [ ] Validates config structure
  - [ ] Checks test directory exists
  - [ ] Provides actionable error messages
  - [ ] `--fix` mode repairs common issues

- [ ] **Config Command**
  - [ ] `get` returns correct values
  - [ ] `set` updates config atomically
  - [ ] `list` displays all config values
  - [ ] `reset` restores defaults
  - [ ] Supports nested keys (`generation.naming`)

- [ ] **Watch Command**
  - [ ] Watches source files for changes
  - [ ] Debounces rapid changes (configurable)
  - [ ] Low CPU usage when idle
  - [ ] Graceful shutdown on Ctrl+C

- [ ] **Plugin System**
  - [ ] Loads plugins from `node_modules`
  - [ ] Loads plugins from local paths
  - [ ] Validates plugin structure
  - [ ] Handles missing plugins gracefully
  - [ ] Executes plugin hooks in correct order

### 6.2 Quality Requirements

- [ ] **Test Coverage**
  - [ ] Unit test coverage >85% (statements, functions, lines)
  - [ ] Branch coverage >80%
  - [ ] All tests passing (0 failures)
  - [ ] Integration tests cover main workflows
  - [ ] Performance tests validate speed targets

- [ ] **Code Quality**
  - [ ] Zero TypeScript errors
  - [ ] Zero ESLint errors
  - [ ] All code formatted with Prettier
  - [ ] No console.log statements (use logger)
  - [ ] All public APIs have JSDoc comments

- [ ] **Performance**
  - [ ] Project detection: <2 seconds
  - [ ] Config loading: <100ms
  - [ ] Test generation: <500ms per file
  - [ ] Watch mode: <50ms CPU usage when idle

- [ ] **Cross-Platform**
  - [ ] Works on macOS (primary)
  - [ ] Works on Linux (CI)
  - [ ] Works on Windows (manual test if possible)
  - [ ] Path handling is cross-platform
  - [ ] File operations respect OS conventions

### 6.3 Documentation Requirements

- [ ] **API Documentation**
  - [ ] All public functions have JSDoc comments
  - [ ] Type definitions are exported correctly
  - [ ] Examples included in JSDoc
  - [ ] README files updated for all packages

- [ ] **Architecture Documentation**
  - [ ] ADR-002: Detection Engine Architecture
  - [ ] ADR-003: Plugin System Design
  - [ ] Diagrams for complex systems (detection flow, config loading)

- [ ] **Usage Documentation**
  - [ ] CLI usage guide (commands, options, examples)
  - [ ] Configuration reference (all config options)
  - [ ] Plugin development guide
  - [ ] Migration guide from Phase 1

- [ ] **Examples**
  - [ ] Example: Initialize new project
  - [ ] Example: Generate tests for existing code
  - [ ] Example: Create custom plugin
  - [ ] Example: Watch mode workflow

### 6.4 Security Requirements

- [ ] **Input Validation**
  - [ ] All user inputs validated (file paths, config values)
  - [ ] No path traversal vulnerabilities
  - [ ] No command injection vulnerabilities
  - [ ] Safe handling of special characters

- [ ] **File Operations**
  - [ ] Atomic writes (no partial writes)
  - [ ] Proper error handling for permissions
  - [ ] Backups before overwriting files
  - [ ] No data loss on errors

- [ ] **Dependencies**
  - [ ] All dependencies audited (npm audit)
  - [ ] No high/critical vulnerabilities
  - [ ] Dependencies are actively maintained
  - [ ] Minimal dependency footprint

---

## 7. Risk Assessment

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| **Detection accuracy lower than 95%** | High | Medium | Extensive testing with real projects; fallback to manual config | Skye + Finn |
| **Cross-platform file operations fail** | High | Low | Use `fs-extra` for robust operations; test on Linux (CI) | Mina + Finn |
| **Config loading breaks on edge cases** | Medium | Medium | Use battle-tested `cosmiconfig`; comprehensive test coverage | Skye + Leo |
| **Plugin system too complex** | Medium | Low | Start simple (dynamic import only); enhance in Phase 3 | Kai + Skye |
| **Test generation produces invalid syntax** | High | Medium | Template testing with real parsers; framework-specific validation | Skye + Finn |
| **Watch command high CPU usage** | Low | Low | Use `chokidar` (optimized); debounce changes | Mina |
| **Scope creep (AI features)** | High | Medium | Strict scope enforcement; defer AI to Phase 4 | Alex |
| **Dependencies introduce breaking changes** | Medium | Low | Pin exact versions; review updates carefully | Alex + Iris |
| **Performance regressions** | Medium | Medium | Performance tests in CI; profile before merge | Finn |
| **Documentation lags implementation** | Low | Medium | Document as you go (Day 8+); dedicated docs day (Day 14) | Eden |

### Risk Response Plans

#### **Risk: Detection accuracy lower than 95%**
- **Detection**: Run detection on 20+ real projects; measure accuracy
- **Response**:
  - Enhance pattern matching for edge cases
  - Add more config file patterns to detect
  - Provide manual override (`--framework` flag)
  - Document common false negatives

#### **Risk: Cross-platform file operations fail**
- **Detection**: Run tests on Linux (CI); manual test on Windows
- **Response**:
  - Use `fs-extra` instead of `fs` (more robust)
  - Normalize all paths with `path.resolve()`
  - Test with paths containing spaces and special characters
  - Document platform-specific issues

#### **Risk: Test generation produces invalid syntax**
- **Detection**: Parse generated tests with TypeScript compiler
- **Response**:
  - Validate templates with real parsers (TSC, Babel)
  - Test generated files by actually running them
  - Add syntax validation step in generate command
  - Provide `--dry-run` mode to preview without writing

#### **Risk: Scope creep (AI features)**
- **Detection**: Monitor feature requests and implementation tasks
- **Response**:
  - Alex reviews all new feature proposals
  - Strict adherence to Phase 2 scope document
  - Defer AI features to Phase 4 explicitly
  - Create backlog for future enhancements

---

## 8. Resource Planning

### 8.1 Work Breakdown Structure

| Category | Tasks | Estimated LOC | Estimated Days | Assigned Agent |
|----------|-------|---------------|----------------|----------------|
| **Detection Engine** | Package parser, framework detector, file scanner, pattern matcher, project detector | 900 | 3 | Skye + Leo |
| **Configuration System** | Config loader, validator, defaults, resolver | 700 | 1 | Leo + Skye |
| **File System Operations** | File ops, directory scanner, template engine, path resolver, safe writer | 800 | 2 | Mina + Skye |
| **Commands** | Init, generate, validate, config, watch | 1,100 | 4 | Skye + Mina |
| **Plugin System** | Plugin loader, registry, validator | 600 | 1.5 | Skye + Kai |
| **Templates** | Vitest, Jest, Mocha templates | 300 | 0.5 | Skye |
| **Testing** | Unit tests, integration tests, performance tests | 2,500 | 4 | Finn + Skye |
| **Documentation** | README, ADRs, examples, API docs | 1,500 (docs) | 2 | Eden + Kai |
| **Total** | - | ~8,400 | **14** | - |

### 8.2 Agent Effort Breakdown

| Agent | Days | Key Deliverables |
|-------|------|------------------|
| **Alex** | 1 (oversight) | Phase 2 plan, daily reviews, quality gates, final sign-off |
| **Skye** | 10 (implementation) | Detection engine, config system, commands, plugin system |
| **Leo** | 2 (schema design) | Type definitions, config schema, validation rules |
| **Mina** | 3 (integration) | File operations, cross-platform support, plugin loading |
| **Finn** | 4 (testing) | Unit tests, integration tests, performance tests, bug validation |
| **Eden** | 2 (documentation) | README updates, ADRs, examples, usage guides |
| **Kai** | 2 (architecture) | ADRs, design reviews, plugin API design |
| **Iris** | 1 (security) | Security audit, input validation review, dependency audit |
| **Total** | **25 person-days** | - |

### 8.3 Critical Path

```
Day 1: Setup (Alex + Kai)
  ↓
Days 2-4: Detection Engine (Skye + Leo + Finn)
  ↓
Day 5: Configuration System (Leo + Skye + Finn)
  ↓
Days 6-7: File System Operations (Mina + Skye + Finn)
  ↓
Days 8-10: Commands (Skye + Finn + Eden)
  ↓
Days 11-12: Plugin System + Watch (Skye + Kai + Mina + Finn)
  ↓
Day 13: Integration Testing (Finn + Skye)
  ↓
Day 14: Documentation & Release (Eden + Alex + Iris)
```

**Critical Path Duration**: 14 days (no slack)

**Bottlenecks**:
- Skye is on critical path for 10 days (high utilization)
- Finn must wait for implementation before testing

**Mitigation**:
- Write tests in parallel with implementation (TDD approach)
- Finn writes test stubs on Days 2-4, then fills in as implementation progresses
- Mina assists Skye on file operations (Days 6-7) to parallelize work

---

## 9. Parallel Execution Strategy

### 9.1 Parallelization Opportunities

Phase 2 has **5 major parallel execution windows** where independent work can proceed simultaneously:

#### **Window 1: Days 2-4 (Detection Engine)**

**Independent Tasks**:
- Skye: Implement package parser + framework detector
- Leo: Design detection result types
- Finn: Write test stubs for detection
- Mina: Setup test fixtures (sample projects)

**Coordination Point**: End of Day 4
- Review detection accuracy
- Integrate tests
- Sign off on detection engine

#### **Window 2: Days 5-7 (Config & File Ops)**

**Independent Tasks**:
- Leo: Config schema design and validation rules
- Skye: Config loader implementation
- Mina: File operations (read/write/atomic)
- Finn: Unit tests for config and file ops

**Coordination Point**: End of Day 7
- Integration test: Load config + write files
- Verify cross-platform compatibility
- Sign off on config and file systems

#### **Window 3: Days 8-10 (Commands Implementation)**

**Independent Tasks**:
- Skye: Implement init command (Day 8)
- Skye: Implement generate command (Day 9)
- Skye: Implement validate + config commands (Day 10)
- Finn: Write command integration tests (parallel with implementation)
- Eden: Document commands as they're completed

**Coordination Point**: End of Day 10
- All 5 commands functional
- Integration tests passing
- Documentation complete

#### **Window 4: Days 11-12 (Plugin System & Watch)**

**Independent Tasks**:
- Skye: Plugin loader and registry (Day 11)
- Kai: Plugin architecture review and ADR (Day 11)
- Mina: Plugin loading integration (Day 11)
- Skye: Watch command (Day 12)
- Finn: Plugin tests (Day 11-12)

**Coordination Point**: End of Day 12
- Plugin system functional
- Watch command working
- All core features complete

#### **Window 5: Days 13-14 (Integration & Documentation)**

**Independent Tasks**:
- Finn: Integration testing (Day 13)
- Finn: Performance testing (Day 13)
- Eden: Update README files (Day 14)
- Eden: Create examples (Day 14)
- Kai: Write ADRs (Day 14)
- Iris: Security audit (Day 13)
- Alex: Final review (Day 14)

**Coordination Point**: End of Day 14
- All tests passing
- Documentation complete
- Security audit complete
- Phase 2 ready for release

### 9.2 Coordination Mechanisms

**Daily Standups** (15 minutes):
- What did you complete yesterday?
- What are you working on today?
- Any blockers?

**Mid-Week Reviews** (End of Day 7):
- Review progress vs plan
- Identify risks and adjust schedule
- Coordinate handoffs between agents

**End-of-Week Reviews** (End of Day 14):
- Demo completed features
- Review acceptance criteria
- Sign off on phase completion

### 9.3 Dependency Management

**Explicit Dependencies**:
1. Commands depend on Config System (Day 8+ depends on Day 5-7)
2. Integration Tests depend on Commands (Day 13 depends on Day 8-12)
3. Documentation depends on Implementation (Day 14 depends on Day 8-12)

**Hidden Dependencies** (watch for these):
- Plugin system needs config loader (ensure config ready before Day 11)
- Generate command needs template engine (ensure file ops ready before Day 9)
- Validate command needs detection engine (ensure detection ready before Day 10)

**Mitigation**:
- Stubs: Create stub implementations for dependencies (e.g., stub config loader on Day 2)
- Mocks: Use mocks in tests to avoid waiting for real implementations
- Interfaces: Define interfaces early so parallel work can proceed

---

## 10. Phase 3 Handoff

### 10.1 Phase 3 Dependencies

Phase 3 (Advanced Features & Plugin Ecosystem) depends on:

#### **Stable APIs from Phase 2**
These must NOT change in Phase 3 (backward compatibility):

1. **Config Schema** (`Config` type):
   - `version`, `framework`, `testDir`, `testPattern`, `plugins`, `generation`
   - Phase 3 can ADD fields, but cannot CHANGE existing fields

2. **Plugin Interface** (`Plugin` type):
   - `name`, `version`, `activate()`, `deactivate()`
   - Phase 3 will ADD hooks, but core interface must remain stable

3. **Detection Result** (`ProjectInfo` type):
   - `type`, `framework`, `typescript`, `buildTool`, `suggestedPlugins`
   - Phase 3 may ADD fields, but existing fields must remain

4. **CLI Commands**:
   - `init`, `generate`, `validate`, `config`, `watch` must remain backward compatible
   - Phase 3 can ADD commands (e.g., `ai-generate`), but existing commands must work

#### **File System Layout**
Phase 3 will build on:
- `.tddai.json` - User configuration
- `.tddai/` - Templates and local plugins
- `node_modules/@tddai/plugin-*` - Installed plugins

### 10.2 Breaking Changes to Avoid

❌ **Do NOT do these in Phase 2** (would break Phase 3):

1. **Don't expose internal APIs**:
   - Keep detection internals private (only expose `detectProject()`)
   - Keep config internals private (only expose `loadConfig()`)

2. **Don't hard-code framework names**:
   - Use enums or constants, not string literals
   - Allow plugins to register new frameworks

3. **Don't couple commands to specific frameworks**:
   - Commands should work with any framework (via plugins)
   - Avoid `if (framework === 'vitest')` in command code

4. **Don't use synchronous APIs**:
   - All file operations should be async (for future performance)
   - Config loading should be async

### 10.3 Phase 3 Enhancement Areas

Phase 3 will enhance:

1. **Plugin Ecosystem**:
   - Official plugins: `@tddai/plugin-react`, `@tddai/plugin-vue`, `@tddai/plugin-svelte`
   - Plugin marketplace/registry
   - Plugin development guide

2. **AI Integration** (Phase 4 preview):
   - AI test generation (OpenAI, Anthropic APIs)
   - Code analysis for better test suggestions

3. **Advanced Features**:
   - Code coverage tracking
   - Test result visualization
   - CI/CD integration
   - Pre-commit hooks

4. **Enhanced Configuration**:
   - Per-file configuration (`.tddai.json` in subdirectories)
   - Environment-specific configs (`.tddai.dev.json`, `.tddai.prod.json`)
   - Config profiles (quick switch between setups)

### 10.4 Handoff Deliverables

**Documentation for Phase 3 Team**:
- ✅ Phase 2 implementation plan (this document)
- ✅ API documentation (JSDoc comments)
- ✅ ADR-002: Detection Engine Architecture
- ✅ ADR-003: Plugin System Design
- ✅ Integration test suite (examples of usage)

**Code Artifacts**:
- ✅ All Phase 2 source code (~4,000 LOC)
- ✅ All Phase 2 tests (~2,500 LOC)
- ✅ Type definitions (`.d.ts` files)
- ✅ Example projects (`examples/`)

**Known Limitations** (for Phase 3 to address):
1. Plugin system is basic (dynamic import only) - enhance with lifecycle hooks
2. Watch command is simple - add smart test targeting
3. Generate command uses basic templates - add AI-powered generation
4. No code coverage tracking - add in Phase 3
5. No CI/CD integration - add in Phase 3

### 10.5 Success Criteria for Handoff

Phase 2 is ready to hand off to Phase 3 when:

- [ ] All acceptance criteria met (see Section 6)
- [ ] Integration tests passing on real projects
- [ ] Documentation complete and accurate
- [ ] No known critical bugs
- [ ] Security audit passed
- [ ] Performance targets met
- [ ] Backward compatibility guaranteed for stable APIs
- [ ] Phase 3 team briefed on architecture and limitations

---

## 11. Appendix

### 11.1 Reference Documents

- **Phase 1 Implementation Report**: `IMPLEMENTATION-COMPLETE.md`
- **Phase 1 Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Orchestra Setup Guide**: `ORCHESTRA_SETUP.md`
- **Progress Tracker Documentation**: `README-PROGRESS-TRACKER.md`
- **Root README**: `README.md`

### 11.2 Testing Strategy

**Unit Testing**:
- Framework: Vitest
- Coverage Target: >85% (statements, functions, lines)
- Coverage Tool: Vitest coverage (c8)
- Test Naming: `*.test.ts` (mirror source structure)

**Integration Testing**:
- Location: `packages/*/tests/integration/`
- Focus: End-to-end workflows (init → generate → validate)
- Real Projects: Test on fixture projects (Vitest, Jest, Mocha)

**Performance Testing**:
- Location: `packages/*/tests/performance/`
- Targets:
  - Detection: <2 seconds
  - Config loading: <100ms
  - Test generation: <500ms per file
- Tools: `console.time()`, manual profiling

**Cross-Platform Testing**:
- Primary: macOS (dev machine)
- CI: Linux (GitHub Actions)
- Manual: Windows (if available)

### 11.3 Code Style Guidelines

**TypeScript**:
- Strict mode enabled
- Explicit return types on exported functions
- No `any` types (use `unknown` instead)
- Prefer `const` over `let`

**Naming Conventions**:
- Files: kebab-case (`project-detector.ts`)
- Classes: PascalCase (`ProjectDetector`)
- Functions: camelCase (`detectProject()`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_CONFIG`)

**Error Handling**:
- Use custom error classes (`DetectionError`, `ConfigError`)
- Include context in error messages
- Never swallow errors silently

**Comments**:
- JSDoc on all public APIs
- Inline comments for complex logic
- No commented-out code (use git history)

### 11.4 Git Workflow

**Branch Strategy**:
- Main branch: `main`
- Phase 2 branch: `phase-2/core-functionality`
- Feature branches: `phase-2/detection-engine`, `phase-2/config-system`, etc.

**Commit Messages**:
```
feat(detection): implement framework detector

- Add Vitest detection logic
- Add Jest detection logic
- Add Mocha detection logic
- Tests: 20 tests passing, 95% coverage

Relates-to: PHASE-2
```

**Pull Requests**:
- One PR per major feature (detection, config, commands, etc.)
- Require review from Alex (quality gate)
- Require passing tests (CI check)
- Require no TypeScript errors
- Require no lint errors

### 11.5 Monitoring & Metrics

**Daily Metrics** (track in standup):
- Lines of code written (source + tests)
- Tests passing / total tests
- Coverage percentage
- Blockers / issues

**Weekly Metrics** (track in weekly review):
- Completed tasks vs planned
- New issues discovered
- Performance benchmarks
- Documentation progress

**Phase Completion Metrics**:
- Total LOC: ~8,400 (4,000 source + 2,500 tests + 1,900 docs)
- Total Tests: ~200
- Coverage: >85%
- Commands: 5 (init, generate, validate, config, watch)
- Duration: 14 days
- Team Size: 8 agents

---

## 12. Sign-Off

### Implementation Team

| Role | Agent | Status | Date |
|------|-------|--------|------|
| **Project Conductor** | Alex | ✅ Plan Approved | 2025-11-03 |
| **Architect** | Kai | Pending Review | - |
| **Code Implementer** | Skye | Pending Start | - |
| **Data/Schema** | Leo | Pending Start | - |
| **Integrator** | Mina | Pending Start | - |
| **QA/Testing** | Finn | Pending Start | - |
| **Documentation** | Eden | Pending Start | - |
| **Security** | Iris | Pending Review | - |

### Approval Authority

- **Plan Approved By**: Alex (Project Conductor)
- **Architecture Approved By**: (Pending Kai review)
- **Security Approved By**: (Pending Iris review on Day 13)
- **QA Approved By**: (Pending Finn sign-off on Day 14)

### Next Steps

1. ✅ **Alex**: Share this plan with the user for approval
2. ⏳ **User**: Review and approve plan (or request changes)
3. ⏳ **Alex**: Create Phase 2 branch (`phase-2/core-functionality`)
4. ⏳ **Alex**: Schedule Day 1 kickoff (install dependencies, create structure)
5. ⏳ **Skye**: Begin Day 2 implementation (detection engine)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Next Review**: 2025-11-10 (Mid-Phase 2 checkpoint)

---

## FAQ

**Q: What if we discover new requirements during implementation?**
A: Bring to Alex immediately. If critical, update plan and re-approve. If nice-to-have, add to Phase 3 backlog.

**Q: What if detection accuracy is below 95%?**
A: Acceptable for Phase 2 MVP if >90%. Document known issues and improve in Phase 3.

**Q: What if we fall behind schedule?**
A: Prioritize critical path (detection → config → commands). Defer watch command and advanced plugin features to Phase 3 if needed.

**Q: What if cross-platform tests fail on Linux/Windows?**
A: Fix if critical (file operations). Document as known issue if edge case (e.g., special characters in paths).

**Q: Can we add AI test generation in Phase 2?**
A: No. Strict scope enforcement. AI is Phase 4. Focus on foundation first.

**Q: What if we need more agents?**
A: Alex can request help from Riley (clarification) or Nova (UI/UX for CLI output).

