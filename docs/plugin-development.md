# Plugin Development Guide

This guide covers everything you need to create custom TDD.ai plugins, from basic setup to publishing on npm.

## What Are Plugins?

Plugins extend TDD.ai's test generation capabilities for specific frameworks, libraries, or organizational patterns. They hook into the test generation lifecycle and provide custom logic.

### When to Create a Plugin

Create a plugin when you need to:
- Support a new test framework (e.g., AVA, Tape)
- Add framework-specific patterns (e.g., React Hooks, Vue Composition API)
- Implement organization-specific testing conventions
- Integrate custom assertion libraries or test utilities

### When NOT to Create a Plugin

Use configuration or templates instead if you need to:
- Change test file naming conventions (use `testPattern`)
- Adjust coverage targets (use `generation.coverageTarget`)
- Modify simple test templates (use `generation.templatePath`)

## Plugin Architecture

### Plugin Interface

Every plugin must implement the `Plugin` interface from `@tddai/core`:

```typescript
export interface Plugin {
  metadata: PluginMetadata;
  api: PluginAPI;
}

export interface PluginMetadata {
  name: string;          // Package name (e.g., '@tddai/plugin-react')
  version: string;       // Semantic version (e.g., '1.0.0')
  description: string;   // Short description
  author?: string;       // Optional author info
}

export interface PluginAPI {
  onInit?(context: PluginContext): Promise<void>;
  // Future hooks: onGenerate, onValidate, onWatch (Phase 2)
}

export interface PluginContext {
  config: Config;        // User's TDD.ai configuration
  projectRoot: string;   // Absolute path to project root
}
```

## Creating Your First Plugin

### Step 1: Project Setup

Create a new npm package:

```bash
mkdir tddai-plugin-myframework
cd tddai-plugin-myframework
npm init -y
```

Update `package.json`:

```json
{
  "name": "@tddai/plugin-myframework",
  "version": "1.0.0",
  "description": "MyFramework testing support for TDD.ai",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "keywords": ["tddai", "plugin", "myframework", "testing"],
  "peerDependencies": {
    "@tddai/core": "^1.0.0"
  },
  "devDependencies": {
    "@tddai/core": "^1.0.0",
    "@types/node": "^20.10.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.2"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "test:watch": "vitest --watch"
  }
}
```

### Step 2: TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Step 3: Plugin Implementation

Create `src/index.ts`:

```typescript
import type { Plugin, PluginContext } from '@tddai/core';

const plugin: Plugin = {
  metadata: {
    name: '@tddai/plugin-myframework',
    version: '1.0.0',
    description: 'MyFramework testing support for TDD.ai',
    author: 'Your Name',
  },

  api: {
    async onInit(context: PluginContext): Promise<void> {
      console.log(`[${this.metadata.name}] Initializing...`);
      console.log(`Project root: ${context.projectRoot}`);
      console.log(`Framework: ${context.config.framework}`);

      // Plugin initialization logic here
      // - Validate MyFramework is installed
      // - Load framework-specific configuration
      // - Register custom test generators
    },
  },
};

export default plugin;
```

### Step 4: Add Tests

Create `tests/plugin.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import plugin from '../src/index.js';
import type { PluginContext } from '@tddai/core';

describe('@tddai/plugin-myframework', () => {
  it('should have correct metadata', () => {
    expect(plugin.metadata.name).toBe('@tddai/plugin-myframework');
    expect(plugin.metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should initialize successfully', async () => {
    const context: PluginContext = {
      config: {
        framework: 'vitest',
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
      },
      projectRoot: '/path/to/project',
    };

    const consoleSpy = vi.spyOn(console, 'log');
    await plugin.api.onInit?.(context);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Initializing')
    );
  });
});
```

### Step 5: Build and Test

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Verify output
ls dist/
# index.js  index.d.ts
```

## Advanced Plugin Features

### Validating Framework Installation

```typescript
import { existsSync } from 'node:fs';
import { join } from 'node:path';

async onInit(context: PluginContext): Promise<void> {
  const packageJsonPath = join(context.projectRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found in project root');
  }

  const packageJson = JSON.parse(
    await fs.readFile(packageJsonPath, 'utf-8')
  );

  const hasFramework =
    packageJson.dependencies?.myframework ||
    packageJson.devDependencies?.myframework;

  if (!hasFramework) {
    console.warn('[plugin-myframework] MyFramework not installed');
    console.warn('Install with: npm install myframework');
  }
}
```

### Loading Plugin Configuration

Extend user config with plugin-specific settings:

```typescript
interface MyFrameworkConfig {
  componentPattern?: string;
  mockStrategy?: 'auto' | 'manual';
}

