export class TddaiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TddaiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConfigError extends TddaiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFIG_ERROR', message, details);
    this.name = 'ConfigError';
  }
}

export class DetectionError extends TddaiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('DETECTION_ERROR', message, details);
    this.name = 'DetectionError';
  }
}

export class FileSystemError extends TddaiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('FILESYSTEM_ERROR', message, details);
    this.name = 'FileSystemError';
  }
}

export class PluginError extends TddaiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('PLUGIN_ERROR', message, details);
    this.name = 'PluginError';
  }
}
