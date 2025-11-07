# TDD.ai Core API Reference

> Complete API documentation for @tddai/core

This document provides detailed API documentation for all public classes, interfaces, and functions in the @tddai/core package.

## Table of Contents

- [ProjectDetector](#projectdetector)
- [ConfigLoader](#configloader)
- [FileWriter](#filewriter)
- [TestWriter](#testwriter)
- [ProjectAnalyzer](#projectanalyzer)
- [PluginManager](#pluginmanager)
- [Type Definitions](#type-definitions)
- [Error Classes](#error-classes)

## ProjectDetector

Detects project characteristics including framework, package manager, and TypeScript usage.

### Constructor

```typescript
constructor(options?: ProjectDetectorOptions)
```

**Parameters:**
- `options.cwd?: string` - Working directory (default: `process.cwd()`)

**Example:**
```typescript
const detector = new ProjectDetector({ cwd: '/path/to/project' });
```

### Methods

#### generateReport()

Generate comprehensive detection report.

```typescript
async generateReport(): Promise<DetectionReport>
```

**Returns:** Promise<DetectionReport>

**Example:**
```typescript
const report = await detector.generateReport();
console.log(report.framework);   // 'vitest' | 'jest' | 'mocha'
console.log(report.typescript);  // true | false
```

#### detectFramework()

Detect testing framework from package.json.

```typescript
async detectFramework(): Promise<string>
```

**Returns:** 'vitest' | 'jest' | 'mocha' | 'unknown'

#### detectPackageManager()

Detect package manager from lockfiles.

```typescript
async detectPackageManager(): Promise<string>
```

**Returns:** 'npm' | 'yarn' | 'pnpm'

---

## ConfigLoader

Loads and validates TDD.ai configuration.

### Constructor

```typescript
constructor(options?: ConfigLoaderOptions)
```

**Parameters:**
- `options.cwd?: string` - Working directory
- `options.searchPlaces?: string[]` - Config file search locations

**Example:**
```typescript
const loader = new ConfigLoader({
  cwd: process.cwd(),
  searchPlaces: ['.tddai/config.json', '.tddairc']
});
```

### Methods

#### load()

Load configuration from filesystem.

```typescript
async load(): Promise<ConfigLoadResult>
```

**Returns:** ConfigLoadResult with config, filepath, and isEmpty flag

**Example:**
```typescript
const result = await loader.load();
if (result.config) {
  console.log('Framework:', result.config.framework);
  console.log('Config file:', result.filepath);
}
```

#### mergeWithDefaults()

Merge user config with defaults.

```typescript
mergeWithDefaults(config: Partial<Config>): Config
```

**Example:**
```typescript
const fullConfig = loader.mergeWithDefaults({
  framework: 'vitest'
});
```

---

## FileWriter

Provides atomic file operations with backup support.

### Constructor

```typescript
constructor(options?: FileSystemOptions)
```

**Parameters:**
- `options.encoding?: string` - File encoding (default: 'utf-8')
- `options.createDirs?: boolean` - Auto-create directories (default: true)
- `options.backupOriginal?: boolean` - Backup before overwrite (default: true)

### Methods

#### writeAtomic()

Write file atomically (all-or-nothing).

```typescript
async writeAtomic(path: string, content: string): Promise<FileWriteResult>
```

**Example:**
```typescript
const result = await writer.writeAtomic(
  'tests/example.test.ts',
  testContent
);
console.log('Wrote', result.bytesWritten, 'bytes');
```

#### previewDiff()

Preview changes before writing.

```typescript
async previewDiff(path: string, newContent: string): Promise<FileDiff>
```

**Returns:** FileDiff with additions, deletions, and hunks

---

## TestWriter

Generates test file content from source files.

### Methods

#### generateTestContent()

Generate test file content.

```typescript
async generateTestContent(
  sourcePath: string,
  config: Config
): Promise<string>
```

**Example:**
```typescript
const writer = new TestWriter();
const content = await writer.generateTestContent(
  'src/calculator.ts',
  config
);
```

#### getTestPath()

Calculate test file path from source path.

```typescript
getTestPath(sourcePath: string, config: Config): string
```

**Example:**
```typescript
const testPath = writer.getTestPath('src/utils/math.ts', config);
// Returns: 'tests/utils/math.test.ts'
```

---

## ProjectAnalyzer

Orchestrates project analysis and configuration loading.

### Methods

#### analyze()

Perform complete project analysis.

```typescript
async analyze(): Promise<AnalysisResult>
```

**Returns:** AnalysisResult with detection report, config, and plugins

**Example:**
```typescript
const analyzer = new ProjectAnalyzer({ cwd: process.cwd() });
const analysis = await analyzer.analyze();

console.log('Framework:', analysis.detectionReport.framework);
console.log('Config:', analysis.config);
console.log('Plugins:', analysis.plugins.length);
```

---

## PluginManager

Manages plugin lifecycle and execution.

### Methods

#### loadPlugins()

Load plugins from paths or npm packages.

```typescript
async loadPlugins(paths: string[]): Promise<void>
```

**Example:**
```typescript
const manager = new PluginManager();
await manager.loadPlugins([
  '@tddai/plugin-react',
  './plugins/custom-plugin.ts'
]);
```

#### executeHook()

Execute plugin hook with context.

```typescript
async executeHook(name: string, context: PluginContext): Promise<any>
```

**Example:**
```typescript
const result = await manager.executeHook('generate', {
  sourcePath: 'src/file.ts',
  config: /* config */
});
```

---

## Type Definitions

### Config

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
  };
  watch?: {
    debounce: number;
    ignore: string[];
  };
}
```

### DetectionReport

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

### Plugin

```typescript
interface Plugin {
  name: string;
  version: string;
  generate?(context: PluginContext): Promise<GenerateResult>;
  validate?(context: PluginContext): Promise<ValidationResult>;
  init?(context: PluginContext): Promise<void>;
}
```

---

## Error Classes

### TddaiError

Base error class for all TDD.ai errors.

```typescript
class TddaiError extends Error {
  constructor(message: string, public code?: string) {}
}
```

### ConfigError

Configuration-related errors.

```typescript
class ConfigError extends TddaiError {
  constructor(
    message: string,
    public configPath: string,
    public validationErrors?: ValidationError[]
  ) {}
}
```

### DetectionError

Project detection failures.

```typescript
class DetectionError extends TddaiError {
  constructor(message: string) {}
}
```

### FileSystemError

File operation errors.

```typescript
class FileSystemError extends TddaiError {
  constructor(
    message: string,
    public filePath: string,
    public operation: string
  ) {}
}
```

---

For complete package documentation, see [packages/core/README.md](../../packages/core/README.md).

For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md).
