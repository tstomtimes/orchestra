# Getting Started with TDD.ai

This guide will walk you through installing TDD.ai, configuring your first project, and running your first test generation workflow.

## System Requirements

### Required

- **Node.js**: >= 20.0.0
- **Package Manager**: npm, yarn, or pnpm (pnpm recommended for development)

### Supported Operating Systems

- macOS (Intel and Apple Silicon)
- Linux (Ubuntu 20.04+, Debian 11+, other major distributions)
- Windows 10/11 (via WSL2 recommended)

### Supported Test Frameworks

- Vitest (recommended)
- Jest
- Mocha (coming soon)
- Jasmine (coming soon)

## Installation

### Global Installation (Recommended)

Install TDD.ai globally to use it across all your projects:

```bash
npm install -g @tddai/cli
```

Verify installation:

```bash
tddai --version
```

### Local Development Installation

For contributing or local development:

```bash
# Clone the repository
git clone https://github.com/tddai/tddai.git
cd tddai

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Link CLI for local testing
cd packages/cli
npm link
```

Verify local build:

```bash
tddai --version
```

### Project-Local Installation

Install as a dev dependency in your project:

```bash
npm install --save-dev @tddai/cli
```

Run via npx:

```bash
npx tddai init
```

## Your First 5 Minutes with TDD.ai

### Step 1: Initialize Configuration

Navigate to your project directory and run:

```bash
cd your-project/
tddai init
```

You'll be prompted to select your test framework:

```
? Which test framework are you using? (Use arrow keys)
❯ Vitest
  Jest
  Mocha
```

This creates `.tddai/config.json`:

```json
{
  "framework": "vitest",
  "testDir": "tests",
  "testPattern": "**/*.test.ts",
  "plugins": [],
  "generation": {
    "coverageTarget": 85,
    "includeEdgeCases": true,
    "mockExternal": true
  }
}
```

### Step 2: Generate Your First Test

Create a simple source file or use an existing one:

```typescript
// src/calculator.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
```

Generate tests:

```bash
tddai generate src/calculator.ts
```

Expected output:

```
✓ Analyzing src/calculator.ts
✓ Generated tests/calculator.test.ts
✓ 2 test cases created
```

### Step 3: Verify Generated Tests

Check the generated test file:

```bash
cat tests/calculator.test.ts
```

### Step 4: Run Your Tests

```bash
npm test
# or
pnpm test
```

### Step 5: Enable Watch Mode

For continuous test generation as you code:

```bash
tddai watch src/
```

Now, when you modify `src/calculator.ts`, tests will automatically regenerate.

## Common Commands

### Initialize Project

```bash
tddai init [options]

Options:
  --framework <name>  Test framework (vitest|jest|mocha)
  --force            Overwrite existing config
```

### Generate Tests

```bash
tddai generate <path> [options]

Arguments:
  <path>              File or directory to generate tests for

Options:
  --coverage <n>      Target coverage percentage (default: 85)
  --force            Overwrite existing tests
  --dry-run          Preview without writing files
```

Examples:

```bash
# Single file
tddai generate src/utils/parser.ts

# Entire directory
tddai generate src/components/

# With custom coverage target
tddai generate src/api/ --coverage 90

# Preview without writing
tddai generate src/lib/ --dry-run
```

### Watch Mode

```bash
tddai watch [directory] [options]

Arguments:
  [directory]         Directory to watch (default: src/)

Options:
  --debounce <ms>     Delay before regenerating (default: 300)
  --ignore <pattern>  Ignore patterns (can be repeated)
```

Examples:

```bash
# Watch default src/ directory
tddai watch

# Watch specific directory
tddai watch src/components/

# With custom debounce
tddai watch src/ --debounce 500

# Ignore specific patterns
tddai watch src/ --ignore "*.spec.ts" --ignore "*.mock.ts"
```

### Validate Tests

```bash
tddai validate [options]

Options:
  --coverage-threshold <n>  Minimum coverage (default: 85)
  --strict                  Fail on any missing tests
```

### Configuration Management

```bash
# List current configuration
tddai config list

# Get specific value
tddai config get framework

# Set value
tddai config set framework jest

# Reset to defaults
tddai config reset
```

## Troubleshooting

### "tddai: command not found"

**Cause**: CLI not in PATH after global installation.

**Solution**:

```bash
# Verify npm global bin path
npm config get prefix

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$(npm config get prefix)/bin"
```

For pnpm:

```bash
# Verify pnpm global bin path
pnpm bin -g

# Add to PATH
export PATH="$PATH:$(pnpm bin -g)"
```

### "Permission denied" Errors

**Cause**: Insufficient permissions for global installation.

**Solution**:

Option 1 - Use npx (no global install):

```bash
npx @tddai/cli init
```

Option 2 - Fix npm permissions:

```bash
# Change npm global directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Config File Not Found

**Cause**: Running commands outside initialized project.

**Solution**:

```bash
# Initialize first
tddai init

# Or specify config location
tddai generate src/file.ts --config /path/to/.tddai/config.json
```

### Tests Not Generating

**Check**:

1. Verify framework is installed:
   ```bash
   npm list vitest
   ```

2. Check config file syntax:
   ```bash
   cat .tddai/config.json | jq .
   ```

3. Run with debug mode:
   ```bash
   DEBUG=tddai:* tddai generate src/file.ts
   ```

### Watch Mode Not Detecting Changes

**Solution**:

Increase system file watcher limit (Linux/macOS):

```bash
# Temporary
sudo sysctl -w fs.inotify.max_user_watches=524288

# Permanent (Linux)
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Next Steps

Now that you have TDD.ai running:

1. **Customize Configuration**: See [Configuration Guide](configuration.md)
2. **Install Plugins**: Explore available plugins for React, Vue, Angular
3. **Learn Plugin Development**: Create custom generators for your needs
4. **Integrate with CI/CD**: Set up automated test generation in your pipeline

## Additional Resources

- [Architecture Overview](architecture/ARCHITECTURE.md)
- [Configuration Reference](configuration.md)
- [Plugin Development Guide](plugin-development.md)
- [API Documentation](https://tddai.dev/api)

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/tddai/tddai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tddai/tddai/discussions)
- **Chat**: [Discord Community](https://discord.gg/tddai)
