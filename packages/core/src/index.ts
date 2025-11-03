// Public API exports
export * from './types/index.js';
export * from './utils/logger.js';
export * from './detection/index.js';
export * from './config/index.js';
export * from './fs/index.js';
export * from './integration/index.js';

// Plugin system exports
export { PluginManager, createPluginManager } from './plugins/plugin-manager.js';
export { PluginLoader, loadPlugins } from './plugins/plugin-loader.js';
export { PluginContext, createPluginContext } from './plugins/plugin-context.js';
export type { PluginHook } from './plugins/plugin-manager.js';
export type { PluginContextData } from './plugins/plugin-context.js';

// Version
export const VERSION = '1.0.0';