async onInit(context: PluginContext): Promise<void> {
  // Look for plugin config in user's config file
  const pluginConfig: MyFrameworkConfig = (context.config as any).myframework || {
    componentPattern: '**/*.component.ts',
    mockStrategy: 'auto',
  };

  console.log(`Component pattern: ${pluginConfig.componentPattern}`);
  console.log(`Mock strategy: ${pluginConfig.mockStrategy}`);

  // Use config to customize behavior
}
```

User's `.tddai/config.json`:

```json
{
  "framework": "vitest",
  "plugins": ["@tddai/plugin-myframework"],
  "myframework": {
    "componentPattern": "**/*.view.ts",
    "mockStrategy": "manual"
  }
}
```

### Logging Best Practices

Use consistent logging format:

```typescript
class PluginLogger {
  constructor(private pluginName: string) {}

  info(message: string): void {
    console.log(`[${this.pluginName}] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[${this.pluginName}] ⚠️  ${message}`);
  }

  error(message: string): void {
    console.error(`[${this.pluginName}] ❌ ${message}`);
  }

  success(message: string): void {
    console.log(`[${this.pluginName}] ✅ ${message}`);
  }
}

// Usage
const logger = new PluginLogger(plugin.metadata.name);
logger.info('Initializing...');
logger.success('Ready!');
```

## Real-World Example: React Plugin

Let's examine the official React plugin structure:

### Package Structure

```
@tddai/plugin-react/
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── generators/
│   │   ├── component.ts      # React component test generation
│   │   ├── hook.ts           # Custom hook test generation
│   │   └── util.ts           # Utility function tests
│   ├── templates/
│   │   ├── component.hbs     # Component test template
│   │   └── hook.hbs          # Hook test template
│   └── utils/
│       ├── ast-parser.ts     # Parse JSX/TSX
│       └── react-detector.ts # Detect React components
├── tests/
│   └── generators/
│       ├── component.test.ts
│       └── hook.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Implementation Highlights

```typescript
// src/index.ts
import type { Plugin, PluginContext } from '@tddai/core';
import { generateComponentTests } from './generators/component.js';
import { generateHookTests } from './generators/hook.js';
import { detectReactVersion } from './utils/react-detector.js';

const plugin: Plugin = {
  metadata: {
    name: '@tddai/plugin-react',
    version: '1.0.0',
    description: 'React component and hook testing support',
    author: 'TDD.ai Team',
  },

  api: {
    async onInit(context: PluginContext): Promise<void> {
      // Validate React installation
      const reactVersion = await detectReactVersion(context.projectRoot);

      if (!reactVersion) {
        console.warn('[plugin-react] React not detected');
        return;
      }

      console.log(`[plugin-react] Detected React ${reactVersion}`);

      // Register test generators (Phase 2 feature)
      // registerGenerator('component', generateComponentTests);
      // registerGenerator('hook', generateHookTests);
    },
  },
};

export default plugin;
```

## Plugin Naming Conventions

### Official Plugins

Official TDD.ai plugins use the `@tddai/` scope:

- `@tddai/plugin-react`
- `@tddai/plugin-vue`
- `@tddai/plugin-angular`

### Community Plugins

Use your own npm scope or `tddai-plugin-` prefix:

- `@myorg/tddai-plugin-custom`
- `tddai-plugin-myframework`

### Discovery

TDD.ai discovers plugins by:
1. Scanning `node_modules` for packages matching:
   - `@tddai/plugin-*`
   - `@*/tddai-plugin-*`
   - `tddai-plugin-*`
2. Loading plugins listed in config's `plugins` array

## Testing Your Plugin

### Unit Tests

Test individual functions and logic:

```typescript
import { describe, it, expect } from 'vitest';
import { detectReactVersion } from '../src/utils/react-detector.js';

describe('React version detection', () => {
  it('should detect React version from package.json', async () => {
    const version = await detectReactVersion('/path/to/project');
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should return null if React not installed', async () => {
    const version = await detectReactVersion('/empty/project');
    expect(version).toBeNull();
  });
});
```

### Integration Tests

Test plugin with TDD.ai CLI:

```bash
# Link plugin locally
cd my-plugin
npm link

# Link in test project
cd test-project
npm link @tddai/plugin-myframework

# Test with TDD.ai
tddai init --framework vitest
tddai config set plugins @tddai/plugin-myframework
tddai generate src/example.ts
```

### Test Coverage Requirements

- Unit test coverage: ≥ 80%
- Integration test coverage: ≥ 60%
- Critical path coverage: 100%

