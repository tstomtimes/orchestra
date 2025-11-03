# Contributing to TDD.ai

Thank you for your interest in contributing to TDD.ai! This guide will help you get started with development, testing, and submitting contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences
- Accept responsibility and apologize for mistakes

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js**: >= 20.0.0 (check with `node --version`)
- **pnpm**: >= 8.0.0 (install with `npm install -g pnpm`)
- **Git**: Latest stable version
- **Code Editor**: VS Code recommended (with TypeScript extension)

### First-Time Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tddai.git
   cd tddai
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/tddai/tddai.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Build all packages**:
   ```bash
   pnpm build
   ```

6. **Run tests to verify setup**:
   ```bash
   pnpm test
   ```

If all tests pass, you're ready to contribute!

## Development Setup

### Workspace Commands

The monorepo uses pnpm workspaces. Here are key commands:

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Watch mode for tests
pnpm test:watch

# Lint code
pnpm lint

# Format code
pnpm format

# Run CLI in development mode
pnpm dev
```

### Working on Specific Packages

```bash
# Work on CLI package
cd packages/cli
pnpm dev

# Work on core package
cd packages/core
pnpm test:watch

# Work on plugin
cd packages/plugin-react
pnpm build && pnpm test
```

### Linking CLI Locally

To test CLI changes globally:

```bash
cd packages/cli
npm link

# Now you can run:
tddai --version
```

Unlink when done:

```bash
npm unlink -g @tddai/cli
```

## Project Structure

```
tddai/
├── packages/
│   ├── core/               # Core types and utilities
│   │   ├── src/
│   │   │   ├── types/      # TypeScript type definitions
│   │   │   └── utils/      # Shared utilities
│   │   └── tests/
│   ├── cli/                # CLI entry point
│   │   ├── src/
│   │   │   ├── commands/   # Command implementations
│   │   │   ├── cli.ts      # CLI configuration
│   │   │   └── index.ts    # Entry point
│   │   └── tests/
│   └── plugin-react/       # React plugin example
│       ├── src/
│       └── tests/
├── docs/                   # Documentation
│   ├── architecture/       # Architecture docs and ADRs
│   ├── getting-started.md
│   ├── configuration.md
│   └── plugin-development.md
├── examples/               # Example projects
├── .github/                # GitHub workflows and templates
├── pnpm-workspace.yaml     # Workspace configuration
├── package.json            # Root package
├── tsconfig.json           # TypeScript config
└── vitest.config.ts        # Test configuration
```

### Package Responsibilities

- **@tddai/core**: Types, interfaces, shared utilities
- **@tddai/cli**: User-facing commands, CLI orchestration
- **@tddai/plugin-\***: Framework-specific test generation

## Development Workflow

### 1. Create a Feature Branch

Always work on a feature branch:

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/my-new-feature
```

Branch naming conventions:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/improvements

### 2. Make Changes

Follow TDD (Test-Driven Development):

```bash
# 1. Write failing test
# 2. Run test to verify it fails
pnpm test

# 3. Write minimal code to pass test
# 4. Run test to verify it passes
pnpm test

# 5. Refactor if needed
# 6. Verify tests still pass
pnpm test
```

### 3. Ensure Code Quality

Before committing:

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Run all tests
pnpm test

# Check TypeScript compilation
pnpm build
```

### 4. Commit Changes

Use conventional commits (see [Commit Guidelines](#commit-message-guidelines)):

```bash
git add .
git commit -m "feat(cli): add watch mode command"
```

### 5. Push and Create PR

```bash
git push origin feature/my-new-feature
```

Then create a Pull Request on GitHub.

## Code Standards

### TypeScript

- **Strict Mode**: Always use TypeScript strict mode
- **Type Safety**: No `any` types without explicit justification
- **Explicit Returns**: Always specify return types for functions
- **Interfaces over Types**: Prefer interfaces for object shapes

**Example**:

```typescript
// Good
export interface Config {
  framework: string;
  testDir: string;
}

export function parseConfig(data: unknown): Config {
  // Implementation
  return { framework: 'vitest', testDir: 'tests' };
}

// Bad
export type Config = {
  framework: any;
  testDir: string;
};

export function parseConfig(data) {
  return { framework: 'vitest', testDir: 'tests' };
}
```

### Naming Conventions

- **Files**: kebab-case (`test-generator.ts`)
- **Classes**: PascalCase (`TestGenerator`)
- **Functions**: camelCase (`generateTest`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_COVERAGE`)
- **Interfaces**: PascalCase, no `I` prefix (`PluginContext`, not `IPluginContext`)

### Code Organization

- One class/interface per file (except small related types)
- Export at declaration, not at end of file
- Group imports: Node.js built-ins → external → internal

**Example**:

```typescript
// Node.js built-ins
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// External dependencies
import { z } from 'zod';

// Internal modules
import type { Config } from './types/config.js';
import { logger } from './utils/logger.js';
```

### ESLint Rules

The project enforces ESLint rules. Key rules:

- `@typescript-eslint/no-explicit-any`: Error
- `@typescript-eslint/explicit-function-return-type`: Warn
- `@typescript-eslint/no-unused-vars`: Error
- `prefer-const`: Error
- `no-console`: Warn (allowed in CLI package)

### Prettier Formatting

Code is automatically formatted with Prettier:

```bash
pnpm format
```

Settings (in `.prettierrc.json`):
- Single quotes
- No semicolons
- 2-space indentation
- 80-character line width

## Testing Requirements

### Test Coverage Targets

