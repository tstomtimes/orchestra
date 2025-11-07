import { Command } from 'commander';
import { join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { ProjectAnalyzer, ConfigSchema } from '@tddai/core';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('validate');

interface ValidateOptions {
  staged?: boolean;
  bail?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ category: string; message: string }>;
  warnings: Array<{ category: string; message: string }>;
  checks: Array<{ name: string; passed: boolean; message?: string }>;
}

export function registerValidateCommand(program: Command): void {
  program
    .command('validate')
    .description('Validate project configuration and setup')
    .option('--staged', 'Validate only staged files (for pre-commit)')
    .option('--bail', 'Exit immediately on first failure')
    .action(async (options: ValidateOptions) => {
      try {
        const result = await validateProject(options);
        displayValidationResults(result);

        // Exit with appropriate code
        process.exit(result.valid ? 0 : 1);
      } catch (error) {
        logger.error(
          `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
      }
    });
}

async function validateProject(_options: ValidateOptions): Promise<ValidationResult> {
  const spinner = ora();
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    checks: [],
  };

  // Check 1: Configuration file exists
  spinner.start('Checking configuration file...');
  const configPath = join(process.cwd(), '.tddai.json');
  const configExists = existsSync(configPath);

  if (!configExists) {
    result.valid = false;
    result.errors.push({
      category: 'Configuration',
      message: 'Configuration file (.tddai.json) not found',
    });
    result.checks.push({
      name: 'Configuration file exists',
      passed: false,
      message: 'Run "tddai init" to create configuration',
    });
    spinner.fail('Configuration file not found');
    return result;
  }

  result.checks.push({ name: 'Configuration file exists', passed: true });
  spinner.succeed('Configuration file found');

  // Check 2: Load and validate configuration schema
  spinner.start('Validating configuration schema...');
  const analyzer = new ProjectAnalyzer(process.cwd());
  let config;

  try {
    const analysisResult = await analyzer.analyze();
    config = analysisResult.config;

    // Validate against schema
    const parseResult = ConfigSchema.safeParse(config);
    if (!parseResult.success) {
      result.valid = false;
      result.errors.push({
        category: 'Configuration',
        message: 'Configuration schema validation failed',
      });
      parseResult.error.errors.forEach((err) => {
        result.errors.push({
          category: 'Schema',
          message: `${err.path.join('.')}: ${err.message}`,
        });
      });
      result.checks.push({
        name: 'Configuration schema valid',
        passed: false,
        message: 'See errors above for details',
      });
      spinner.fail('Configuration schema invalid');
    } else {
      result.checks.push({ name: 'Configuration schema valid', passed: true });
      spinner.succeed('Configuration schema valid');
    }
  } catch (error) {
    result.valid = false;
    result.errors.push({
      category: 'Configuration',
      message: error instanceof Error ? error.message : String(error),
    });
    result.checks.push({
      name: 'Configuration loads correctly',
      passed: false,
      message: 'Configuration file is malformed',
    });
    spinner.fail('Failed to load configuration');
    return result;
  }

  // Check 3: Test framework installation
  spinner.start('Checking test framework installation...');
  const frameworkInstalled = await checkFrameworkInstalled(config.framework);

  if (!frameworkInstalled) {
    result.valid = false;
    result.errors.push({
      category: 'Dependencies',
      message: `Test framework "${config.framework}" is not installed`,
    });
    result.checks.push({
      name: 'Test framework installed',
      passed: false,
      message: `Install ${config.framework} to run tests`,
    });
    spinner.fail('Test framework not installed');
  } else {
    result.checks.push({ name: 'Test framework installed', passed: true });
    spinner.succeed('Test framework installed');
  }

  // Check 4: Test directory exists or can be created
  spinner.start('Checking test directory...');
  const testDirPath = join(process.cwd(), config.testDir);
  const testDirExists = existsSync(testDirPath);

  if (!testDirExists) {
    result.warnings.push({
      category: 'Structure',
      message: `Test directory "${config.testDir}" does not exist`,
    });
    result.checks.push({
      name: 'Test directory exists',
      passed: false,
      message: 'Test directory will be created during generation',
    });
    spinner.warn('Test directory does not exist');
  } else {
    result.checks.push({ name: 'Test directory exists', passed: true });
    spinner.succeed('Test directory exists');
  }

  // Check 5: .tddai directory structure
  spinner.start('Checking .tddai directory structure...');
  const tddaiDir = join(process.cwd(), '.tddai');
  const tddaiDirExists = existsSync(tddaiDir);

  if (!tddaiDirExists) {
    result.warnings.push({
      category: 'Structure',
      message: '.tddai directory not found',
    });
    result.checks.push({
      name: '.tddai directory exists',
      passed: false,
      message: 'Run "tddai init" to create directory structure',
    });
    spinner.warn('.tddai directory not found');
  } else {
    const pluginsDir = join(tddaiDir, 'plugins');
    const templatesDir = join(tddaiDir, 'templates');

    const pluginsDirExists = existsSync(pluginsDir);
    const templatesDirExists = existsSync(templatesDir);

    if (!pluginsDirExists || !templatesDirExists) {
      result.warnings.push({
        category: 'Structure',
        message: '.tddai subdirectories incomplete',
      });
      result.checks.push({
        name: '.tddai structure complete',
        passed: false,
        message: 'Missing plugins or templates directory',
      });
      spinner.warn('.tddai structure incomplete');
    } else {
      result.checks.push({ name: '.tddai structure complete', passed: true });
      spinner.succeed('.tddai directory structure complete');
    }
  }

  // Check 6: Package.json exists
  spinner.start('Checking package.json...');
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJsonExists = existsSync(packageJsonPath);

  if (!packageJsonExists) {
    result.warnings.push({
      category: 'Project',
      message: 'package.json not found in project root',
    });
    result.checks.push({
      name: 'package.json exists',
      passed: false,
      message: 'Node.js project structure recommended',
    });
    spinner.warn('package.json not found');
  } else {
    result.checks.push({ name: 'package.json exists', passed: true });
    spinner.succeed('package.json exists');
  }

  return result;
}

async function checkFrameworkInstalled(framework: string): Promise<boolean> {
  if (framework === 'auto') {
    // Check for any common test framework
    return (
      (await checkPackageInstalled('vitest')) ||
      (await checkPackageInstalled('jest')) ||
      (await checkPackageInstalled('mocha'))
    );
  }

  return await checkPackageInstalled(framework);
}

async function checkPackageInstalled(packageName: string): Promise<boolean> {
  try {
    // Try to resolve the package
    const packageJsonPath = join(process.cwd(), 'node_modules', packageName, 'package.json');
    return existsSync(packageJsonPath);
  } catch {
    return false;
  }
}

function displayValidationResults(result: ValidationResult): void {
  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════'));
  console.log(
    chalk.bold.cyan(
      `   Validation ${result.valid ? chalk.green('PASSED') : chalk.red('FAILED')}`,
    ),
  );
  console.log(chalk.bold.cyan('═══════════════════════════════════\n'));

  // Display checks
  console.log(chalk.bold('Checks:'));
  for (const check of result.checks) {
    const icon = check.passed ? chalk.green('✓') : chalk.red('✗');
    console.log(`  ${icon} ${check.name}`);
    if (check.message) {
      console.log(`    ${chalk.gray(check.message)}`);
    }
  }

  // Display errors
  if (result.errors.length > 0) {
    console.log(`\n${chalk.bold.red('Errors:')}`);
    for (const error of result.errors) {
      console.log(`  ${chalk.red('✗')} ${chalk.gray(`[${error.category}]`)} ${error.message}`);
    }
  }

  // Display warnings
  if (result.warnings.length > 0) {
    console.log(`\n${chalk.bold.yellow('Warnings:')}`);
    for (const warning of result.warnings) {
      console.log(
        `  ${chalk.yellow('⚠')} ${chalk.gray(`[${warning.category}]`)} ${warning.message}`,
      );
    }
  }

  // Display recommendations
  if (!result.valid || result.warnings.length > 0) {
    console.log(`\n${chalk.bold('Recommendations:')}`);

    if (result.errors.some((e) => e.message.includes('not found'))) {
      console.log(`  1. ${chalk.yellow('Run "tddai init" to initialize or fix configuration')}`);
    }

    if (result.errors.some((e) => e.category === 'Dependencies')) {
      console.log(`  2. ${chalk.yellow('Install missing test framework dependencies')}`);
    }

    if (result.warnings.some((w) => w.category === 'Structure')) {
      console.log(`  3. ${chalk.yellow('Create missing directories or run "tddai init"')}`);
    }
  }

  // Summary
  console.log(`\n${chalk.bold('Summary:')}`);
  console.log(
    `  ${chalk.gray('Status:')} ${result.valid ? chalk.green('Valid') : chalk.red('Invalid')}`,
  );
  console.log(`  ${chalk.gray('Errors:')} ${chalk.red(result.errors.length)}`);
  console.log(`  ${chalk.gray('Warnings:')} ${chalk.yellow(result.warnings.length)}`);
  console.log(
    `  ${chalk.gray('Checks passed:')} ${chalk.cyan(result.checks.filter((c) => c.passed).length)}/${result.checks.length}\n`,
  );
}
