# @tddai/cli

> Command-line interface for TDD.ai - Generate, validate, and manage tests from the terminal

The `@tddai/cli` package provides a user-friendly command-line interface for TDD.ai. It wraps the core library functionality in intuitive commands that integrate seamlessly into your development workflow.

## Installation

### Global Installation (Recommended)

```bash
npm install -g @tddai/cli
```

After installation, the `tddai` command is available globally:

```bash
tddai --version
tddai --help
```

### Local Installation

```bash
npm install --save-dev @tddai/cli
```

Use with npx:

```bash
npx tddai init
npx tddai generate src/
```

### From Source

```bash
git clone https://github.com/tddai/tddai.git
cd tddai
pnpm install
pnpm build
cd packages/cli
npm link
```

## Quick Start

### 1. Initialize Your Project

```bash
cd your-project
tddai init
```

This creates `.tddai/config.json` with intelligent defaults based on your project.

### 2. Generate Tests

```bash
# Single file
tddai generate src/calculator.ts

# Directory
tddai generate src/utils/

# With options
tddai generate src/ --coverage 90 --dry-run
```

### 3. Watch for Changes

```bash
tddai watch src/
```

Tests regenerate automatically when source files change.

### 4. Validate Configuration

```bash
tddai validate --coverage-threshold 85
```

## Commands

### `tddai init`

Initialize TDD.ai configuration in your project.

**Usage:**

```bash
tddai init [options]
```

**Options:**

- `--framework <name>` - Specify testing framework (vitest|jest|mocha)
- `--test-dir <path>` - Test output directory (default: detected or "tests")
- `--coverage <num>` - Target coverage percentage (default: 85)
- `--force` - Overwrite existing configuration

**Examples:**

```bash
# Auto-detect framework
tddai init

# Specify Vitest with custom test directory
tddai init --framework vitest --test-dir __tests__

# Set coverage target
tddai init --coverage 90

# Force overwrite existing config
tddai init --force
```

**What it does:**

1. Detects project type and testing framework
2. Creates `.tddai/config.json` with defaults
3. Validates configuration
4. Reports setup status

**Output:**

```
✔ Detected framework: vitest
✔ Created configuration: .tddai/config.json
✔ Configuration validated

Configuration:
  Framework: vitest
  Test Directory: tests
  Coverage Target: 85%

Ready to generate tests! Run: tddai generate src/
```

---

### `tddai generate`

Generate test files from source files.

**Usage:**

```bash
tddai generate <files...> [options]
```

**Arguments:**

- `files...` - Source files or directories to generate tests for

**Options:**

- `--dry-run` - Preview changes without writing files
- `--pattern <glob>` - Glob pattern for file selection
- `--force` - Overwrite existing test files
- `--coverage <num>` - Target coverage percentage for this generation
- `--framework <name>` - Override framework for this generation

**Examples:**

```bash
# Single file
tddai generate src/calculator.ts

# Multiple files
tddai generate src/math.ts src/string.ts

# Entire directory
tddai generate src/utils/

# With glob pattern
tddai generate --pattern "src/**/*.ts"

# Dry run (preview only)
tddai generate src/ --dry-run

# Force overwrite existing tests
tddai generate src/ --force

# Custom coverage target
tddai generate src/ --coverage 95
```

**What it does:**

1. Analyzes source files
2. Generates comprehensive test suites
3. Writes test files to configured test directory
4. Reports generation statistics

**Output:**

```
Generating tests...

✔ src/calculator.ts → tests/calculator.test.ts (24 tests)
✔ src/validator.ts → tests/validator.test.ts (18 tests)
✔ src/parser.ts → tests/parser.test.ts (31 tests)

Generated 3 test files with 73 tests
Estimated coverage: 87%
```

**Dry Run Output:**

```
Dry run mode - no files will be written

Would generate:
  src/calculator.ts → tests/calculator.test.ts
    - should add two numbers correctly
    - should handle negative numbers
    - should handle zero
    ... 21 more tests

  src/validator.ts → tests/validator.test.ts
    - should validate email format
    - should reject invalid emails
    ... 16 more tests

Total: 3 files, 73 tests
```

---

### `tddai watch`

Watch files and regenerate tests automatically on changes.

**Usage:**

```bash
tddai watch [directory] [options]
```

**Arguments:**

- `directory` - Directory to watch (default: src)

**Options:**

