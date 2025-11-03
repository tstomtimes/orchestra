export type { Config, ConfigV1, ConfigLoadResult, ValidationError } from './config.js';
export { ConfigSchema } from './config.js';

export type { PluginAPI, Plugin, PluginContext, PluginMetadata } from './plugin.js';

export type { ProjectInfo, DetectionReport } from './detection.js';

export type {
  FileSystemOptions,
  FileWriteResult,
  FileDiff,
  AtomicWriteOptions,
} from './file-system.js';

export type {
  CommandContext,
  CommandResult,
  InitCommandOptions,
  GenerateCommandOptions,
  ValidateCommandOptions,
} from './commands.js';

export {
  TddaiError,
  ConfigError,
  DetectionError,
  FileSystemError,
  PluginError,
} from './errors.js';

export type { ConfigSchemaType, ValidationResult } from './schemas.js';
export { ConfigSchemaV1, validateConfig } from './schemas.js';