- **Overall**: ≥ 85%
- **Core package**: ≥ 90%
- **CLI package**: ≥ 85%
- **Plugin packages**: ≥ 80%
- **New features**: 100% (all new code must be tested)

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Feature/Module Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('specific functionality', () => {
    it('should do something expected', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      // Test edge cases
    });

    it('should throw on invalid input', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### Testing Best Practices

1. **Descriptive Test Names**: Use "should" statements
   - Good: `it('should return null when input is empty')`
   - Bad: `it('works')`

2. **Arrange-Act-Assert**: Structure tests clearly
   ```typescript
   // Arrange: Set up test data
   const input = { value: 10 };

   // Act: Execute function
   const result = calculate(input);

   // Assert: Verify outcome
   expect(result).toBe(20);
   ```

3. **Test One Thing**: Each test should verify one behavior

4. **Use Test Fixtures**: Extract common test data
   ```typescript
   const validConfig = {
     framework: 'vitest',
     testDir: 'tests',
   };
   ```

5. **Mock External Dependencies**: Use Vitest's mocking

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Specific package
pnpm --filter @tddai/core test

# Single file
pnpm test tests/config.test.ts

# With coverage
pnpm test:ci
```

## Pull Request Process

### Before Submitting

Checklist:

- [ ] Tests passing locally (`pnpm test`)
- [ ] Test coverage ≥ 85% for changed code
- [ ] Linter passing (`pnpm lint`)
- [ ] Code formatted (`pnpm format`)
- [ ] TypeScript compiles (`pnpm build`)
- [ ] Documentation updated (if user-facing change)
- [ ] Changelog entry added (if user-facing change)

### PR Template

Use this template when creating a PR:

```markdown
## Description

Brief description of changes (1-3 sentences).

## Related Issue

Closes #123

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made

- Change 1
- Change 2
- Change 3

## Testing

Describe how you tested your changes:

- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing performed

## Screenshots (if applicable)

Add screenshots for UI changes.

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings
```

### PR Review Process

1. **Automated Checks**: CI runs tests, linting, build
2. **Code Review**: Maintainer reviews code quality and design
3. **Feedback**: Address review comments
4. **Approval**: Once approved, PR can be merged
5. **Merge**: Maintainer merges with squash commit

### Review Turnaround

- Initial review: Within 2-3 business days
- Follow-up reviews: Within 1-2 business days

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no behavior change)
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

### Scopes

- `core`: @tddai/core package
- `cli`: @tddai/cli package
- `plugin-react`: @tddai/plugin-react package
- `docs`: Documentation
- `ci`: CI/CD changes

### Examples

**Feature**:
```
feat(cli): add watch mode command

Implement watch mode that monitors file changes and regenerates
tests automatically. Includes debouncing to prevent excessive runs.

Closes #42
```

**Bug Fix**:
```
fix(core): correct type inference for plugin context

The PluginContext type was incorrectly allowing undefined config.
This change makes config required and adds validation.

Fixes #58
```

**Documentation**:
```
docs: update plugin development guide

- Add section on testing plugins
- Include example of React plugin
- Fix typos in configuration examples
```

**Breaking Change**:
```
feat(core)!: redesign plugin interface

BREAKING CHANGE: Plugin API now requires async onInit method
instead of synchronous init. All plugins must be updated.

Migration guide: docs/migration/v2.md
```

## Release Process

Releases are managed by maintainers using [Changesets](https://github.com/changesets/changesets).

### For Contributors

If your PR includes user-facing changes:

1. **Add a changeset**:
   ```bash
   pnpm changeset
   ```

2. **Follow prompts**:
   - Select affected packages
   - Choose version bump (major/minor/patch)
   - Write user-friendly change description

3. **Commit changeset**:
   ```bash
   git add .changeset/
   git commit -m "chore: add changeset"
   ```

### For Maintainers

Release process:

```bash
# 1. Version packages
pnpm changeset version

# 2. Update lockfile
pnpm install

# 3. Build all packages
pnpm build

# 4. Commit changes
git add .
git commit -m "chore: version packages"

# 5. Publish to npm
pnpm changeset publish

# 6. Push changes and tags
git push --follow-tags
```

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

## Development Tips

### VS Code Settings

Recommended `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Debugging

**CLI Debugging**:

```bash
# Add debugger statement in code
# Then run:
node --inspect-brk packages/cli/dist/index.js generate src/file.ts
```

**Test Debugging**:

```bash
# Run single test with inspect
node --inspect-brk ./node_modules/.bin/vitest run tests/mytest.test.ts
```

### Common Issues

**Problem**: `pnpm install` fails

**Solution**: Ensure Node.js >= 20 and pnpm >= 8

```bash
node --version  # Should be >= 20
pnpm --version  # Should be >= 8
```

---

**Problem**: Tests fail with "Cannot find module"

**Solution**: Build packages first

```bash
pnpm build
```

---

**Problem**: TypeScript errors in editor but not in CLI

**Solution**: Restart TypeScript server (VS Code: Cmd+Shift+P → "Restart TypeScript Server")

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/tddai/tddai/discussions)
- **Bugs**: [GitHub Issues](https://github.com/tddai/tddai/issues)
- **Chat**: [Discord Community](https://discord.gg/tddai)

## Recognition

Contributors will be:
- Listed in CHANGELOG.md for their contributions
- Credited in release notes
- Added to Contributors section (automatic via GitHub)

Thank you for contributing to TDD.ai! Your contributions help make TDD accessible to all developers.
