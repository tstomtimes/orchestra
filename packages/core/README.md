# @tddai/core

> Core library for TDD.ai - Project detection, configuration management, file operations, and plugin system

The `@tddai/core` package provides the foundational services and types for TDD.ai. It handles project analysis, configuration loading, atomic file operations, and the plugin system infrastructure.

## Installation

```bash
npm install @tddai/core
```

## Overview

@tddai/core is designed to be used programmatically or as a foundation for CLI tools. It provides:

- **Project Detection**: Automatically detect project type and testing framework
- **Configuration Management**: Load, merge, and validate configuration
- **File System Operations**: Safe, atomic file writes with rollback support
- **Plugin System**: Extensible architecture for custom test generators
- **Type Definitions**: Comprehensive TypeScript types for all operations

## Quick Start

```typescript
import {
  ProjectAnalyzer,
  ConfigLoader,
  TestWriter,
  FileWriter
} from '@tddai/core';

// Analyze project
const analyzer = new ProjectAnalyzer();
const analysis = await analyzer.analyze('/path/to/project');

console.log(`Framework: ${analysis.config.framework}`);
console.log(`Test directory: ${analysis.config.testDir}`);

// Generate a test file
const writer = new TestWriter();
const testContent = await writer.generateTestContent(
  '/path/to/source.ts',
  analysis.config
);

const fileWriter = new FileWriter();
await fileWriter.writeAtomic(
  '/path/to/source.test.ts',
  testContent
);
```

## Core Classes

### ProjectDetector

Detects project type, testing framework, and package manager.

```typescript
import { ProjectDetector } from '@tddai/core';

const detector = new ProjectDetector({ cwd: process.cwd() });

// Generate detection report
const report = await detector.generateReport();

console.log(report.framework);   // 'vitest' | 'jest' | 'mocha' | 'unknown'
console.log(report.packageManager); // 'npm' | 'yarn' | 'pnpm'
console.log(report.typescript);  // true | false
console.log(report.testRunner);  // Framework-specific test runner info
```

**Methods:**

- `generateReport(): Promise<DetectionReport>` - Analyze project and generate comprehensive report
- `detectFramework(): Promise<string>` - Detect testing framework from package.json
- `detectPackageManager(): Promise<string>` - Detect package manager (npm/yarn/pnpm)
- `detectTypeScript(): Promise<boolean>` - Check if project uses TypeScript

**Types:**

```typescript
interface DetectionReport {
  framework: 'vitest' | 'jest' | 'mocha' | 'unknown';
  packageManager: 'npm' | 'yarn' | 'pnpm';
  typescript: boolean;
  projectRoot: string;
  testRunner?: {
    command: string;
    configFile?: string;
  };
}
```

### ConfigLoader

Loads and merges configuration from multiple sources.

```typescript
import { ConfigLoader } from '@tddai/core';

const loader = new ConfigLoader({
  cwd: process.cwd(),
  searchPlaces: [
    '.tddai/config.json',
    '.tddairc',
    'package.json'
  ]
});

// Load configuration
const result = await loader.load();

if (result.config) {
  console.log('Framework:', result.config.framework);
  console.log('Test directory:', result.config.testDir);
}

// Merge with defaults
const config = loader.mergeWithDefaults(result.config);
```

**Methods:**

- `load(): Promise<ConfigLoadResult>` - Load configuration from file system
- `mergeWithDefaults(config): Config` - Merge user config with defaults
- `validate(config): ValidationResult` - Validate configuration schema

**Types:**

```typescript
interface Config {
  version: 1;
  framework: string;
  testDir: string;
  testPattern: string;
  sourceDir: string;
  plugins: string[];
  generation: {
    coverageTarget: number;
    includeEdgeCases: boolean;
    mockExternal: boolean;
    typescript?: {
      strict: boolean;
    };
  };
  watch?: {
    debounce: number;
    ignore: string[];
  };
}

interface ConfigLoadResult {
  config: Config | null;
  filepath: string | null;
  isEmpty: boolean;
}
```

