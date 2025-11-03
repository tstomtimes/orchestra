# Architecture Decision Records (ADRs)

This document contains key architectural decisions made during TDD.ai development, including context, alternatives considered, and consequences.

## ADR Index

- [ADR-001: Monorepo with pnpm Workspaces](#adr-001-monorepo-with-pnpm-workspaces)
- [ADR-002: Plugin System Architecture](#adr-002-plugin-system-architecture)
- [ADR-003: CLI Framework Selection](#adr-003-cli-framework-selection)
- [ADR-004: Test Strategy and Framework](#adr-004-test-strategy-and-framework)

---

## ADR-001: Monorepo with pnpm Workspaces

**Status**: ✅ Accepted

**Date**: 2025-11-03

**Context**: We needed to organize multiple related packages (@tddai/cli, @tddai/core, @tddai/plugin-*) in a way that enables efficient development, consistent versioning, and easy dependency management.

### Decision

Use pnpm workspaces for monorepo management instead of npm workspaces, yarn workspaces, Lerna, or Turborepo.

### Rationale

1. **Disk Efficiency**: pnpm uses content-addressable storage, saving significant disk space when multiple packages share dependencies
2. **Strict Dependencies**: pnpm enforces strict dependency resolution, preventing phantom dependencies (packages used but not declared)
3. **Fast Performance**: Installation and linking speed superior to npm/yarn
4. **Native Workspace Support**: Built-in workspace protocol (`workspace:*`) for inter-package dependencies
5. **Active Development**: Well-maintained with growing adoption in TypeScript ecosystem

### Alternatives Considered

**npm workspaces**:
- Pros: Built-in, no additional tool
- Cons: Slower, flat node_modules structure, weaker dependency isolation
- Rejected: Performance and strictness concerns

**yarn workspaces**:
- Pros: Mature, widely used
- Cons: Yarn v1 deprecated, Yarn v3+ (Berry) has breaking changes
- Rejected: Ecosystem uncertainty

**Lerna**:
- Pros: Mature monorepo tool, publishing workflows
- Cons: Adds complexity, overlaps with pnpm workspace features
- Rejected: pnpm workspaces sufficient

**Turborepo**:
- Pros: Advanced caching, task orchestration
- Cons: Overkill for current project size, additional abstraction layer
- Rejected: Not needed at Phase 1 scale

### Consequences

**Positive**:
- Fast CI builds due to efficient caching
- Clear dependency boundaries prevent coupling
- Easy to add new packages (`pnpm init` in `packages/`)
- Consistent dependency versions across workspace

**Negative**:
- Contributors must install pnpm (enforced via `preinstall` script)
- Slightly less familiar than npm for some developers
- Requires `.npmrc` configuration for publishing

**Mitigation**:
- Document pnpm requirement prominently in README
- Provide npm-to-pnpm command equivalents in docs
- Enforce pnpm usage with preinstall hook

### Related Files

- `/pnpm-workspace.yaml` - Workspace configuration
- `/package.json` - Root package with workspace scripts
- `/.npmrc` - pnpm configuration

---

## ADR-002: Plugin System Architecture

**Status**: ✅ Accepted

**Date**: 2025-11-03

**Context**: TDD.ai needs to support multiple test frameworks (Jest, Vitest, Mocha) and UI frameworks (React, Vue, Angular) without creating a monolithic codebase. The system must be extensible by third-party developers.

### Decision

Implement a plugin-based architecture where each framework-specific implementation is a separate npm package following the `@tddai/plugin-{name}` naming convention.

### Rationale

1. **Separation of Concerns**: Core logic separate from framework-specific code
2. **Independent Versioning**: Plugins can evolve independently of core
3. **Opt-in Dependencies**: Users only install plugins they need (smaller footprint)
4. **Third-Party Extensibility**: Clear interface for community plugins
5. **Testing Isolation**: Plugin bugs don't affect core functionality

### Plugin Interface Design

```typescript
export interface Plugin {
  name: string;
  version: string;
  frameworks: string[];
  generate(context: PluginContext): Promise<GeneratedTest>;
  validate?(test: string, source: string): Promise<ValidationResult>;
}
```

### Alternatives Considered

**Monolithic Framework Support**:
- Pros: Simpler architecture, fewer packages
- Cons: Large bundle size, tight coupling, hard to extend
- Rejected: Violates single responsibility principle

**Dynamic Import Only** (no separate packages):
- Pros: Simpler publishing
- Cons: All code bundled together, can't version independently
- Rejected: Increases maintenance burden

**Configuration-Based Generators** (no plugins):
- Pros: No code extension needed
- Cons: Limited to predefined templates, not flexible enough
- Rejected: Insufficient for framework-specific nuances

### Consequences

**Positive**:
- Clear extension point for community contributions
- Small core bundle (~50KB), plugins opt-in
- Framework-specific best practices encapsulated in plugins
- Easy to deprecate/remove framework support

**Negative**:
- More packages to maintain and publish
- Plugin discovery mechanism needed
- Version compatibility matrix to manage

**Mitigation**:
- Automated publishing with changesets
- Clear plugin API with semantic versioning
- Plugin compatibility matrix in docs

### Plugin Discovery Mechanism

1. Scan `node_modules` for packages matching `@tddai/plugin-*`
2. Check config file's `plugins` array for explicit inclusions
3. Lazy-load plugins only when needed (framework match)

### Related Files

- `/packages/core/src/types/plugin.ts` - Plugin interface
- `/packages/plugin-react/` - Reference implementation
- `/docs/plugin-development.md` - Plugin authoring guide

---

## ADR-003: CLI Framework Selection

**Status**: ✅ Accepted

**Date**: 2025-11-03

**Context**: The CLI needs to parse arguments, handle subcommands, display help text, and provide a developer-friendly API for adding new commands.

### Decision

Use `commander.js` as the CLI framework.

### Rationale

1. **Mature & Stable**: 10+ years of development, battle-tested
2. **TypeScript Support**: Excellent type definitions
3. **Subcommand Support**: Natural command structure (`tddai generate`, `tddai watch`)
4. **Help Generation**: Automatic help text from command definitions
5. **Minimal API Surface**: Easy to learn and maintain
6. **Lightweight**: ~20KB, no heavy dependencies

### Alternatives Considered

**yargs**:
- Pros: Feature-rich, powerful parsing
- Cons: Larger bundle (~200KB), more complex API
- Rejected: Overkill for our needs

**oclif** (OpenCLI Framework):
- Pros: Enterprise-grade, plugin system, auto-documentation
- Cons: Heavy framework (~2MB), opinionated structure
- Rejected: Too heavyweight for a focused CLI

**cac** (Command And Conquer):
- Pros: Lightweight (5KB), modern API
- Cons: Smaller community, fewer examples
- Rejected: Commander's maturity preferred

**meow**:
- Pros: Very simple, minimal API
- Cons: Too minimal, lacks subcommand structure
- Rejected: Insufficient features

### Command Structure

```typescript
program
  .name('tddai')
  .description('AI-powered TDD workflow automation')
  .version(VERSION);

program
  .command('generate <file>')
  .description('Generate tests for source file')
  .option('--coverage <n>', 'Target coverage', '85')
  .action(generateCommand);
```

### Consequences

**Positive**:
- Consistent, idiomatic CLI interface
- Easy to add new commands (each in own file)
- Automatic `--help` and `--version` support
- Error handling built-in

**Negative**:
- Tied to commander's command structure patterns
- Limited customization of help text format

**Mitigation**:
- Use commander's extension points for custom behavior
- Supplement with chalk for styled output

### Related Files

- `/packages/cli/src/index.ts` - CLI entry point
- `/packages/cli/src/commands/` - Command implementations
- `/packages/cli/src/cli.ts` - Commander configuration

---

## ADR-004: Test Strategy and Framework

**Status**: ✅ Accepted

**Date**: 2025-11-03

**Context**: We need a testing framework that supports TypeScript, provides fast feedback, integrates with modern tooling, and aligns with TDD principles.

### Decision

Use **Vitest** as the primary testing framework for all packages.

### Rationale

1. **Native TypeScript Support**: No ts-node/ts-jest required, uses esbuild
2. **Fast Execution**: Up to 10x faster than Jest for TS projects
3. **Jest-Compatible API**: Easy migration path, familiar syntax
4. **Built-in Coverage**: c8/v8 coverage out-of-the-box
5. **Watch Mode Excellence**: Instant re-runs, smart test selection
6. **Vite Ecosystem**: Aligns with modern build tooling

### Test Coverage Targets

- **Core Package**: ≥ 90% (critical path)
- **CLI Package**: ≥ 85% (command logic)
- **Plugin Packages**: ≥ 80% (generation logic)
- **Overall Project**: ≥ 85%

### Alternatives Considered

**Jest**:
- Pros: Industry standard, massive ecosystem
- Cons: Slower TS compilation, config complexity
- Rejected: Performance concerns with TypeScript

**AVA**:
- Pros: Parallel execution, modern API
- Cons: Smaller community, less TypeScript integration
- Rejected: Vitest offers similar benefits with better TS support

**Mocha + Chai**:
- Pros: Flexible, composable
- Cons: Requires multiple packages, more setup
- Rejected: Vitest more integrated

### Test Organization

```
packages/{package}/
├── src/
│   └── utils/logger.ts
└── tests/
    └── utils/logger.test.ts
```

**Naming Convention**: `{filename}.test.ts`

**Test File Location**: Mirror `src/` structure in `tests/` directory

### Testing Pyramid

- **70% Unit Tests**: Pure functions, utilities, types
- **25% Integration Tests**: Multi-module workflows
- **5% E2E Tests** (Phase 2): Full CLI command execution

### Consequences

**Positive**:
- Extremely fast test execution (watch mode viable)
- Native ESM support (no dual-package hazards)
- Unified testing experience across all packages
- Easy to achieve high coverage with TDD

**Negative**:
- Vitest less mature than Jest (potential edge case bugs)
- Smaller community/ecosystem (fewer plugins)
- Some Jest plugins not compatible

**Mitigation**:
- Pin Vitest version to stable releases
- Comprehensive test suite catches framework issues early
- Document any Vitest-specific quirks in contributor guide

### Related Files

- `/vitest.config.ts` - Global Vitest configuration
- `/packages/*/tests/` - Test directories
- `/.github/workflows/test.yml` - CI test automation

---

## ADR Template for Future Decisions

```markdown
## ADR-XXX: [Title]

**Status**: [Proposed | Accepted | Deprecated | Superseded]

**Date**: YYYY-MM-DD

**Context**: What problem are we solving? What constraints exist?

### Decision

What did we decide? (1-2 sentences)

### Rationale

Why did we make this decision? (3-5 bullet points)

### Alternatives Considered

**Alternative 1**:
- Pros:
- Cons:
- Rejected because:

### Consequences

**Positive**:
-

**Negative**:
-

**Mitigation**:
-

### Related Files

- Path to relevant implementation files
- Path to documentation
```

---

## Governance

### When to Create an ADR

Create an ADR when making decisions about:
- Core architecture changes
- Technology selection (frameworks, libraries)
- API design with long-term implications
- Breaking changes to plugin interface
- Performance trade-offs with significant impact

### ADR Review Process

1. **Proposal**: Author creates ADR with "Proposed" status
2. **Discussion**: Team reviews via PR comments
3. **Decision**: After consensus, merge with "Accepted" status
4. **Implementation**: Reference ADR in implementation PRs
5. **Review**: Revisit after 6 months or when pain points emerge

### ADR Status Lifecycle

- **Proposed**: Under discussion
- **Accepted**: Approved and implemented
- **Deprecated**: Decision no longer valid but kept for history
- **Superseded**: Replaced by newer ADR (reference new ADR number)

---

**Document Maintainer**: Kai (Architect)
**Last Review**: 2025-11-03
**Next Review**: After Phase 2 completion
