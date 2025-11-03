import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/types/schemas.js';
import {
  ConfigError,
  DetectionError,
  FileSystemError,
  PluginError,
  TddaiError,
} from '../src/types/errors.js';

describe('Config Schema', () => {
  it('should validate minimal config', () => {
    const result = validateConfig({
      version: '1.0.0',
    });

    expect(result.success).toBe(true);
    expect(result.data?.framework).toBe('auto');
    expect(result.data?.testDir).toBe('tests');
    expect(result.errors).toHaveLength(0);
  });

  it('should apply default values', () => {
    const result = validateConfig({});

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      version: '1.0.0',
      framework: 'auto',
      testDir: 'tests',
      testPattern: '**/*.test.ts',
      plugins: [],
    });
  });

  it('should reject invalid framework', () => {
    const result = validateConfig({
      version: '1.0.0',
      framework: 'invalid',
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].field).toBe('framework');
  });

  it('should reject absolute testDir path', () => {
    const result = validateConfig({
      version: '1.0.0',
      testDir: '/absolute/path',
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    const testDirError = result.errors.find((e) => e.field === 'testDir');
    expect(testDirError?.message).toContain('relative');
  });

  it('should validate complete config', () => {
    const result = validateConfig({
      version: '1.0.0',
      framework: 'vitest',
      testDir: 'test',
      testPattern: '**/*.spec.ts',
      plugins: ['@tddai/plugin-react'],
      generation: {
        colocate: true,
        naming: 'kebab',
      },
    });

    expect(result.success).toBe(true);
    expect(result.data?.framework).toBe('vitest');
    expect(result.data?.testDir).toBe('test');
    expect(result.data?.testPattern).toBe('**/*.spec.ts');
    expect(result.data?.plugins).toEqual(['@tddai/plugin-react']);
    expect(result.data?.generation?.colocate).toBe(true);
    expect(result.data?.generation?.naming).toBe('kebab');
  });

  it('should validate all framework options', () => {
    const frameworks = ['vitest', 'jest', 'mocha', 'auto'];

    frameworks.forEach((framework) => {
      const result = validateConfig({
        version: '1.0.0',
        framework,
      });

      expect(result.success).toBe(true);
      expect(result.data?.framework).toBe(framework);
    });
  });

  it('should validate all naming conventions', () => {
    const namings = ['mirror', 'kebab', 'flat'] as const;

    namings.forEach((naming) => {
      const result = validateConfig({
        version: '1.0.0',
        generation: {
          colocate: false,
          naming,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.generation?.naming).toBe(naming);
    });
  });

  it('should accept empty plugins array', () => {
    const result = validateConfig({
      version: '1.0.0',
      plugins: [],
    });

    expect(result.success).toBe(true);
    expect(result.data?.plugins).toEqual([]);
  });

  it('should accept multiple plugins', () => {
    const plugins = ['@tddai/plugin-react', '@tddai/plugin-vue', 'custom-plugin'];
    const result = validateConfig({
      version: '1.0.0',
      plugins,
    });

    expect(result.success).toBe(true);
    expect(result.data?.plugins).toEqual(plugins);
  });

  it('should make generation config optional', () => {
    const result = validateConfig({
      version: '1.0.0',
    });

    expect(result.success).toBe(true);
    expect(result.data?.generation).toBeUndefined();
  });
});

describe('Error Classes', () => {
  it('should create TddaiError with code and message', () => {
    const error = new TddaiError('TEST_ERROR', 'Test error message');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TddaiError);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test error message');
    expect(error.name).toBe('TddaiError');
  });

  it('should create TddaiError with details', () => {
    const error = new TddaiError('TEST_ERROR', 'Test error message', {
      file: 'test.ts',
      line: 42,
    });

    expect(error.details).toEqual({
      file: 'test.ts',
      line: 42,
    });
  });

  it('should create ConfigError with proper inheritance', () => {
    const error = new ConfigError('Invalid config', {
      file: '.tddai.json',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(TddaiError);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.code).toBe('CONFIG_ERROR');
    expect(error.name).toBe('ConfigError');
    expect(error.message).toBe('Invalid config');
    expect(error.details?.file).toBe('.tddai.json');
  });

  it('should create DetectionError', () => {
    const error = new DetectionError('Failed to detect project', {
      reason: 'No package.json found',
    });

    expect(error).toBeInstanceOf(TddaiError);
    expect(error.code).toBe('DETECTION_ERROR');
    expect(error.name).toBe('DetectionError');
    expect(error.details?.reason).toBe('No package.json found');
  });

  it('should create FileSystemError', () => {
    const error = new FileSystemError('Failed to write file', {
      path: '/tmp/test.txt',
      errno: -13,
    });

    expect(error).toBeInstanceOf(TddaiError);
    expect(error.code).toBe('FILESYSTEM_ERROR');
    expect(error.name).toBe('FileSystemError');
    expect(error.details?.path).toBe('/tmp/test.txt');
  });

  it('should create PluginError', () => {
    const error = new PluginError('Plugin initialization failed', {
      plugin: '@tddai/plugin-react',
      version: '1.0.0',
    });

    expect(error).toBeInstanceOf(TddaiError);
    expect(error.code).toBe('PLUGIN_ERROR');
    expect(error.name).toBe('PluginError');
    expect(error.details?.plugin).toBe('@tddai/plugin-react');
  });

  it('should capture stack trace', () => {
    const error = new TddaiError('TEST_ERROR', 'Test');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('TddaiError');
  });
});

describe('Type Guards and Validation', () => {
  it('should handle unknown input gracefully', () => {
    const result = validateConfig(null);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle undefined input with defaults', () => {
    const result = validateConfig({});

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle invalid types', () => {
    const result = validateConfig({
      version: '1.0.0',
      framework: 123,
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate plugins as string array', () => {
    const result = validateConfig({
      version: '1.0.0',
      plugins: [123, 456],
    });

    expect(result.success).toBe(false);
  });
});