### FileWriter

Provides atomic file operations with rollback support.

```typescript
import { FileWriter } from '@tddai/core';

const writer = new FileWriter({
  encoding: 'utf-8',
  createDirs: true,
  backupOriginal: true
});

// Atomic write (all-or-nothing)
await writer.writeAtomic('/path/to/file.ts', 'content');

// Write with diff preview
const diff = await writer.previewDiff(
  '/path/to/file.ts',
  'new content'
);
console.log(diff.additions, diff.deletions);

// Batch write multiple files
await writer.writeBatch([
  { path: '/path/to/test1.ts', content: 'test 1' },
  { path: '/path/to/test2.ts', content: 'test 2' }
]);
```

**Methods:**

- `writeAtomic(path, content): Promise<FileWriteResult>` - Atomic file write
- `previewDiff(path, newContent): Promise<FileDiff>` - Preview changes before writing
- `writeBatch(files): Promise<FileWriteResult[]>` - Write multiple files atomically
- `backup(path): Promise<string>` - Create backup of existing file

**Types:**

```typescript
interface FileWriteResult {
  path: string;
  success: boolean;
  bytesWritten: number;
  backupPath?: string;
}

interface FileDiff {
  oldContent: string;
  newContent: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}
```

### TestWriter

Generates test file content from source files.

```typescript
import { TestWriter, Config } from '@tddai/core';

const writer = new TestWriter();

const config: Config = {
  framework: 'vitest',
  testDir: 'tests',
  // ... other config options
};

// Generate test content
const testContent = await writer.generateTestContent(
  '/path/to/calculator.ts',
  config
);

// Write test file
const testPath = writer.getTestPath('/path/to/calculator.ts', config);
await fileWriter.writeAtomic(testPath, testContent);
```

**Methods:**

- `generateTestContent(sourcePath, config): Promise<string>` - Generate test file content
- `getTestPath(sourcePath, config): string` - Calculate test file path from source path
- `generateSuite(sourceFile, config): Promise<TestSuite>` - Generate structured test suite

**Types:**

```typescript
interface TestSuite {
  imports: string[];
  describe: string;
  tests: TestCase[];
}

interface TestCase {
  name: string;
  code: string;
  async: boolean;
}
```

### ProjectAnalyzer

Orchestrates project detection and configuration loading.

```typescript
import { ProjectAnalyzer } from '@tddai/core';

const analyzer = new ProjectAnalyzer({
  cwd: '/path/to/project'
});

// Full project analysis
const analysis = await analyzer.analyze();

console.log('Framework:', analysis.detectionReport.framework);
console.log('Config:', analysis.config);
console.log('Project root:', analysis.projectInfo.root);
```

**Methods:**

- `analyze(): Promise<AnalysisResult>` - Perform complete project analysis
- `detectAndLoad(): Promise<{report, config}>` - Detect framework and load config
- `getProjectInfo(): ProjectInfo` - Get project metadata

**Types:**

```typescript
interface AnalysisResult {
  projectInfo: ProjectInfo;
  detectionReport: DetectionReport;
  config: Config;
  plugins: Plugin[];
}

interface ProjectInfo {
  root: string;
  name: string;
  version: string;
  packageManager: string;
}
```

### PluginManager

Manages plugin lifecycle and execution.

```typescript
import { PluginManager, Plugin } from '@tddai/core';

const manager = new PluginManager();

// Load plugins
await manager.loadPlugins([
  '@tddai/plugin-react',
  './custom-plugin.ts'
]);

// Get loaded plugins
const plugins = manager.getPlugins();

// Execute plugin hook
await manager.executeHook('generate', {
  sourcePath: '/path/to/file.ts',
  config: /* config object */
});
```

**Methods:**

- `loadPlugins(paths): Promise<void>` - Load plugins from paths or npm packages
- `getPlugins(): Plugin[]` - Get all loaded plugins
- `executeHook(name, context): Promise<any>` - Execute plugin hook
- `unloadPlugin(name): void` - Unload a specific plugin

