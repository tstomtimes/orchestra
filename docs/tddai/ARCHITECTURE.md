# TDD.ai Architecture

> System design, component structure, and architectural decisions

This document provides a comprehensive overview of TDD.ai's architecture, design principles, and key technical decisions.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Package Structure](#package-structure)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Design Principles](#design-principles)
- [Extension Points](#extension-points)
- [Key Design Decisions](#key-design-decisions)

## System Overview

TDD.ai is a modular, layered system designed for extensibility and maintainability. The architecture follows a clear separation of concerns across four primary layers:

**Layers:**

1. **CLI Layer** - User interface and command handling
2. **Integration Layer** - Orchestration and coordination
3. **Core Services** - Business logic and operations
4. **Foundation** - Types, schemas, and utilities

**Design Philosophy:**

- **Modular**: Independent packages with clear boundaries
- **Extensible**: Plugin system for custom behavior
- **Type-Safe**: TypeScript strict mode throughout
- **Testable**: Dependency injection and pure functions
- **Maintainable**: Single responsibility per component

## Architecture Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Layer                                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │   init   │ generate │ validate │  config  │  watch   │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Integration Layer                             │
│  ┌────────────────────┐          ┌────────────────────┐         │
│  │  ProjectAnalyzer   │          │    TestWriter      │         │
│  │  - Orchestrates    │          │  - Generates tests │         │
│  │  - Coordinates     │          │  - Writes files    │         │
│  └────────────────────┘          └────────────────────┘         │
└──┬────────────┬──────────────┬──────────────┬──────────────┬───┘
   │            │              │              │              │
┌──▼────────┐ ┌─▼─────────┐ ┌─▼────────┐  ┌─▼──────────┐ ┌─▼─────┐
│ Detection │ │   Config  │ │ File Ops │  │  Plugins   │ │ Utils │
│  System   │ │   Loader  │ │ (Atomic) │  │  Manager   │ │       │
│           │ │           │ │          │  │            │ │       │
│ - Project │ │ - Load    │ │ - Write  │  │ - Load     │ │ - Log │
│   Detect  │ │ - Merge   │ │ - Backup │  │ - Execute  │ │ - Fmt │
│ - Frame-  │ │ - Valid   │ │ - Rollbk │  │ - Manage   │ │       │
│   work    │ │           │ │          │  │            │ │       │
└───────────┘ └───────────┘ └──────────┘  └────────────┘ └───────┘
     │              │              │              │
┌────▼──────────────▼──────────────▼──────────────▼────────────────┐
│                     Foundation Layer                              │
│  ┌─────────┬──────────┬──────────┬──────────┬──────────┐        │
│  │  Types  │ Schemas  │  Errors  │ Constants│  Helpers │        │
│  └─────────┴──────────┴──────────┴──────────┴──────────┘        │
└───────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Input (CLI Command)
         │
         ▼
┌────────────────────┐
│  Command Handler   │
│  (CLI Layer)       │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ ProjectAnalyzer    │
│ (Integration)      │
└─────────┬──────────┘
          │
          ├─────────────┐
          │             │
          ▼             ▼
┌──────────────┐  ┌──────────────┐
│ Detection    │  │ Config       │
│ - Framework  │  │ - Load       │
│ - TypeScript │  │ - Merge      │
│ - Pkg Mgr    │  │ - Validate   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ PluginManager    │
       │ - Load plugins   │
       │ - Init context   │
       └────────┬─────────┘
                │
                ▼
       ┌─────────────────┐
       │   TestWriter     │
       │ - Generate       │
       │ - Format         │
       └────────┬─────────┘
                │
                ▼
       ┌─────────────────┐
       │   FileWriter     │
       │ - Atomic write   │
       │ - Backup         │
       └────────┬─────────┘
                │
                ▼
       Generated Test Files
```

## Package Structure

TDD.ai is organized as a monorepo with three main packages:

### @tddai/core

**Purpose:** Core library providing foundational services

**Structure:**
```
@tddai/core/
├── src/
│   ├── types/              # TypeScript definitions
│   │   ├── config.ts       # Configuration types
│   │   ├── detection.ts    # Detection types
│   │   ├── file-system.ts  # File operation types
│   │   ├── plugin.ts       # Plugin system types
│   │   ├── commands.ts     # Command types
│   │   └── index.ts        # Exports
│   │
│   ├── detection/          # Project detection
│   │   ├── project-detector.ts
│   │   └── framework-detector.ts
│   │
│   ├── config/             # Configuration management
│   │   ├── loader.ts       # Load config from files
│   │   ├── merger.ts       # Merge with defaults
│   │   └── validator.ts    # Schema validation
│   │
│   ├── fs/                 # File system operations
│   │   ├── file-writer.ts  # Atomic file operations
│   │   └── backup.ts       # Backup utilities
│   │
│   ├── integration/        # Orchestration
│   │   ├── project-analyzer.ts  # Main orchestrator
│   │   └── test-writer.ts       # Test generation
│   │
│   ├── plugins/            # Plugin system
│   │   ├── plugin-manager.ts    # Lifecycle management
│   │   ├── plugin-loader.ts     # Dynamic loading
│   │   └── plugin-context.ts    # Execution context
│   │
│   └── utils/              # Utilities
│       └── logger.ts
│
└── tests/                  # Unit tests
```

**Responsibilities:**
- Project detection and analysis
- Configuration loading and validation
- File operations (atomic writes, backups)
- Plugin system infrastructure
- Type definitions for entire system

### @tddai/cli

**Purpose:** Command-line interface

**Structure:**
```
@tddai/cli/
├── src/
│   ├── commands/           # Command implementations
│   │   ├── init.ts         # Initialize project
│   │   ├── generate.ts     # Generate tests
│   │   ├── validate.ts     # Validate config
│   │   ├── config.ts       # Manage config
│   │   ├── watch.ts        # Watch mode
│   │   └── index.ts        # Export all commands
│   │
│   ├── utils/              # CLI utilities
│   │   ├── logger.ts       # Formatted logging
│   │   └── format.ts       # Output formatting
│   │
│   ├── cli.ts              # CLI setup (Commander)
│   └── index.ts            # Entry point
│
├── bin/
│   └── tddai.js           # Executable script
│
└── tests/                  # Command tests
```

**Responsibilities:**
- User interface (CLI commands)
- Argument parsing and validation
- Output formatting and logging
- Error handling and user feedback

### @tddai/plugin-react

**Purpose:** React-specific test generation

**Structure:**
```
@tddai/plugin-react/
├── src/
│   ├── generators/         # Test generators
│   │   ├── component.ts    # Component tests
│   │   └── hooks.ts        # Hook tests
│   │
│   ├── templates/          # Test templates
│   │   └── component.template.ts
│   │
│   └── index.ts            # Plugin export
│
└── tests/                  # Plugin tests
```

**Responsibilities:**
- React component test generation
- Hook test generation
- React-specific templates

## Core Components

### ProjectDetector

**Purpose:** Detect project characteristics

**Location:** `@tddai/core/detection/project-detector.ts`

**Responsibilities:**
- Detect testing framework from package.json
- Identify package manager (npm/yarn/pnpm)
- Determine if project uses TypeScript
- Generate detection report

**Key Methods:**
```typescript
class ProjectDetector {
  async generateReport(): Promise<DetectionReport>
  async detectFramework(): Promise<string>
  async detectPackageManager(): Promise<string>
  async detectTypeScript(): Promise<boolean>
}
```

**Design Notes:**
- Uses package.json analysis (no filesystem scanning)
- Caches results for performance
- Gracefully handles missing dependencies

### ConfigLoader

**Purpose:** Load and merge configuration

**Location:** `@tddai/core/config/loader.ts`

**Responsibilities:**
- Load config from `.tddai/config.json`
- Search multiple locations (cosmiconfig)
- Merge with defaults
- Validate schema

**Key Methods:**
```typescript
class ConfigLoader {
  async load(): Promise<ConfigLoadResult>
  mergeWithDefaults(config: Partial<Config>): Config
  validate(config: Config): ValidationResult
}
```

**Design Notes:**
- Uses cosmiconfig for flexible config loading
- Zod for runtime schema validation
- Immutable config objects

### FileWriter

**Purpose:** Safe file operations

**Location:** `@tddai/core/fs/file-writer.ts`

**Responsibilities:**
- Atomic file writes (all-or-nothing)
- Automatic backups
- Directory creation
- Rollback support

**Key Methods:**
```typescript
class FileWriter {
  async writeAtomic(path: string, content: string): Promise<FileWriteResult>
  async previewDiff(path: string, newContent: string): Promise<FileDiff>
  async writeBatch(files: FileWrite[]): Promise<FileWriteResult[]>
  async backup(path: string): Promise<string>
}
```

**Design Notes:**
- Uses temp files + atomic rename
- Never overwrites without backup
- Transaction-like semantics

### TestWriter

**Purpose:** Generate test file content

**Location:** `@tddai/core/integration/test-writer.ts`

**Responsibilities:**
- Generate test content from source
- Apply framework-specific templates
- Calculate test file paths
- Integrate with plugins

**Key Methods:**
```typescript
class TestWriter {
  async generateTestContent(sourcePath: string, config: Config): Promise<string>
  getTestPath(sourcePath: string, config: Config): string
  async generateSuite(sourceFile: string, config: Config): Promise<TestSuite>
}
```

**Design Notes:**
- Template-based generation
- Plugin-extensible
- Framework-agnostic core

### ProjectAnalyzer

**Purpose:** Orchestrate project analysis

**Location:** `@tddai/core/integration/project-analyzer.ts`

**Responsibilities:**
- Coordinate detection and config loading
- Initialize plugin system
- Provide unified analysis result

**Key Methods:**
```typescript
class ProjectAnalyzer {
  async analyze(): Promise<AnalysisResult>
  async detectAndLoad(): Promise<{report, config}>
  getProjectInfo(): ProjectInfo
}
```

**Design Notes:**
- Main orchestrator for core library
- Entry point for CLI commands
- Aggregates all analysis data

### PluginManager

**Purpose:** Manage plugin lifecycle

**Location:** `@tddai/core/plugins/plugin-manager.ts`

**Responsibilities:**
- Load plugins from paths/packages
- Initialize plugin contexts
- Execute plugin hooks
- Handle plugin errors

**Key Methods:**
```typescript
class PluginManager {
  async loadPlugins(paths: string[]): Promise<void>
  getPlugins(): Plugin[]
  async executeHook(name: string, context: PluginContext): Promise<any>
  unloadPlugin(name: string): void
}
```

**Design Notes:**
- Dynamic plugin loading
- Sandbox plugin execution
- Error isolation

## Data Flow

### Command Execution Flow

```
1. User runs: tddai generate src/file.ts

2. CLI Layer:
   - Parse arguments (Commander.js)
   - Validate inputs
   - Call generateCommand()

3. Integration Layer:
   - Create ProjectAnalyzer
   - Call analyzer.analyze()

4. Core Services (Parallel):
   - ProjectDetector.generateReport()
   - ConfigLoader.load()

5. Integration Layer:
   - PluginManager.loadPlugins()
   - TestWriter.generateTestContent()

6. Core Services:
   - FileWriter.writeAtomic()

7. CLI Layer:
   - Format output
   - Display results
```

### Configuration Loading Flow

```
1. ConfigLoader.load()
   ↓
2. Cosmiconfig searches:
   - .tddai/config.json
   - .tddairc
   - package.json (tddai key)
   ↓
3. Found config loaded
   ↓
4. ConfigLoader.mergeWithDefaults()
   ↓
5. ConfigLoader.validate()
   ↓
6. Return validated config
```

### Plugin Execution Flow

```
1. PluginManager.loadPlugins([paths])
   ↓
2. For each path:
   - Resolve module
   - Import plugin
   - Validate plugin interface
   - Store in registry
   ↓
3. PluginManager.executeHook('generate', context)
   ↓
4. For each loaded plugin:
   - Check if plugin has hook
   - Create plugin context
   - Execute plugin.generate(context)
   - Collect result
   ↓
5. Aggregate results
   ↓
6. Return combined result
```

## Design Principles

### 1. Separation of Concerns

Each component has a single, well-defined responsibility:

- **Detection** knows only about analyzing projects
- **Config** knows only about loading configuration
- **FileWriter** knows only about safe file operations
- **CLI** knows only about user interaction

### 2. Dependency Injection

Components accept dependencies rather than creating them:

```typescript
// Good: Accepts logger
class ProjectDetector {
  constructor(private logger: Logger) {}
}

// Bad: Creates logger internally
class ProjectDetector {
  private logger = new Logger();
}
```

### 3. Immutability

Configuration and data structures are immutable:

```typescript
// Config objects are readonly
interface Config {
  readonly framework: string;
  readonly testDir: string;
  // ...
}

// Returns new config, doesn't mutate
function mergeConfig(a: Config, b: Partial<Config>): Config {
  return { ...a, ...b };
}
```

### 4. Type Safety

TypeScript strict mode throughout:

- No `any` types without justification
- Explicit return types on all functions
- Comprehensive type definitions

### 5. Error Handling

Custom error classes with context:

```typescript
class ConfigError extends TddaiError {
  constructor(
    message: string,
    public configPath: string,
    public validationErrors?: ValidationError[]
  ) {
    super(message);
  }
}
```

### 6. Testability

Pure functions and dependency injection enable testing:

```typescript
// Pure function - easy to test
function calculateTestPath(
  sourcePath: string,
  config: Config
): string {
  return path.join(config.testDir, /* ... */);
}

// Accepts mocks
class ProjectDetector {
  constructor(
    private fs: FileSystem = new NodeFileSystem()
  ) {}
}
```

## Extension Points

### 1. Plugin System

**Primary extension mechanism.**

Plugins can:
- Generate custom test content
- Validate configurations
- Transform source analysis
- Add custom hooks

**Example:**

```typescript
export const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',

  async generate(context: PluginContext) {
    // Custom generation logic
  },

  async validate(context: PluginContext) {
    // Custom validation
  }
};
```

### 2. Custom Templates

**Framework-specific templates.**

Override default test templates:

```typescript
const template = `
import { test, expect } from '${framework}';
{{imports}}

{{tests}}
`;
```

### 3. Configuration Schema

**Extend configuration with custom options.**

Add plugin-specific config:

```json
{
  "plugins": ["./my-plugin"],
  "myPlugin": {
    "customOption": true
  }
}
```

### 4. Custom Commands

**Add new CLI commands.**

Extend Commander instance:

```typescript
program
  .command('my-command')
  .action(async () => {
    // Custom command logic
  });
```

## Key Design Decisions

### ADR-001: Monorepo Structure

**Decision:** Use pnpm workspaces for monorepo

**Rationale:**
- Shared dependencies reduce duplication
- Easy to develop packages together
- Single source of truth for versioning
- pnpm provides best performance

**Alternatives Considered:**
- Separate repositories (rejected: too much coordination overhead)
- Lerna (rejected: pnpm workspaces more lightweight)

### ADR-002: TypeScript Strict Mode

**Decision:** Enable TypeScript strict mode throughout

**Rationale:**
- Catches errors at compile time
- Self-documenting code
- Better IDE support
- Prevents common bugs

**Trade-offs:**
- More verbose code
- Steeper learning curve
- Longer development time initially

### ADR-003: Atomic File Operations

**Decision:** Use atomic writes for all file operations

**Rationale:**
- Prevents partial writes on errors
- Safe for concurrent operations
- Enables rollback on failure

**Implementation:**
- Write to temp file
- Atomic rename to target

### ADR-004: Plugin System Architecture

**Decision:** Dynamic plugin loading with sandboxed execution

**Rationale:**
- Extensibility without modifying core
- Third-party plugins possible
- Isolated plugin failures

**Alternatives Considered:**
- Static plugins only (rejected: not extensible)
- No plugin system (rejected: limited use cases)

### ADR-005: Configuration with Cosmiconfig

**Decision:** Use cosmiconfig for configuration management

**Rationale:**
- Industry standard
- Multiple search locations
- Supports JSON, YAML, JS
- Well-tested

### ADR-006: Zod for Schema Validation

**Decision:** Use Zod for runtime schema validation

**Rationale:**
- Runtime type safety
- TypeScript integration
- Excellent error messages
- Schema inference

**Alternatives Considered:**
- Joi (rejected: less TypeScript integration)
- Yup (rejected: less powerful)
- JSON Schema (rejected: less ergonomic)

### ADR-007: Commander.js for CLI

**Decision:** Use Commander.js for CLI framework

**Rationale:**
- Battle-tested
- Simple API
- Good TypeScript support
- Standard in Node.js ecosystem

### ADR-008: Vitest for Testing

**Decision:** Use Vitest as primary test framework

**Rationale:**
- Fast (Vite-powered)
- Modern API
- ESM support out of the box
- Excellent TypeScript support

## Performance Considerations

### Caching

- Detection results cached per session
- Configuration cached after first load
- Plugin modules loaded once

### Parallelization

- Multiple test generation can run in parallel
- Batch file operations when possible

### Lazy Loading

- Plugins loaded only when needed
- Heavy dependencies imported lazily

## Security Considerations

### Plugin Sandboxing

- Plugins run in limited context
- No direct filesystem access
- Limited Node.js API access

### File Operations

- Validate all paths before writes
- Prevent path traversal attacks
- Atomic operations prevent race conditions

### Configuration Validation

- Schema validation on all config
- Type checking at runtime
- Sanitize user inputs

## Future Architecture Considerations

### Scalability

- Watch mode should handle large projects
- Consider worker threads for parallel generation
- Optimize detection for monorepos

### Modularity

- Consider breaking core into smaller packages
- Enable tree-shaking for CLI bundle
- Separate detection from config

### Extensibility

- More plugin hooks (pre/post generate)
- Middleware pattern for transformations
- Event system for notifications

## Related Documentation

- **[API Reference](API.md)** - Detailed API documentation
- **[Plugin Development](../plugin-development.md)** - Creating plugins
- **[ADRs](architecture/ADRs/)** - Individual architecture decision records

---

**TDD.ai Architecture** - Built for extensibility, type safety, and developer experience
