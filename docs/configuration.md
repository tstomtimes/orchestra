# Configuration Guide

This guide covers all configuration options available in TDD.ai, including schema definitions, examples, and best practices.

## Configuration File Location

TDD.ai looks for configuration in the following order:

1. `.tddai/config.json` (project root, recommended)
2. `tddai.config.json` (project root, alternative)
3. `package.json` (under `"tddai"` key)

**Recommended**: Use `.tddai/config.json` for clarity and separation of concerns.

## Creating Configuration

### Automatic Initialization

```bash
tddai init
```

This creates `.tddai/config.json` with defaults based on your project structure.

### Manual Creation

Create `.tddai/config.json`:

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

## Configuration Schema

### Complete Schema

```typescript
{
  framework: 'vitest' | 'jest' | 'mocha' | 'jasmine';
  testDir: string;
  testPattern: string;
  sourceDir?: string;
  plugins: string[];
  generation: {
    coverageTarget: number;        // 0-100
    includeEdgeCases: boolean;
    mockExternal: boolean;
    templatePath?: string;
    aiProvider?: 'claude' | 'openai' | 'local';
  };
  watch?: {
    enabled: boolean;
    debounce: number;              // milliseconds
    ignore: string[];
  };
  validation?: {
    strict: boolean;
    minCoverage: number;           // 0-100
    failOnWarnings: boolean;
  };
}
```

## Configuration Options

### Core Options

#### `framework`

**Type**: `'vitest' | 'jest' | 'mocha' | 'jasmine'`

**Default**: `'vitest'`

**Description**: Test framework to use for test generation and execution.

**Example**:

```json
{
  "framework": "jest"
}
```

**Notes**:
- Must be installed in your project
- Affects test file syntax and imports
- Plugin selection depends on framework compatibility

---

#### `testDir`

**Type**: `string`

**Default**: `'tests'`

**Description**: Directory where generated tests are written.

**Example**:

```json
{
  "testDir": "src/__tests__"
}
```

**Notes**:
- Path relative to project root
- Created automatically if doesn't exist
- Can mirror source structure (see `testPattern`)

---

#### `testPattern`

**Type**: `string` (glob pattern)

**Default**: `'**/*.test.ts'`

**Description**: Glob pattern for test file naming.

**Examples**:

```json
{
  "testPattern": "**/*.spec.ts"
}
```

```json
{
  "testPattern": "**/__tests__/*.test.ts"
}
```

**Notes**:
- Uses glob syntax
- `**` matches any directory depth
- `*` matches any filename characters

---

#### `sourceDir`

**Type**: `string` (optional)

**Default**: `'src'`

**Description**: Source code directory to watch/analyze.

**Example**:

```json
{
  "sourceDir": "lib"
}
```

---

#### `plugins`

**Type**: `string[]`

**Default**: `[]`

**Description**: List of plugin packages to load.

**Example**:

```json
{
  "plugins": [
    "@tddai/plugin-react",
    "@tddai/plugin-vue",
    "@myorg/custom-plugin"
  ]
}
```

**Notes**:
- Plugins must be installed (`npm install @tddai/plugin-react`)
- Loaded in order specified
- Custom plugins supported (see [Plugin Development](plugin-development.md))

---

### Generation Options

#### `generation.coverageTarget`

**Type**: `number` (0-100)

**Default**: `85`

**Description**: Target code coverage percentage for generated tests.

**Example**:

```json
{
  "generation": {
    "coverageTarget": 90
  }
}
```

**Notes**:
- Higher values generate more comprehensive tests
- 100% may be impractical for all code
- Affects test case count and assertion depth

---

#### `generation.includeEdgeCases`

**Type**: `boolean`

**Default**: `true`

**Description**: Include edge case testing (null, undefined, empty arrays, etc.).

**Example**:

```json
{
  "generation": {
    "includeEdgeCases": true
  }
}
```

**Notes**:
- Recommended for production code
- Increases test file size
- Catches boundary condition bugs

---

#### `generation.mockExternal`

**Type**: `boolean`

**Default**: `true`

**Description**: Automatically mock external dependencies (API calls, database, etc.).

**Example**:

```json
{
  "generation": {
    "mockExternal": false
  }
}
```

