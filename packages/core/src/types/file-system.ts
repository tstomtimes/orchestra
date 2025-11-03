export interface FileSystemOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  encoding?: 'utf-8' | 'utf8';
  mode?: number;
}

export interface FileWriteResult {
  path: string;
  written: boolean;
  bytes: number;
  error?: Error;
}

export interface FileDiff {
  path: string;
  action: 'create' | 'update' | 'delete';
  before?: string;
  after?: string;
  size: number;
}

export interface AtomicWriteOptions extends FileSystemOptions {
  backup?: boolean;
  backupPath?: string;
}
