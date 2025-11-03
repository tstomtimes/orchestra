import { resolve } from 'path';
import { PluginError } from '../types/errors.js';
import type { Plugin } from '../types/index.js';
import { PluginManager } from './plugin-manager.js';

export class PluginLoader {
  constructor(private manager: PluginManager) {}

  /**
   * Load plugins from multiple sources
   */
  async loadPlugins(
    pluginNames: string[],
    baseDir: string = process.cwd()
  ): Promise<Plugin[]> {
    const loadedPlugins: Plugin[] = [];

    for (const pluginName of pluginNames) {
      const plugin = await this.loadPlugin(pluginName, baseDir);
      this.manager.register(plugin);
      loadedPlugins.push(plugin);
    }

    return loadedPlugins;
  }

  /**
   * Load a single plugin by name
   */
  async loadPlugin(name: string, baseDir: string = process.cwd()): Promise<Plugin> {
    // Try multiple locations
    const locations = [
      // Installed via npm
      `${name}`,
      // Local .tddai/plugins directory
      resolve(baseDir, '.tddai', 'plugins', name),
      // Relative path
      resolve(baseDir, name),
    ];

    let lastError: Error | null = null;

    for (const location of locations) {
      try {
        return await this.loadPluginFromLocation(location);
      } catch (error) {
        lastError = error as Error;
        // Continue trying next location
      }
    }

    throw new PluginError(`Failed to load plugin: ${name}`, {
      name,
      attempts: locations,
      lastError: lastError?.message,
    });
  }

  /**
   * Load plugin from specific location
   */
  private async loadPluginFromLocation(location: string): Promise<Plugin> {
    try {
      const module = await import(location);
      const plugin = module.default as Plugin;

      // Validate plugin structure
      if (!plugin.metadata || !plugin.api) {
        throw new Error('Invalid plugin structure: missing metadata or api');
      }

      // Validate plugin version
      if (!this.manager.validatePluginVersion(plugin)) {
        throw new Error(
          `Incompatible plugin version: ${plugin.metadata.version}`
        );
      }

      return plugin;
    } catch (error) {
      throw new PluginError('Failed to load plugin from location', {
        location,
        error: String(error),
      });
    }
  }

  /**
   * Load plugins from config
   */
  async loadFromConfig(plugins: string[], baseDir: string = process.cwd()): Promise<Plugin[]> {
    return this.loadPlugins(plugins, baseDir);
  }
}

export async function loadPlugins(
  pluginNames: string[],
  manager?: PluginManager
): Promise<Plugin[]> {
  const mgr = manager || new PluginManager();
  const loader = new PluginLoader(mgr);
  return loader.loadPlugins(pluginNames);
}
