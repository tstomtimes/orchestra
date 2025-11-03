import { cosmiconfig } from 'cosmiconfig';
import { readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import type { ConfigV1, ConfigLoadResult } from '../types/index.js';
import { validateConfig } from '../types/schemas.js';
import { ConfigError } from '../types/errors.js';

const moduleName = 'tddai';

export class ConfigLoader {
  private explorer = cosmiconfig(moduleName, {
    searchPlaces: [
      'package.json',
      '.tddairc',
      '.tddairc.json',
      '.tddairc.js',
      'tddai.config.js',
      'tddai.config.ts',
    ],
    loaders: {
      '.json': (filepath: string) => JSON.parse(readFileSync(filepath, 'utf-8')),
      noExt: (filepath: string) => JSON.parse(readFileSync(filepath, 'utf-8')),
    },
  });

  /**
   * Load configuration from project
   */
  async load(startFrom: string = process.cwd()): Promise<ConfigLoadResult> {
    try {
      const result = await this.explorer.search(startFrom);

      if (!result) {
        return {
          config: this.getDefaults(),
          source: 'default',
          errors: [],
        };
      }

      const validation = validateConfig(result.config);

      if (!validation.success) {
        throw new ConfigError('Invalid configuration', {
          errors: validation.errors,
          file: result.filepath,
        });
      }

      return {
        config: validation.data as ConfigV1,
        source: this.detectSource(result.filepath),
        path: result.filepath,
        errors: [],
      };
    } catch (error) {
      if (error instanceof ConfigError) throw error;

      throw new ConfigError('Failed to load configuration', {
        error: String(error),
        startFrom,
      });
    }
  }

  /**
   * Load configuration from specific file
   */
  async loadFromFile(filePath: string): Promise<ConfigLoadResult> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const config = JSON.parse(content);

      const validation = validateConfig(config);

      if (!validation.success) {
        throw new ConfigError('Invalid configuration in file', {
          errors: validation.errors,
          file: filePath,
        });
      }

      return {
        config: validation.data as ConfigV1,
        source: 'file',
        path: filePath,
        errors: [],
      };
    } catch (error) {
      if (error instanceof ConfigError) throw error;

      throw new ConfigError('Failed to load configuration file', {
        error: String(error),
        filePath,
      });
    }
  }

  /**
   * Merge CLI options with file config
   */
  mergeWithOptions(
    fileConfig: ConfigV1,
    options: Record<string, unknown>
  ): ConfigV1 {
    const merged = { ...fileConfig };

    if (options.framework && typeof options.framework === 'string') {
      merged.framework = options.framework as ConfigV1['framework'];
    }

    if (options.testDir && typeof options.testDir === 'string') {
      merged.testDir = options.testDir;
    }

    if (options.testPattern && typeof options.testPattern === 'string') {
      merged.testPattern = options.testPattern;
    }

    if (Array.isArray(options.plugins)) {
      merged.plugins = options.plugins;
    }

    return merged;
  }

  /**
   * Get default configuration
   */
  getDefaults(): ConfigV1 {
    return {
      version: '1.0.0',
      framework: 'auto',
      testDir: 'tests',
      testPattern: '**/*.test.ts',
      plugins: [],
    };
  }

  /**
   * Detect config source from filepath
   */
  private detectSource(filepath: string): 'file' | 'package.json' {
    return filepath.endsWith('package.json') ? 'package.json' : 'file';
  }
}

/**
 * Convenience function to load config
 */
export async function loadConfig(
  startFrom?: string
): Promise<ConfigLoadResult> {
  const loader = new ConfigLoader();
  return loader.load(startFrom);
}
