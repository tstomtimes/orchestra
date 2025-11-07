# Example: Watch Mode

> Monitor files and auto-generate tests on changes

## Quick Start

```bash
# Watch src directory
tddai watch src/

# Custom debounce
tddai watch src/ --debounce 500

# Watch specific pattern
tddai watch --pattern "src/**/*.tsx"

# Ignore files
tddai watch src/ --ignore "**/test-utils.ts"
```

## How It Works

1. TDD.ai monitors specified directory
2. Detects file changes (create, modify, delete)
3. Waits for debounce period (default 300ms)
4. Regenerates corresponding test files

## Example Session

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

## Configuration

Add to `.tddai/config.json`:

```json
{
  "watch": {
    "debounce": 300,
    "ignore": [
      "node_modules/**",
      "dist/**",
      "*.config.js"
    ]
  }
}
```

## Learn More

See full [CLI Reference](../../../docs/tddai/CLI.md#watch-command) for all options.
