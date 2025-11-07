# Example: Generate Tests

> Generate comprehensive test suites from source files

## Quick Start

```bash
# Single file
tddai generate src/calculator.ts

# Directory
tddai generate src/utils/

# With options
tddai generate src/ --dry-run --coverage 90
```

## Sample Source File

`src/calculator.ts`:
```typescript
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}
```

## Generate Tests

```bash
tddai generate src/calculator.ts
```

## Expected Output

`tests/calculator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { add, subtract, multiply, divide } from '../src/calculator';

describe('Calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });

    it('should handle zero', () => {
      expect(add(5, 0)).toBe(5);
    });
  });

  describe('divide', () => {
    it('should throw error on division by zero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero');
    });
  });
});
```

## Learn More

See full [CLI Reference](../../../docs/tddai/CLI.md#generate-command) for all options.
