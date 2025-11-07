# TDD.ai Examples

> Real-world usage examples demonstrating TDD.ai features and workflows

This directory contains practical examples showing how to use TDD.ai in different scenarios. Each example includes setup instructions, code samples, and expected outputs.

## Available Examples

### 1. [Basic Setup](basic-setup/)

Learn how to initialize TDD.ai in a new project.

**What you'll learn:**
- Installing TDD.ai
- Running `tddai init`
- Understanding the configuration file
- Project structure setup

**Time:** 5 minutes

**Difficulty:** Beginner

---

### 2. [Generate Tests](generate-tests/)

Generate comprehensive test suites from source files.

**What you'll learn:**
- Using `tddai generate` command
- Generating tests for single files
- Batch test generation
- Dry-run mode

**Time:** 10 minutes

**Difficulty:** Beginner

---

### 3. [Validate Config](validate-config/)

Validate project configuration and test coverage.

**What you'll learn:**
- Using `tddai validate` command
- Coverage threshold validation
- Configuration schema validation
- Fixing validation issues

**Time:** 10 minutes

**Difficulty:** Intermediate

---

### 4. [Watch Mode](watch-mode/)

Monitor files and auto-generate tests on changes.

**What you'll learn:**
- Using `tddai watch` command
- Configuring debounce delays
- Ignoring specific files
- Real-time test regeneration

**Time:** 15 minutes

**Difficulty:** Intermediate

---

### 5. [Custom Framework](custom-framework/)

Integrate TDD.ai with custom or less common testing frameworks.

**What you'll learn:**
- Creating custom framework plugins
- Configuring custom test templates
- Advanced plugin development
- Framework-specific configuration

**Time:** 20 minutes

**Difficulty:** Advanced

---

## Quick Start

### Prerequisites

Ensure you have:
- Node.js >= 20.0.0
- pnpm >= 8.0.0 (or npm/yarn)
- Basic TypeScript knowledge

### Running Examples

Each example is self-contained. To run an example:

```bash
# Navigate to example directory
cd examples/tddai/basic-setup

# Follow the README instructions
cat README.md

# Install dependencies (if needed)
pnpm install

# Run example commands
tddai init
```

## Example Structure

Each example follows this structure:

```
example-name/
├── README.md           # Instructions and explanation
├── package.json        # Dependencies (if needed)
├── .tddairc.json      # TDD.ai configuration
├── src/               # Source files (if applicable)
│   └── example.ts
└── tests/             # Expected output (if applicable)
    └── example.test.ts
```

## Learning Path

We recommend following this learning path:

1. **Start here:** [Basic Setup](basic-setup/) - Get familiar with initialization
2. **Next:** [Generate Tests](generate-tests/) - Learn test generation
3. **Then:** [Validate Config](validate-config/) - Understand validation
4. **Advanced:** [Watch Mode](watch-mode/) - Enable automation
5. **Expert:** [Custom Framework](custom-framework/) - Extend TDD.ai

## Common Workflows

### Workflow 1: New Project Setup

```bash
# Initialize TDD.ai
cd my-new-project
tddai init

# Generate tests for existing code
tddai generate src/

# Validate setup
tddai validate
```

### Workflow 2: Continuous Development

```bash
# Start watch mode
tddai watch src/

# Make code changes
# Tests regenerate automatically

# Validate coverage periodically
tddai validate --coverage-threshold 85
```

### Workflow 3: CI/CD Integration

```bash
# In CI pipeline
tddai init --force
tddai generate src/ --dry-run
tddai validate --strict
```

## Tips and Best Practices

### Configuration

- **Start with defaults:** Run `tddai init` to auto-detect your setup
- **Customize gradually:** Modify configuration as needs grow
- **Version control:** Commit `.tddai/config.json` to git

### Test Generation

- **Generate early:** Create tests as you write code
- **Review generated tests:** AI-generated tests need human review
- **Customize templates:** Use plugins for project-specific patterns

### Watch Mode

- **Use in development:** Keep watch running during active development
- **Adjust debounce:** Higher values (500ms+) reduce noise
- **Ignore build artifacts:** Add `dist/`, `build/` to ignore patterns

### Validation

- **Set realistic thresholds:** Start at 80%, increase gradually
- **Run in CI:** Fail builds if validation fails
- **Fix issues promptly:** Use `--fix` flag when available

## Troubleshooting Examples

### Example Not Working?

1. **Check Node version:** `node --version` (should be >= 20.0.0)
2. **Install dependencies:** Run `pnpm install` in example directory
3. **Clean install:** Delete `node_modules` and reinstall
4. **Check permissions:** Ensure you have write access

### Configuration Errors?

1. **Validate schema:** Run `tddai validate`
2. **Check JSON syntax:** Ensure `.tddairc.json` is valid JSON
3. **Reset config:** Run `tddai init --force`

### Tests Not Generating?

1. **Check file patterns:** Verify files match source patterns
2. **Review permissions:** Ensure write access to test directory
3. **Try dry-run:** Use `--dry-run` to preview without writing
4. **Enable verbose logging:** Add `--verbose` flag

## Additional Resources

- **[TDD.ai Documentation](../../docs/tddai/)** - Complete documentation
- **[CLI Reference](../../docs/tddai/CLI.md)** - All commands documented
- **[API Reference](../../docs/tddai/API.md)** - Programmatic usage
- **[Plugin Development](../../docs/plugin-development.md)** - Create plugins

## Contributing Examples

We welcome new examples! To contribute:

1. Create a new directory: `examples/tddai/your-example/`
2. Include:
   - `README.md` with clear instructions
   - Sample code demonstrating the feature
   - Expected outputs
   - Troubleshooting section
3. Test your example thoroughly
4. Submit a PR with your example

**Good example topics:**
- Integration with specific frameworks (Next.js, Remix, etc.)
- Complex project structures (monorepos, multi-package)
- Custom plugins for specific use cases
- CI/CD integration patterns

## Feedback

Found an issue with an example? Have a suggestion?

- **GitHub Issues**: [Report issues](https://github.com/tddai/tddai/issues)
- **GitHub Discussions**: [Suggest improvements](https://github.com/tddai/tddai/discussions)

## License

All examples are provided under MIT License - see [LICENSE](../../LICENSE) for details.

---

**Ready to start?** Jump to [Basic Setup](basic-setup/) to begin your TDD.ai journey!
