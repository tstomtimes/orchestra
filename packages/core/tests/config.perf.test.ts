import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigLoader } from '../src/config/loader.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ConfigLoader Performance', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `tddai-perf-${Date.now()}-${Math.random()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should load config in under 50ms', async () => {
    const config = {
      version: '1.0.0',
      framework: 'vitest',
      testDir: 'test',
      testPattern: '**/*.test.ts',
      plugins: ['plugin1', 'plugin2'],
    };

    writeFileSync(
      join(tmpDir, '.tddairc.json'),
      JSON.stringify(config)
    );

    const loader = new ConfigLoader();
    const startTime = performance.now();

    await loader.load(tmpDir);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(50);
    console.log(`Config load time: ${duration.toFixed(2)}ms`);
  });

  it('should load multiple configs sequentially in under 150ms', async () => {
    const config = {
      version: '1.0.0',
      framework: 'vitest',
      testDir: 'test',
    };

    writeFileSync(
      join(tmpDir, '.tddairc.json'),
      JSON.stringify(config)
    );

    const loader = new ConfigLoader();
    const startTime = performance.now();

    // Load config 10 times
    for (let i = 0; i < 10; i++) {
      await loader.load(tmpDir);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(150);
    console.log(`10x sequential loads: ${duration.toFixed(2)}ms (avg: ${(duration / 10).toFixed(2)}ms)`);
  });
});
