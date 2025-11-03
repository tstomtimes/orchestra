import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigLoader } from '../src/config/loader.js';
import { ConfigMerger } from '../src/config/merger.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ConfigLoader', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `tddai-test-${Date.now()}-${Math.random()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('load', () => {
    it('should return defaults when no config file found', async () => {
      const loader = new ConfigLoader();
      const result = await loader.load(tmpDir);

      expect(result.source).toBe('default');
      expect(result.config.framework).toBe('auto');
      expect(result.config.testDir).toBe('tests');
      expect(result.config.testPattern).toBe('**/*.test.ts');
      expect(result.config.plugins).toEqual([]);
      expect(result.errors).toHaveLength(0);
    });

    it('should load config from .tddairc.json', async () => {
      const config = {
        version: '1.0.0',
        framework: 'vitest',
        testDir: 'test',
      };

      writeFileSync(
        join(tmpDir, '.tddairc.json'),
        JSON.stringify(config)
      );

      const loader = new ConfigLoader();
      const result = await loader.load(tmpDir);

      expect(result.source).toBe('file');
      expect(result.config.framework).toBe('vitest');
      expect(result.config.testDir).toBe('test');
      expect(result.path).toBe(join(tmpDir, '.tddairc.json'));
    });

    it('should load config from package.json', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        tddai: {
          version: '1.0.0',
          framework: 'jest',
        },
      };

      writeFileSync(
        join(tmpDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      const loader = new ConfigLoader();
      const result = await loader.load(tmpDir);

      expect(result.source).toBe('package.json');
      expect(result.config.framework).toBe('jest');
      expect(result.path).toBe(join(tmpDir, 'package.json'));
    });

    it('should reject invalid config with invalid framework', async () => {
      const invalidConfig = {
        version: '1.0.0',
        framework: 'invalid-framework',
      };

      writeFileSync(
        join(tmpDir, '.tddairc.json'),
        JSON.stringify(invalidConfig)
      );

      const loader = new ConfigLoader();

      await expect(async () => {
        await loader.load(tmpDir);
      }).rejects.toThrow('Invalid configuration');
    });

    it('should reject invalid config with absolute testDir path', async () => {
      const invalidConfig = {
        version: '1.0.0',
        framework: 'vitest',
        testDir: '/absolute/path',
      };

      writeFileSync(
        join(tmpDir, '.tddairc.json'),
        JSON.stringify(invalidConfig)
      );

      const loader = new ConfigLoader();

      await expect(async () => {
        await loader.load(tmpDir);
      }).rejects.toThrow('Invalid configuration');
    });

    it('should load config with all optional fields', async () => {
      const config = {
        version: '1.0.0',
        framework: 'jest',
        testDir: 'spec',
        testPattern: '**/*.spec.ts',
        plugins: ['plugin1', 'plugin2'],
      };

      writeFileSync(
        join(tmpDir, '.tddairc.json'),
        JSON.stringify(config)
      );

      const loader = new ConfigLoader();
      const result = await loader.load(tmpDir);

      expect(result.config.framework).toBe('jest');
      expect(result.config.testDir).toBe('spec');
      expect(result.config.testPattern).toBe('**/*.spec.ts');
      expect(result.config.plugins).toEqual(['plugin1', 'plugin2']);
    });
  });

  describe('loadFromFile', () => {
    it('should load config from specific file path', async () => {
      const filePath = join(tmpDir, 'custom.json');
      const config = {
        version: '1.0.0',
        framework: 'vitest',
      };

      writeFileSync(filePath, JSON.stringify(config));

      const loader = new ConfigLoader();
      const result = await loader.loadFromFile(filePath);

      expect(result.path).toBe(filePath);
      expect(result.source).toBe('file');
      expect(result.config.framework).toBe('vitest');
    });

    it('should throw error for non-existent file', async () => {
      const filePath = join(tmpDir, 'nonexistent.json');

      const loader = new ConfigLoader();

      await expect(async () => {
        await loader.loadFromFile(filePath);
      }).rejects.toThrow('Failed to load configuration file');
    });

    it('should throw error for invalid JSON', async () => {
      const filePath = join(tmpDir, 'invalid.json');
      writeFileSync(filePath, 'not valid json{]');

      const loader = new ConfigLoader();

      await expect(async () => {
        await loader.loadFromFile(filePath);
      }).rejects.toThrow('Failed to load configuration file');
    });
  });

  describe('mergeWithOptions', () => {
    it('should merge CLI options with file config', () => {
      const fileConfig = {
        version: '1.0.0' as const,
        framework: 'jest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
      };

      const loader = new ConfigLoader();
      const merged = loader.mergeWithOptions(fileConfig, {
        framework: 'vitest',
        testDir: 'test',
      });

      expect(merged.framework).toBe('vitest');
      expect(merged.testDir).toBe('test');
      expect(merged.testPattern).toBe('**/*.test.ts'); // unchanged
    });

    it('should merge plugins array from options', () => {
      const fileConfig = {
        version: '1.0.0' as const,
        framework: 'jest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: ['plugin1'],
      };

      const loader = new ConfigLoader();
      const merged = loader.mergeWithOptions(fileConfig, {
        plugins: ['plugin2', 'plugin3'],
      });

      expect(merged.plugins).toEqual(['plugin2', 'plugin3']);
    });

    it('should ignore invalid option types', () => {
      const fileConfig = {
        version: '1.0.0' as const,
        framework: 'jest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
      };

      const loader = new ConfigLoader();
      const merged = loader.mergeWithOptions(fileConfig, {
        framework: 123, // invalid type
        testDir: true, // invalid type
      });

      // Should ignore invalid types and keep original values
      expect(merged.framework).toBe('jest');
      expect(merged.testDir).toBe('tests');
    });
  });

  describe('getDefaults', () => {
    it('should return correct default config', () => {
      const loader = new ConfigLoader();
      const defaults = loader.getDefaults();

      expect(defaults.version).toBe('1.0.0');
      expect(defaults.framework).toBe('auto');
      expect(defaults.testDir).toBe('tests');
      expect(defaults.testPattern).toBe('**/*.test.ts');
      expect(defaults.plugins).toEqual([]);
    });
  });
});

describe('ConfigMerger', () => {
  it('should merge configs with correct priority', () => {
    const defaults = {
      version: '1.0.0' as const,
      framework: 'auto' as const,
      testDir: 'tests',
      testPattern: '**/*.test.ts',
      plugins: [],
    };

    const fileConfig = {
      version: '1.0.0' as const,
      framework: 'jest' as const,
      testDir: 'test',
      testPattern: '**/*.spec.ts',
      plugins: [],
    };

    const cliOptions = {
      framework: 'vitest',
    };

    const merged = ConfigMerger.merge(defaults, fileConfig, cliOptions);

    expect(merged.framework).toBe('vitest'); // CLI has highest priority
    expect(merged.testDir).toBe('test'); // From file
    expect(merged.testPattern).toBe('**/*.spec.ts'); // From file
  });

  it('should use defaults when file config is null', () => {
    const defaults = {
      version: '1.0.0' as const,
      framework: 'auto' as const,
      testDir: 'tests',
      testPattern: '**/*.test.ts',
      plugins: [],
    };

    const cliOptions = {
      framework: 'vitest',
    };

    const merged = ConfigMerger.merge(defaults, null, cliOptions);

    expect(merged.framework).toBe('vitest'); // From CLI
    expect(merged.testDir).toBe('tests'); // From defaults
    expect(merged.testPattern).toBe('**/*.test.ts'); // From defaults
  });

  it('should merge all options correctly', () => {
    const defaults = {
      version: '1.0.0' as const,
      framework: 'auto' as const,
      testDir: 'tests',
      testPattern: '**/*.test.ts',
      plugins: [],
    };

    const fileConfig = {
      version: '1.0.0' as const,
      framework: 'jest' as const,
      testDir: 'test',
      testPattern: '**/*.spec.ts',
      plugins: ['plugin1'],
    };

    const cliOptions = {
      framework: 'vitest',
      testDir: 'spec',
      testPattern: '**/*.test.js',
      plugins: ['plugin2', 'plugin3'],
    };

    const merged = ConfigMerger.merge(defaults, fileConfig, cliOptions);

    expect(merged.framework).toBe('vitest');
    expect(merged.testDir).toBe('spec');
    expect(merged.testPattern).toBe('**/*.test.js');
    expect(merged.plugins).toEqual(['plugin2', 'plugin3']);
  });

  it('should preserve file config when CLI options are empty', () => {
    const defaults = {
      version: '1.0.0' as const,
      framework: 'auto' as const,
      testDir: 'tests',
      testPattern: '**/*.test.ts',
      plugins: [],
    };

    const fileConfig = {
      version: '1.0.0' as const,
      framework: 'jest' as const,
      testDir: 'test',
      testPattern: '**/*.spec.ts',
      plugins: ['plugin1'],
    };

    const merged = ConfigMerger.merge(defaults, fileConfig, {});

    expect(merged.framework).toBe('jest');
    expect(merged.testDir).toBe('test');
    expect(merged.testPattern).toBe('**/*.spec.ts');
    expect(merged.plugins).toEqual(['plugin1']);
  });
});
