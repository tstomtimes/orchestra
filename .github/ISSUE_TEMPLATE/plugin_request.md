---
name: Plugin Request
about: Request support for a new framework or library
title: '[PLUGIN] '
labels: plugin, enhancement
assignees: ''
---

## Framework/Library

Name of the framework or library you'd like supported.

## Use Case

Describe your use case for this plugin. Why is it important?

## Framework Details

- **Package Name**: (e.g., `react`, `vue`, `angular`)
- **Version**: (e.g., `^18.0.0`)
- **Documentation**: (link to official docs)
- **GitHub**: (link to repository)

## Testing Patterns

What specific testing patterns should this plugin support?

Examples:
- Component testing
- Hook testing
- Store/state management testing
- API integration testing

## Example Code

Show example of the framework code that needs tests generated:

```typescript
// Example framework code
export function MyComponent() {
  // ...
}
```

## Expected Generated Test

What should the generated test look like?

```typescript
// Expected test output
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // ...
  });
});
```

## Existing Testing Tools

Are there existing testing utilities for this framework?
- Testing Library: (e.g., @testing-library/react)
- Test Utilities: (e.g., @vue/test-utils)
- Mocking Tools: (e.g., msw, jest-mock)

## Willingness to Contribute

- [ ] I'm willing to implement this plugin
- [ ] I'm willing to test this plugin
- [ ] I can provide example projects for testing