**Types:**

```typescript
interface Plugin {
  name: string;
  version: string;
  generate?(context: PluginContext): Promise<GenerateResult>;
  validate?(context: PluginContext): Promise<ValidationResult>;
  init?(context: PluginContext): Promise<void>;
}

interface PluginContext {
  config: Config;
  projectInfo: ProjectInfo;
  sourcePath?: string;
  logger: Logger;
}
```

## Type Definitions

### Exported Types

```typescript
// Configuration
export type { Config, ConfigV1, ConfigLoadResult, ValidationError };
export { ConfigSchema };

// Plugins
export type { PluginAPI, Plugin, PluginContext, PluginMetadata };

// Detection
export type { ProjectInfo, DetectionReport };

// File System
export type {
  FileSystemOptions,
  FileWriteResult,
  FileDiff,
  AtomicWriteOptions
};

// Commands
export type {
  CommandContext,
  CommandResult,
  InitCommandOptions,
  GenerateCommandOptions,
  ValidateCommandOptions
};

// Errors
export {
  TddaiError,
  ConfigError,
  DetectionError,
  FileSystemError,
  PluginError
};

// Schemas
export type { ConfigSchemaType, ValidationResult };
export { ConfigSchemaV1, validateConfig };
```

## Error Handling

@tddai/core provides custom error classes for different error scenarios:

```typescript
import {
  TddaiError,
  ConfigError,
  DetectionError,
  FileSystemError,
  PluginError
} from '@tddai/core';

try {
  const config = await loader.load();
} catch (error) {
  if (error instanceof ConfigError) {
    console.error('Configuration error:', error.message);
    console.error('Config path:', error.configPath);
  } else if (error instanceof DetectionError) {
    console.error('Detection failed:', error.message);
  } else if (error instanceof FileSystemError) {
    console.error('File operation failed:', error.message);
    console.error('File path:', error.filePath);
  }
}
```

**Error Classes:**

- `TddaiError` - Base error class
- `ConfigError` - Configuration-related errors
- `DetectionError` - Project detection failures
- `FileSystemError` - File operation failures
- `PluginError` - Plugin loading or execution errors

## Schema Validation

@tddai/core uses Zod for runtime configuration validation:

```typescript
import { ConfigSchemaV1, validateConfig } from '@tddai/core';

const userConfig = {
  framework: 'vitest',
  testDir: 'tests',
  // ... other properties
};

// Validate configuration
const result = validateConfig(userConfig);

if (result.success) {
  console.log('Valid configuration');
} else {
  console.error('Validation errors:', result.errors);
}
```

## Examples

### Basic Project Analysis

```typescript
import { ProjectAnalyzer } from '@tddai/core';

async function analyzeProject() {
  const analyzer = new ProjectAnalyzer({ cwd: process.cwd() });
  const analysis = await analyzer.analyze();

  console.log('Project Analysis:');
  console.log('  Name:', analysis.projectInfo.name);
  console.log('  Framework:', analysis.detectionReport.framework);
  console.log('  TypeScript:', analysis.detectionReport.typescript);
  console.log('  Test Directory:', analysis.config.testDir);
  console.log('  Coverage Target:', analysis.config.generation.coverageTarget);
}

analyzeProject().catch(console.error);
```

### Generate Test File

```typescript
import { ProjectAnalyzer, TestWriter, FileWriter } from '@tddai/core';

async function generateTest(sourcePath: string) {
  // Analyze project
  const analyzer = new ProjectAnalyzer();
  const analysis = await analyzer.analyze();

  // Generate test content
  const testWriter = new TestWriter();
  const testContent = await testWriter.generateTestContent(
    sourcePath,
    analysis.config
  );

  // Write test file
  const testPath = testWriter.getTestPath(sourcePath, analysis.config);
  const fileWriter = new FileWriter({ createDirs: true });
  await fileWriter.writeAtomic(testPath, testContent);

  console.log(`Generated test: ${testPath}`);
}

generateTest('src/calculator.ts').catch(console.error);
```

