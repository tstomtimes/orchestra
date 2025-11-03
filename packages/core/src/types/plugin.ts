import type { Config } from './config.js';
import type { ProjectInfo } from './detection.js';

// Note: Logger interface is defined in ../utils/logger.ts
// We reference it here via import type to avoid circular dependencies
export type { Logger } from '../utils/logger.js';

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
}

export interface PluginContext {
  config: Config;
  projectRoot?: string; // For backward compatibility
  project?: ProjectInfo;
  cwd?: string;
  logger?: import('../utils/logger.js').Logger;
  metadata?: Record<string, unknown>;
}

export interface PluginAPI {
  onInit?(context: PluginContext): Promise<void>;
  onGenerate?(context: PluginContext): Promise<void>;
  // Future hooks will be added in Phase 2
}

export interface Plugin {
  metadata: PluginMetadata;
  api: PluginAPI;
}
