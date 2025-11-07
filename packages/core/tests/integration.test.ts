import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectAnalyzer } from '../src/integration/project-analyzer.js';
import { TestWriter } from '../src/integration/test-writer.js';
import { FileWriter } from '../src/fs/writer.js';
import { ConfigLoader } from '../src/config/loader.js';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'fs';

describe('ProjectAnalyzer', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `tddai-integration-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    // Create a minimal package.json for testing
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      devDependencies: {
        vitest: '^0.34.0',
        typescript: '^5.0.0',
      },
    };
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  });

  afterEach(() => {
    try {
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('analyze', () => {
    it('should analyze project with detection and config', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyze();

      expect(result.project).toBeDefined();
      expect(result.config).toBeDefined();
      expect(result.report).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.config.version).toBe('1.0.0');
    });

    it('should detect vitest framework from package.json', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyze();

      expect(result.project.framework).toBe('vitest');
      expect(result.config.framework).toBe('vitest');
    });

    it('should merge detection with config framework', async () => {
      // Create a config file with auto framework
      const configContent = {
        version: '1.0.0',
        framework: 'auto',
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
      };
      writeFileSync(join(tmpDir, '.tddairc.json'), JSON.stringify(configContent, null, 2));

      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyze();

      // Config framework should be set from detection
      expect(result.config.framework).toBe('vitest');
    });

    it('should respect explicit framework in config', async () => {
      // Create a config file with explicit framework
      const configContent = {
        version: '1.0.0',
        framework: 'jest',
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: [],
      };
      writeFileSync(join(tmpDir, '.tddairc.json'), JSON.stringify(configContent, null, 2));

      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyze();

      // Config framework should remain jest
      expect(result.config.framework).toBe('jest');
    });

    it('should handle projects without detection', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyze();

      expect(result.project.type).toBeDefined();
      expect(result.config.testDir).toBe('tests');
    });
  });

  describe('analyzeWithoutDetection', () => {
    it('should load config without detection', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyzeWithoutDetection();

      expect(result.config).toBeDefined();
      expect(result.report.recommendations).toBeDefined();
      expect(result.report.recommendations).toContain('Run `tddai init` to auto-detect project type');
    });

    it('should create minimal project info', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyzeWithoutDetection();

      expect(result.project.type).toBe('unknown');
      expect(result.project.confidence).toBe(0.5);
      expect(result.project.packageManager).toBe('npm');
    });

    it('should include warnings about incomplete analysis', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyzeWithoutDetection();

      expect(result.report.warnings).toBeDefined();
      expect(result.report.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('createCommandContext', () => {
    it('should create valid command context', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyze();
      const context = analyzer.createCommandContext(result);

      expect(context.cwd).toBe(tmpDir);
      expect(context.config).toBeDefined();
      expect(context.projectInfo).toBeDefined();
      expect(context.logger).toBeDefined();
      expect(context.dryRun).toBe(false);
      expect(context.verbose).toBe(false);
    });

    it('should use analysis result data', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyze();
      const context = analyzer.createCommandContext(result);

      expect(context.config).toBe(result.config);
      expect(context.projectInfo).toBe(result.project);
    });
  });

  describe('getDryRunAnalysis', () => {
    it('should generate dry-run analysis message', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.getDryRunAnalysis();

      expect(result.message).toContain('Project Analysis');
      expect(result.message).toContain('Framework');
      expect(result.message).toContain('Test Directory');
      expect(result.message).toContain('Test Pattern');
      expect(result.message).toContain('Confidence');
    });

    it('should include project and config data', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.getDryRunAnalysis();

      expect(result.project).toBeDefined();
      expect(result.config).toBeDefined();
    });

    it('should format confidence as percentage', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.getDryRunAnalysis();

      expect(result.message).toMatch(/Confidence: \d+%/);
    });
  });
});

describe('TestWriter', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `tddai-writer-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    try {
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('writeTestFile', () => {
    it('should write test file from template', async () => {
      const writer = new TestWriter();
      const testPath = resolve(tmpDir, 'test.ts');

      const template = {
        name: 'test-template',
        content: 'describe("test", () => { });',
      };

      const result = await writer.writeTestFile(testPath, template);

      expect(result.written).toBe(true);
      expect(result.path).toBe(testPath);
      expect(result.bytes).toBeGreaterThan(0);
      expect(existsSync(testPath)).toBe(true);
    });

    it('should render template variables', async () => {
      const writer = new TestWriter();
      const testPath = resolve(tmpDir, 'test.ts');

      const template = {
        name: 'test-template',
        content: 'describe("{{ FUNCTION_NAME }}", () => { });',
        variables: {
          FUNCTION_NAME: 'myFunction',
        },
      };

      const result = await writer.writeTestFile(testPath, template);

      expect(result.written).toBe(true);
      const content = readFileSync(testPath, 'utf-8');
      expect(content).toContain('myFunction');
      expect(content).not.toContain('{{ FUNCTION_NAME }}');
    });

    it('should support multiple variables', async () => {
      const writer = new TestWriter();
      const testPath = resolve(tmpDir, 'test.ts');

      const template = {
        name: 'test-template',
        content: 'import { {{ FUNCTION_NAME }} } from "{{ IMPORT_PATH }}";',
        variables: {
          FUNCTION_NAME: 'testFunc',
          IMPORT_PATH: './module',
        },
      };

      const result = await writer.writeTestFile(testPath, template);

      expect(result.written).toBe(true);
      const content = readFileSync(testPath, 'utf-8');
      expect(content).toContain('testFunc');
      expect(content).toContain('./module');
    });

    it('should support dry-run mode', async () => {
      const writer = new TestWriter();
      const testPath = resolve(tmpDir, 'test.ts');

      const template = {
        name: 'test-template',
        content: 'describe("test", () => { });',
      };

      const result = await writer.writeTestFile(testPath, template, {
        dryRun: true,
      });

      expect(result.written).toBe(false);
      expect(result.bytes).toBeGreaterThan(0);
      expect(existsSync(testPath)).toBe(false);
    });

    it('should create backup when enabled', async () => {
      const writer = new TestWriter();
      const testPath = resolve(tmpDir, 'test.ts');

      // Create initial file
      writeFileSync(testPath, 'original content');

      const template = {
        name: 'test-template',
        content: 'new content',
      };

      const result = await writer.writeTestFile(testPath, template, {
        backup: true,
      });

      expect(result.written).toBe(true);
      expect(existsSync(`${testPath}.bak`)).toBe(true);
      const backupContent = readFileSync(`${testPath}.bak`, 'utf-8');
      expect(backupContent).toBe('original content');
    });
  });

  describe('writeTestFiles', () => {
    it('should write multiple test files', async () => {
      const writer = new TestWriter();

      const files = [
        {
          path: resolve(tmpDir, 'test1.ts'),
          template: {
            name: 'test1',
            content: 'describe("test1", () => { });',
          },
        },
        {
          path: resolve(tmpDir, 'test2.ts'),
          template: {
            name: 'test2',
            content: 'describe("test2", () => { });',
          },
        },
      ];

      const results = await writer.writeTestFiles(files);

      expect(results).toHaveLength(2);
      expect(results[0].written).toBe(true);
      expect(results[1].written).toBe(true);
      expect(existsSync(files[0].path)).toBe(true);
      expect(existsSync(files[1].path)).toBe(true);
    });

    it('should handle empty file list', async () => {
      const writer = new TestWriter();
      const results = await writer.writeTestFiles([]);

      expect(results).toHaveLength(0);
    });

    it('should apply options to all files', async () => {
      const writer = new TestWriter();

      const files = [
        {
          path: resolve(tmpDir, 'test1.ts'),
          template: {
            name: 'test1',
            content: 'describe("test1", () => { });',
          },
        },
        {
          path: resolve(tmpDir, 'test2.ts'),
          template: {
            name: 'test2',
            content: 'describe("test2", () => { });',
          },
        },
      ];

      const results = await writer.writeTestFiles(files, { dryRun: true });

      expect(results[0].written).toBe(false);
      expect(results[1].written).toBe(false);
      expect(existsSync(files[0].path)).toBe(false);
      expect(existsSync(files[1].path)).toBe(false);
    });
  });

  describe('getBuiltInTemplate', () => {
    it('should retrieve vitest-function template', () => {
      const writer = new TestWriter();
      const template = writer.getBuiltInTemplate('vitest-function');

      expect(template.name).toBe('vitest-function');
      expect(template.content).toContain('import { describe, it, expect }');
      expect(template.content).toContain('from \'vitest\'');
    });

    it('should retrieve jest-function template', () => {
      const writer = new TestWriter();
      const template = writer.getBuiltInTemplate('jest-function');

      expect(template.name).toBe('jest-function');
      expect(template.content).toContain('describe');
      expect(template.content).toContain('test(');
    });

    it('should retrieve vitest-class template', () => {
      const writer = new TestWriter();
      const template = writer.getBuiltInTemplate('vitest-class');

      expect(template.name).toBe('vitest-class');
      expect(template.content).toContain('{{ CLASS_NAME }}');
      expect(template.content).toContain('new {{ CLASS_NAME }}()');
    });

    it('should throw on unknown template', () => {
      const writer = new TestWriter();

      expect(() => {
        writer.getBuiltInTemplate('unknown-template');
      }).toThrow('Unknown template');
    });

    it('should include available templates in error', () => {
      const writer = new TestWriter();

      try {
        writer.getBuiltInTemplate('unknown-template');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.details.available).toBeDefined();
        expect(error.details.available).toContain('vitest-function');
      }
    });
  });

  describe('generateDiff', () => {
    it('should generate file diff', () => {
      const writer = new TestWriter();
      const testPath = resolve(tmpDir, 'test.ts');

      const diff = writer.generateDiff(testPath, 'describe("test", () => { });');

      expect(diff.path).toBe(testPath);
      expect(diff.action).toBe('create');
      expect(diff.after).toBeDefined();
      expect(diff.size).toBeGreaterThan(0);
    });

    it('should render variables in diff', () => {
      const writer = new TestWriter();
      const testPath = resolve(tmpDir, 'test.ts');

      const diff = writer.generateDiff(
        testPath,
        'describe("{{ NAME }}", () => { });',
        { NAME: 'myTest' }
      );

      expect(diff.after).toContain('myTest');
      expect(diff.after).not.toContain('{{ NAME }}');
    });

    it('should calculate correct size', () => {
      const writer = new TestWriter();
      const testPath = resolve(tmpDir, 'test.ts');
      const content = 'describe("test", () => { });';

      const diff = writer.generateDiff(testPath, content);

      expect(diff.size).toBe(Buffer.byteLength(content, 'utf-8'));
    });
  });
});

