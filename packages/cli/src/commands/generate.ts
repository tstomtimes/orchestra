import { Command } from 'commander';
import { join, relative, dirname, basename, extname } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import {
  ProjectAnalyzer,
  TestWriter,
  TestTemplate,
  ConfigError,
  FileSystemError,
} from '@tddai/core';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('generate');

interface GenerateOptions {
  dryRun?: boolean;
  pattern?: string;
  force?: boolean;
  watch?: boolean;
}

export function registerGenerateCommand(program: Command): void {
  program
    .command('generate [files...]')
    .description('Generate test scaffolds for source files')
    .option('--dry-run', 'Preview changes without writing files')
    .option('--pattern <glob>', 'Generate tests matching glob pattern')
    .option('--force', 'Overwrite existing test files')
    .option('--watch', 'Watch for changes and regenerate')
    .action(async (files: string[], options: GenerateOptions) => {
      try {
        await generateTests(files, options);
      } catch (error) {
        if (error instanceof ConfigError) {
          logger.error(`Configuration error: ${error.message}`);
          logger.info('Run "tddai init" to create configuration');
          process.exit(1);
        }
        if (error instanceof FileSystemError) {
          logger.error(`File system error: ${error.message}`);
          process.exit(1);
        }
        logger.error(
          `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}

async function generateTests(files: string[], options: GenerateOptions): Promise<void> {
  const spinner = ora();

  // Step 1: Load project configuration
  spinner.start('Loading project configuration...');
  const analyzer = new ProjectAnalyzer(process.cwd());
  let analysisResult;

  try {
    analysisResult = await analyzer.analyze();
  } catch (error) {
    spinner.fail('Configuration not found');
    throw new ConfigError('No .tddai.json found. Run "tddai init" first.', {
      cwd: process.cwd(),
    });
  }

  const { config, project } = analysisResult;
  spinner.succeed('Configuration loaded');

  // Step 2: Determine source files to process
  if (files.length === 0 && !options.pattern) {
    logger.error('No files specified. Provide file paths or use --pattern <glob>');
    process.exit(1);
  }

  const sourceFiles = files.filter((file) => {
    const fullPath = join(process.cwd(), file);
    if (!existsSync(fullPath)) {
      logger.warn(`File not found: ${file}`);
      return false;
    }
    return true;
  });

  if (sourceFiles.length === 0) {
    logger.error('No valid source files found');
    process.exit(1);
  }

  // Step 3: Generate test files
  const testWriter = new TestWriter();
  const generated: Array<{ source: string; test: string; size: number }> = [];

  for (const sourceFile of sourceFiles) {
    const testPath = getTestPath(sourceFile, config.testDir, config.generation?.colocate);
    const template = createTestTemplate(sourceFile, testPath, project.framework);

    if (options.dryRun) {
      // Dry-run: Show what would be generated
      const diff = testWriter.generateDiff(testPath, template.content, template.variables);
      logger.info(`Would create: ${chalk.cyan(testPath)} (${diff.size} bytes)`);
      generated.push({ source: sourceFile, test: testPath, size: diff.size });
    } else {
      // Check if test file exists
      const testExists = existsSync(testPath);
      if (testExists && !options.force) {
        logger.warn(`Test exists (use --force to overwrite): ${testPath}`);
        continue;
      }

      // Write test file
      spinner.start(`Generating test for ${chalk.cyan(relative(process.cwd(), sourceFile))}...`);
      try {
        const result = await testWriter.writeTestFile(testPath, template, {
          backup: testExists,
        });
        spinner.succeed(`Generated: ${chalk.green(relative(process.cwd(), testPath))}`);
        generated.push({ source: sourceFile, test: testPath, size: result.size });
      } catch (error) {
        spinner.fail(`Failed to generate test for ${sourceFile}`);
        throw error;
      }
    }
  }

  // Step 4: Display summary
  displayGenerationSummary(generated, options.dryRun || false);

  if (options.watch) {
    logger.info('Use "tddai watch" command for continuous generation');
  }
}

function getTestPath(
  sourceFile: string,
  testDir: string,
  colocate: boolean = false,
): string {
  const cwd = process.cwd();
  const relativePath = relative(cwd, sourceFile);
  const ext = extname(sourceFile);
  const baseNameWithoutExt = basename(sourceFile, ext);
  const dir = dirname(relativePath);

  if (colocate) {
    // Place test file next to source file
    return join(cwd, dir, `${baseNameWithoutExt}.test${ext}`);
  } else {
    // Mirror directory structure in test directory
    const testFileName = `${baseNameWithoutExt}.test${ext}`;
    return join(cwd, testDir, dir, testFileName);
  }
}

function createTestTemplate(
  sourceFile: string,
  testPath: string,
  framework: string,
): TestTemplate {
  const ext = extname(sourceFile);
  const baseNameWithoutExt = basename(sourceFile, ext);
  const isTypeScript = ext === '.ts' || ext === '.tsx';

  // Calculate import path from test to source
  const testDir = dirname(testPath);
  const sourceDir = dirname(sourceFile);
  const relativeImport = relative(testDir, sourceFile).replace(/\\/g, '/');
  const importPath = relativeImport.startsWith('.') ? relativeImport : `./${relativeImport}`;
  const importPathWithoutExt = importPath.replace(/\.(ts|tsx|js|jsx)$/, '');

  const variables = {
    FUNCTION_NAME: baseNameWithoutExt,
    CLASS_NAME: baseNameWithoutExt.charAt(0).toUpperCase() + baseNameWithoutExt.slice(1),
    IMPORT_PATH: importPathWithoutExt,
    SOURCE_FILE: relative(process.cwd(), sourceFile),
  };

  // Choose template based on framework
  let templateName = 'vitest-function';
  if (framework === 'jest') {
    templateName = 'jest-function';
  }

  const testWriter = new TestWriter();
  const baseTemplate = testWriter.getBuiltInTemplate(templateName);

  return {
    name: templateName,
    content: baseTemplate.content,
    variables,
  };
}

function displayGenerationSummary(
  generated: Array<{ source: string; test: string; size: number }>,
  dryRun: boolean,
): void {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════'));
  console.log(chalk.bold.cyan(`   Test Generation ${dryRun ? '(Dry Run) ' : ''}Complete!`));
  console.log(chalk.bold.cyan('═══════════════════════════════════\n'));

  console.log(chalk.bold('Generated Tests:'));
  for (const item of generated) {
    const rel = relative(process.cwd(), item.test);
    console.log(`  ${chalk.gray('→')} ${chalk.cyan(rel)} ${chalk.gray(`(${item.size} bytes)`)}`);
  }

  console.log(`\n${chalk.bold('Summary:')}`);
  console.log(`  ${chalk.gray('Total files:')} ${chalk.cyan(generated.length)}`);
  const totalSize = generated.reduce((sum, item) => sum + item.size, 0);
  console.log(`  ${chalk.gray('Total size:')} ${chalk.cyan(`${totalSize} bytes`)}`);

  if (!dryRun) {
    console.log(`\n${chalk.bold('Next Steps:')}`);
    console.log(`  1. ${chalk.yellow('Review and customize generated tests')}`);
    console.log(`  2. ${chalk.yellow('Run your test suite to verify')}`);
    console.log(`  3. ${chalk.yellow('Use tddai watch for continuous generation')}\n`);
  } else {
    console.log(`\n${chalk.gray('Run without --dry-run to create these files')}\n`);
  }
}