- `--debounce <ms>` - Debounce delay in milliseconds (default: 300)
- `--pattern <glob>` - Glob pattern for watched files
- `--ignore <glob>` - Glob pattern for ignored files
- `--initial` - Generate tests immediately before watching

**Examples:**

```bash
# Watch src directory
tddai watch src/

# Custom debounce (wait 500ms after last change)
tddai watch src/ --debounce 500

# Watch specific pattern
tddai watch --pattern "src/**/*.tsx"

# Ignore certain files
tddai watch src/ --ignore "**/test-utils.ts"

# Generate tests immediately, then watch
tddai watch src/ --initial
```

**What it does:**

1. Monitors specified directory for file changes
2. Debounces rapid changes
3. Regenerates tests automatically
4. Displays real-time status

**Output:**

```
Watching src/ for changes...
(Press Ctrl+C to stop)

✔ Ready. Waiting for file changes...

[14:23:45] Changed: src/calculator.ts
[14:23:45] Regenerating tests...
✔ tests/calculator.test.ts updated (24 tests)

✔ Ready. Waiting for file changes...

[14:25:12] Changed: src/validator.ts
[14:25:12] Regenerating tests...
✔ tests/validator.test.ts updated (18 tests)
```

---

### `tddai validate`

Validate configuration and test coverage.

**Usage:**

```bash
tddai validate [options]
```

**Options:**

- `--coverage-threshold <num>` - Minimum coverage percentage (default: from config)
- `--fix` - Attempt to fix validation issues
- `--strict` - Enable strict validation mode
- `--report` - Generate detailed validation report

**Examples:**

```bash
# Basic validation
tddai validate

# Custom coverage threshold
tddai validate --coverage-threshold 90

# Strict mode (fails on warnings)
tddai validate --strict

# Auto-fix issues
tddai validate --fix

# Detailed report
tddai validate --report
```

**What it does:**

1. Validates configuration schema
2. Checks test coverage
3. Verifies test files exist for source files
4. Reports issues and warnings

**Output (Success):**

```
Validating project...

✔ Configuration valid
✔ Coverage: 87% (target: 85%)
✔ All source files have tests
✔ No issues found

Project validation passed!
```

**Output (Issues):**

```
Validating project...

✔ Configuration valid
✗ Coverage: 78% (target: 85%) - Below threshold
⚠ Missing tests:
  - src/new-feature.ts
  - src/utils/helper.ts

2 issues found, 1 warning

Run with --fix to attempt automatic fixes
```

---

### `tddai config`

View or update configuration.

**Usage:**

```bash
tddai config <command> [options]
```

**Commands:**

- `list` - Display current configuration
- `get <key>` - Get configuration value
- `set <key> <value>` - Set configuration value
- `reset` - Reset to default configuration

**Examples:**

```bash
# View all configuration
tddai config list

# Get specific value
tddai config get framework
tddai config get generation.coverageTarget

# Set values
tddai config set framework jest
tddai config set testDir __tests__
tddai config set generation.coverageTarget 90

# Reset configuration
tddai config reset
```

**Output (list):**

```
Current Configuration (.tddai/config.json)

version: 1
framework: vitest
testDir: tests
testPattern: **/*.test.ts
sourceDir: src
plugins: []

generation:
  coverageTarget: 85
  includeEdgeCases: true
  mockExternal: true

watch:
  debounce: 300
  ignore: ["node_modules/**", "dist/**"]
```

**Output (get):**

```bash
$ tddai config get framework
vitest

$ tddai config get generation.coverageTarget
85
```

**Output (set):**

```bash
$ tddai config set framework jest
✔ Updated framework: vitest → jest
✔ Configuration saved

$ tddai config set generation.coverageTarget 90
✔ Updated generation.coverageTarget: 85 → 90
✔ Configuration saved
```

---

## Global Options

Available for all commands:

- `--version` - Display CLI version
- `--help` - Display help information
- `--verbose` - Enable verbose logging
- `--quiet` - Suppress output except errors
- `--cwd <path>` - Set working directory

**Examples:**

```bash
# Show version
tddai --version

# Show help for command
tddai generate --help

# Verbose mode
tddai generate src/ --verbose

# Quiet mode
tddai validate --quiet

# Custom working directory
tddai init --cwd /path/to/project
```

## Configuration File

The CLI reads from `.tddai/config.json`:

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
    "mockExternal": true,
    "typescript": {
      "strict": true
    }
  },
  "watch": {
    "debounce": 300,
    "ignore": ["node_modules/**", "dist/**"]
  }
}
```

See [configuration documentation](../../docs/configuration.md) for complete reference.

## Integration with CI/CD

### GitHub Actions

```yaml
name: Test Generation

