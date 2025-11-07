import { Command } from 'commander';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import { ProjectAnalyzer, ConfigV1, ConfigError } from '@tddai/core';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('config');

interface ConfigOptions {
  show?: boolean;
  set?: string;
  get?: string;
  reset?: boolean;
}

export function registerConfigCommand(program: Command): void {
  program
    .command('config [key] [value]')
    .description('View or edit TDD.ai configuration')
    .option('--show', 'Display full configuration')
    .option('--set <key>', 'Set configuration key (followed by value)')
    .option('--get <key>', 'Get configuration value for key')
    .option('--reset', 'Reset configuration to defaults')
    .action(async (key?: string, value?: string, options: ConfigOptions = {}) => {
      try {
        // Handle different config operations
        if (options.reset) {
          await resetConfig();
        } else if (options.show) {
          await showConfig();
        } else if (options.get || key) {
          await getConfigValue(options.get || key!);
        } else if (options.set || (key && value)) {
          const setKey = options.set || key!;
          await setConfigValue(setKey, value!);
        } else {
          // Default: show config
          await showConfig();
        }
      } catch (error) {
        if (error instanceof ConfigError) {
          logger.error(`Configuration error: ${error.message}`);
          logger.info('Run "tddai init" to create configuration');
          process.exit(1);
        }
        logger.error(`Config operation failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
}

async function showConfig(): Promise<void> {
  const configPath = join(process.cwd(), '.tddai.json');

  if (!existsSync(configPath)) {
    throw new ConfigError('Configuration file not found', { path: configPath });
  }

  const analyzer = new ProjectAnalyzer(process.cwd());
  const analysisResult = await analyzer.analyze();
  const config = analysisResult.config;

  console.log('\n' + chalk.bold.cyan('═══════════════════════════════════'));
  console.log(chalk.bold.cyan('   TDD.ai Configuration'));
  console.log(chalk.bold.cyan('═══════════════════════════════════\n'));

  console.log(chalk.bold('Current Configuration:'));
  console.log(`  ${chalk.gray('version:')} ${chalk.cyan(config.version)}`);
  console.log(`  ${chalk.gray('framework:')} ${chalk.cyan(config.framework)}`);
  console.log(`  ${chalk.gray('testDir:')} ${chalk.cyan(config.testDir)}`);
  console.log(`  ${chalk.gray('testPattern:')} ${chalk.cyan(config.testPattern)}`);
  console.log(
    `  ${chalk.gray('plugins:')} ${chalk.cyan(config.plugins.length > 0 ? config.plugins.join(', ') : 'none')}`,
  );

  if (config.generation) {
    console.log(`  ${chalk.gray('generation:')}`);
    console.log(`    ${chalk.gray('colocate:')} ${chalk.cyan(config.generation.colocate)}`);
    console.log(`    ${chalk.gray('naming:')} ${chalk.cyan(config.generation.naming)}`);
  }

  console.log(`\n${chalk.gray('Configuration file:')} ${configPath}`);
  console.log(`${chalk.gray('Use')} ${chalk.yellow('tddai config --set <key> <value>')} ${chalk.gray('to update')}\n`);
}

async function getConfigValue(key: string): Promise<void> {
  const configPath = join(process.cwd(), '.tddai.json');

  if (!existsSync(configPath)) {
    throw new ConfigError('Configuration file not found', { path: configPath });
  }

  const analyzer = new ProjectAnalyzer(process.cwd());
  const analysisResult = await analyzer.analyze();
  const config = analysisResult.config;

  // Support nested keys like "generation.colocate"
  const value = getNestedValue(config as unknown as Record<string, unknown>, key);

  if (value === undefined) {
    logger.error(`Configuration key "${key}" not found`);
    logger.info('Available keys: version, framework, testDir, testPattern, plugins, generation.colocate, generation.naming');
    process.exit(1);
  }

  console.log(chalk.cyan(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)));
}

async function setConfigValue(key: string, value: string): Promise<void> {
  const configPath = join(process.cwd(), '.tddai.json');

  if (!existsSync(configPath)) {
    throw new ConfigError('Configuration file not found', { path: configPath });
  }

  // Read current config
  const configContent = readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent) as ConfigV1;

  // Set nested value
  const parsedValue = parseValue(value);
  setNestedValue(config as unknown as Record<string, unknown>, key, parsedValue);

  // Validate the updated config
  validateConfig(config);

  // Write updated config
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

  logger.success(`Configuration updated: ${key} = ${value}`);
  console.log(chalk.gray(`Configuration saved to ${configPath}`));
}

async function resetConfig(): Promise<void> {
  const configPath = join(process.cwd(), '.tddai.json');

  if (!existsSync(configPath)) {
    throw new ConfigError('Configuration file not found', { path: configPath });
  }

  const defaultConfig: ConfigV1 = {
    version: '1.0.0',
    framework: 'auto',
    testDir: './tests',
    testPattern: '**/*.test.(ts|js)',
    plugins: [],
    generation: {
      colocate: false,
      naming: 'mirror',
    },
  };

  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');

  logger.success('Configuration reset to defaults');
  console.log(chalk.gray(`Configuration saved to ${configPath}`));
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object' && current !== null && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current: Record<string, unknown> = obj;

  // Navigate to the parent object
  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {};
    }
    const next = current[key];
    if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
      current = next as Record<string, unknown>;
    } else {
      current[key] = {};
      current = current[key] as Record<string, unknown>;
    }
  }

  // Set the value
  current[lastKey] = value;
}

function parseValue(value: string): unknown {
  // Try to parse as JSON first (for booleans, numbers, arrays, objects)
  try {
    return JSON.parse(value);
  } catch {
    // If parsing fails, return as string
    return value;
  }
}

function validateConfig(config: ConfigV1): void {
  // Basic validation
  const validFrameworks = ['vitest', 'jest', 'mocha', 'auto'];
  if (!validFrameworks.includes(config.framework)) {
    throw new ConfigError('Invalid framework', {
      framework: config.framework,
      valid: validFrameworks.join(', '),
    });
  }

  if (config.generation) {
    const validNaming = ['mirror', 'kebab', 'flat'];
    if (!validNaming.includes(config.generation.naming)) {
      throw new ConfigError('Invalid generation.naming value', {
        naming: config.generation.naming,
        valid: validNaming.join(', '),
      });
    }

    if (typeof config.generation.colocate !== 'boolean') {
      throw new ConfigError('Invalid generation.colocate value', {
        value: config.generation.colocate,
        expected: 'boolean',
      });
    }
  }

  if (!config.testDir || typeof config.testDir !== 'string') {
    throw new ConfigError('Invalid testDir', { testDir: config.testDir });
  }

  if (!config.testPattern || typeof config.testPattern !== 'string') {
    throw new ConfigError('Invalid testPattern', { testPattern: config.testPattern });
  }

  if (!Array.isArray(config.plugins)) {
    throw new ConfigError('Invalid plugins array', { plugins: config.plugins });
  }
}
