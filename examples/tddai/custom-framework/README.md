# Example: Custom Framework Integration

> Integrate TDD.ai with custom or less common testing frameworks

## Creating a Custom Plugin

`plugins/my-framework-plugin.ts`:

```typescript
import { Plugin, PluginContext } from '@tddai/core';

export const myFrameworkPlugin: Plugin = {
  name: 'my-framework-plugin',
  version: '1.0.0',

  async generate(context: PluginContext) {
    const { sourcePath, config } = context;

    // Custom test generation logic
    const testContent = `
import { test, expect } from 'my-framework';
import { myFunction } from '${sourcePath}';

test('my test', () => {
  expect(myFunction()).toBe(true);
});
`;

    return {
      success: true,
      content: testContent
    };
  }
};
```

## Register Plugin

Update `.tddai/config.json`:

```json
{
  "framework": "my-framework",
  "plugins": ["./plugins/my-framework-plugin.ts"],
  "generation": {
    "coverageTarget": 85
  }
}
```

## Use Custom Plugin

```bash
tddai generate src/myfile.ts
```

TDD.ai will use your custom plugin for test generation.

## Learn More

See full [Plugin Development Guide](../../../docs/plugin-development.md) for advanced topics.