**Notes**:
- Set to `false` for integration testing style
- `true` for isolated unit tests
- Framework-specific mocking syntax used

---

#### `generation.templatePath`

**Type**: `string` (optional)

**Default**: Built-in templates

**Description**: Path to custom test templates.

**Example**:

```json
{
  "generation": {
    "templatePath": "./test-templates"
  }
}
```

**Template Structure**:

```
test-templates/
├── unit.hbs
├── integration.hbs
└── helpers.js
```

---

#### `generation.aiProvider`

**Type**: `'claude' | 'openai' | 'local'` (optional)

**Default**: None (Phase 2 feature)

**Description**: AI provider for intelligent test generation.

**Example**:

```json
{
  "generation": {
    "aiProvider": "claude"
  }
}
```

---

### Watch Options

#### `watch.enabled`

**Type**: `boolean`

**Default**: `false`

**Description**: Enable watch mode by default.

**Example**:

```json
{
  "watch": {
    "enabled": true
  }
}
```

---

#### `watch.debounce`

**Type**: `number` (milliseconds)

**Default**: `300`

**Description**: Delay before regenerating tests after file change.

**Example**:

```json
{
  "watch": {
    "debounce": 500
  }
}
```

**Notes**:
- Prevents excessive regeneration during typing
- Lower = faster feedback, higher = fewer regenerations

---

#### `watch.ignore`

**Type**: `string[]` (glob patterns)

**Default**: `['node_modules/**', '**/*.test.ts']`

**Description**: Patterns to ignore in watch mode.

**Example**:

```json
{
  "watch": {
    "ignore": [
      "node_modules/**",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/*.mock.ts"
    ]
  }
}
```

---

### Validation Options

#### `validation.strict`

**Type**: `boolean`

**Default**: `false`

**Description**: Fail on any validation warnings.

**Example**:

```json
{
  "validation": {
    "strict": true
  }
}
```

---

#### `validation.minCoverage`

**Type**: `number` (0-100)

**Default**: `85`

**Description**: Minimum coverage required to pass validation.

**Example**:

```json
{
  "validation": {
    "minCoverage": 90
  }
}
```

---

#### `validation.failOnWarnings`

**Type**: `boolean`

**Default**: `false`

**Description**: Treat validation warnings as errors.

**Example**:

```json
{
  "validation": {
    "failOnWarnings": true
  }
}
```

---

## Configuration Examples

### Minimal Configuration

Smallest valid config (uses all defaults):

```json
{
  "framework": "vitest"
}
```

---

### Standard TypeScript Project

Typical setup for TS project with Jest:

```json
{
  "framework": "jest",
  "testDir": "tests",
  "testPattern": "**/*.test.ts",
  "sourceDir": "src",
  "generation": {
    "coverageTarget": 85,
    "includeEdgeCases": true,
    "mockExternal": true
  }
}
```

---

### React Application

Configuration for React app with Vitest:

```json
{
  "framework": "vitest",
  "testDir": "src/__tests__",
  "testPattern": "**/*.test.tsx",
  "sourceDir": "src",
  "plugins": ["@tddai/plugin-react"],
  "generation": {
    "coverageTarget": 80,
    "includeEdgeCases": true,
    "mockExternal": true
  },
  "watch": {
    "enabled": true,
    "debounce": 300,
    "ignore": ["**/*.stories.tsx", "**/*.mock.ts"]
  }
}
```

---

### Monorepo Package

Configuration for package in monorepo:

```json
{
  "framework": "vitest",
  "testDir": "tests",
  "testPattern": "**/*.test.ts",
  "sourceDir": "src",
  "generation": {
    "coverageTarget": 90,
    "includeEdgeCases": true,
    "mockExternal": false
  },
  "validation": {
    "strict": true,
    "minCoverage": 85,
    "failOnWarnings": true
  }
}
```

---

### High Coverage Requirements

Configuration for critical code requiring high coverage:

```json
{
  "framework": "vitest",
  "testDir": "tests",
  "testPattern": "**/*.test.ts",
  "generation": {
    "coverageTarget": 95,
    "includeEdgeCases": true,
    "mockExternal": true
  },
  "validation": {
    "strict": true,
    "minCoverage": 90,
    "failOnWarnings": true
  }
}
```

