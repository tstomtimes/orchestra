import { describe, it, expect } from 'vitest';
import { ConsoleLogger } from '../src/utils/logger.js';

describe('ConsoleLogger', () => {
  it('should create a logger instance', () => {
    const logger = new ConsoleLogger();
    expect(logger).toBeDefined();
    expect(logger.log).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });
});
