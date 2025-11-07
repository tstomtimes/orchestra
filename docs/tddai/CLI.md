# TDD.ai CLI Reference

> Complete command-line interface documentation

This document provides comprehensive documentation for all TDD.ai CLI commands, options, and usage patterns.

## Table of Contents

- [Installation](#installation)
- [Global Options](#global-options)
- [Commands](#commands)
  - [init](#init)
  - [generate](#generate)
  - [watch](#watch)
  - [validate](#validate)
  - [config](#config)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Exit Codes](#exit-codes)

## Installation

### Global Installation

```bash
npm install -g @tddai/cli
```

### Local Installation

```bash
npm install --save-dev @tddai/cli
```

### Verify Installation

```bash
tddai --version
```

## Global Options

Available for all commands:

| Option | Description | Default |
|--------|-------------|---------|
| `--version` | Display version | - |
| `--help` | Show help | - |
| `--verbose` | Enable verbose logging | false |
| `--quiet` | Suppress non-error output | false |
| `--cwd <path>` | Set working directory | process.cwd() |

## Commands

### init

Initialize TDD.ai configuration in your project.

**Usage:**
```bash
tddai init [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--framework <name>` | string | Testing framework (vitest\|jest\|mocha) | auto-detect |
| `--test-dir <path>` | string | Test output directory | 'tests' |
| `--coverage <num>` | number | Target coverage percentage | 85 |
| `--force` | boolean | Overwrite existing config | false |

**Examples:**

```bash
# Auto-detect and initialize
tddai init

# Specify framework
tddai init --framework vitest

# Custom test directory
tddai init --test-dir __tests__

# Force overwrite
tddai init --force

# Combine options
tddai init --framework jest --coverage 90
```

**Exit Codes:**
- `0` - Success
- `1` - Configuration error
- `2` - Detection failed

---

### generate

Generate test files from source files.

**Usage:**
```bash
tddai generate <files...> [options]
```

**Arguments:**

| Argument | Type | Description | Required |
|----------|------|-------------|----------|
| `files` | string[] | Source files or directories | Yes |

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--dry-run` | boolean | Preview without writing | false |
| `--pattern <glob>` | string | Glob pattern for files | - |
| `--force` | boolean | Overwrite existing tests | false |
| `--coverage <num>` | number | Target coverage for generation | from config |
| `--framework <name>` | string | Override framework | from config |

**Examples:**

```bash
# Single file
tddai generate src/calculator.ts

# Multiple files
tddai generate src/math.ts src/utils.ts

# Directory
tddai generate src/utils/

# Glob pattern
tddai generate --pattern "src/**/*.ts"

# Dry run
tddai generate src/ --dry-run

# Force overwrite
tddai generate src/ --force

# Custom coverage
tddai generate src/ --coverage 95
```

**Output:**
```
Generating tests...

✔ src/calculator.ts → tests/calculator.test.ts (24 tests)
✔ src/validator.ts → tests/validator.test.ts (18 tests)

Generated 2 test files with 42 tests
Estimated coverage: 89%
```

**Exit Codes:**
- `0` - Success
- `1` - Generation failed
- `2` - No files found

---

### watch

Watch files and regenerate tests on changes.

**Usage:**
```bash
tddai watch [directory] [options]
```

**Arguments:**

| Argument | Type | Description | Default |
|----------|------|-------------|---------|
| `directory` | string | Directory to watch | 'src' |

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--debounce <ms>` | number | Debounce delay (ms) | 300 |
| `--pattern <glob>` | string | Watch pattern | `**/*` |
| `--ignore <glob>` | string | Ignore pattern | from config |
| `--initial` | boolean | Generate before watching | false |

**Examples:**

```bash
# Watch src directory
tddai watch src/

# Custom debounce
tddai watch src/ --debounce 500

# Watch pattern
tddai watch --pattern "src/**/*.tsx"

# Ignore files
tddai watch src/ --ignore "**/*.config.ts"

# Generate immediately
tddai watch src/ --initial
```

**Output:**
```
Watching src/ for changes...
(Press Ctrl+C to stop)

✔ Ready. Waiting for file changes...

[14:23:45] Changed: src/calculator.ts
[14:23:45] Regenerating tests...
✔ tests/calculator.test.ts updated (24 tests)
```

**Exit Codes:**
- `0` - Graceful shutdown
- `1` - Watch setup failed

---

### validate

Validate configuration and test coverage.

**Usage:**
```bash
tddai validate [options]
```

**Options:**

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `--coverage-threshold <num>` | number | Minimum coverage % | from config |
| `--fix` | boolean | Auto-fix issues | false |
| `--strict` | boolean | Strict validation | false |
| `--report` | boolean | Detailed report | false |

**Examples:**

```bash
# Basic validation
tddai validate

# Custom threshold
tddai validate --coverage-threshold 90

# Strict mode
tddai validate --strict

# Auto-fix
tddai validate --fix

# Detailed report
tddai validate --report
```

**Output (Success):**
```
Validating project...

✔ Configuration valid
✔ Coverage: 87% (target: 85%)
✔ All source files have tests

Project validation passed!
```

**Output (Failures):**
```
Validating project...

✔ Configuration valid
✗ Coverage: 78% (target: 85%) - Below threshold
⚠ Missing tests:
  - src/new-feature.ts

2 issues found
Run with --fix to attempt fixes
```

**Exit Codes:**
- `0` - Validation passed
- `1` - Validation failed
- `2` - Configuration invalid

---

### config

View or update configuration.

**Usage:**
```bash
tddai config <command> [args]
```

**Commands:**

#### config list

Display current configuration.

```bash
tddai config list
```

#### config get

Get configuration value.

```bash
tddai config get <key>
```

**Examples:**
```bash
tddai config get framework
tddai config get generation.coverageTarget
```

#### config set

Set configuration value.

```bash
tddai config set <key> <value>
```

**Examples:**
```bash
tddai config set framework jest
tddai config set testDir __tests__
tddai config set generation.coverageTarget 90
```

#### config reset

Reset to default configuration.

```bash
tddai config reset
```

**Exit Codes:**
- `0` - Success
- `1` - Configuration error
- `2` - Key not found

---

## Configuration

TDD.ai reads configuration from `.tddai/config.json`:

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
  },
  "watch": {
    "debounce": 300,
    "ignore": ["node_modules/**", "dist/**"]
  }
}
```

See [configuration.md](configuration.md) for complete reference.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TDDAI_CONFIG` | Config file path | `.tddai/config.json` |
| `TDDAI_LOG_LEVEL` | Log level (debug\|info\|warn\|error) | `info` |
| `TDDAI_NO_COLOR` | Disable colored output | `false` |
| `TDDAI_CACHE_DIR` | Cache directory | `.tddai/cache` |

**Examples:**

```bash
# Custom config path
TDDAI_CONFIG=/path/to/config.json tddai generate src/

# Debug logging
TDDAI_LOG_LEVEL=debug tddai generate src/ --verbose

# Disable colors
TDDAI_NO_COLOR=1 tddai validate
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Configuration error |
| `3` | Detection failed |
| `4` | Validation failed |
| `5` | File operation failed |

---

For complete CLI documentation, see [packages/cli/README.md](../../packages/cli/README.md).

For usage examples, see [examples/](../../examples/tddai/).
