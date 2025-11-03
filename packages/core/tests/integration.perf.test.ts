import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectAnalyzer } from '../src/integration/project-analyzer.js';
import { TestWriter } from '../src/integration/test-writer.js';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'fs';

describe('Integration Performance', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `tddai-perf-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    // Create a minimal package.json
    const packageJson = {
      name: 'perf-test',
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

  describe('ProjectAnalyzer Performance', () => {
    it('should analyze project in under 100ms', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);

      const start = performance.now();
      const result = await analyzer.analyze();
      const duration = performance.now() - start;

      console.log(`Project analysis time: ${duration.toFixed(2)}ms`);

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(100);
    });

    it('should create command context in under 5ms', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const result = await analyzer.analyze();

      const start = performance.now();
      const context = analyzer.createCommandContext(result);
      const duration = performance.now() - start;

      console.log(`Context creation time: ${duration.toFixed(2)}ms`);

      expect(context).toBeDefined();
      expect(duration).toBeLessThan(5);
    });

    it('should generate dry-run analysis in under 60ms', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);

      const start = performance.now();
      const result = await analyzer.getDryRunAnalysis();
      const duration = performance.now() - start;

      console.log(`Dry-run analysis time: ${duration.toFixed(2)}ms`);

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(60);
    });
  });

  describe('TestWriter Performance', () => {
    it('should write test file in under 10ms', async () => {
      const writer = new TestWriter();
      const testPath = resolve(tmpDir, 'perf-test.ts');

      const template = writer.getBuiltInTemplate('vitest-function');

      const start = performance.now();
      const result = await writer.writeTestFile(testPath, {
        ...template,
        variables: {
          FUNCTION_NAME: 'testFunc',
          IMPORT_PATH: './module',
        },
      });
      const duration = performance.now() - start;

      console.log(`Test file write time: ${duration.toFixed(2)}ms`);

      expect(result.written).toBe(true);
      expect(duration).toBeLessThan(10);
    });

    it('should write 10 test files in under 50ms', async () => {
      const writer = new TestWriter();
      const template = writer.getBuiltInTemplate('vitest-function');

      const files = Array.from({ length: 10 }, (_, i) => ({
        path: resolve(tmpDir, `test${i}.ts`),
        template: {
          ...template,
          variables: {
            FUNCTION_NAME: `testFunc${i}`,
            IMPORT_PATH: `./module${i}`,
          },
        },
      }));

      const start = performance.now();
      const results = await writer.writeTestFiles(files);
      const duration = performance.now() - start;

      console.log(`10 test files write time: ${duration.toFixed(2)}ms (avg: ${(duration / 10).toFixed(2)}ms)`);

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.written)).toBe(true);
      expect(duration).toBeLessThan(50);
    });

    it('should render template in under 1ms', () => {
      const writer = new TestWriter();
      const template = writer.getBuiltInTemplate('vitest-function');

      const start = performance.now();
      const diff = writer.generateDiff(
        resolve(tmpDir, 'test.ts'),
        template.content,
        {
          FUNCTION_NAME: 'testFunc',
          IMPORT_PATH: './module',
        }
      );
      const duration = performance.now() - start;

      console.log(`Template render time: ${duration.toFixed(2)}ms`);

      expect(diff).toBeDefined();
      expect(duration).toBeLessThan(1);
    });
  });

  describe('Full Workflow Performance', () => {
    it('should complete analyze + write workflow in under 60ms', async () => {
      const analyzer = new ProjectAnalyzer(tmpDir);
      const writer = new TestWriter();

      const start = performance.now();

      // Analyze
      const analysis = await analyzer.analyze();

      // Write test file
      const template = writer.getBuiltInTemplate('vitest-function');
      const testPath = resolve(tmpDir, 'example.test.ts');
      await writer.writeTestFile(testPath, {
        ...template,
        variables: {
          FUNCTION_NAME: 'example',
          IMPORT_PATH: './example',
        },
      });

      const duration = performance.now() - start;

      console.log(`Full workflow time: ${duration.toFixed(2)}ms`);

      expect(analysis).toBeDefined();
      expect(existsSync(testPath)).toBe(true);
      expect(duration).toBeLessThan(60);
    });
  });
});
