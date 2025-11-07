# TDD.ai Documentation

> Comprehensive documentation for the TDD.ai AI-powered Test-Driven Development automation tool

Welcome to the complete TDD.ai documentation. This guide will help you get started, understand the architecture, use the CLI effectively, and extend TDD.ai with custom plugins.

## Documentation Structure

### Getting Started
- **[Quick Start Guide](quick-start.md)** - Install and run your first command in < 5 minutes
- **[Installation](installation.md)** - Detailed installation instructions for all environments
- **[Configuration](configuration.md)** - Complete configuration reference

### Core Documentation
- **[Architecture Overview](ARCHITECTURE.md)** - System design and component architecture
- **[Core API Reference](API.md)** - @tddai/core package API documentation
- **[CLI Reference](CLI.md)** - Complete command-line interface guide

### Guides
- **[Plugin Development](plugin-development.md)** - Create custom test generation plugins
- **[Contributing Guide](../../CONTRIBUTING-TDDAI.md)** - How to contribute to TDD.ai
- **[Examples](../../examples/)** - Real-world usage examples

### Architecture & Design
- **[ADRs (Architecture Decision Records)](architecture/ADRs/)** - Technical decisions and rationale
- **[Design Patterns](architecture/patterns.md)** - Common patterns used in TDD.ai
- **[Plugin System Design](architecture/plugin-system.md)** - Plugin architecture deep-dive

## Quick Navigation

### I want to...

