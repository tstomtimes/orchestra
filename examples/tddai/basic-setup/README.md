# Example: Basic Setup

> Learn how to initialize TDD.ai in a new project

This example demonstrates the fundamental setup process for TDD.ai, including installation, initialization, and configuration.

## What You'll Learn

- Installing TDD.ai globally or locally
- Initializing configuration with `tddai init`
- Understanding the generated configuration file
- Customizing settings for your project

## Prerequisites

- Node.js >= 20.0.0
- pnpm, npm, or yarn
- A JavaScript/TypeScript project (or create one)

## Step-by-Step Guide

### Step 1: Create a New Project (Optional)

If you don't have an existing project:

```bash
mkdir my-tdd-project
cd my-tdd-project
npm init -y
```

Install a test framework:

```bash
npm install --save-dev vitest
```

### Step 2: Install TDD.ai

**Global installation:**

```bash
npm install -g @tddai/cli
```

**Or local installation:**

```bash
npm install --save-dev @tddai/cli
```

Verify installation:

```bash
tddai --version
```

**Expected output:**
```
@tddai/cli v1.1.0
```

### Step 3: Initialize TDD.ai

Run the initialization command:

```bash
tddai init
```

**What happens:**

1. TDD.ai detects your project structure
2. Identifies your testing framework
3. Creates `.tddai/config.json` with defaults
4. Validates the configuration

**Expected output:**

```
Initializing TDD.ai...

✔ Detected project type: Node.js TypeScript
✔ Detected testing framework: vitest
✔ Detected package manager: npm

Creating configuration...
✔ Created .tddai/config.json

Configuration Summary:
  Framework: vitest
  Test Directory: tests
  Source Directory: src
  Coverage Target: 85%

✔ Initialization complete!

Next steps:
  1. Review configuration: .tddai/config.json
  2. Generate tests: tddai generate src/
  3. Start watch mode: tddai watch src/
```

### Step 4: Review Configuration

Open `.tddai/config.json`:

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
    "ignore": [
      "node_modules/**",
      "dist/**",
      "build/**"
    ]
  }
}
```

**Key configuration options:**

- `framework`: Testing framework (auto-detected)
- `testDir`: Where test files are written
- `sourceDir`: Where source files are located
- `generation.coverageTarget`: Target code coverage percentage
- `watch.debounce`: Delay before regenerating tests (ms)

### Step 5: Customize Configuration (Optional)

Customize using the `config` command:

```bash
# Change test directory
tddai config set testDir __tests__

# Increase coverage target
tddai config set generation.coverageTarget 90

# Add ignored patterns
tddai config set watch.ignore '["node_modules/**", "*.config.js"]'
```

Or edit `.tddai/config.json` directly.

### Step 6: Validate Configuration

Ensure configuration is valid:

```bash
tddai validate
```

**Expected output:**

```
Validating configuration...

✔ Configuration schema valid
✔ Framework supported: vitest
✔ Test directory exists: tests/
✔ Source directory exists: src/

✔ Validation passed!
```

## Configuration Options Explained

### Framework Detection

TDD.ai detects your framework by analyzing `package.json`:

- **Vitest**: If `vitest` is in dependencies
- **Jest**: If `jest` is in dependencies
- **Mocha**: If `mocha` is in dependencies

To override detection:

```bash
tddai init --framework jest
```

### Test Directory

By default, TDD.ai uses `tests/`. Common alternatives:

- `__tests__/` (Jest convention)
- `test/` (Node.js convention)
- `src/__tests__/` (colocated tests)

Set during initialization:

```bash
tddai init --test-dir __tests__
```

### Coverage Target

Default is 85%. Adjust based on project needs:

- **80-85%**: Good starting point
- **85-90%**: Recommended for production code
- **90-95%**: High-quality, critical systems
- **95-100%**: Exceptional cases only

Set during initialization:

```bash
tddai init --coverage 90
```

## Advanced Initialization

### Force Overwrite

Reinitialize existing configuration:

```bash
tddai init --force
```

**Warning:** This overwrites your existing `.tddai/config.json`.

### Specify All Options

```bash
tddai init \
  --framework vitest \
  --test-dir __tests__ \
  --coverage 90 \
  --force
```

### Custom Configuration Path

Use environment variable:

```bash
TDDAI_CONFIG=/path/to/custom/config.json tddai init
```

## Project Structure After Setup

```
my-tdd-project/
├── .tddai/
│   └── config.json       # TDD.ai configuration
├── src/                  # Source files
│   └── (your code)
├── tests/                # Generated test files
│   └── (auto-generated)
├── node_modules/
├── package.json
└── README.md
```

## Common Setup Scenarios

### Scenario 1: Existing Jest Project

```bash
cd existing-jest-project
tddai init
# Auto-detects Jest, uses existing test directory
```

### Scenario 2: New Vitest Project

```bash
mkdir new-project
cd new-project
npm init -y
npm install --save-dev vitest
tddai init
```

### Scenario 3: Monorepo

```bash
# Initialize in each package
cd packages/package-a
tddai init --test-dir ../../tests/package-a

cd ../package-b
tddai init --test-dir ../../tests/package-b
```

### Scenario 4: TypeScript Strict Mode

```bash
tddai init
# Edit .tddai/config.json
# Set generation.typescript.strict: true
```

## Troubleshooting

### Issue: Framework Not Detected

**Problem:**
```
Warning: Could not auto-detect testing framework
```

**Solution:**

Specify framework manually:

```bash
tddai init --framework vitest
```

Or ensure framework is in `package.json`:

```bash
npm install --save-dev vitest
tddai init
```

### Issue: Permission Denied

**Problem:**
```
Error: EACCES: permission denied, mkdir '.tddai'
```

**Solution:**

Check directory permissions:

```bash
ls -la
chmod u+w .
tddai init
```

### Issue: Configuration Already Exists

**Problem:**
```
Error: Configuration already exists at .tddai/config.json
```

**Solution:**

Use `--force` to overwrite:

```bash
tddai init --force
```

Or manually remove the file:

```bash
rm -rf .tddai
tddai init
```

## Next Steps

Now that TDD.ai is initialized:

1. **[Generate Tests](../generate-tests/)** - Create your first test files
2. **[Watch Mode](../watch-mode/)** - Enable automatic test regeneration
3. **[Validate Config](../validate-config/)** - Verify your setup

## Additional Resources

- **[Configuration Guide](../../../docs/configuration.md)** - Complete configuration reference
- **[CLI Reference](../../../docs/tddai/CLI.md)** - All CLI commands
- **[Getting Started](../../../docs/getting-started.md)** - Comprehensive guide

## Summary

You learned:

✅ How to install TDD.ai globally or locally
✅ How to initialize configuration with `tddai init`
✅ How to customize configuration settings
✅ How to validate your setup
✅ Common setup scenarios and troubleshooting

**Ready for the next example?** → [Generate Tests](../generate-tests/)
