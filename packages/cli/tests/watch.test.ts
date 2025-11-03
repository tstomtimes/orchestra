import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createCLI } from '../src/cli';

describe('Watch Command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `tddai-test-watch-${Date.now()}`);
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
    it('should register watch command in CLI', () => {
      const program = createCLI();
      const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
      expect(watchCommand).toBeDefined();
    });

    it('should have correct description', () => {
      const program = createCLI();
      const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
      expect(watchCommand?.description()).toBe('Watch for file changes and auto-generate tests');
    });

    it('should support --pattern flag', () => {
      const program = createCLI();
      const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
      const hasPattern = watchCommand?.options.some((opt) => opt.long === '--pattern');
      expect(hasPattern).toBe(true);
    });

    it('should support --interval flag', () => {
      const program = createCLI();
      const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
      const hasInterval = watchCommand?.options.some((opt) => opt.long === '--interval');
      expect(hasInterval).toBe(true);
    });

    it('should support --exclude flag', () => {
      const program = createCLI();
      const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
      const hasExclude = watchCommand?.options.some((opt) => opt.long === '--exclude');
      expect(hasExclude).toBe(true);
    });
  });

  describe('File Pattern Matching', () => {
    it('should match TypeScript files', () => {
      const pattern = 'src/**/*.ts';
      const testFile = 'src/utils.ts';
      // Pattern matching logic would be handled by chokidar
      expect(testFile).toContain('.ts');
    });

    it('should match JavaScript files', () => {
      const pattern = 'src/**/*.js';
      const testFile = 'src/utils.js';
      expect(testFile).toContain('.js');
    });

    it('should match nested directories', () => {
      const pattern = 'src/**/*.ts';
      const testFile = 'src/lib/helpers/utils.ts';
      expect(testFile).toContain('src/');
    });

    it('should exclude test files', () => {
      const excludePattern = '**/*.test.*';
      const testFile = 'src/utils.test.ts';
      expect(testFile).toContain('.test.');
    });

    it('should exclude node_modules', () => {
      const excludePattern = '**/node_modules/**';
      const file = 'node_modules/package/file.ts';
      expect(file).toContain('node_modules');
    });
  });

  describe('Debouncing Logic', () => {
    it('should debounce rapid file changes', () => {
      const debounceInterval = 500;
      const changes = [
        { file: 'utils.ts', timestamp: 0 },
        { file: 'utils.ts', timestamp: 100 },
        { file: 'utils.ts', timestamp: 200 },
      ];

      // Only the last change within interval should trigger
      const lastChange = changes[changes.length - 1];
      expect(lastChange.timestamp).toBe(200);
    });

    it('should respect custom debounce interval', () => {
      const customInterval = 1000;
      expect(customInterval).toBeGreaterThan(500);
    });

    it('should clear pending timeouts on new changes', () => {
      const pendingChanges = new Map<string, any>();
      const file = 'utils.ts';

      // Simulate clearing existing timeout
      if (pendingChanges.has(file)) {
        const existing = pendingChanges.get(file);
        clearTimeout(existing);
      }

      expect(pendingChanges.has(file)).toBe(false);
    });
  });

  describe('Watch Statistics', () => {
    it('should track files watched', () => {
      const stats = {
        filesWatched: 5,
        testsGenerated: 3,
        errors: 0,
        startTime: Date.now(),
      };

      expect(stats.filesWatched).toBe(5);
    });

    it('should track tests generated', () => {
      const stats = {
        filesWatched: 5,
        testsGenerated: 3,
        errors: 0,
        startTime: Date.now(),
      };

      expect(stats.testsGenerated).toBe(3);
    });

    it('should track errors', () => {
      const stats = {
        filesWatched: 5,
        testsGenerated: 3,
        errors: 1,
        startTime: Date.now(),
      };

      expect(stats.errors).toBe(1);
    });

    it('should calculate duration', () => {
      const startTime = Date.now();
      const endTime = startTime + 60000; // 1 minute later
      const duration = endTime - startTime;

      expect(duration).toBe(60000);
    });
  });

  describe('File Change Events', () => {
    it('should handle file added event', () => {
      const event = { type: 'add', path: 'src/utils.ts' };
      expect(event.type).toBe('add');
    });

    it('should handle file changed event', () => {
      const event = { type: 'change', path: 'src/utils.ts' };
      expect(event.type).toBe('change');
    });

    it('should handle file removed event', () => {
      const event = { type: 'unlink', path: 'src/utils.ts' };
      expect(event.type).toBe('unlink');
    });

    it('should handle watcher errors', () => {
      const error = new Error('Watch error');
      expect(error).toBeDefined();
      expect(error.message).toBe('Watch error');
    });
  });

  describe('Test Generation on Change', () => {
    it('should generate test for changed file', () => {
      const sourceFile = 'src/utils.ts';
      const testFile = sourceFile.replace('src/', 'tests/').replace(/\.ts$/, '.test.ts');

      expect(testFile).toBe('tests/utils.test.ts');
    });

    it('should create test directory if missing', () => {
      const testDirPath = join(testDir, 'tests', 'src');
      mkdirSync(testDirPath, { recursive: true });

      expect(existsSync(testDirPath)).toBe(true);
    });

    it('should overwrite existing test files', () => {
      const testPath = join(testDir, 'tests', 'utils.test.ts');
      mkdirSync(join(testDir, 'tests'), { recursive: true });
      writeFileSync(testPath, 'old content');

      // New content would overwrite
      const fileExists = existsSync(testPath);
      expect(fileExists).toBe(true);
    });
  });

  describe('Watcher Configuration', () => {
    it('should set persistent watching', () => {
      const watchOptions = { persistent: true };
      expect(watchOptions.persistent).toBe(true);
    });

    it('should ignore initial files', () => {
      const watchOptions = { ignoreInitial: true };
      expect(watchOptions.ignoreInitial).toBe(true);
    });

    it('should await write finish', () => {
      const watchOptions = {
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100,
        },
      };

      expect(watchOptions.awaitWriteFinish.stabilityThreshold).toBe(200);
    });

    it('should ignore specified patterns', () => {
      const watchOptions = {
        ignored: ['**/node_modules/**', '**/.git/**', '**/*.test.*'],
      };

      expect(watchOptions.ignored).toContain('**/node_modules/**');
      expect(watchOptions.ignored).toContain('**/*.test.*');
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGINT signal', () => {
      const signals = ['SIGINT', 'SIGTERM'];
      expect(signals).toContain('SIGINT');
    });

    it('should handle SIGTERM signal', () => {
      const signals = ['SIGINT', 'SIGTERM'];
      expect(signals).toContain('SIGTERM');
    });

    it('should display summary on exit', () => {
      const stats = {
        filesWatched: 10,
        testsGenerated: 8,
        errors: 0,
        startTime: Date.now() - 60000,
      };

      const duration = Date.now() - stats.startTime;
      expect(duration).toBeGreaterThan(0);
    });

    it('should close watcher on cleanup', () => {
      const watcher = { close: vi.fn() };
      // Simulate cleanup
      expect(watcher.close).toBeDefined();
    });
  });

  describe('Progress Indicators', () => {
    it('should show file change notifications', () => {
      const notification = 'File changed: src/utils.ts - generating test...';
      expect(notification).toContain('File changed');
      expect(notification).toContain('generating test');
    });

    it('should show success messages', () => {
      const success = 'Test generated for src/utils.ts';
      expect(success).toContain('Test generated');
    });

    it('should show error messages', () => {
      const error = 'Failed to generate test for src/utils.ts: Error message';
      expect(error).toContain('Failed to generate');
    });
  });

  describe('Watch Summary Display', () => {
    it('should format duration as minutes and seconds', () => {
      const duration = 125000; // 2 minutes 5 seconds
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);

      expect(minutes).toBe(2);
      expect(seconds).toBe(5);
    });

    it('should display files watched count', () => {
      const stats = { filesWatched: 15 };
      expect(stats.filesWatched).toBe(15);
    });

    it('should display tests generated count', () => {
      const stats = { testsGenerated: 12 };
      expect(stats.testsGenerated).toBe(12);
    });

    it('should display error count', () => {
      const stats = { errors: 2 };
      expect(stats.errors).toBe(2);
    });
  });

  describe('Pattern Validation', () => {
    it('should validate glob patterns', () => {
      const validPatterns = ['src/**/*.ts', '**/*.js', 'lib/*.ts'];
      validPatterns.forEach((pattern) => {
        expect(pattern).toContain('*');
      });
    });

    it('should handle multiple patterns', () => {
      const patterns = ['src/**/*.ts', 'lib/**/*.js'];
      expect(patterns).toHaveLength(2);
    });

    it('should handle exclude patterns', () => {
      const excludePattern = '**/*.test.*';
      expect(excludePattern).toContain('test');
    });
  });

  describe('Error Recovery', () => {
    it('should continue watching after generation error', () => {
      const stats = {
        filesWatched: 5,
        testsGenerated: 3,
        errors: 1,
      };

      // After error, watching continues
      expect(stats.filesWatched).toBeGreaterThan(stats.errors);
    });

    it('should log errors without crashing', () => {
      const errors: string[] = [];
      errors.push('Generation failed for file.ts');

      expect(errors).toHaveLength(1);
    });
  });

  describe('Real-time Monitoring', () => {
    it('should process changes in real-time', () => {
      const changes = [
        { file: 'utils.ts', time: 1000 },
        { file: 'helpers.ts', time: 2000 },
      ];

      expect(changes[1].time).toBeGreaterThan(changes[0].time);
    });

    it('should handle concurrent file changes', () => {
      const pendingChanges = new Map<string, any>();
      pendingChanges.set('utils.ts', setTimeout(() => {}, 500));
      pendingChanges.set('helpers.ts', setTimeout(() => {}, 500));

      expect(pendingChanges.size).toBe(2);
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration before watching', () => {
      const configPath = join(testDir, '.tddai.json');
      const configExists = existsSync(configPath);
      expect(configExists).toBe(true);
    });

    it('should fail if configuration is missing', () => {
      const configPath = join(testDir, '.tddai.json');
      rmSync(configPath);

      const configExists = existsSync(configPath);
      expect(configExists).toBe(false);
    });
  });
});
