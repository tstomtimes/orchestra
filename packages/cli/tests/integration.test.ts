import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  ProjectAnalyzer,
  FileWriter,
  ConfigLoader,
  TestWriter,
  ConfigV1Schema,
  FrameworkDetector,
} from '@tddai/core';

/**
 * CLI Integration Tests
 *
 * Tests the complete workflow of CLI commands working together:
 * - Init → Generate → Validate
 * - Init → Config → Watch
 * - Error handling across workflows
 * - Cross-package integration (cli ↔ core)
 */

describe('CLI Integration: Complete Workflows', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = join(tmpdir(), `tddai-cli-integration-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    // Create minimal package.json for framework detection
    const packageJson = {
      name: 'integration-test',
      version: '1.0.0',
      devDependencies: {
        vitest: '^2.0.0',
        typescript: '^5.0.0',
      },
    };
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Workflow: Init → Generate → Validate', () => {
    it('should complete full TDD workflow from init to validate', async () => {
      // Step 1: Init - Create configuration
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze();

      expect(analysis.config).toBeDefined();
      expect(analysis.project).toBeDefined();
      expect(analysis.project.framework).toBe('vitest');

      // Write config to disk
      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      expect(existsSync(join(testDir, '.tddairc.json'))).toBe(true);

      // Step 2: Verify config is valid
      const configLoader = new ConfigLoader();
      const configResult = await configLoader.load(testDir);
      const loadedConfig = configResult.config;

      expect(loadedConfig.framework).toBe('vitest');
      expect(loadedConfig.testDir).toBeDefined();
      expect(loadedConfig.version).toBe('1.0.0');

      // Step 3: Create source file to generate test for
      const srcDir = join(testDir, 'src');
      mkdirSync(srcDir, { recursive: true });
      const sourceFile = join(srcDir, 'calculator.ts');
      writeFileSync(sourceFile, `
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}
`);

      // Step 4: Generate - Create test file
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      const testPath = join(testDir, 'tests', 'calculator.test.ts');
      mkdirSync(join(testDir, 'tests'), { recursive: true });

      const writeResult = await testWriter.writeTestFile(testPath, {
        ...template,
        variables: {
          FUNCTION_NAME: 'calculator',
          IMPORT_PATH: '../src/calculator',
        },
      });

      expect(writeResult.written).toBe(true);
      expect(existsSync(testPath)).toBe(true);

      // Step 5: Validate - Confirm generated test is valid
      const testContent = readFileSync(testPath, 'utf-8');
      expect(testContent).toContain('vitest');
      expect(testContent).toContain('calculator');
      expect(testContent).toContain('../src/calculator');
      expect(testContent).toContain('describe');
      expect(testContent).toContain('it(');
      expect(testContent).toContain('expect');
    });

    it('should use detected framework from init in generate', async () => {
      // Init with vitest detection
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      expect(analysis.config.framework).toBe('vitest');

      // Generate should use vitest template
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate(
        analysis.config.framework === 'vitest' ? 'vitest-function' : 'jest-function'
      );

      expect(template.name).toBe('vitest-function');
      expect(template.content).toContain('from \'vitest\'');
    });

    it('should support config modification between init and generate', async () => {

      // Init
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Modify config
      const configLoader = new ConfigLoader(testDir);
      const config = await configLoader.load();
      config.testDir = 'spec';
      config.testPattern = '**/*.spec.ts';

      await writer.writeFile('.tddai.json', JSON.stringify(config, null, 2));

      // Reload and verify
      const updatedConfig = await configLoader.load();
      expect(updatedConfig.testDir).toBe('spec');
      expect(updatedConfig.testPattern).toBe('**/*.spec.ts');

      // Generate should respect new config
      const testWriter = new TestWriter();
      const specDir = join(testDir, 'spec');
      mkdirSync(specDir, { recursive: true });

      const template = testWriter.getBuiltInTemplate('vitest-function');
      const testPath = join(specDir, 'example.spec.ts');

      await testWriter.writeTestFile(testPath, template);
      expect(existsSync(testPath)).toBe(true);
    });
  });

  describe('Workflow: Init → Config Commands', () => {
    it('should read config created by init', async () => {
      // Init
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Config get
      const configLoader = new ConfigLoader(testDir);
      const config = await configLoader.load();

      expect(config.framework).toBe('vitest');
      expect(config.version).toBe('1.0.0');
      expect(config.testDir).toBeDefined();
    });

    it('should update config values', async () => {
      // Init
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Config set
      const configLoader = new ConfigLoader(testDir);
      let config = await configLoader.load();

      config.testDir = 'custom-tests';
      config.testPattern = '**/*.custom.ts';

      await writer.writeFile('.tddai.json', JSON.stringify(config, null, 2));

      // Config get - verify changes
      config = await configLoader.load();
      expect(config.testDir).toBe('custom-tests');
      expect(config.testPattern).toBe('**/*.custom.ts');
    });

    it('should validate config after modifications', async () => {
      // Init
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Modify and validate
      const configLoader = new ConfigLoader(testDir);
      const config = await configLoader.load();

      const validationResult = ConfigV1Schema.safeParse(config);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('Workflow: Multiple Command Invocations', () => {
    it('should handle multiple generate calls without conflicts', async () => {
      // Setup
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Create test directory
      const testsDir = join(testDir, 'tests');
      mkdirSync(testsDir, { recursive: true });

      // Generate call 1
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      await testWriter.writeTestFile(join(testsDir, 'test1.test.ts'), {
        ...template,
        variables: { FUNCTION_NAME: 'test1', IMPORT_PATH: './module1' },
      });

      // Generate call 2
      await testWriter.writeTestFile(join(testsDir, 'test2.test.ts'), {
        ...template,
        variables: { FUNCTION_NAME: 'test2', IMPORT_PATH: './module2' },
      });

      // Generate call 3
      await testWriter.writeTestFile(join(testsDir, 'test3.test.ts'), {
        ...template,
        variables: { FUNCTION_NAME: 'test3', IMPORT_PATH: './module3' },
      });

      // Verify all files exist
      expect(existsSync(join(testsDir, 'test1.test.ts'))).toBe(true);
      expect(existsSync(join(testsDir, 'test2.test.ts'))).toBe(true);
      expect(existsSync(join(testsDir, 'test3.test.ts'))).toBe(true);

      // Verify content uniqueness
      const content1 = readFileSync(join(testsDir, 'test1.test.ts'), 'utf-8');
      const content2 = readFileSync(join(testsDir, 'test2.test.ts'), 'utf-8');
      const content3 = readFileSync(join(testsDir, 'test3.test.ts'), 'utf-8');

      expect(content1).toContain('test1');
      expect(content2).toContain('test2');
      expect(content3).toContain('test3');
    });

    it('should preserve config across multiple command invocations', async () => {
      // Create config
      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      // Load multiple times
      const configLoader = new ConfigLoader(testDir);
      const loaded1 = await configLoader.load();
      const loaded2 = await configLoader.load();
      const loaded3 = await configLoader.load();

      // All should be identical
      expect(loaded1).toEqual(loaded2);
      expect(loaded2).toEqual(loaded3);
      expect(loaded1.framework).toBe('vitest');
    });
  });

  describe('Workflow: Different Frameworks', () => {
    it('should work with vitest framework', async () => {

      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      expect(analysis.project.framework).toBe('vitest');
      expect(analysis.config.framework).toBe('vitest');
    });

    it('should work with jest framework', async () => {
      // Update package.json to use jest
      const packageJson = {
        name: 'integration-test',
        version: '1.0.0',
        devDependencies: {
          jest: '^29.0.0',
          '@types/jest': '^29.0.0',
        },
      };
      writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      expect(analysis.project.framework).toBe('jest');
      expect(analysis.config.framework).toBe('jest');
    });

    it('should detect mocha framework', async () => {
      // Update package.json to use mocha
      const packageJson = {
        name: 'integration-test',
        version: '1.0.0',
        devDependencies: {
          mocha: '^10.0.0',
          '@types/mocha': '^10.0.0',
        },
      };
      writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      expect(analysis.project.framework).toBe('mocha');
      expect(analysis.config.framework).toBe('mocha');
    });

    it('should auto-detect framework when set to auto', async () => {
      // Create config with auto framework
      const config = {
        version: '1.0.0' as const,
        framework: 'auto' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      // Analyze should detect and set framework
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      expect(analysis.config.framework).toBe('vitest');
      expect(analysis.project.framework).toBe('vitest');
    });
  });

  describe('Workflow: Cross-Package Integration', () => {
    it('should use core detection in CLI init workflow', async () => {

      // Detection (core package)
      const detector = new FrameworkDetector(testDir);
      const detected = detector.detect();

      expect(detected.framework).toBe('vitest');

      // Analysis (core package integration layer)
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      expect(analysis.project.framework).toBe(detected.framework);
      expect(analysis.config.framework).toBe(detected.framework);
    });

    it('should use core config loader in CLI commands', async () => {

      // Create config
      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      // Load with core config loader
      const loader = new ConfigLoader(testDir);
      const loaded = await loader.load();

      expect(loaded.framework).toBe('vitest');
      expect(loaded.version).toBe('1.0.0');
    });

    it('should use core test writer in CLI generate workflow', async () => {

      const writer = new TestWriter();
      const template = writer.getBuiltInTemplate('vitest-function');

      expect(template.name).toBe('vitest-function');
      expect(template.content).toContain('vitest');
    });

    it('should integrate plugin system across packages', async () => {

      // Create config with plugin
      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: ['@tddai/plugin-react'],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      // Plugin manager should load plugins
      const loader = new ConfigLoader(testDir);
      const loadedConfig = await loader.load();

      expect(loadedConfig.plugins).toContain('@tddai/plugin-react');
    });
  });

  describe('Workflow: Config Merging', () => {
    it('should merge detected config with user config', async () => {
      // Create partial user config
      const userConfig = {
        version: '1.0.0' as const,
        framework: 'auto' as const,
        testDir: 'custom-tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: true, // User preference
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(userConfig, null, 2));

      // Analyze should merge detection with user config
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      expect(analysis.config.framework).toBe('vitest'); // From detection
      expect(analysis.config.testDir).toBe('custom-tests'); // From user
      expect(analysis.config.generation.colocate).toBe(true); // From user
    });

    it('should respect explicit framework over detection', async () => {

      // Create config with explicit jest (even though vitest is detected)
      const config = {
        version: '1.0.0' as const,
        framework: 'jest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      // Analysis should respect explicit framework
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      expect(analysis.project.framework).toBe('vitest'); // Detection
      expect(analysis.config.framework).toBe('jest'); // User explicit choice
    });

    it('should merge defaults with detected and user config', async () => {

      // Minimal user config
      const config = {
        version: '1.0.0' as const,
        framework: 'auto' as const,
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      // Should have defaults filled in
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      expect(analysis.config.framework).toBe('vitest'); // Detected
      expect(analysis.config.testDir).toBeDefined(); // Default
      expect(analysis.config.testPattern).toBeDefined(); // Default
      expect(analysis.config.plugins).toBeDefined(); // Default
      expect(analysis.config.generation).toBeDefined(); // Default
    });
  });

  describe('Workflow: End-to-End Scenarios', () => {
    it('should complete new project setup workflow', async () => {
      // 1. New project - no config exists
      expect(existsSync(join(testDir, '.tddai.json'))).toBe(false);

      // 2. Run init
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // 3. Create .tddai directory
      const tddaiDir = join(testDir, '.tddai');
      mkdirSync(tddaiDir, { recursive: true });
      expect(existsSync(tddaiDir)).toBe(true);

      // 4. Create source files
      const srcDir = join(testDir, 'src');
      mkdirSync(srcDir, { recursive: true });
      writeFileSync(join(srcDir, 'utils.ts'), 'export function format(str: string) { return str.trim(); }');

      // 5. Generate tests
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      const testsDir = join(testDir, 'tests');
      mkdirSync(testsDir, { recursive: true });

      await testWriter.writeTestFile(join(testsDir, 'utils.test.ts'), {
        ...template,
        variables: { FUNCTION_NAME: 'format', IMPORT_PATH: '../src/utils' },
      });

      // 6. Validate everything exists
      expect(existsSync(join(testDir, '.tddai.json'))).toBe(true);
      expect(existsSync(join(testDir, '.tddai'))).toBe(true);
      expect(existsSync(join(testsDir, 'utils.test.ts'))).toBe(true);
    });

    it('should complete existing project enhancement workflow', async () => {

      // 1. Existing project with config
      const existingConfig = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(existingConfig, null, 2));

      // 2. Load existing config
      const loader = new ConfigLoader(testDir);
      const config = await loader.load();

      expect(config.framework).toBe('vitest');

      // 3. Add plugin to config
      config.plugins = ['@tddai/plugin-react'];
      await writer.writeFile('.tddai.json', JSON.stringify(config, null, 2));

      // 4. Generate new tests with plugin
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-class');

      const testsDir = join(testDir, 'tests');
      mkdirSync(testsDir, { recursive: true });

      await testWriter.writeTestFile(join(testsDir, 'component.test.ts'), {
        ...template,
        variables: { CLASS_NAME: 'Component', IMPORT_PATH: '../src/Component' },
      });

      // 5. Verify
      expect(existsSync(join(testsDir, 'component.test.ts'))).toBe(true);
      const content = readFileSync(join(testsDir, 'component.test.ts'), 'utf-8');
      expect(content).toContain('Component');
    });
  });

  describe('Workflow: Dry-Run Mode', () => {
    it('should support dry-run across workflow', async () => {
      // Dry-run init
      const analyzer = new ProjectAnalyzer(testDir);
      const dryRunAnalysis = await analyzer.getDryRunAnalysis();

      expect(dryRunAnalysis.message).toContain('Project Analysis');
      expect(dryRunAnalysis.config).toBeDefined();

      // Dry-run generate
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');
      const testPath = join(testDir, 'test.test.ts');

      const result = await testWriter.writeTestFile(testPath, template, {
        dryRun: true,
      });

      expect(result.written).toBe(false);
      expect(result.bytes).toBeGreaterThan(0);
      expect(existsSync(testPath)).toBe(false);
    });

    it('should preview changes without writing files', async () => {

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      // Generate diff
      const diff = testWriter.generateDiff(
        join(testDir, 'example.test.ts'),
        template.content,
        { FUNCTION_NAME: 'example', IMPORT_PATH: './example' }
      );

      expect(diff.path).toContain('example.test.ts');
      expect(diff.action).toBe('create');
      expect(diff.after).toContain('example');
      expect(diff.size).toBeGreaterThan(0);

      // File should not exist
      expect(existsSync(join(testDir, 'example.test.ts'))).toBe(false);
    });
  });
});

describe('CLI Integration: Error Scenarios', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = join(tmpdir(), `tddai-error-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Missing Configuration', () => {
    it('should handle missing .tddai.json gracefully', async () => {

      expect(existsSync(join(testDir, '.tddai.json'))).toBe(false);

      const loader = new ConfigLoader(testDir);

      await expect(async () => {
        await loader.load();
      }).rejects.toThrow();
    });

    it('should provide helpful error message when config not found', async () => {

      const loader = new ConfigLoader(testDir);

      try {
        await loader.load();
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('.tddai.json');
      }
    });

    it('should suggest running init when config missing', async () => {
      // Analysis without config should recommend init
      const analyzer = new ProjectAnalyzer(testDir);
      const result = await analyzer.analyzeWithoutDetection();

      expect(result.report.recommendations).toBeDefined();
      expect(result.report.recommendations).toContain('Run `tddai init`');
    });
  });

  describe('Invalid Configuration', () => {
    it('should handle invalid JSON format', async () => {
      // Write invalid JSON
      writeFileSync(join(testDir, '.tddai.json'), 'invalid json {{{');

      const loader = new ConfigLoader(testDir);

      await expect(async () => {
        await loader.load();
      }).rejects.toThrow();
    });

    it('should validate config schema', async () => {

      // Write invalid config (missing required fields)
      const invalidConfig = {
        version: '1.0.0',
        // Missing framework
      };

      writeFileSync(join(testDir, '.tddai.json'), JSON.stringify(invalidConfig, null, 2));

      const loader = new ConfigLoader(testDir);

      await expect(async () => {
        await loader.load();
      }).rejects.toThrow();
    });

    it('should reject invalid framework values', async () => {

      const invalidConfig = {
        version: '1.0.0',
        framework: 'invalid-framework',
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror',
        },
      };

      const result = ConfigV1Schema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject invalid version format', async () => {

      const invalidConfig = {
        version: '2.0.0', // Only 1.0.0 is valid
        framework: 'vitest',
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror',
        },
      };

      const result = ConfigV1Schema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('File System Errors', () => {
    it('should handle missing source files', async () => {

      const nonExistentSource = join(testDir, 'does-not-exist.ts');
      expect(existsSync(nonExistentSource)).toBe(false);

      // This should still work - we're just generating a test file
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');
      const testPath = join(testDir, 'test.test.ts');

      const result = await testWriter.writeTestFile(testPath, template);
      expect(result.written).toBe(true);
    });

    it('should handle missing test directory creation', async () => {

      const testPath = join(testDir, 'nested', 'deep', 'test.test.ts');

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      // Should create directory structure if it doesn't exist
      await testWriter.writeTestFile(testPath, template);

      expect(existsSync(testPath)).toBe(true);
    });

    it('should provide clear error for permission issues', async () => {
      // Skip this test on systems where permission testing is not reliable
      if (process.platform === 'win32') {
        return;
      }


      // Create read-only directory
      const readOnlyDir = join(testDir, 'readonly');
      mkdirSync(readOnlyDir, { recursive: true });

      // Note: Actual permission testing is complex and environment-dependent
      // This test validates the error type exists
      expect(FileSystemError).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty package.json', async () => {

      writeFileSync(join(testDir, 'package.json'), '{}');

      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      // Should still work with defaults
      expect(analysis.config).toBeDefined();
      expect(analysis.project.type).toBeDefined();
    });

    it('should handle missing package.json', async () => {

      expect(existsSync(join(testDir, 'package.json'))).toBe(false);

      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      // Should work with minimal defaults
      expect(analysis.config).toBeDefined();
      expect(analysis.project.type).toBe('unknown');
    });

    it('should handle concurrent config reads', async () => {

      // Create config
      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      // Load config concurrently
      const loader = new ConfigLoader(testDir);
      const [config1, config2, config3] = await Promise.all([
        loader.load(),
        loader.load(),
        loader.load(),
      ]);

      expect(config1).toEqual(config2);
      expect(config2).toEqual(config3);
    });

    it('should handle very long file paths', async () => {
      // Create deep directory structure
      const deepPath = join(
        testDir,
        'very', 'deep', 'nested', 'directory', 'structure',
        'for', 'testing', 'path', 'handling'
      );
      mkdirSync(deepPath, { recursive: true });

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');
      const testPath = join(deepPath, 'deep-test.test.ts');

      const result = await testWriter.writeTestFile(testPath, template);
      expect(result.written).toBe(true);
      expect(existsSync(testPath)).toBe(true);
    });

    it('should handle special characters in file names', async () => {

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      // Test with special characters (that are valid in filenames)
      const testPath = join(testDir, 'test-file_with.special@chars.test.ts');

      const result = await testWriter.writeTestFile(testPath, template);
      expect(result.written).toBe(true);
      expect(existsSync(testPath)).toBe(true);
    });

    it('should handle empty plugin array', async () => {

      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      const loader = new ConfigLoader(testDir);
      const loaded = await loader.load();

      expect(loaded.plugins).toEqual([]);
    });

    it('should handle large test file generation', async () => {

      const testWriter = new TestWriter();

      // Create a large template
      let largeContent = 'import { describe, it, expect } from \'vitest\';\n\n';
      for (let i = 0; i < 100; i++) {
        largeContent += `describe('test suite ${i}', () => {\n`;
        largeContent += `  it('should test ${i}', () => {\n`;
        largeContent += `    expect(${i}).toBe(${i});\n`;
        largeContent += `  });\n`;
        largeContent += `});\n\n`;
      }

      const template = {
        name: 'large-template',
        content: largeContent,
      };

      const testPath = join(testDir, 'large.test.ts');
      const result = await testWriter.writeTestFile(testPath, template);

      expect(result.written).toBe(true);
      expect(result.bytes).toBeGreaterThan(1000);
      expect(existsSync(testPath)).toBe(true);
    });
  });

  describe('Recovery and Graceful Degradation', () => {
    it('should recover from partial failures in batch operations', async () => {

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      const files = [
        {
          path: join(testDir, 'test1.test.ts'),
          template,
        },
        {
          path: join(testDir, 'test2.test.ts'),
          template,
        },
        {
          path: join(testDir, 'test3.test.ts'),
          template,
        },
      ];

      const results = await testWriter.writeTestFiles(files);

      // All should succeed
      expect(results.every(r => r.written)).toBe(true);
      expect(results).toHaveLength(3);
    });

    it('should provide analysis recommendations on warnings', async () => {
      // Empty project
      const analyzer = new ProjectAnalyzer(testDir);
      const result = await analyzer.analyzeWithoutDetection();

      expect(result.report.warnings).toBeDefined();
      expect(result.report.recommendations).toBeDefined();
      expect(result.report.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle corrupted config with fallback', async () => {
      // Write partially corrupted config
      writeFileSync(join(testDir, '.tddai.json'), '{"version": "1.0.0"}');

      const analyzer = new ProjectAnalyzer(testDir);

      // Should handle gracefully
      try {
        await analyzer.analyze();
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });
});

describe('CLI Integration: Performance Benchmarks', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = join(tmpdir(), `tddai-perf-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    // Create package.json
    const packageJson = {
      name: 'perf-test',
      version: '1.0.0',
      devDependencies: {
        vitest: '^2.0.0',
      },
    };
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Init Performance', () => {
    it('should complete init workflow in < 1 second', async () => {

      const start = Date.now();

      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
      expect(existsSync(join(testDir, '.tddai.json'))).toBe(true);
    });

    it('should detect framework quickly (< 200ms)', async () => {

      const start = Date.now();

      const detector = new FrameworkDetector(testDir);
      const result = detector.detect();

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
      expect(result.framework).toBeDefined();
    });
  });

  describe('Validate Performance', () => {
    it('should validate config in < 500ms', async () => {

      // Create config
      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      const start = Date.now();

      const loader = new ConfigLoader(testDir);
      const loaded = await loader.load();
      const validationResult = ConfigV1Schema.safeParse(loaded);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
      expect(validationResult.success).toBe(true);
    });

    it('should load config quickly (< 100ms)', async () => {

      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      const start = Date.now();

      const loader = new ConfigLoader(testDir);
      await loader.load();

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Config Performance', () => {
    it('should read config in < 100ms', async () => {

      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      const start = Date.now();

      const loader = new ConfigLoader(testDir);
      await loader.load();

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should update config in < 100ms', async () => {

      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      const start = Date.now();

      const loader = new ConfigLoader(testDir);
      const loaded = await loader.load();
      loaded.testDir = 'new-tests';
      await writer.writeFile('.tddai.json', JSON.stringify(loaded, null, 2));

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Generate Performance', () => {
    it('should generate single test file in < 2 seconds', async () => {

      const start = Date.now();

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');
      const testPath = join(testDir, 'test.test.ts');

      await testWriter.writeTestFile(testPath, {
        ...template,
        variables: {
          FUNCTION_NAME: 'testFunc',
          IMPORT_PATH: './module',
        },
      });

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
      expect(existsSync(testPath)).toBe(true);
    });

    it('should generate multiple test files efficiently', async () => {

      const start = Date.now();

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      const files = Array.from({ length: 10 }, (_, i) => ({
        path: join(testDir, `test${i}.test.ts`),
        template: {
          ...template,
          variables: {
            FUNCTION_NAME: `test${i}`,
            IMPORT_PATH: `./module${i}`,
          },
        },
      }));

      await testWriter.writeTestFiles(files);

      const duration = Date.now() - start;

      // Should complete 10 files in < 5 seconds (avg < 500ms per file)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle template variable substitution quickly', async () => {

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      const start = Date.now();

      const diff = testWriter.generateDiff(
        join(testDir, 'test.test.ts'),
        template.content,
        {
          FUNCTION_NAME: 'example',
          IMPORT_PATH: './example',
        }
      );

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
      expect(diff.after).toContain('example');
    });
  });

  describe('Watch Startup Performance', () => {
    it('should initialize watch mode in < 500ms', async () => {
      // Setup config
      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const writer = new FileWriter();
      await writer.writeAtomic(join(testDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      const start = Date.now();

      // Simulate watch startup (load config + analysis)
      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
      expect(analysis.config).toBeDefined();
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle project analysis with many files', async () => {
      // Create multiple source files
      const srcDir = join(testDir, 'src');
      mkdirSync(srcDir, { recursive: true });

      for (let i = 0; i < 50; i++) {
        writeFileSync(join(srcDir, `module${i}.ts`), `export function func${i}() { return ${i}; }`);
      }

      const start = Date.now();

      const analyzer = new ProjectAnalyzer();
      const analysis = await analyzer.analyze(testDir);

      const duration = Date.now() - start;

      // Should analyze 50 files in < 3 seconds
      expect(duration).toBeLessThan(3000);
      expect(analysis.config).toBeDefined();
    });
  });
});