### Custom Plugin

```typescript
import { Plugin, PluginContext } from '@tddai/core';

export const myPlugin: Plugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',

  async generate(context: PluginContext) {
    const { sourcePath, config } = context;

    // Custom test generation logic
    const testContent = `
import { describe, it, expect } from '${config.framework}';
import { myFunction } from '${sourcePath}';

describe('Custom Test', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
`;

    return {
      success: true,
      content: testContent,
      filesGenerated: [testPath]
    };
  },

  async validate(context: PluginContext) {
    // Custom validation logic
    return { valid: true };
  }
};
```

### Batch Test Generation

```typescript
import { ProjectAnalyzer, TestWriter, FileWriter } from '@tddai/core';
import { glob } from 'glob';

async function generateAllTests(pattern: string) {
  const analyzer = new ProjectAnalyzer();
  const analysis = await analyzer.analyze();

  const sourceFiles = await glob(pattern);
  const testWriter = new TestWriter();
  const fileWriter = new FileWriter({ createDirs: true });

  const results = [];

  for (const sourceFile of sourceFiles) {
    const testContent = await testWriter.generateTestContent(
      sourceFile,
      analysis.config
    );
    const testPath = testWriter.getTestPath(sourceFile, analysis.config);
    const result = await fileWriter.writeAtomic(testPath, testContent);
    results.push(result);
  }

  console.log(`Generated ${results.length} test files`);
  return results;
}

generateAllTests('src/**/*.ts').catch(console.error);
```

## Development

### Building

```bash
# Build package
pnpm build

# Watch mode
pnpm build --watch
```

### Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:ci
```

### Type Checking

```bash
# Check types
pnpm typecheck
```

## Package Structure

```
@tddai/core/
├── src/
│   ├── types/           # TypeScript type definitions
│   │   ├── config.ts
│   │   ├── detection.ts
│   │   ├── file-system.ts
│   │   ├── plugin.ts
│   │   └── index.ts
│   ├── detection/       # Project detection
│   │   ├── project-detector.ts
│   │   └── framework-detector.ts
│   ├── config/          # Configuration management
│   │   ├── loader.ts
│   │   ├── merger.ts
│   │   └── validator.ts
│   ├── fs/              # File system operations
│   │   ├── file-writer.ts
│   │   └── atomic-writer.ts
│   ├── integration/     # Orchestration
│   │   ├── project-analyzer.ts
│   │   └── test-writer.ts
│   ├── plugins/         # Plugin system
│   │   ├── plugin-manager.ts
│   │   ├── plugin-loader.ts
│   │   └── plugin-context.ts
│   └── utils/           # Utilities
│       └── logger.ts
├── tests/               # Test files
└── package.json
```

## Dependencies

- **zod**: Schema validation
- **cosmiconfig**: Configuration file loading
- **typescript**: Type checking and compilation

## API Stability

@tddai/core follows semantic versioning:

- **Major version** (1.x.x → 2.x.x): Breaking API changes
- **Minor version** (x.1.x → x.2.x): New features, backward compatible
- **Patch version** (x.x.1 → x.x.2): Bug fixes

## Related Packages

- **[@tddai/cli](../cli/README.md)** - Command-line interface built on @tddai/core
- **[@tddai/plugin-react](../plugin-react/README.md)** - React test generation plugin

## Documentation

- **[Full API Reference](../../docs/tddai/API.md)** - Complete API documentation
- **[Architecture Guide](../../docs/tddai/ARCHITECTURE.md)** - System design overview
- **[Plugin Development](../../docs/plugin-development.md)** - Create custom plugins

## Support

- **GitHub Issues**: [Report issues](https://github.com/tddai/tddai/issues)
- **Documentation**: [Full docs](../../docs/tddai/)

## License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**@tddai/core** - The foundation of intelligent test automation
