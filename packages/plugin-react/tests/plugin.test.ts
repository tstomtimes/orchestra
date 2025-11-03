import { describe, it, expect } from 'vitest';
import plugin from '../src/index.js';

describe('React Plugin', () => {
  it('should have correct metadata', () => {
    expect(plugin.metadata.name).toBe('@tddai/plugin-react');
    expect(plugin.metadata.version).toBe('1.0.0');
    expect(plugin.metadata.description).toBe('React testing support for TDD.ai');
  });

  it('should have onInit hook', () => {
    expect(plugin.api.onInit).toBeDefined();
    expect(typeof plugin.api.onInit).toBe('function');
  });
});
