import { Command } from 'commander';
import { VERSION } from '@tddai/core';
import { registerInitCommand } from './commands/init.js';
import { registerGenerateCommand } from './commands/generate.js';
import { registerWatchCommand } from './commands/watch.js';
import { registerValidateCommand } from './commands/validate.js';
import { registerConfigCommand } from './commands/config.js';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('tddai')
    .description('AI-powered TDD workflow automation')
    .version(VERSION);

  // Register commands
  registerInitCommand(program);
  registerGenerateCommand(program);
  registerWatchCommand(program);
  registerValidateCommand(program);
  registerConfigCommand(program);

  return program;
}

export async function main(): Promise<void> {
  const program = createCLI();
  await program.parseAsync(process.argv);
}