---

### JavaScript Project (No TypeScript)

Configuration for plain JavaScript:

```json
{
  "framework": "jest",
  "testDir": "tests",
  "testPattern": "**/*.test.js",
  "sourceDir": "src",
  "generation": {
    "coverageTarget": 80,
    "includeEdgeCases": true
  }
}
```

---

## Environment Variables

### `TDDAI_CONFIG`

Override config file location:

```bash
TDDAI_CONFIG=/path/to/config.json tddai generate src/file.ts
```

---

### `DEBUG`

Enable debug logging:

```bash
DEBUG=tddai:* tddai generate src/file.ts
```

Debug namespaces:
- `tddai:config` - Configuration loading
- `tddai:plugin` - Plugin discovery and execution
- `tddai:generate` - Test generation process
- `tddai:watch` - Watch mode events

---

### `TDDAI_PLUGIN_PATH`

Additional plugin search paths:

```bash
TDDAI_PLUGIN_PATH=/custom/plugins tddai generate src/file.ts
```

---

## CLI Argument Overrides

CLI arguments override config file values:

```bash
# Override framework
tddai generate src/file.ts --framework jest

# Override coverage target
tddai generate src/file.ts --coverage 90

# Override test directory
tddai generate src/file.ts --test-dir tests/__tests__
```

**Precedence Order** (highest to lowest):
1. CLI arguments
2. Environment variables
3. Config file (`.tddai/config.json`)
4. Default values

---

## Configuration Validation

TDD.ai validates configuration at runtime using Zod schemas.

### Validation Errors

**Invalid framework**:

```json
{
  "framework": "unknown"
}
```

```
Error: Invalid config: framework must be one of [vitest, jest, mocha, jasmine]
```

**Invalid coverage target**:

```json
{
  "generation": {
    "coverageTarget": 150
  }
}
```

```
Error: Invalid config: coverageTarget must be between 0 and 100
```

---

## Configuration in package.json

Alternative: embed config in `package.json`:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "tddai": {
    "framework": "vitest",
    "testDir": "tests",
    "generation": {
      "coverageTarget": 85
    }
  }
}
```

**Note**: `.tddai/config.json` takes precedence over `package.json`.

---

## Best Practices

### 1. Version Control

**Commit** `.tddai/config.json` to git for consistent team settings.

**Ignore** `.tddai/local.json` for developer-specific overrides.

---

### 2. Environment-Specific Configs

Use different configs for CI vs local development:

```bash
# Local development (watch mode enabled)
tddai generate --config .tddai/config.local.json

# CI (strict validation)
tddai validate --config .tddai/config.ci.json
```

---

### 3. Progressive Coverage

Start with lower coverage targets, increase gradually:

```json
{
  "generation": {
    "coverageTarget": 70  // Start here
  }
}
```

After team adopts TDD:

```json
{
  "generation": {
    "coverageTarget": 85  // Increase
  }
}
```

---

### 4. Plugin Order Matters

Plugins execute in order. Place general plugins before specific:

```json
{
  "plugins": [
    "@tddai/plugin-base",      // General test generation
    "@tddai/plugin-react",     // React-specific enhancements
    "@myorg/custom-assertions" // Custom project rules
  ]
}
```

---

## Troubleshooting

### Config Not Found

**Error**: `Error: Config file not found`

**Solution**:
```bash
# Initialize config
tddai init

# Or specify location
tddai generate --config /path/to/config.json
```

---

### Plugin Not Loading

**Error**: `Warning: Plugin @tddai/plugin-react not found`

**Solution**:
```bash
# Install plugin
npm install @tddai/plugin-react

# Verify installation
npm list @tddai/plugin-react
```

---

### Invalid Config Schema

**Error**: `Error: Invalid config: ...`

**Solution**:
```bash
# Validate config manually
tddai config validate

# View current config
tddai config list
```

---

## Related Documentation

- [Getting Started](getting-started.md) - Initial setup
- [Plugin Development](plugin-development.md) - Creating custom plugins
- [Architecture](architecture/ARCHITECTURE.md) - System design

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-03
**Next Review**: After Phase 2 (AI integration)
