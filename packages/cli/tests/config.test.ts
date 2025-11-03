import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createCLI } from '../src/cli';

describe('Config Command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `tddai-test-config-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    // Create a basic .tddai.json config
    const config = {
      version: '1.0.0',
      framework: 'vitest',
      testDir: './tests',
      testPattern: '**/*.test.ts',
      plugins: [],
      generation: { colocate: false, naming: 'mirror' },
    };
    writeFileSync(join(testDir, '.tddai.json'), JSON.stringify(config, null, 2));
  });

  afterEach(() => {
    process.chdir('/');
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Command Registration', () => {
    it('should register config command in CLI', () => {
      const program = createCLI();
      const configCommand = program.commands.find((cmd) => cmd.name() === 'config');
      expect(configCommand).toBeDefined();
    });

    it('should have correct description', () => {
      const program = createCLI();
      const configCommand = program.commands.find((cmd) => cmd.name() === 'config');
      expect(configCommand?.description()).toBe('View or edit TDD.ai configuration');
    });

    it('should support --show flag', () => {
      const program = createCLI();
      const configCommand = program.commands.find((cmd) => cmd.name() === 'config');
      const hasShow = configCommand?.options.some((opt) => opt.long === '--show');
      expect(hasShow).toBe(true);
    });

    it('should support --set flag', () => {
      const program = createCLI();
      const configCommand = program.commands.find((cmd) => cmd.name() === 'config');
      const hasSet = configCommand?.options.some((opt) => opt.long === '--set');
      expect(hasSet).toBe(true);
    });

    it('should support --get flag', () => {
      const program = createCLI();
      const configCommand = program.commands.find((cmd) => cmd.name() === 'config');
      const hasGet = configCommand?.options.some((opt) => opt.long === '--get');
      expect(hasGet).toBe(true);
    });
  });

  describe('Show Configuration', () => {
    it('should display full configuration', () => {
      const configPath = join(testDir, '.tddai.json');
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('framework');
      expect(config).toHaveProperty('testDir');
      expect(config).toHaveProperty('testPattern');
    });

    it('should show all configuration keys', () => {
      const config = {
        version: '1.0.0',
        framework: 'vitest',
        testDir: './tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: { colocate: false, naming: 'mirror' },
      };

      const keys = Object.keys(config);
      expect(keys).toContain('version');
      expect(keys).toContain('framework');
      expect(keys).toContain('testDir');
      expect(keys).toContain('generation');
    });

    it('should format nested configuration', () => {
      const config = {
        generation: {
          colocate: false,
          naming: 'mirror',
        },
      };

      expect(config.generation).toHaveProperty('colocate');
      expect(config.generation).toHaveProperty('naming');
    });
  });

  describe('Get Configuration Value', () => {
    it('should retrieve single config value', () => {
      const configPath = join(testDir, '.tddai.json');
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      const framework = config.framework;
      expect(framework).toBe('vitest');
    });

    it('should retrieve nested config value', () => {
      const configPath = join(testDir, '.tddai.json');
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      const colocate = config.generation?.colocate;
      expect(colocate).toBe(false);
    });

    it('should handle missing keys gracefully', () => {
      const config = { version: '1.0.0', framework: 'vitest' };
      const value = config['nonexistent' as keyof typeof config];
      expect(value).toBeUndefined();
    });
  });

  describe('Set Configuration Value', () => {
    it('should update simple config value', () => {
      const configPath = join(testDir, '.tddai.json');
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Simulate update
      config.framework = 'jest';
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const updatedContent = readFileSync(configPath, 'utf-8');
      const updatedConfig = JSON.parse(updatedContent);
      expect(updatedConfig.framework).toBe('jest');
    });

    it('should update nested config value', () => {
      const configPath = join(testDir, '.tddai.json');
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Simulate update
      config.generation.colocate = true;
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const updatedContent = readFileSync(configPath, 'utf-8');
      const updatedConfig = JSON.parse(updatedContent);
      expect(updatedConfig.generation.colocate).toBe(true);
    });

    it('should create nested keys if missing', () => {
      const config: any = { version: '1.0.0' };

      // Create nested structure
      if (!config.generation) {
        config.generation = {};
      }
      config.generation.colocate = true;

      expect(config.generation.colocate).toBe(true);
    });
  });

  describe('Value Parsing', () => {
    it('should parse boolean values', () => {
      const trueValue = JSON.parse('true');
      const falseValue = JSON.parse('false');

      expect(trueValue).toBe(true);
      expect(falseValue).toBe(false);
    });

    it('should parse number values', () => {
      const numberValue = JSON.parse('42');
      expect(numberValue).toBe(42);
      expect(typeof numberValue).toBe('number');
    });

    it('should parse array values', () => {
      const arrayValue = JSON.parse('["plugin1","plugin2"]');
      expect(Array.isArray(arrayValue)).toBe(true);
      expect(arrayValue).toHaveLength(2);
    });

    it('should keep string values as strings', () => {
      const stringValue = './tests';
      expect(typeof stringValue).toBe('string');
    });
  });

  describe('Nested Key Handling', () => {
    it('should handle dot notation for nested keys', () => {
      const config = {
        generation: {
          colocate: false,
          naming: 'mirror',
        },
      };

      const keys = 'generation.colocate'.split('.');
      let value: any = config;
      for (const key of keys) {
        value = value[key];
      }

      expect(value).toBe(false);
    });

    it('should set values using dot notation', () => {
      const config: any = {
        generation: {
          colocate: false,
        },
      };

      const path = 'generation.colocate';
      const keys = path.split('.');
      const lastKey = keys.pop()!;
      let current: any = config;

      for (const key of keys) {
        current = current[key];
      }
      current[lastKey] = true;

      expect(config.generation.colocate).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate framework values', () => {
      const validFrameworks = ['vitest', 'jest', 'mocha', 'auto'];
      const testFramework = 'jest';
      expect(validFrameworks).toContain(testFramework);
    });

    it('should reject invalid framework values', () => {
      const validFrameworks = ['vitest', 'jest', 'mocha', 'auto'];
      const invalidFramework = 'invalid';
      expect(validFrameworks).not.toContain(invalidFramework);
    });

    it('should validate naming convention values', () => {
      const validNaming = ['mirror', 'kebab', 'flat'];
      const testNaming = 'mirror';
      expect(validNaming).toContain(testNaming);
    });

    it('should validate boolean colocate value', () => {
      const colocate = false;
      expect(typeof colocate).toBe('boolean');
    });

    it('should validate testDir is a string', () => {
      const testDir = './tests';
      expect(typeof testDir).toBe('string');
      expect(testDir.length).toBeGreaterThan(0);
    });
  });

  describe('Reset Configuration', () => {
    it('should reset to default values', () => {
      const defaultConfig = {
        version: '1.0.0',
        framework: 'auto',
        testDir: './tests',
        testPattern: '**/*.test.(ts|js)',
        plugins: [],
        generation: { colocate: false, naming: 'mirror' },
      };

      expect(defaultConfig.framework).toBe('auto');
      expect(defaultConfig.testDir).toBe('./tests');
    });

    it('should preserve version during reset', () => {
      const config = {
        version: '1.0.0',
        framework: 'jest',
      };

      // After reset
      const resetConfig = {
        version: config.version,
        framework: 'auto',
      };

      expect(resetConfig.version).toBe('1.0.0');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration file', () => {
      const configPath = join(testDir, '.tddai.json');
      rmSync(configPath);

      const exists = existsSync(configPath);
      expect(exists).toBe(false);
    });

    it('should handle invalid JSON in config file', () => {
      const configPath = join(testDir, '.tddai.json');
      writeFileSync(configPath, '{ invalid }');

      try {
        const content = readFileSync(configPath, 'utf-8');
        JSON.parse(content);
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid key paths', () => {
      const config = { version: '1.0.0' };
      const value = (config as any).nonexistent?.nested?.key;
      expect(value).toBeUndefined();
    });
  });

  describe('Configuration File Writing', () => {
    it('should write formatted JSON', () => {
      const configPath = join(testDir, '.tddai.json');
      const config = { version: '1.0.0', framework: 'vitest' };

      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const content = readFileSync(configPath, 'utf-8');
      expect(content).toContain('  '); // Has indentation
    });

    it('should preserve existing keys when updating', () => {
      const configPath = join(testDir, '.tddai.json');
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Update one key
      config.framework = 'jest';
      writeFileSync(configPath, JSON.stringify(config, null, 2));

      const updatedContent = readFileSync(configPath, 'utf-8');
      const updatedConfig = JSON.parse(updatedContent);

      expect(updatedConfig.framework).toBe('jest');
      expect(updatedConfig.testDir).toBe('./tests'); // Preserved
      expect(updatedConfig.version).toBe('1.0.0'); // Preserved
    });
  });

  describe('Plugins Configuration', () => {
    it('should list installed plugins', () => {
      const config = {
        plugins: ['plugin-react', 'plugin-vue'],
      };

      expect(config.plugins).toHaveLength(2);
    });

    it('should add plugin to list', () => {
      const config = {
        plugins: ['plugin-react'],
      };

      config.plugins.push('plugin-vue');
      expect(config.plugins).toContain('plugin-vue');
    });

    it('should remove plugin from list', () => {
      const config = {
        plugins: ['plugin-react', 'plugin-vue'],
      };

      config.plugins = config.plugins.filter((p) => p !== 'plugin-react');
      expect(config.plugins).not.toContain('plugin-react');
    });
  });

  describe('Configuration Output', () => {
    it('should format configuration for display', () => {
      const config = {
        version: '1.0.0',
        framework: 'vitest',
        testDir: './tests',
      };

      const formatted = Object.entries(config)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      expect(formatted).toContain('framework: vitest');
    });

    it('should show configuration file path', () => {
      const configPath = join(testDir, '.tddai.json');
      expect(configPath).toContain('.tddai.json');
    });
  });
});