describe('Integration: ProjectAnalyzer + TestWriter', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `tddai-full-integration-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    // Create a minimal package.json
    const packageJson = {
      name: 'integration-test',
      version: '1.0.0',
      devDependencies: {
        vitest: '^0.34.0',
      },
    };
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  });

  afterEach(() => {
    try {
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should complete full workflow: analyze + write', async () => {
    const analyzer = new ProjectAnalyzer(tmpDir);
    const writer = new TestWriter();

    // Analyze project
    const analysis = await analyzer.analyze();
    expect(analysis.project).toBeDefined();
    expect(analysis.config).toBeDefined();

    // Write test file using template
    const template = writer.getBuiltInTemplate('vitest-function');
    const testPath = resolve(tmpDir, 'example.test.ts');

    const result = await writer.writeTestFile(testPath, {
      ...template,
      variables: {
        FUNCTION_NAME: 'testFunction',
        IMPORT_PATH: './module',
      },
    });

    expect(result.written).toBe(true);
    expect(existsSync(testPath)).toBe(true);

    const content = readFileSync(testPath, 'utf-8');
    expect(content).toContain('testFunction');
    expect(content).toContain('./module');
  });

  it('should support dry-run workflow', async () => {
    const analyzer = new ProjectAnalyzer(tmpDir);
    const writer = new TestWriter();

    // Analyze project
    const dryRunAnalysis = await analyzer.getDryRunAnalysis();
    expect(dryRunAnalysis.message).toContain('Dry-run');

    // Write test file in dry-run mode
    const template = writer.getBuiltInTemplate('vitest-function');
    const testPath = resolve(tmpDir, 'example.test.ts');

    const result = await writer.writeTestFile(testPath, template, {
      dryRun: true,
    });

    expect(result.written).toBe(false);
    expect(existsSync(testPath)).toBe(false);
  });

  it('should create context for command execution', async () => {
    const analyzer = new ProjectAnalyzer(tmpDir);

    const analysis = await analyzer.analyze();
    const context = analyzer.createCommandContext(analysis);

    expect(context.cwd).toBe(tmpDir);
    expect(context.config.framework).toBe('vitest');
    expect(context.projectInfo.framework).toBe('vitest');
  });

  it('should handle framework detection and template selection', async () => {
    const analyzer = new ProjectAnalyzer(tmpDir);
    const writer = new TestWriter();

    const analysis = await analyzer.analyze();

    // Use detected framework to select template
    const templateName =
      analysis.config.framework === 'vitest' ? 'vitest-function' : 'jest-function';
    const template = writer.getBuiltInTemplate(templateName);

    expect(template.name).toBe('vitest-function');
    expect(template.content).toContain('vitest');
  });
});

describe('Cross-Package Integration: CLI + Core Workflows', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `tddai-cross-integration-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpDir, { recursive: true });

    const packageJson = {
      name: 'cross-package-test',
      version: '1.0.0',
      devDependencies: {
        vitest: '^2.0.0',
        typescript: '^5.0.0',
      },
    };
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  });

  afterEach(() => {
    try {
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Complete Project Setup Workflow', () => {
    it('should execute full init → generate → validate workflow', async () => {
      // Step 1: Project Analysis (Core)
      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      expect(analysis.project.framework).toBe('vitest');
      expect(analysis.config.framework).toBe('vitest');

      // Step 2: Write configuration (Core)
      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      expect(existsSync(join(tmpDir, '.tddairc.json'))).toBe(true);

      // Step 3: Create source file
      mkdirSync(join(tmpDir, 'src'), { recursive: true });
      writeFileSync(
        join(tmpDir, 'src', 'math.ts'),
        'export function add(a: number, b: number) { return a + b; }'
      );

      // Step 4: Generate test (Core)
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      mkdirSync(join(tmpDir, 'tests'), { recursive: true });
      const testPath = join(tmpDir, 'tests', 'math.test.ts');

      await testWriter.writeTestFile(testPath, {
        ...template,
        variables: {
          FUNCTION_NAME: 'add',
          IMPORT_PATH: '../src/math',
        },
      });

      // Step 5: Validate (Core)
      expect(existsSync(testPath)).toBe(true);
      const testContent = readFileSync(testPath, 'utf-8');
      expect(testContent).toContain('vitest');
      expect(testContent).toContain('add');
      expect(testContent).toContain('../src/math');
    });

    it('should handle multi-file project setup', async () => {
      // Analyze project
      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      // Write config
      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Create multiple source files
      const srcDir = join(tmpDir, 'src');
      mkdirSync(srcDir, { recursive: true });

      const sourceFiles = ['utils.ts', 'helpers.ts', 'validators.ts'];
      sourceFiles.forEach((file, i) => {
        writeFileSync(
          join(srcDir, file),
          `export function func${i}() { return ${i}; }`
        );
      });

      // Generate tests for all files
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      const testsDir = join(tmpDir, 'tests');
      mkdirSync(testsDir, { recursive: true });

      const testFiles = sourceFiles.map((file, i) => ({
        path: join(testsDir, file.replace('.ts', '.test.ts')),
        template: {
          ...template,
          variables: {
            FUNCTION_NAME: `func${i}`,
            IMPORT_PATH: `../src/${file.replace('.ts', '')}`,
          },
        },
      }));

      const results = await testWriter.writeTestFiles(testFiles);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.written)).toBe(true);
    });

    it('should support config-driven generation', async () => {
      // Create config with custom settings
      const customConfig = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'spec',
        testPattern: '**/*.spec.ts',
        plugins: [],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(customConfig, null, 2));

      // Load config
      const loader = new ConfigLoader();
      const result = await loader.load(tmpDir);

      expect(result.config.testDir).toBe('spec');
      expect(result.config.testPattern).toBe('**/*.spec.ts');

      // Generate using config
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      const specDir = join(tmpDir, 'spec');
      mkdirSync(specDir, { recursive: true });

      await testWriter.writeTestFile(join(specDir, 'example.spec.ts'), template);
      expect(existsSync(join(specDir, 'example.spec.ts'))).toBe(true);
    });
  });

  describe('Framework Detection and Usage', () => {
    it('should detect vitest and use vitest templates', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      expect(analysis.project.framework).toBe('vitest');

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');

      expect(template.content).toContain('from \'vitest\'');
    });

    it('should detect jest and use jest templates', async () => {
      // Update package.json
      const packageJson = {
        name: 'jest-test',
        version: '1.0.0',
        devDependencies: {
          jest: '^29.0.0',
          '@types/jest': '^29.0.0',
        },
      };
      writeFileSync(join(tmpDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      expect(analysis.project.framework).toBe('jest');

      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('jest-function');

      expect(template.content).toContain('describe');
    });

    it('should support framework override in config', async () => {
      // Detect vitest
      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      expect(analysis.project.framework).toBe('vitest');

      // Override to jest in config
      analysis.config.framework = 'jest';

      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Reload and verify
      const loader = new ConfigLoader();
      const result = await loader.load(tmpDir);

      expect(result.config.framework).toBe('jest');
    });
  });

  describe('Plugin System Integration', () => {
    it('should integrate plugin configuration', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      // Add plugin to config
      analysis.config.plugins = ['@tddai/plugin-react'];

      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Verify plugin is persisted
      const loader = new ConfigLoader();
      const result = await loader.load(tmpDir);

      expect(result.config.plugins).toContain('@tddai/plugin-react');
    });

    it('should support multiple plugins', async () => {
      const config = {
        version: '1.0.0' as const,
        framework: 'vitest' as const,
        testDir: 'tests',
        testPattern: '**/*.test.ts',
        plugins: ['@tddai/plugin-react', '@tddai/plugin-vue'],
        generation: {
          colocate: false,
          naming: 'mirror' as const,
        },
      };

      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(config, null, 2));

      const loader = new ConfigLoader();
      const result = await loader.load(tmpDir);
      const loadedConfig = result.config;

      expect(loadedConfig.plugins).toHaveLength(2);
      expect(loadedConfig.plugins).toContain('@tddai/plugin-react');
      expect(loadedConfig.plugins).toContain('@tddai/plugin-vue');
    });
  });

  describe('Error Handling Across Packages', () => {
    it('should propagate config errors from core to CLI', async () => {
      // Write invalid config
      writeFileSync(join(tmpDir, '.tddairc.json'), 'invalid json');

      const loader = new ConfigLoader();

      await expect(async () => {
        await loader.load(tmpDir);
      }).rejects.toThrow();
    });

    it('should handle missing dependencies gracefully', async () => {
      // Remove package.json
      rmSync(join(tmpDir, 'package.json'));

      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      // Should still work with defaults
      expect(analysis.config).toBeDefined();
      // When no package.json exists, detection may default to 'javascript' or 'unknown'
      expect(['unknown', 'javascript']).toContain(analysis.project.type);
    });

    it('should validate schema across packages', async () => {
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

      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(invalidConfig, null, 2));

      const loader = new ConfigLoader();

      await expect(async () => {
        await loader.load(tmpDir);
      }).rejects.toThrow();
    });
  });

  describe('Performance Across Packages', () => {
    it('should complete full workflow in reasonable time', async () => {
      const start = Date.now();

      // Init
      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Generate
      const testWriter = new TestWriter();
      const template = testWriter.getBuiltInTemplate('vitest-function');
      const testPath = join(tmpDir, 'test.test.ts');

      await testWriter.writeTestFile(testPath, template);

      // Validate
      const loader = new ConfigLoader();
      await loader.load(tmpDir);

      const duration = Date.now() - start;

      // Complete workflow should be fast
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Data Flow Between Packages', () => {
    it('should pass project info from core to CLI commands', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      // Create command context
      const context = analyzer.createCommandContext(analysis);

      expect(context.projectInfo).toBe(analysis.project);
      expect(context.config).toBe(analysis.config);
      expect(context.cwd).toBe(tmpDir);
    });

    it('should share config between core components', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Load in different component
      const loader = new ConfigLoader();
      const result = await loader.load(tmpDir);
      const loadedConfig = result.config;

      expect(loadedConfig).toEqual(analysis.config);
    });

    it('should maintain config consistency across operations', async () => {
      // Create initial config
      const analyzer = new ProjectAnalyzer(tmpDir);
      const analysis = await analyzer.analyze();

      const fileWriter = new FileWriter();
      await fileWriter.writeAtomic(join(tmpDir, '.tddairc.json'), JSON.stringify(analysis.config, null, 2));

      // Multiple operations
      const loader = new ConfigLoader();
      const result1 = await loader.load(tmpDir);
      const result2 = await loader.load(tmpDir);
      const result3 = await loader.load(tmpDir);
      const config1 = result1.config;
      const config2 = result2.config;
      const config3 = result3.config;

      // All should be identical
      expect(config1).toEqual(config2);
      expect(config2).toEqual(config3);
    });
  });
});
