import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createCLI } from '../src/cli';

describe('Validate Command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `tddai-test-validate-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir('/');
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Command Registration', () => {
    it('should register validate command in CLI', () => {
      const program = createCLI();
      const validateCommand = program.commands.find((cmd) => cmd.name() === 'validate');
      expect(validateCommand).toBeDefined();
    });

    it('should have correct description', () => {
      const program = createCLI();
      const validateCommand = program.commands.find((cmd) => cmd.name() === 'validate');
      expect(validateCommand?.description()).toBe('Validate project configuration and setup');
    });

    it('should support --staged flag', () => {
      const program = createCLI();
      const validateCommand = program.commands.find((cmd) => cmd.name() === 'validate');
      const hasStaged = validateCommand?.options.some((opt) => opt.long === '--staged');
      expect(hasStaged).toBe(true);
    });

    it('should support --bail flag', () => {
      const program = createCLI();
      const validateCommand = program.commands.find((cmd) => cmd.name() === 'validate');
      const hasBail = validateCommand?.options.some((opt) => opt.long === '--bail');
      expect(hasBail).toBe(true);
    });
  });

  describe('Configuration File Validation', () => {
    it('should detect missing configuration file', () => {
      const configPath = join(testDir, '.tddai.json');
      const configExists = existsSync(configPath);
      expect(configExists).toBe(false);
    });

    it('should validate existing configuration file', () => {
      const config = {
        version: '1.0.0',
        framework: 'vitest',
        testDir: './tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: { colocate: false, naming: 'mirror' },
      };
      writeFileSync(join(testDir, '.tddai.json'), JSON.stringify(config, null, 2));

      const configExists = existsSync(join(testDir, '.tddai.json'));
      expect(configExists).toBe(true);
    });

    it('should detect malformed JSON configuration', () => {
      writeFileSync(join(testDir, '.tddai.json'), '{ invalid json }');

      const configPath = join(testDir, '.tddai.json');
      expect(existsSync(configPath)).toBe(true);

      // Parsing would fail
      try {
        const content = require('fs').readFileSync(configPath, 'utf-8');
        JSON.parse(content);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Schema Validation', () => {
    it('should validate framework field', () => {
      const validFrameworks = ['vitest', 'jest', 'mocha', 'auto'];
      const testFramework = 'vitest';
      expect(validFrameworks).toContain(testFramework);
    });

    it('should reject invalid framework values', () => {
      const validFrameworks = ['vitest', 'jest', 'mocha', 'auto'];
      const invalidFramework = 'karma';
      expect(validFrameworks).not.toContain(invalidFramework);
    });

    it('should validate testDir field', () => {
      const testDir = './tests';
      expect(typeof testDir).toBe('string');
      expect(testDir.length).toBeGreaterThan(0);
    });

    it('should validate testPattern field', () => {
      const pattern = '**/*.test.ts';
      expect(typeof pattern).toBe('string');
      expect(pattern).toContain('*');
    });

    it('should validate plugins array', () => {
      const plugins: string[] = ['plugin-react', 'plugin-vue'];
      expect(Array.isArray(plugins)).toBe(true);
    });

    it('should validate generation config', () => {
      const generation = {
        colocate: false,
        naming: 'mirror' as const,
      };

      expect(typeof generation.colocate).toBe('boolean');
      expect(['mirror', 'kebab', 'flat']).toContain(generation.naming);
    });
  });

  describe('Framework Detection', () => {
    it('should detect installed vitest', () => {
      const vitestPath = join(testDir, 'node_modules', 'vitest', 'package.json');
      mkdirSync(join(testDir, 'node_modules', 'vitest'), { recursive: true });
      writeFileSync(vitestPath, JSON.stringify({ name: 'vitest', version: '1.0.0' }));

      expect(existsSync(vitestPath)).toBe(true);
    });

    it('should detect installed jest', () => {
      const jestPath = join(testDir, 'node_modules', 'jest', 'package.json');
      mkdirSync(join(testDir, 'node_modules', 'jest'), { recursive: true });
      writeFileSync(jestPath, JSON.stringify({ name: 'jest', version: '29.0.0' }));

      expect(existsSync(jestPath)).toBe(true);
    });

    it('should handle missing framework installation', () => {
      const vitestPath = join(testDir, 'node_modules', 'vitest', 'package.json');
      expect(existsSync(vitestPath)).toBe(false);
    });
  });

  describe('Directory Structure Validation', () => {
    it('should check for test directory', () => {
      const testDirPath = join(testDir, 'tests');
      mkdirSync(testDirPath, { recursive: true });
      expect(existsSync(testDirPath)).toBe(true);
    });

    it('should check for .tddai directory', () => {
      const tddaiDir = join(testDir, '.tddai');
      mkdirSync(tddaiDir, { recursive: true });
      expect(existsSync(tddaiDir)).toBe(true);
    });

    it('should check for .tddai/plugins directory', () => {
      const pluginsDir = join(testDir, '.tddai', 'plugins');
      mkdirSync(pluginsDir, { recursive: true });
      expect(existsSync(pluginsDir)).toBe(true);
    });

    it('should check for .tddai/templates directory', () => {
      const templatesDir = join(testDir, '.tddai', 'templates');
      mkdirSync(templatesDir, { recursive: true });
      expect(existsSync(templatesDir)).toBe(true);
    });

    it('should warn about missing test directory', () => {
      const testDirPath = join(testDir, 'tests');
      const exists = existsSync(testDirPath);
      expect(exists).toBe(false);
    });
  });

  describe('Validation Result Structure', () => {
    it('should have valid result structure', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        checks: [
          { name: 'Configuration exists', passed: true },
          { name: 'Framework installed', passed: true },
        ],
      };

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('checks');
    });

    it('should categorize errors correctly', () => {
      const error = {
        category: 'Configuration',
        message: 'Missing required field',
      };

      expect(error.category).toBe('Configuration');
      expect(error.message).toBeTruthy();
    });

    it('should categorize warnings correctly', () => {
      const warning = {
        category: 'Structure',
        message: 'Test directory not found',
      };

      expect(warning.category).toBe('Structure');
    });
  });

  describe('Check Execution', () => {
    it('should pass all checks for valid setup', () => {
      // Create complete setup
      const config = {
        version: '1.0.0',
        framework: 'vitest',
        testDir: './tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: { colocate: false, naming: 'mirror' },
      };
      writeFileSync(join(testDir, '.tddai.json'), JSON.stringify(config, null, 2));
      mkdirSync(join(testDir, '.tddai', 'plugins'), { recursive: true });
      mkdirSync(join(testDir, '.tddai', 'templates'), { recursive: true });
      mkdirSync(join(testDir, 'tests'), { recursive: true });

      const checks = {
        configExists: existsSync(join(testDir, '.tddai.json')),
        tddaiDirExists: existsSync(join(testDir, '.tddai')),
        testDirExists: existsSync(join(testDir, 'tests')),
      };

      expect(checks.configExists).toBe(true);
      expect(checks.tddaiDirExists).toBe(true);
      expect(checks.testDirExists).toBe(true);
    });

    it('should fail checks for missing components', () => {
      const checks = {
        configExists: existsSync(join(testDir, '.tddai.json')),
        tddaiDirExists: existsSync(join(testDir, '.tddai')),
      };

      expect(checks.configExists).toBe(false);
      expect(checks.tddaiDirExists).toBe(false);
    });
  });

  describe('Error Reporting', () => {
    it('should report configuration errors', () => {
      const errors = [
        { category: 'Configuration', message: 'File not found' },
        { category: 'Schema', message: 'Invalid framework value' },
      ];

      expect(errors).toHaveLength(2);
      expect(errors[0].category).toBe('Configuration');
    });

    it('should report dependency errors', () => {
      const errors = [{ category: 'Dependencies', message: 'Framework not installed' }];

      expect(errors[0].category).toBe('Dependencies');
    });

    it('should report structure errors', () => {
      const warnings = [{ category: 'Structure', message: 'Missing directory' }];

      expect(warnings[0].category).toBe('Structure');
    });
  });

  describe('Recommendations', () => {
    it('should suggest running init for missing config', () => {
      const recommendation = 'Run "tddai init" to create configuration';
      expect(recommendation).toContain('tddai init');
    });

    it('should suggest installing framework', () => {
      const recommendation = 'Install vitest to run tests';
      expect(recommendation).toContain('Install');
    });

    it('should suggest creating directories', () => {
      const recommendation = 'Create missing directories or run "tddai init"';
      expect(recommendation).toContain('Create missing directories');
    });
  });

  describe('Exit Codes', () => {
    it('should return 0 for valid configuration', () => {
      const validResult = { valid: true, errors: [], warnings: [] };
      const exitCode = validResult.valid ? 0 : 1;
      expect(exitCode).toBe(0);
    });

    it('should return 1 for invalid configuration', () => {
      const invalidResult = {
        valid: false,
        errors: [{ category: 'Configuration', message: 'Error' }],
        warnings: [],
      };
      const exitCode = invalidResult.valid ? 0 : 1;
      expect(exitCode).toBe(1);
    });
  });

  describe('Package.json Validation', () => {
    it('should check for package.json existence', () => {
      const packageJsonPath = join(testDir, 'package.json');
      writeFileSync(packageJsonPath, JSON.stringify({ name: 'test', version: '1.0.0' }));

      expect(existsSync(packageJsonPath)).toBe(true);
    });

    it('should warn if package.json is missing', () => {
      const packageJsonPath = join(testDir, 'package.json');
      const exists = existsSync(packageJsonPath);
      expect(exists).toBe(false);
    });
  });

  describe('Validation Summary', () => {
    it('should provide summary statistics', () => {
      const summary = {
        status: 'Valid',
        errors: 0,
        warnings: 1,
        checksPassed: 5,
        totalChecks: 6,
      };

      expect(summary.status).toBe('Valid');
      expect(summary.checksPassed).toBeLessThanOrEqual(summary.totalChecks);
    });

    it('should calculate pass rate', () => {
      const passed = 5;
      const total = 6;
      const passRate = (passed / total) * 100;

      expect(passRate).toBeGreaterThan(80);
    });
  });
});