## Publishing Your Plugin

### Pre-Publication Checklist

- [ ] Tests passing (`npm test`)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] README.md with usage instructions
- [ ] LICENSE file (MIT recommended)
- [ ] Version follows semantic versioning
- [ ] package.json has correct metadata:
  - `name`, `version`, `description`
  - `keywords` includes "tddai", "plugin"
  - `peerDependencies` includes `@tddai/core`
  - `files` includes only `dist/`

### Publishing to npm

```bash
# Build plugin
npm run build

# Test build locally
npm pack
# Verify generated tarball

# Publish to npm
npm login
npm publish --access public
```

### Versioning Strategy

Follow semantic versioning:

- **Major** (1.0.0 → 2.0.0): Breaking changes to plugin API
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, no API changes

### Post-Publication

1. Create GitHub release with changelog
2. Update plugin documentation
3. Submit to TDD.ai plugin directory (coming soon)
4. Announce in community discussions

## Plugin Best Practices

### 1. Single Responsibility

Each plugin should focus on one framework or pattern:

**Good**:
- `@tddai/plugin-react` - React components and hooks
- `@tddai/plugin-vue` - Vue components

**Bad**:
- `@tddai/plugin-all-frameworks` - React, Vue, Angular, etc.

### 2. Graceful Degradation

Handle missing dependencies gracefully:

```typescript
async onInit(context: PluginContext): Promise<void> {
  try {
    const framework = await detectFramework(context.projectRoot);
    if (!framework) {
      console.warn('[plugin] Framework not detected, skipping initialization');
      return; // Don't throw
    }
    // Continue initialization
  } catch (error) {
    console.warn(`[plugin] Initialization failed: ${error.message}`);
    // Log but don't crash TDD.ai
  }
}
```

### 3. Minimal Dependencies

Keep plugin dependencies minimal:

**Preferred**:
- Node.js built-ins (`fs`, `path`)
- `@tddai/core` (peer dependency)
- Framework peer dependencies

**Avoid**:
- Large utility libraries (lodash, moment)
- Unnecessary abstraction layers

### 4. Clear Error Messages

Provide actionable error messages:

**Bad**:
```typescript
throw new Error('Failed to initialize');
```

**Good**:
```typescript
throw new Error(
  'Failed to initialize @tddai/plugin-myframework\n' +
  '  → Ensure "myframework" is installed: npm install myframework\n' +
  '  → Verify config has correct framework: tddai config get framework'
);
```

### 5. TypeScript Strict Mode

Always use strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Future Plugin Capabilities (Phase 2)

Phase 2 will expand plugin APIs:

### Additional Hooks

```typescript
export interface PluginAPI {
  onInit?(context: PluginContext): Promise<void>;

  // Phase 2 additions:
  onGenerate?(
    sourceFile: string,
    sourceCode: string,
    context: PluginContext
  ): Promise<string>;

  onValidate?(
    testFile: string,
    testCode: string,
    context: PluginContext
  ): Promise<ValidationResult>;

  onWatch?(
    event: 'add' | 'change' | 'unlink',
    filePath: string,
    context: PluginContext
  ): Promise<void>;
}
```

### AI Integration Hooks

```typescript
interface AIContext {
  prompt: string;
  model: 'claude' | 'openai';
  temperature: number;
}

onBeforeAIGenerate?(context: AIContext): Promise<string>; // Modify prompt
onAfterAIGenerate?(generatedCode: string): Promise<string>; // Post-process
```

## Getting Help

- **Plugin Issues**: [GitHub Issues](https://github.com/tddai/tddai/issues)
- **Plugin Ideas**: [GitHub Discussions](https://github.com/tddai/tddai/discussions)
- **Official Plugins**: [Plugin Directory](https://tddai.dev/plugins)
- **Plugin Development Chat**: [Discord #plugin-dev](https://discord.gg/tddai)

## Example Plugins

### Official Plugins (Reference)

- [@tddai/plugin-react](https://github.com/tddai/tddai/tree/main/packages/plugin-react) - React components and hooks
- [@tddai/plugin-vue](https://github.com/tddai/tddai/tree/main/packages/plugin-vue) - Vue 3 Composition API
- [@tddai/plugin-node](https://github.com/tddai/tddai/tree/main/packages/plugin-node) - Node.js APIs

### Community Plugins

- `tddai-plugin-nextjs` - Next.js specific patterns
- `tddai-plugin-graphql` - GraphQL resolver testing
- `tddai-plugin-express` - Express.js route testing

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-03
**Phase**: 1 (Foundation)
**Next Review**: After Phase 2 (AI Integration)
