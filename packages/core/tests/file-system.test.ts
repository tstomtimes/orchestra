import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileWriter } from '../src/fs/writer.js';
import { readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('FileWriter', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `tddai-fs-test-${Date.now()}-${Math.random()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('writeAtomic', () => {
    it('should write file successfully', async () => {
      const writer = new FileWriter();
      const filePath = join(tmpDir, 'test.txt');
      const content = 'Hello, World!';

      const result = await writer.writeAtomic(filePath, content);

      expect(result.written).toBe(true);
      expect(result.path).toBe(filePath);
      expect(result.bytes).toBe(content.length);

      const written = readFileSync(filePath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create parent directories', async () => {
      const writer = new FileWriter();
      const filePath = join(tmpDir, 'deep', 'nested', 'file.txt');

      await writer.writeAtomic(filePath, 'content');

      expect(existsSync(filePath)).toBe(true);
      const written = readFileSync(filePath, 'utf-8');
      expect(written).toBe('content');
    });

    it('should handle dry-run mode', async () => {
      const writer = new FileWriter();
      const filePath = join(tmpDir, 'test.txt');

      const result = await writer.writeAtomic(filePath, 'content', {
        dryRun: true,
      });

      expect(result.written).toBe(false);
      expect(result.bytes).toBe(7);
      expect(existsSync(filePath)).toBe(false);
    });

    it('should create backup when overwriting existing file', async () => {
      const writer = new FileWriter();
      const filePath = join(tmpDir, 'test.txt');
      const backupPath = `${filePath}.bak`;

      // Write initial content
      writeFileSync(filePath, 'original content');

      // Overwrite with new content
      await writer.writeAtomic(filePath, 'new content', { backup: true });

      expect(readFileSync(filePath, 'utf-8')).toBe('new content');
      expect(existsSync(backupPath)).toBe(true);
      expect(readFileSync(backupPath, 'utf-8')).toBe('original content');
    });

    it('should support custom backup path', async () => {
      const writer = new FileWriter();
      const filePath = join(tmpDir, 'test.txt');
      const customBackupPath = join(tmpDir, 'backup', 'test.txt.backup');

      // Write initial content
      writeFileSync(filePath, 'original content');

      // Overwrite with custom backup path
      await writer.writeAtomic(filePath, 'new content', {
        backup: true,
        backupPath: customBackupPath,
      });

      expect(readFileSync(filePath, 'utf-8')).toBe('new content');
      expect(existsSync(customBackupPath)).toBe(true);
      expect(readFileSync(customBackupPath, 'utf-8')).toBe('original content');
    });

    it('should skip backup when backup option is false', async () => {
      const writer = new FileWriter();
      const filePath = join(tmpDir, 'test.txt');
      const backupPath = `${filePath}.bak`;

      // Write initial content
      writeFileSync(filePath, 'original content');

      // Overwrite without backup
      await writer.writeAtomic(filePath, 'new content', { backup: false });

      expect(readFileSync(filePath, 'utf-8')).toBe('new content');
      expect(existsSync(backupPath)).toBe(false);
    });

    it('should handle unicode content correctly', async () => {
      const writer = new FileWriter();
      const filePath = join(tmpDir, 'unicode.txt');
      const content = 'こんにちは世界 🌍';

      const result = await writer.writeAtomic(filePath, content);

      expect(result.written).toBe(true);
      // UTF-8 encoding: Japanese chars are 3 bytes each, emoji is 4 bytes
      expect(result.bytes).toBeGreaterThan(content.length);

      const written = readFileSync(filePath, 'utf-8');
      expect(written).toBe(content);
    });
  });

  describe('writeFiles', () => {
    it('should write multiple files', async () => {
      const writer = new FileWriter();
      const files = [
        { path: join(tmpDir, 'file1.txt'), content: 'content1' },
        { path: join(tmpDir, 'file2.txt'), content: 'content2' },
        { path: join(tmpDir, 'file3.txt'), content: 'content3' },
      ];

      const results = await writer.writeFiles(files);

      expect(results).toHaveLength(3);
      expect(results[0].written).toBe(true);
      expect(results[1].written).toBe(true);
      expect(results[2].written).toBe(true);

      expect(readFileSync(files[0].path, 'utf-8')).toBe('content1');
      expect(readFileSync(files[1].path, 'utf-8')).toBe('content2');
      expect(readFileSync(files[2].path, 'utf-8')).toBe('content3');
    });

    it('should write files in nested directories', async () => {
      const writer = new FileWriter();
      const files = [
        { path: join(tmpDir, 'dir1', 'file1.txt'), content: 'content1' },
        { path: join(tmpDir, 'dir2', 'subdir', 'file2.txt'), content: 'content2' },
      ];

      const results = await writer.writeFiles(files);

      expect(results).toHaveLength(2);
      expect(results[0].written).toBe(true);
      expect(results[1].written).toBe(true);

      expect(existsSync(files[0].path)).toBe(true);
      expect(existsSync(files[1].path)).toBe(true);
    });

    it('should handle dry-run mode for multiple files', async () => {
      const writer = new FileWriter();
      const files = [
        { path: join(tmpDir, 'file1.txt'), content: 'content1' },
        { path: join(tmpDir, 'file2.txt'), content: 'content2' },
      ];

      const results = await writer.writeFiles(files, { dryRun: true });

      expect(results).toHaveLength(2);
      expect(results[0].written).toBe(false);
      expect(results[1].written).toBe(false);
      expect(results[0].bytes).toBe(8);
      expect(results[1].bytes).toBe(8);

      expect(existsSync(files[0].path)).toBe(false);
      expect(existsSync(files[1].path)).toBe(false);
    });
  });
});