on: [push, pull_request]

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g @tddai/cli
      - run: tddai init --force
      - run: tddai generate src/ --dry-run
      - run: tddai validate --strict
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Generate tests for staged files
git diff --cached --name-only --diff-filter=AM | grep '\.ts$' | xargs tddai generate

# Validate
tddai validate --strict
```

### npm Scripts

```json
{
  "scripts": {
    "tdd:init": "tddai init",
    "tdd:generate": "tddai generate src/",
    "tdd:watch": "tddai watch src/",
    "tdd:validate": "tddai validate --strict",
    "pretest": "tddai validate"
  }
}
```

## Programmatic Usage

You can use the CLI programmatically in Node.js:

```typescript
import { Command } from '@tddai/cli';

const program = new Command();

// Run command
await program.parseAsync(['generate', 'src/calculator.ts'], {
  from: 'node'
});

// Or use individual command handlers
import { generateCommand } from '@tddai/cli/commands';

await generateCommand(['src/'], {
  dryRun: false,
  force: false
});
```

## Environment Variables

Configure CLI behavior via environment variables:

- `TDDAI_CONFIG` - Path to configuration file
- `TDDAI_LOG_LEVEL` - Logging level (debug|info|warn|error)
- `TDDAI_NO_COLOR` - Disable colored output
- `TDDAI_CACHE_DIR` - Cache directory path

**Examples:**

```bash
# Custom config path
TDDAI_CONFIG=/path/to/config.json tddai generate src/

# Debug logging
TDDAI_LOG_LEVEL=debug tddai generate src/ --verbose

# Disable colors
TDDAI_NO_COLOR=1 tddai validate
```

## Troubleshooting

### Command Not Found

```bash
tddai: command not found
```

**Solution:** Install globally or use npx:

```bash
npm install -g @tddai/cli
# or
npx @tddai/cli init
```

### Permission Denied

```bash
Error: EACCES: permission denied
```

**Solution:** Use npm with proper permissions or install locally:

```bash
npm install -g @tddai/cli --unsafe-perm
# or
npm install --save-dev @tddai/cli
```

### Configuration Not Found

```bash
Error: No configuration file found
```

**Solution:** Initialize configuration:

```bash
tddai init
```

### Framework Detection Failed

```bash
Warning: Could not detect testing framework
```

**Solution:** Specify framework manually:

```bash
tddai init --framework vitest
```

### Tests Not Generating

```bash
Error: No tests generated
```

**Solution:** Check file patterns and permissions:

```bash
# Verify files match pattern
tddai generate --pattern "src/**/*.ts" --dry-run

# Check permissions
ls -la .tddai/config.json
```

## Development

### Build CLI

```bash
cd packages/cli
pnpm build
```

### Link for Local Development

```bash
npm link
```

### Run Tests

```bash
pnpm test
pnpm test:watch
```

### Debug Commands

```bash
# Enable debug logging
DEBUG=tddai:* tddai generate src/

# Use Node inspector
node --inspect-brk ./dist/index.js generate src/
```

## Package Structure

```
@tddai/cli/
├── src/
│   ├── commands/          # Command implementations
│   │   ├── init.ts
│   │   ├── generate.ts
│   │   ├── validate.ts
│   │   ├── config.ts
│   │   ├── watch.ts
│   │   └── index.ts
│   ├── utils/             # Utilities
│   │   ├── logger.ts
│   │   └── format.ts
│   ├── cli.ts             # CLI setup
│   └── index.ts           # Entry point
├── tests/                 # Command tests
├── bin/
│   └── tddai.js          # Executable
└── package.json
```

## Dependencies

- **commander**: CLI framework
- **@tddai/core**: Core library
- **chalk**: Terminal colors
- **ora**: Spinners
- **inquirer**: Interactive prompts (optional)

## Related Documentation

- **[Core API](../core/README.md)** - Underlying library documentation
- **[Full CLI Reference](../../docs/tddai/CLI.md)** - Complete command documentation
- **[Configuration Guide](../../docs/configuration.md)** - Configuration options
- **[Examples](../../examples/)** - Usage examples

## Support

- **GitHub Issues**: [Report issues](https://github.com/tddai/tddai/issues)
- **Documentation**: [Full docs](../../docs/tddai/)

## License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**@tddai/cli** - Test-Driven Development automation at your fingertips
