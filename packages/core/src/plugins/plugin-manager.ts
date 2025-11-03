import type { Plugin, PluginAPI, PluginContext } from '../types/index.js';
import { PluginError } from '../types/errors.js';

export interface PluginHook {
  name: string;
  fn: (context: PluginContext) => Promise<void>;
  plugin: Plugin;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, PluginHook[]> = new Map();

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.metadata.name)) {
      throw new PluginError(`Plugin ${plugin.metadata.name} already registered`, {
        plugin: plugin.metadata.name,
      });
    }

    this.plugins.set(plugin.metadata.name, plugin);

    // Register hooks from plugin API
    if (plugin.api.onInit) {
      this.registerHook('beforeDetect', plugin.metadata.name, plugin.api.onInit);
    }

    if (plugin.api.onGenerate) {
      this.registerHook('beforeGenerate', plugin.metadata.name, plugin.api.onGenerate);
    }
  }

  /**
   * Register a hook
   */
  private registerHook(
    hookName: string,
    pluginName: string,
    fn: (context: PluginContext) => Promise<void>
  ): void {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new PluginError(`Plugin ${pluginName} not found`, { pluginName });
    }

    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hookList = this.hooks.get(hookName)!;
    hookList.push({
      name: hookName,
      fn,
      plugin,
    });
  }

  /**
   * Execute all hooks for a given hook name
   */
  async executeHooks(hookName: string, context: PluginContext): Promise<void> {
    const hookList = this.hooks.get(hookName) || [];

    for (const hook of hookList) {
      try {
        await hook.fn(context);
      } catch (error) {
        throw new PluginError(`Plugin hook failed: ${hook.plugin.metadata.name}`, {
          hook: hookName,
          plugin: hook.plugin.metadata.name,
          error: String(error),
        });
      }
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Validate plugin compatibility
   */
  validatePluginVersion(plugin: Plugin): boolean {
    // Check if plugin version is compatible with core version
    // For now, simple check: plugin version should be 1.x.x
    return plugin.metadata.version.startsWith('1.');
  }
}

export function createPluginManager(): PluginManager {
  return new PluginManager();
}
