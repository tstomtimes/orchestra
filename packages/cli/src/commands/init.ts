import { Command } from 'commander';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { prompt } from 'enquirer';
import {
  ProjectAnalyzer,
  FileWriter,
  ConfigV1,
  ConfigError,
  ProjectInfo,
} from '@tddai/core';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('init');

interface InitOptions {
  force?: boolean;
  yes?: boolean;
  framework?: string;
}

interface UserResponses {
  framework: 'vitest' | 'jest' | 'mocha' | 'auto';
  testDir: string;
  confirmPlugins: boolean;
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize TDD.ai in current project')
    .option('--force', 'Overwrite existing configuration')
    .option('--yes', 'Use recommended defaults (non-interactive mode)')
    .option('--framework <name>', 'Specify test framework (vitest, jest, mocha, auto)')
    .action(async (options: InitOptions) => {
      try {
        await initializeProject(options);
      } catch (error) {
        if (error instanceof ConfigError) {
          logger.error(`Configuration error: ${error.message}`);
          process.exit(1);
        }
        logger.error(
          `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}

async function initializeProject(options: InitOptions): Promise<void> {
  const spinner = ora();

  // Step 1: Analyze project
  spinner.start('Analyzing project...');
  const analyzer = new ProjectAnalyzer(process.cwd());
  const analysisResult = await analyzer.analyze();
  spinner.succeed('Project analysis complete');

  // Step 2: Check for existing config
  const configPath = join(process.cwd(), '.tddai.json');
  const configExists = existsSync(configPath);

  if (configExists && !options.force) {
    logger.error(
      'Configuration already exists. Use --force to overwrite or remove .tddai.json',
    );
    process.exit(1);
  }

  // Step 3: Get user responses
  const responses = await getUserResponses(
    analysisResult.project,
    analysisResult.config,
    options,
  );

  // Step 4: Create configuration
  spinner.start('Creating configuration...');
  const config = createConfig(responses, analysisResult.config);
  spinner.succeed('Configuration created');

  // Step 5: Write configuration file
  spinner.start('Writing configuration file...');
  const fileWriter = new FileWriter();
  await fileWriter.writeAtomic(configPath, JSON.stringify(config, null, 2));
  spinner.succeed(chalk.green(`✓ Configuration written to ${configPath}`));

  // Step 6: Create .tddai directory
  spinner.start('Setting up .tddai directory...');
  const tddaiDir = join(process.cwd(), '.tddai');
  mkdirSync(tddaiDir, { recursive: true });
  const pluginsDir = join(tddaiDir, 'plugins');
  mkdirSync(pluginsDir, { recursive: true });
  const templatesDir = join(tddaiDir, 'templates');
  mkdirSync(templatesDir, { recursive: true });
  spinner.succeed(chalk.green('✓ .tddai directory structure created'));

  // Step 7: Display summary
  displaySetupSummary(config, analysisResult.project);
}

async function getUserResponses(
  projectInfo: ProjectInfo,
  currentConfig: ConfigV1,
  options: InitOptions,
): Promise<UserResponses> {
  // Non-interactive mode with --yes flag
  if (options.yes) {
    return {
      framework: options.framework as 'vitest' | 'jest' | 'mocha' | 'auto' || projectInfo.framework || 'auto',
      testDir: currentConfig.testDir || './tests',
      confirmPlugins: true,
    };
  }

  // Interactive mode with prompts
  const responses = await prompt<UserResponses>([
    {
      type: 'select',
      name: 'framework',
      message: 'Which test framework are you using?',
      choices: [
        {
          name: 'auto',
          message: `Auto-detect (Detected: ${projectInfo.framework || 'unknown'})`,
        },
        { name: 'vitest', message: 'Vitest' },
        { name: 'jest', message: 'Jest' },
        { name: 'mocha', message: 'Mocha' },
      ],
      initial: projectInfo.framework === 'unknown' ? 0 : undefined,
    } as any,
    {
      type: 'input',
      name: 'testDir',
      message: 'Where are your tests located?',
      initial: currentConfig.testDir || './tests',
    } as any,
    {
      type: 'confirm',
      name: 'confirmPlugins',
      message: `Install recommended plugins? (${projectInfo.suggestedPlugins?.join(', ') || 'none'})`,
      initial: false,
    } as any,
  ]);

  return responses;
}

function createConfig(responses: UserResponses, baseConfig: ConfigV1): ConfigV1 {
  return {
    version: '1.0.0',
    framework: responses.framework,
    testDir: responses.testDir,
    testPattern: baseConfig.testPattern || '**/*.test.(ts|js)',
    plugins: responses.confirmPlugins ? baseConfig.plugins || [] : [],
    generation: baseConfig.generation || {
      colocate: false,
      naming: 'mirror',
    },
  };
}

function displaySetupSummary(config: ConfigV1, projectInfo: ProjectInfo): void {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════'));
  console.log(chalk.bold.cyan('   TDD.ai Initialization Complete!  '));
  console.log(chalk.bold.cyan('═══════════════════════════════════\n'));

  console.log(chalk.bold('Project Configuration:'));
  console.log(`  ${chalk.gray('Framework:')} ${chalk.cyan(config.framework)}`);
  console.log(`  ${chalk.gray('Test Directory:')} ${chalk.cyan(config.testDir)}`);
  console.log(`  ${chalk.gray('Test Pattern:')} ${chalk.cyan(config.testPattern)}`);
  console.log(`  ${chalk.gray('Package Manager:')} ${chalk.cyan(projectInfo.packageManager)}`);

  console.log(`\n${chalk.bold('Next Steps:')}`);
  console.log(`  1. ${chalk.yellow('tddai generate')} - Generate test files`);
  console.log(`  2. ${chalk.yellow('tddai validate')} - Validate your setup`);
  console.log(`  3. ${chalk.yellow('tddai watch')} - Watch for changes and generate tests\n`);

  console.log(`${chalk.bold('Documentation:')} https://github.com/anthropics/tddai\n`);
}

