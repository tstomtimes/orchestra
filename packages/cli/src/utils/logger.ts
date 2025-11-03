import chalk from 'chalk';
import { Logger as CoreLogger } from '@tddai/core';

export interface Logger extends CoreLogger {
  success(message: string): void;
  info(message: string): void;
}

export class CLILogger implements Logger {
  private namespace: string;

  constructor(namespace: string = 'tddai') {
    this.namespace = namespace;
  }

  log(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(chalk.red(`✖ ${this.namespace}`), chalk.red(message));
  }

  warn(message: string): void {
    console.warn(chalk.yellow(`⚠ ${this.namespace}`), chalk.yellow(message));
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray(`[${this.namespace}]`), chalk.gray(message));
    }
  }

  success(message: string): void {
    console.log(chalk.green(`✓ ${this.namespace}`), chalk.green(message));
  }

  info(message: string): void {
    console.log(chalk.cyan(`ℹ ${this.namespace}`), chalk.cyan(message));
  }
}

export function createLogger(namespace: string = 'tddai'): Logger {
  return new CLILogger(namespace);
}
