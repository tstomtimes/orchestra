# Example: Validate Configuration

> Validate project configuration and test coverage

## Quick Start

```bash
# Basic validation
tddai validate

# With custom threshold
tddai validate --coverage-threshold 90

# Strict mode
tddai validate --strict

# Auto-fix issues
tddai validate --fix
```

## What Gets Validated

1. **Configuration Schema** - Ensures .tddai/config.json is valid
2. **Test Coverage** - Checks if coverage meets threshold
3. **Missing Tests** - Identifies source files without tests
4. **Framework Compatibility** - Verifies framework is supported

## Example Output (Success)

```
Validating project...

✔ Configuration valid
✔ Coverage: 87% (target: 85%)
✔ All source files have tests
✔ No issues found

Project validation passed!
```

## Example Output (Issues)

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

## Learn More

See full [CLI Reference](../../../docs/tddai/CLI.md#validate-command) for all options.
