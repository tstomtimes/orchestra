import { Command } from 'commander';
import { join, relative, dirname, basename, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import chokidar from 'chokidar';
import {
  ProjectAnalyzer,
  TestWriter,
  TestTemplate,
  ConfigError,
} from '@tddai/core';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('watch');

interface WatchOptions {
  pattern?: string;
  interval?: string;
  exclude?: string;
}

interface WatchStats {
  filesWatched: number;
  testsGenerated: number;
  errors: number;
  startTime: number;
}

export function registerWatchCommand(program: Command): void {
  program
    .command('watch [pattern]')
    .description('Watch for file changes and auto-generate tests')
    .option('--pattern <pattern>', 'File pattern to watch', 'src/**/*.ts')
    .option('--interval <ms>', 'Debounce interval in milliseconds', '500')
    .option('--exclude <pattern>', 'Pattern to exclude from watching')
    .action(async (pattern?: string, options: WatchOptions = {}) => {
      try {
        const watchPattern = pattern || options.pattern || 'src/**/*.ts';
        await watchFiles(watchPattern, options);
      } catch (error) {
        if (error instanceof ConfigError) {
          logger.error(`Configuration error: ${error.message}`);
          logger.info('Run "tddai init" to create configuration');
          process.exit(1);
        }
        logger.error(
          `Watch failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}

async function watchFiles(pattern: string, options: WatchOptions): Promise<void> {
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

  // Step 2: Initialize watch statistics
  const stats: WatchStats = {
    filesWatched: 0,
    testsGenerated: 0,
    errors: 0,
    startTime: Date.now(),
  };

  // Step 3: Set up debouncing
  const debounceInterval = parseInt(options.interval || '500', 10);
  const pendingChanges = new Map<string, NodeJS.Timeout>();

  // Step 4: Create TestWriter instance
  const testWriter = new TestWriter();

  // Step 5: Display watch start message
  displayWatchStart(pattern, config.testDir, debounceInterval);

  // Step 6: Set up file watcher
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const watchOptions: any = {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/*.test.*',
      '**/*.spec.*',
      options.exclude,
    ].filter(Boolean) as string[],
  };

  const watcher = chokidar.watch(pattern, watchOptions);

  // Step 7: Handle file changes
  watcher.on('add', (filePath) => {
    stats.filesWatched++;
    handleFileChange(filePath, 'added');
  });

  watcher.on('change', (filePath) => {
    handleFileChange(filePath, 'changed');
  });

  watcher.on('unlink', (filePath) => {
    logger.info(`File removed: ${chalk.gray(relative(process.cwd(), filePath))}`);
  });

  watcher.on('error', (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Watcher error: ${errorMessage}`);
    stats.errors++;
  });

  watcher.on('ready', () => {
    logger.success(`Watching for changes... ${chalk.gray('(Press Ctrl+C to stop)')}`);
  });

  // Step 8: Handle graceful shutdown
  const cleanup = async () => {
    console.log('\n');
    spinner.start('Stopping file watcher...');
    await watcher.close();
    spinner.succeed('File watcher stopped');
    displayWatchSummary(stats);
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // File change handler with debouncing
  function handleFileChange(filePath: string, changeType: 'added' | 'changed'): void {
    // Clear existing timeout for this file
    const existing = pendingChanges.get(filePath);
    if (existing) {
      clearTimeout(existing);
    }

    // Set new timeout for debouncing
    const timeout = setTimeout(async () => {
      pendingChanges.delete(filePath);

      const relPath = relative(process.cwd(), filePath);
      logger.info(
        `File ${changeType}: ${chalk.cyan(relPath)} - ${chalk.gray('generating test...')}`,
      );

      try {
        await generateTestForFile(
          filePath,
          config.testDir,
          config.generation?.colocate || false,
          project.framework,
          testWriter,
        );
        stats.testsGenerated++;
        logger.success(`Test generated for ${chalk.green(relPath)}`);
      } catch (error) {
        stats.errors++;
        logger.error(
          `Failed to generate test for ${relPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }, debounceInterval);

    pendingChanges.set(filePath, timeout);
  }
}

async function generateTestForFile(
  sourceFile: string,
  testDir: string,
  colocate: boolean,
  framework: string,
  testWriter: TestWriter,
): Promise<void> {
  const testPath = getTestPath(sourceFile, testDir, colocate);
  const template = createTestTemplate(sourceFile, testPath, framework, testWriter);

  // Ensure test directory exists
  const testDirPath = dirname(testPath);
  if (!existsSync(testDirPath)) {
    mkdirSync(testDirPath, { recursive: true });
  }

  // Write test file (overwrite if exists)
  const testExists = existsSync(testPath);
  await testWriter.writeTestFile(testPath, template, {
    backup: testExists,
  });
}

function getTestPath(sourceFile: string, testDir: string, colocate: boolean): string {
  const cwd = process.cwd();
  const relativePath = relative(cwd, sourceFile);
  const ext = extname(sourceFile);
  const baseNameWithoutExt = basename(sourceFile, ext);
  const dir = dirname(relativePath);

  if (colocate) {
    return join(cwd, dir, `${baseNameWithoutExt}.test${ext}`);
  } else {
    const testFileName = `${baseNameWithoutExt}.test${ext}`;
    return join(cwd, testDir, dir, testFileName);
  }
}

function createTestTemplate(
  sourceFile: string,
  testPath: string,
  framework: string,
  tw: TestWriter,
): TestTemplate {
  const ext = extname(sourceFile);
  const baseNameWithoutExt = basename(sourceFile, ext);

  // Calculate import path from test to source
  const testDir = dirname(testPath);
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

  const baseTemplate = tw.getBuiltInTemplate(templateName);

  return {
    name: templateName,
    content: baseTemplate.content,
    variables,
  };
}

function displayWatchStart(pattern: string, testDir: string, interval: number): void {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════'));
  console.log(chalk.bold.cyan('   TDD.ai File Watcher Started'));
  console.log(chalk.bold.cyan('═══════════════════════════════════\n'));

  console.log(chalk.bold('Watch Configuration:'));
  console.log(`  ${chalk.gray('Pattern:')} ${chalk.cyan(pattern)}`);
  console.log(`  ${chalk.gray('Test Directory:')} ${chalk.cyan(testDir)}`);
  console.log(`  ${chalk.gray('Debounce Interval:')} ${chalk.cyan(`${interval}ms`)}`);
  console.log(
    `  ${chalk.gray('Excluding:')} ${chalk.cyan('node_modules, .git, dist, build, test files')}\n`,
  );
}

function displayWatchSummary(stats: WatchStats): void {
  const duration = Date.now() - stats.startTime;
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);

  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════'));
  console.log(chalk.bold.cyan('   Watch Session Summary'));
  console.log(chalk.bold.cyan('═══════════════════════════════════\n'));

  console.log(chalk.bold('Statistics:'));
  console.log(`  ${chalk.gray('Files watched:')} ${chalk.cyan(stats.filesWatched)}`);
  console.log(`  ${chalk.gray('Tests generated:')} ${chalk.green(stats.testsGenerated)}`);
  console.log(`  ${chalk.gray('Errors:')} ${chalk.red(stats.errors)}`);
  console.log(`  ${chalk.gray('Duration:')} ${chalk.cyan(`${minutes}m ${seconds}s`)}\n`);
}
