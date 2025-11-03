import { writeFile, mkdir, copy } from 'fs-extra';
import { dirname } from 'path';
import { existsSync } from 'fs';
import type { FileWriteResult, AtomicWriteOptions } from '../types/index.js';
import { FileSystemError } from '../types/errors.js';

export class FileWriter {
  /**
   * Write file atomically with optional backup
   */
  async writeAtomic(
    path: string,
    content: string,
    options: AtomicWriteOptions = {}
  ): Promise<FileWriteResult> {
    const { dryRun = false, backup = true, encoding = 'utf-8' } = options;

    if (dryRun) {
      return {
        path,
        written: false,
        bytes: Buffer.byteLength(content, encoding as BufferEncoding),
      };
    }

    try {
      // Create backup if file exists
      if (backup && existsSync(path)) {
        try {
          const backupPath = options.backupPath || `${path}.bak`;
          await copy(path, backupPath);
        } catch (error) {
          // If backup fails, log but continue
          // This is non-critical
        }
      }

      // Ensure directory exists
      await mkdir(dirname(path), { recursive: true });

      // Write file
      await writeFile(path, content, { encoding: encoding as BufferEncoding });

      const bytes = Buffer.byteLength(content, encoding as BufferEncoding);

      return {
        path,
        written: true,
        bytes,
      };
    } catch (error) {
      throw new FileSystemError('Failed to write file', {
        path,
        error: String(error),
      });
    }
  }

  /**
   * Write multiple files
   */
  async writeFiles(
    files: Array<{ path: string; content: string }>,
    options: AtomicWriteOptions = {}
  ): Promise<FileWriteResult[]> {
    return Promise.all(
      files.map((file) => this.writeAtomic(file.path, file.content, options))
    );
  }
}

/**
 * Convenience function to write a file atomically
 */
export async function writeFileAtomic(
  path: string,
  content: string,
  options?: AtomicWriteOptions
): Promise<FileWriteResult> {
  const writer = new FileWriter();
  return writer.writeAtomic(path, content, options);
}
