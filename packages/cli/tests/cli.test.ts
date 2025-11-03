import { describe, it, expect } from 'vitest';
import { createCLI } from '../src/cli';

describe('CLI', () => {
  it('should create CLI instance with correct name', () => {
    const program = createCLI();
    expect(program.name()).toBe('tddai');
  });

  it('should have all expected commands', () => {
    const program = createCLI();
    const commands = program.commands.map((cmd) => cmd.name());

    expect(commands).toContain('init');
    expect(commands).toContain('generate');
    expect(commands).toContain('watch');
    expect(commands).toContain('validate');
    expect(commands).toContain('config');
  });
});
