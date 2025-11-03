# TDD.ai

> AI-powered Test-Driven Development workflow automation for modern JavaScript and TypeScript projects

TDD.ai is an intelligent CLI tool that automates test generation, validation, and maintenance using AI. Designed for developers who want to embrace TDD without the overhead, it intelligently generates comprehensive test suites, watches for code changes, and ensures your tests stay aligned with your implementation.

## Key Features

- **Intelligent Test Generation**: AI-powered test creation from source code with context-aware assertions
- **Watch Mode**: Real-time test regeneration as your code evolves
- **Framework Agnostic**: Extensible plugin system supporting Jest, Vitest, Mocha, and more
- **Type-Safe**: Built with TypeScript strict mode for maximum reliability
- **Zero Config**: Works out-of-the-box with sensible defaults, customizable when needed

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm, yarn, or pnpm (recommended: pnpm)

### Installation

**Global Installation (Recommended):**

```bash
npm install -g @tddai/cli
```

**Local Development:**

```bash
git clone https://github.com/tddai/tddai.git
cd tddai
pnpm install
pnpm build
```

### First Steps

Initialize TDD.ai in your project:

```bash
tddai init
```

This creates `.tddai/config.json` with default settings.

Generate tests for a file:

```bash
tddai generate src/calculator.ts
```

Watch for changes and regenerate tests automatically:

```bash
tddai watch src/
```

Validate existing tests against source:

```bash
tddai validate
```

## Project Structure

This is a monorepo built with pnpm workspaces:

```
tddai/
├── packages/
│   ├── core/           # Shared types, utilities, and plugin interfaces
│   ├── cli/            # CLI entry point and command implementations
│   └── plugin-react/   # React-specific test generation plugin
├── examples/           # Example projects and use cases
├── docs/              # Comprehensive documentation
└── tests/             # Integration and E2E tests
```

### Package Responsibilities

- **@tddai/core**: Core type definitions, plugin system interfaces, shared utilities
- **@tddai/cli**: User-facing CLI commands, argument parsing, orchestration
- **@tddai/plugin-react**: React component test generation (example plugin)

## Commands

### `tddai init`

Initialize TDD.ai configuration in your project.

```bash
tddai init [--framework vitest|jest|mocha]
```

### `tddai generate`

Generate tests for source files.

```bash
tddai generate <file-or-directory>
tddai generate src/components/Button.tsx
tddai generate src/utils/ --coverage 90
```

### `tddai watch`

Watch files and regenerate tests on changes.

```bash
tddai watch [directory]
tddai watch src/ --debounce 500
```

### `tddai validate`

Validate that tests cover source code appropriately.

```bash
tddai validate [--coverage-threshold 85]
```

### `tddai config`

View or update configuration.

```bash
tddai config list
tddai config set framework vitest
```

## Development Setup

### Clone and Install

```bash
git clone https://github.com/tddai/tddai.git
cd tddai
pnpm install
```

### Build All Packages

```bash
pnpm build
```

### Run Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# CI mode with coverage
pnpm test:ci
```

### Development Workflow

```bash
# Watch mode for CLI development
pnpm dev

# Lint code
pnpm lint

# Format code
pnpm format
```

## Configuration

TDD.ai uses `.tddai/config.json` for project-specific settings:

```json
{
  "framework": "vitest",
  "testDir": "tests",
  "testPattern": "**/*.test.ts",
  "plugins": ["@tddai/plugin-react"],
  "generation": {
    "coverageTarget": 85,
    "includeEdgeCases": true,
    "mockExternal": true
  }
}
```

See [docs/configuration.md](docs/configuration.md) for detailed configuration options.

## Plugin System

TDD.ai is extensible through plugins. Create custom test generators for specific frameworks or patterns:

```typescript
import { Plugin, PluginContext } from '@tddai/core';

export const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',

  async generate(context: PluginContext) {
    // Custom test generation logic
  }
};
```

See [docs/plugin-development.md](docs/plugin-development.md) for the complete guide.

## Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup and workflow
- Code style guidelines
- Testing requirements
- PR submission process

### Code Standards

- TypeScript strict mode required
- ESLint and Prettier enforced
- Test coverage > 85%
- Conventional Commits for commit messages

## Documentation

- [Getting Started](docs/getting-started.md) - Installation and first steps
- [Architecture](docs/architecture/ARCHITECTURE.md) - System design and structure
- [Configuration](docs/configuration.md) - Configuration options
- [Plugin Development](docs/plugin-development.md) - Creating custom plugins
- [ADRs](docs/architecture/ADRs.md) - Architecture decision records

## Roadmap

### Phase 1: Foundation (✅ Complete)
- ✅ Monorepo structure with pnpm workspaces
- ✅ CLI infrastructure with commander.js
- ✅ Core types and plugin system
- ✅ TypeScript strict mode support
- ✅ Vitest integration
- ✅ Basic plugin example (@tddai/plugin-react)

### Phase 2: AI Integration (Planned)
- AI-powered test generation engine
- Context-aware assertion creation
- Code coverage analysis
- Integration with Claude/GPT APIs

### Phase 3: Advanced Features (Planned)
- Visual test reporting
- CI/CD integration
- Advanced plugin marketplace
- Multi-framework support expansion

## License

MIT - See [LICENSE](LICENSE) for details.

## Support

- GitHub Issues: [Report bugs or request features](https://github.com/tddai/tddai/issues)
- Discussions: [Community Q&A](https://github.com/tddai/tddai/discussions)
- Documentation: [Full docs](https://tddai.dev/docs)

---

**Built with** ❤️ **by developers who believe TDD should be effortless**
