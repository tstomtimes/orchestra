import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type {
  ProjectInfo,
  DetectionReport,
} from '../types/index.js';
import { DetectionError } from '../types/index.js';

export class ProjectDetector {
  constructor(private cwd: string = process.cwd()) {}

  /**
   * Detect project type and configuration
   */
  async detect(): Promise<ProjectInfo> {
    try {
      const [type, framework, ts, buildTool, pm, nodeVersion] = await Promise.all([
        this.detectProjectType(),
        this.detectTestFramework(),
        this.detectTypeScript(),
        this.detectBuildTool(),
        this.detectPackageManager(),
        Promise.resolve(process.version.slice(1)), // Remove 'v' prefix
      ]);

      return {
        type,
        framework,
        typescript: ts,
        buildTool,
        packageManager: pm,
        nodeVersion,
        confidence: this.calculateConfidence({ type, framework, typescript: ts }),
        metadata: {},
        suggestedPlugins: this.suggestPlugins({ framework, type }),
      };
    } catch (error) {
      throw new DetectionError(
        'Failed to detect project',
        { cwd: this.cwd, error: String(error) }
      );
    }
  }

  /**
   * Generate detailed detection report
   */
  async generateReport(): Promise<DetectionReport> {
    const project = await this.detect();
    const detectedFiles = await this.findConfigFiles();

    return {
      project,
      detectedFiles: {
        packageJson: detectedFiles.packageJson || '',
        tsconfig: detectedFiles.tsconfig,
        vitest: detectedFiles.vitest,
        jest: detectedFiles.jest,
        mocha: detectedFiles.mocha,
      },
      recommendations: this.generateRecommendations(project),
      warnings: this.generateWarnings(project),
    };
  }

  private async detectProjectType(): Promise<'typescript' | 'javascript' | 'unknown'> {
    const tsconfig = await this.fileExists(join(this.cwd, 'tsconfig.json'));
    if (tsconfig) return 'typescript';

    // Check for .ts files
    const tsFiles = await glob('**/*.ts', {
      cwd: this.cwd,
      ignore: ['node_modules/**', 'dist/**'],
    });

    return tsFiles.length > 0 ? 'typescript' : 'javascript';
  }

  private async detectTestFramework(): Promise<
    'vitest' | 'jest' | 'mocha' | 'unknown'
  > {
    const packageJson = await this.readPackageJson();
    if (!packageJson) return 'unknown';

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Priority order
    if (allDeps.vitest) return 'vitest';
    if (allDeps.jest) return 'jest';
    if (allDeps.mocha) return 'mocha';

    return 'unknown';
  }

  private async detectTypeScript(): Promise<boolean> {
    const tsconfig = await this.fileExists(join(this.cwd, 'tsconfig.json'));
    if (tsconfig) return true;

    const packageJson = await this.readPackageJson();
    if (!packageJson) return false;

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    return !!allDeps.typescript;
  }

  private async detectBuildTool(): Promise<
    'vite' | 'webpack' | 'esbuild' | 'tsc' | 'other' | undefined
  > {
    const packageJson = await this.readPackageJson();
    if (!packageJson) return undefined;

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (allDeps.vite) return 'vite';
    if (allDeps.webpack) return 'webpack';
    if (allDeps.esbuild) return 'esbuild';
    if (allDeps.typescript) return 'tsc';

    return undefined;
  }

  private async detectPackageManager(): Promise<'npm' | 'pnpm' | 'yarn' | 'bun'> {
    // Check for lock files
    const [hasPnpmLock, hasYarnLock, hasBunLock] = await Promise.all([
      this.fileExists(join(this.cwd, 'pnpm-lock.yaml')),
      this.fileExists(join(this.cwd, 'yarn.lock')),
      this.fileExists(join(this.cwd, 'bun.lockb')),
    ]);

    if (hasPnpmLock) return 'pnpm';
    if (hasYarnLock) return 'yarn';
    if (hasBunLock) return 'bun';

    return 'npm'; // Default
  }

  private async findConfigFiles(): Promise<Record<string, string | undefined>> {
    const files: Record<string, string | undefined> = {
      packageJson: undefined,
      tsconfig: undefined,
      vitest: undefined,
      jest: undefined,
      mocha: undefined,
    };

    const configs = [
      { key: 'packageJson', pattern: 'package.json' },
      { key: 'tsconfig', pattern: 'tsconfig.json' },
      { key: 'vitest', pattern: 'vitest.config.{ts,js,mjs}' },
      { key: 'jest', pattern: 'jest.config.{ts,js,mjs}' },
      { key: 'mocha', pattern: '.mocharc.{json,yaml,yml,js}' },
    ];

    for (const { key, pattern } of configs) {
      const filesFound = await glob(pattern, { cwd: this.cwd });
      if (filesFound.length > 0) {
        files[key] = filesFound[0];
      }
    }

    return files;
  }

  private generateRecommendations(info: ProjectInfo): string[] {
    const recs: string[] = [];

    if (info.framework === 'unknown') {
      recs.push('No test framework detected. Consider installing Vitest for modern testing.');
    }

    if (!info.typescript) {
      recs.push('No TypeScript detected. Consider using TypeScript for better type safety.');
    }

    if (info.nodeVersion && parseInt(info.nodeVersion) < 18) {
      recs.push('Node.js version is below 18. Please upgrade to the latest LTS version.');
    }

    return recs;
  }

  private generateWarnings(info: ProjectInfo): string[] {
    const warnings: string[] = [];

    if (info.confidence < 0.7) {
      warnings.push('Detection confidence is low. Manual verification recommended.');
    }

    return warnings;
  }

  private calculateConfidence(data: {
    type: string;
    framework: string;
    typescript: boolean;
  }): number {
    let confidence = 0;

    if (data.type !== 'unknown') confidence += 0.3;
    if (data.framework !== 'unknown') confidence += 0.5;
    if (data.typescript) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  private suggestPlugins(data: {
    framework: string;
    type: string;
  }): string[] {
    const plugins: string[] = [];

    if (data.type === 'typescript') {
      plugins.push('@tddai/plugin-typescript');
    }

    // Check for React/Vue/etc in package.json
    // This will be enhanced in Phase 3

    return plugins;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await readFile(path);
      return true;
    } catch {
      return false;
    }
  }

  private async readPackageJson(): Promise<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } | null> {
    try {
      const content = await readFile(
        join(this.cwd, 'package.json'),
        'utf-8'
      );
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

export async function detectProject(cwd: string = process.cwd()): Promise<ProjectInfo> {
  const detector = new ProjectDetector(cwd);
  return detector.detect();
}

export async function detectProjectReport(
  cwd: string = process.cwd()
): Promise<DetectionReport> {
  const detector = new ProjectDetector(cwd);
  return detector.generateReport();
}
