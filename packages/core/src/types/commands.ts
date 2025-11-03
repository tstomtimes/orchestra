import type { ConfigV1 } from './config.js';
import type { ProjectInfo } from './detection.js';
import type { Logger } from '../utils/logger.js';

export interface CommandContext {
  cwd: string;
  config: ConfigV1;
  projectInfo: ProjectInfo;
  dryRun: boolean;
  verbose: boolean;
  logger: Logger;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  errors: Error[];
  warnings: string[];
}

export interface InitCommandOptions {
  force?: boolean;
  yes?: boolean;
  framework?: string;
  testDir?: string;
}

export interface GenerateCommandOptions {
  file: string;
  output?: string;
  framework?: string;
  dryRun?: boolean;
}

export interface ValidateCommandOptions {
  staged?: boolean;
  bail?: boolean;
  fix?: boolean;
}
