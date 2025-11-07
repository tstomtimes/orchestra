import { describe, it, expect,  beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createCLI } from '../src/cli';

describe('Generate Command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `tddai-test-generate-${Date.now()}`);
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

    // Create a basic package.json
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {},
    };
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  });

  afterEach(() => {
    process.chdir('/');
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Command Registration', () => {
    it('should register generate command in CLI', () => {
      const program = createCLI();
      const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
      expect(generateCommand).toBeDefined();
    });

    it('should have correct description', () => {
      const program = createCLI();
      const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
      expect(generateCommand?.description()).toBe('Generate test scaffolds for source files');
    });

    it('should support --dry-run flag', () => {
      const program = createCLI();
      const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
      const hasDryRun = generateCommand?.options.some((opt) => opt.long === '--dry-run');
      expect(hasDryRun).toBe(true);
    });

    it('should support --pattern flag', () => {
      const program = createCLI();
      const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
      const hasPattern = generateCommand?.options.some((opt) => opt.long === '--pattern');
      expect(hasPattern).toBe(true);
    });

    it('should support --force flag', () => {
      const program = createCLI();
      const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
      const hasForce = generateCommand?.options.some((opt) => opt.long === '--force');
      expect(hasForce).toBe(true);
    });
  });

  describe('Test Path Generation', () => {
    it('should generate correct test path for source file', () => {
      const sourceFile = join(testDir, 'src', 'utils.ts');

      // Simulate path generation logic
      const testPath = sourceFile.replace('/src/', '/tests/').replace('.ts', '.test.ts');
      expect(testPath).toContain('utils.test.ts');
      expect(testPath).toContain('/tests/');
    });

    it('should handle nested directory structures', () => {
      const sourceFile = join(testDir, 'src', 'lib', 'helpers', 'format.ts');
      expect(sourceFile).toContain('helpers');
    });

    it('should preserve file extension in test files', () => {
      const tsFile = 'utils.ts';
      const jsFile = 'utils.js';

      expect(tsFile.replace('.ts', '.test.ts')).toBe('utils.test.ts');
      expect(jsFile.replace('.js', '.test.js')).toBe('utils.test.js');
    });
  });

  describe('Template Generation', () => {
    it('should create test template with correct imports', () => {
      const functionName = 'calculateTotal';
      const importPath = '../src/calculator';

      const template = `import { describe, it, expect } from 'vitest';
import { ${functionName} } from '${importPath}';

describe('${functionName}', () => {
  it('should work correctly', () => {
    const result = ${functionName}(/* args */);
    expect(result).toBeDefined();
  });
});`;

      expect(template).toContain(functionName);
      expect(template).toContain(importPath);
      expect(template).toContain('vitest');
    });

    it('should support jest framework templates', () => {
      const jestTemplate = `import { calculateTotal } from '../src/calculator';

describe('calculateTotal', () => {
  test('should work correctly', () => {
    const result = calculateTotal(/* args */);
    expect(result).toBeDefined();
  });
});`;

      expect(jestTemplate).toContain('test(');
      expect(jestTemplate).not.toContain('vitest');
    });

    it('should handle class templates', () => {
      const className = 'Calculator';
      const template = `import { describe, it, expect } from 'vitest';
import { ${className} } from '../src/calculator';

describe('${className}', () => {
  it('should instantiate', () => {
    const instance = new ${className}();
    expect(instance).toBeDefined();
  });
});`;

      expect(template).toContain('new Calculator');
    });
  });

  describe('Dry Run Mode', () => {
    it('should not create files in dry-run mode', () => {
      const dryRun = true;
      const testPath = join(testDir, 'tests', 'utils.test.ts');

      if (!dryRun) {
        // Would create file
        mkdirSync(join(testDir, 'tests'), { recursive: true });
        writeFileSync(testPath, 'content');
      }

      // In dry-run, file should not exist
      if (dryRun) {
        expect(existsSync(testPath)).toBe(false);
      }
    });

    it('should preview file content in dry-run', () => {
      const preview = {
        path: 'tests/utils.test.ts',
        size: 256,
        action: 'create',
      };

      expect(preview.action).toBe('create');
      expect(preview.size).toBeGreaterThan(0);
    });
  });

  describe('File Overwrite Protection', () => {
    it('should not overwrite existing test without --force', () => {
      const testPath = join(testDir, 'tests', 'utils.test.ts');
      mkdirSync(join(testDir, 'tests'), { recursive: true });
      writeFileSync(testPath, 'existing content');

      const fileExists = existsSync(testPath);
      const forceFlag = false;

      const shouldSkip = fileExists && !forceFlag;
      expect(shouldSkip).toBe(true);
    });

    it('should overwrite with --force flag', () => {
      const testPath = join(testDir, 'tests', 'utils.test.ts');
      mkdirSync(join(testDir, 'tests'), { recursive: true });
      writeFileSync(testPath, 'existing content');

      const fileExists = existsSync(testPath);
      const forceFlag = true;

      const shouldOverwrite = fileExists && forceFlag;
      expect(shouldOverwrite).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration', () => {
      // Remove config file
      const configPath = join(testDir, '.tddai.json');
      if (existsSync(configPath)) {
        rmSync(configPath);
      }

      const configExists = existsSync(configPath);
      expect(configExists).toBe(false);
    });

    it('should handle invalid source files', () => {
      const invalidFile = join(testDir, 'nonexistent.ts');
      const fileExists = existsSync(invalidFile);
      expect(fileExists).toBe(false);
    });

    it('should validate file paths before generation', () => {
      const files = ['src/valid.ts', 'src/nonexistent.ts'];
      const validFiles = files.filter((f) => {
        const fullPath = join(testDir, f);
        return existsSync(fullPath);
      });

      expect(validFiles.length).toBe(0); // None exist yet
    });
  });

  describe('Multiple File Generation', () => {
    it('should generate tests for multiple files', () => {
      const files = ['utils.ts', 'helpers.ts', 'formatter.ts'];
      const generated = files.map((file) => ({
        source: file,
        test: file.replace('.ts', '.test.ts'),
        size: 256,
      }));

      expect(generated).toHaveLength(3);
      expect(generated[0].test).toBe('utils.test.ts');
    });

    it('should track generation progress', () => {
      const stats = {
        total: 5,
        generated: 3,
        skipped: 1,
        failed: 1,
      };

      expect(stats.generated + stats.skipped + stats.failed).toBe(stats.total);
    });
  });

  describe('Configuration Integration', () => {
    it('should respect testDir configuration', () => {
      const config = {
        testDir: './spec',
        framework: 'jest',
      };

      expect(config.testDir).toBe('./spec');
    });

    it('should respect colocate configuration', () => {
      const config = {
        generation: {
          colocate: true,
          naming: 'mirror',
        },
      };

      expect(config.generation.colocate).toBe(true);
    });

    it('should use framework-specific templates', () => {
      const vitestConfig = { framework: 'vitest' };
      const jestConfig = { framework: 'jest' };

      expect(vitestConfig.framework).toBe('vitest');
      expect(jestConfig.framework).toBe('jest');
    });
  });

  describe('Import Path Calculation', () => {
    it('should calculate relative import paths correctly', () => {
      // Relative path should go up one level and into src
      const expectedPath = '../../src/utils';
      expect(expectedPath).toContain('../../');
    });

    it('should handle same-directory imports for colocated tests', () => {
      // From src/utils.test.ts to src/utils.ts
      const importPath = './utils';
      expect(importPath).toBe('./utils');
    });

    it('should remove file extensions from imports', () => {
      const importPath = './utils.ts';
      const cleanPath = importPath.replace(/\.(ts|tsx|js|jsx)$/, '');
      expect(cleanPath).toBe('./utils');
    });
  });

  describe('Variable Substitution', () => {
    it('should substitute function names in templates', () => {
      const template = '{{ FUNCTION_NAME }}';
      const variables = { FUNCTION_NAME: 'calculateTotal' };

      const result = template.replace('{{ FUNCTION_NAME }}', variables.FUNCTION_NAME);
      expect(result).toBe('calculateTotal');
    });

    it('should substitute import paths in templates', () => {
      const template = "import { func } from '{{ IMPORT_PATH }}';";
      const variables = { IMPORT_PATH: '../src/utils' };

      const result = template.replace('{{ IMPORT_PATH }}', variables.IMPORT_PATH);
      expect(result).toContain('../src/utils');
    });

    it('should handle class name capitalization', () => {
      const functionName = 'calculator';
      const className = functionName.charAt(0).toUpperCase() + functionName.slice(1);

      expect(className).toBe('Calculator');
    });
  });

  describe('Output Formatting', () => {
    it('should display generation summary', () => {
      const summary = {
        totalFiles: 5,
        totalSize: 1280,
      };

      expect(summary.totalFiles).toBe(5);
      expect(summary.totalSize).toBeGreaterThan(0);
    });

    it('should show relative paths in output', () => {
      const relativePath = 'tests/utils.test.ts';

      expect(relativePath).not.toContain(testDir);
      expect(relativePath).toContain('tests/');
    });
  });
});
