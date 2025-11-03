import type { ConfigV1 } from '../types/index.js';

export class ConfigMerger {
  /**
   * Merge multiple config sources with priority order:
   * CLI options (highest) > File config > Defaults (lowest)
   */
  static merge(
    defaults: ConfigV1,
    fileConfig: ConfigV1 | null,
    cliOptions: Record<string, unknown>
  ): ConfigV1 {
    // Start with defaults
    let result = { ...defaults };

    // Merge file config (overrides defaults)
    if (fileConfig) {
      result = {
        ...result,
        ...fileConfig,
      };
    }

    // Merge CLI options (highest priority - overrides all)
    if (cliOptions.framework && typeof cliOptions.framework === 'string') {
      result.framework = cliOptions.framework as ConfigV1['framework'];
    }

    if (cliOptions.testDir && typeof cliOptions.testDir === 'string') {
      result.testDir = cliOptions.testDir;
    }

    if (cliOptions.testPattern && typeof cliOptions.testPattern === 'string') {
      result.testPattern = cliOptions.testPattern;
    }

    if (Array.isArray(cliOptions.plugins)) {
      result.plugins = cliOptions.plugins;
    }

    return result;
  }
}