**Get Started:**
- [Install TDD.ai](installation.md)
- [Run my first command](quick-start.md#your-first-command)
- [Configure my project](configuration.md)

**Use TDD.ai:**
- [Generate tests](CLI.md#generate-command)
- [Watch for changes](CLI.md#watch-command)
- [Validate configuration](CLI.md#validate-command)
- [Manage settings](CLI.md#config-command)

**Extend TDD.ai:**
- [Create a plugin](plugin-development.md)
- [Understand the architecture](ARCHITECTURE.md)
- [Read the API docs](API.md)

**Contribute:**
- [Set up development environment](../../CONTRIBUTING-TDDAI.md#development-setup)
- [Add a new command](../../CONTRIBUTING-TDDAI.md#how-to-add-a-new-cli-command)
- [Submit a PR](../../CONTRIBUTING-TDDAI.md#pull-request-process)

## Project Overview

TDD.ai is an intelligent CLI tool that automates Test-Driven Development workflows for JavaScript and TypeScript projects. It detects your testing framework, generates comprehensive test suites, monitors code changes, and maintains test quality—all with minimal configuration.

### Key Features

- **Intelligent Test Generation**: AI-powered test creation from source code
- **Framework Detection**: Automatically detects Vitest, Jest, Mocha, and more
- **Watch Mode**: Real-time test regeneration on file changes
- **Configuration Management**: Simple CLI-based configuration
- **Plugin System**: Extensible architecture for custom test generators

### Technology Stack

- **TypeScript**: Strict mode for type safety
- **Commander.js**: CLI framework
- **Vitest**: Testing framework
- **Zod**: Schema validation
- **Cosmiconfig**: Configuration management
- **pnpm**: Package manager and workspace management

## Package Structure

TDD.ai is organized as a monorepo with three main packages:

```
packages/
├── core/           # @tddai/core - Core library
│   ├── detection/  # Project and framework detection
│   ├── config/     # Configuration loading and merging
│   ├── fs/         # File system operations
│   ├── integration/# ProjectAnalyzer and TestWriter
│   ├── plugins/    # Plugin system
│   └── types/      # TypeScript definitions
│
├── cli/            # @tddai/cli - Command-line interface
│   ├── commands/   # init, generate, validate, config, watch
│   └── utils/      # Logger and CLI utilities
│
└── plugin-react/   # @tddai/plugin-react - React plugin
    └── generators/ # React component test generation
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## Commands Overview

### `tddai init`
Initialize TDD.ai configuration in your project.

```bash
tddai init --framework vitest
```

[Full documentation →](CLI.md#init-command)

### `tddai generate`
Generate test files from source files.

```bash
tddai generate src/calculator.ts
```

[Full documentation →](CLI.md#generate-command)

### `tddai watch`
Watch files and regenerate tests automatically.

```bash
tddai watch src/ --debounce 500
```

[Full documentation →](CLI.md#watch-command)

### `tddai validate`
Validate configuration and test coverage.

```bash
tddai validate --coverage-threshold 90
```

[Full documentation →](CLI.md#validate-command)

### `tddai config`
View or update configuration.

```bash
tddai config set framework jest
```

[Full documentation →](CLI.md#config-command)

## Configuration

TDD.ai uses `.tddai/config.json` for project-specific settings:

```json
{
  "version": 1,
  "framework": "vitest",
  "testDir": "tests",
  "testPattern": "**/*.test.ts",
  "sourceDir": "src",
  "plugins": [],
  "generation": {
    "coverageTarget": 85,
    "includeEdgeCases": true,
    "mockExternal": true
  }
}
```

[Full configuration reference →](configuration.md)

## Plugin System

Extend TDD.ai with custom test generators:

```typescript
import { Plugin, PluginContext } from '@tddai/core';

export const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',

  async generate(context: PluginContext) {
    // Your custom test generation logic
    return {
      success: true,
      filesGenerated: ['path/to/test.ts']
    };
  }
};
```

[Plugin development guide →](plugin-development.md)

## Examples

Explore real-world scenarios:

- **[Basic Setup](../../examples/basic-setup/)** - Initialize a new project
- **[Generate Tests](../../examples/generate-tests/)** - Generate tests from source
- **[Validate Config](../../examples/validate-config/)** - Validate project settings
- **[Watch Mode](../../examples/watch-mode/)** - Auto-regenerate tests
- **[Custom Framework](../../examples/custom-framework/)** - Custom framework integration

## API Reference

### Core Classes

- **[ProjectDetector](API.md#projectdetector)** - Detect project type and framework
- **[ConfigLoader](API.md#configloader)** - Load and merge configurations
- **[FileWriter](API.md#filewriter)** - Atomic file operations
- **[TestWriter](API.md#testwriter)** - Generate test files
- **[ProjectAnalyzer](API.md#projectanalyzer)** - Orchestrate detection and config
- **[PluginManager](API.md#pluginmanager)** - Manage plugin lifecycle

[Full API documentation →](API.md)

## Architecture

TDD.ai follows a layered architecture:

```
CLI Layer (Commands)
        ↓
Integration Layer (ProjectAnalyzer, TestWriter)
        ↓
Core Services (Detection, Config, FileOps, Plugins)
        ↓
Foundation (Types, Schemas, Utils)
```

Key design principles:
- **Separation of Concerns**: Each layer has clear responsibilities
- **Dependency Injection**: Services accept dependencies
- **Type Safety**: TypeScript strict mode throughout
- **Extensibility**: Plugin system for custom behavior

[Full architecture documentation →](ARCHITECTURE.md)

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Setup

```bash
# Clone repository
git clone https://github.com/tddai/tddai.git
cd tddai

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

[Full development guide →](../../CONTRIBUTING-TDDAI.md)

## Testing

TDD.ai has comprehensive test coverage:

- **457 tests total** (all passing)
- **355 unit tests** for all CLI commands
- **102 integration tests** for cross-package workflows
- **85%+ code coverage** across all packages

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:ci
```

## Version History

- **v1.1.0** (Current) - Enhanced CLI with watch mode and validation
- **v1.0.0** - Initial release with core functionality

See [CHANGELOG.md](../../CHANGELOG-TDDAI.md) for detailed version history.

## Contributing

We welcome contributions! See our [Contributing Guide](../../CONTRIBUTING-TDDAI.md) for:

- Development setup instructions
- Code style guidelines
- Testing requirements
- PR submission process

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/tddai/tddai/issues)
- **GitHub Discussions**: [Community Q&A](https://github.com/tddai/tddai/discussions)
- **Documentation**: [Full docs](https://tddai.dev/docs)

## License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Next Steps:**
- [Get Started →](quick-start.md)
- [Read Architecture Docs →](ARCHITECTURE.md)
- [Explore Examples →](../../examples/)
- [Contribute →](../../CONTRIBUTING-TDDAI.md)
