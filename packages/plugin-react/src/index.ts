import type { Plugin } from '@tddai/core';

const plugin: Plugin = {
  metadata: {
    name: '@tddai/plugin-react',
    version: '1.0.0',
    description: 'React testing support for TDD.ai',
  },
  api: {
    async onInit() {
      console.log('React plugin initialized');
    },
  },
};

export default plugin;
