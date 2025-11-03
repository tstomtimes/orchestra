import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager, createPluginManager } from '../src/plugins/plugin-manager.js';
import { PluginLoader } from '../src/plugins/plugin-loader.js';
import { PluginContext, createPluginContext } from '../src/plugins/plugin-context.js';
import type { Plugin, Logger } from '../src/types/index.js';
import { PluginError } from '../src/types/errors.js';

// Mock plugin for testing
const createMockPlugin = (name: string): Plugin => ({
  metadata: {
    name,
    version: '1.0.0',
    description: `Mock plugin ${name}`,
  },
  api: {
    async onInit(context) {
      // Mock initialization
    },
  },
});

describe('PluginManager', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = createPluginManager();
  });

  describe('register', () => {
    it('should register a plugin', () => {
      const plugin = createMockPlugin('test-plugin');
      manager.register(plugin);

      expect(manager.getPlugin('test-plugin')).toBeDefined();
    });

    it('should prevent duplicate registration', () => {
      const plugin = createMockPlugin('test-plugin');
      manager.register(plugin);

      expect(() => {
        manager.register(plugin);
      }).toThrow(PluginError);
      expect(() => {
        manager.register(plugin);
      }).toThrow('already registered');
    });

    it('should return all registered plugins', () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');

      manager.register(plugin1);
      manager.register(plugin2);

      const plugins = manager.getPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins.map((p) => p.metadata.name)).toContain('plugin-1');
      expect(plugins.map((p) => p.metadata.name)).toContain('plugin-2');
    });

    it('should return undefined for nonexistent plugin', () => {
      expect(manager.getPlugin('nonexistent')).toBeUndefined();
    });
  });

  describe('validatePluginVersion', () => {
    it('should validate compatible version', () => {
      const plugin = createMockPlugin('test');
      expect(manager.validatePluginVersion(plugin)).toBe(true);
    });

    it('should validate version 1.x.x', () => {
      const plugin: Plugin = {
        metadata: {
          name: 'test',
          version: '1.5.3',
          description: 'Test',
        },
        api: {},
      };

      expect(manager.validatePluginVersion(plugin)).toBe(true);
    });

    it('should reject incompatible version', () => {
      const plugin: Plugin = {
        metadata: {
          name: 'test',
          version: '2.0.0',
          description: 'Test',
        },
        api: {},
      };

      expect(manager.validatePluginVersion(plugin)).toBe(false);
    });

    it('should reject version 0.x.x', () => {
      const plugin: Plugin = {
        metadata: {
          name: 'test',
          version: '0.9.0',
          description: 'Test',
        },
        api: {},
      };

      expect(manager.validatePluginVersion(plugin)).toBe(false);
    });
  });

  describe('executeHooks', () => {
    it('should execute all hooks for a given name', async () => {
      const callStack: string[] = [];

      const plugin1: Plugin = {
        metadata: {
          name: 'plugin-1',
          version: '1.0.0',
          description: 'Plugin 1',
        },
        api: {
          async onInit() {
            callStack.push('plugin-1');
          },
        },
      };

      const plugin2: Plugin = {
        metadata: {
          name: 'plugin-2',
          version: '1.0.0',
          description: 'Plugin 2',
        },
        api: {
          async onInit() {
            callStack.push('plugin-2');
          },
        },
      };

      manager.register(plugin1);
      manager.register(plugin2);

      const context = createPluginContext({
        config: {
          version: '1.0.0',
          framework: 'auto',
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      await manager.executeHooks('beforeDetect', context.toPluginContext());

      expect(callStack).toContain('plugin-1');
      expect(callStack).toContain('plugin-2');
      expect(callStack).toHaveLength(2);
    });

    it('should execute hooks in registration order', async () => {
      const callStack: string[] = [];

      const plugin1: Plugin = {
        metadata: {
          name: 'first',
          version: '1.0.0',
          description: 'First plugin',
        },
        api: {
          async onInit() {
            callStack.push('first');
          },
        },
      };

      const plugin2: Plugin = {
        metadata: {
          name: 'second',
          version: '1.0.0',
          description: 'Second plugin',
        },
        api: {
          async onInit() {
            callStack.push('second');
          },
        },
      };

      manager.register(plugin1);
      manager.register(plugin2);

      const context = createPluginContext({
        config: {
          version: '1.0.0',
          framework: 'auto',
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      await manager.executeHooks('beforeDetect', context.toPluginContext());

      expect(callStack).toEqual(['first', 'second']);
    });

    it('should handle plugin hook errors', async () => {
      const plugin: Plugin = {
        metadata: {
          name: 'failing-plugin',
          version: '1.0.0',
          description: 'Failing plugin',
        },
        api: {
          async onInit() {
            throw new Error('Plugin error');
          },
        },
      };

      manager.register(plugin);

      const context = createPluginContext({
        config: {
          version: '1.0.0',
          framework: 'auto',
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      await expect(async () => {
        await manager.executeHooks('beforeDetect', context.toPluginContext());
      }).rejects.toThrow(PluginError);

      await expect(async () => {
        await manager.executeHooks('beforeDetect', context.toPluginContext());
      }).rejects.toThrow('Plugin hook failed');
    });

    it('should not execute hooks if none registered', async () => {
      const context = createPluginContext({
        config: {
          version: '1.0.0',
          framework: 'auto',
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      // Should not throw
      await manager.executeHooks('nonexistentHook', context.toPluginContext());
    });

    it('should register onGenerate hooks', async () => {
      const callStack: string[] = [];

      const plugin: Plugin = {
        metadata: {
          name: 'gen-plugin',
          version: '1.0.0',
          description: 'Generation plugin',
        },
        api: {
          async onGenerate() {
            callStack.push('generate');
          },
        },
      };

      manager.register(plugin);

      const context = createPluginContext({
        config: {
          version: '1.0.0',
          framework: 'auto',
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      await manager.executeHooks('beforeGenerate', context.toPluginContext());

      expect(callStack).toContain('generate');
    });
  });
});

describe('PluginLoader', () => {
  let manager: PluginManager;
  let loader: PluginLoader;

  beforeEach(() => {
    manager = createPluginManager();
    loader = new PluginLoader(manager);
  });

  describe('loadPlugin', () => {
    it('should throw error for nonexistent plugin', async () => {
      await expect(async () => {
        await loader.loadPlugin('nonexistent-package-xyz-123');
      }).rejects.toThrow(PluginError);

      await expect(async () => {
        await loader.loadPlugin('nonexistent-package-xyz-123');
      }).rejects.toThrow('Failed to load plugin');
    });

    it('should include attempted locations in error', async () => {
      try {
        await loader.loadPlugin('missing-plugin');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(PluginError);
        const pluginError = error as PluginError;
        expect(pluginError.details?.attempts).toBeDefined();
        expect(Array.isArray(pluginError.details?.attempts)).toBe(true);
      }
    });
  });

  describe('loadPlugins', () => {
    it('should handle empty plugin list', async () => {
      const plugins = await loader.loadPlugins([]);
      expect(plugins).toHaveLength(0);
    });
  });

  describe('loadFromConfig', () => {
    it('should handle empty config', async () => {
      const plugins = await loader.loadFromConfig([]);
      expect(plugins).toHaveLength(0);
    });
  });
});

describe('PluginContext', () => {
  describe('configuration access', () => {
    it('should provide access to config', () => {
      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
      };

      const context = createPluginContext({
        config,
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      expect(context.getConfig()).toEqual(config);
    });

    it('should provide access to project info', () => {
      const project = {
        type: 'typescript' as const,
        framework: 'vitest' as const,
        typescript: true,
        confidence: 1.0,
        packageManager: 'npm' as const,
        nodeVersion: '18.0.0',
        metadata: {},
        suggestedPlugins: [],
      };

      const context = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project,
        cwd: process.cwd(),
      });

      expect(context.getProject()).toEqual(project);
    });

    it('should provide access to cwd', () => {
      const cwd = '/test/directory';

      const context = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd,
      });

      expect(context.getCwd()).toBe(cwd);
    });
  });

  describe('logger access', () => {
    it('should provide default logger', () => {
      const context = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      const logger = context.getLogger();
      expect(logger).toBeDefined();
      expect(logger.log).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('should accept custom logger', () => {
      const customLogger: Logger = {
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
      };

      const context = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
        logger: customLogger,
      });

      expect(context.getLogger()).toBe(customLogger);
    });
  });

  describe('metadata management', () => {
    it('should manage metadata', () => {
      const context = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      context.setMetadata('key', 'value');
      expect(context.getMetadata('key')).toBe('value');
    });

    it('should return undefined for nonexistent metadata', () => {
      const context = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      expect(context.getMetadata('nonexistent')).toBeUndefined();
    });

    it('should handle complex metadata values', () => {
      const context = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      const complexValue = { nested: { data: [1, 2, 3] } };
      context.setMetadata('complex', complexValue);
      expect(context.getMetadata('complex')).toEqual(complexValue);
    });
  });

  describe('child context', () => {
    it('should create child contexts', () => {
      const parent = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      const child = parent.createChild({
        cwd: '/other/path',
      });

      expect(child.getCwd()).toBe('/other/path');
      expect(child.getConfig()).toEqual(parent.getConfig());
    });

    it('should inherit parent metadata', () => {
      const parent = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      parent.setMetadata('parent-key', 'parent-value');

      const child = parent.createChild({
        cwd: '/other/path',
      });

      expect(child.getMetadata('parent-key')).toBe('parent-value');
    });
  });

  describe('toPluginContext', () => {
    it('should convert to plain PluginContext object', () => {
      const context = createPluginContext({
        config: {
          version: '1.0.0' as const,
          framework: 'auto' as const,
          testDir: 'tests',
          testPattern: '**/*.test.ts',
          plugins: [],
        },
        project: {
          type: 'typescript',
          framework: 'vitest',
          typescript: true,
          confidence: 1.0,
          packageManager: 'npm',
          nodeVersion: '18.0.0',
          metadata: {},
          suggestedPlugins: [],
        },
        cwd: process.cwd(),
      });

      const plainContext = context.toPluginContext();

      expect(plainContext.config).toBeDefined();
      expect(plainContext.project).toBeDefined();
      expect(plainContext.cwd).toBeDefined();
      expect(plainContext.logger).toBeDefined();
      expect(plainContext.metadata).toBeDefined();
    });
  });
});
