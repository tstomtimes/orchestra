import type {
  Config as ConfigV1,
  ProjectInfo,
} from '../types/index.js';
import { ConsoleLogger, type Logger } from '../utils/logger.js';

export interface PluginContextData {
  config: ConfigV1;
  project: ProjectInfo;
  cwd: string;
  logger?: Logger;
  metadata?: Record<string, unknown>;
}

export class PluginContext {
  private data: PluginContextData;

  constructor(data: PluginContextData) {
    this.data = {
      ...data,
      logger: data.logger || new ConsoleLogger(),
      metadata: data.metadata || {},
    };
  }

  /**
   * Get configuration
   */
  getConfig(): ConfigV1 {
    return this.data.config;
  }

  /**
   * Get project information
   */
  getProject(): ProjectInfo {
    return this.data.project;
  }

  /**
   * Get current working directory
   */
  getCwd(): string {
    return this.data.cwd;
  }

  /**
   * Get logger
   */
  getLogger(): Logger {
    return this.data.logger!;
  }

  /**
   * Get/set metadata
   */
  getMetadata(key: string): unknown {
    return this.data.metadata![key];
  }

  setMetadata(key: string, value: unknown): void {
    this.data.metadata![key] = value;
  }

  /**
   * Create a child context with modified data
   */
  createChild(overrides: Partial<PluginContextData>): PluginContext {
    return new PluginContext({
      ...this.data,
      ...overrides,
    });
  }

  /**
   * Convert to plain PluginContext object for plugin consumption
   */
  toPluginContext(): import('../types/plugin.js').PluginContext {
    return {
      config: this.data.config,
      project: this.data.project,
      cwd: this.data.cwd,
      logger: this.data.logger,
      metadata: this.data.metadata,
    };
  }
}

export function createPluginContext(data: PluginContextData): PluginContext {
  return new PluginContext(data);
}
