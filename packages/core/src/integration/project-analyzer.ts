import { ProjectDetector, detectProjectReport } from '../detection/index.js';
import { ConfigLoader, loadConfig } from '../config/index.js';
import type {
  ProjectInfo,
  ConfigV1,
  DetectionReport,
  CommandContext,
} from '../types/index.js';
import { DetectionError, ConfigError } from '../types/errors.js';
import { ConsoleLogger } from '../utils/logger.js';

export interface ProjectAnalysisResult {
  project: ProjectInfo;
  config: ConfigV1;
  report: DetectionReport;
  timestamp: number;
}

export class ProjectAnalyzer {
  constructor(private cwd: string = process.cwd()) {}

  /**
   * Analyze project end-to-end: detection + config loading
   */
  async analyze(): Promise<ProjectAnalysisResult> {
    try {
      // Step 1: Detect project
      const detector = new ProjectDetector(this.cwd);
      const report = await detector.generateReport();
      const project = report.project;

      // Step 2: Load configuration
      const configLoader = new ConfigLoader();
      const configResult = await configLoader.load(this.cwd);
      const config = configResult.config;

      // Step 3: Merge detection with config
      const mergedConfig = this.mergeDetectionWithConfig(project, config);

      return {
        project,
        config: mergedConfig,
        report,
        timestamp: Date.now(),
      };
    } catch (error) {
      if (error instanceof DetectionError || error instanceof ConfigError) {
        throw error;
      }

      throw new DetectionError('Failed to analyze project', {
        cwd: this.cwd,
        error: String(error),
      });
    }
  }

  /**
   * Get analysis without detection (use existing config)
   */
  async analyzeWithoutDetection(): Promise<ProjectAnalysisResult> {
    try {
      const configLoader = new ConfigLoader();
      const configResult = await configLoader.load(this.cwd);
      const config = configResult.config;

      // Create minimal project info from config
      const project: ProjectInfo = {
        type: 'unknown',
        framework: config.framework as any,
        typescript: false,
        confidence: 0.5,
        packageManager: 'npm',
        nodeVersion: process.version.slice(1),
        metadata: {},
        suggestedPlugins: [],
      };

      return {
        project,
        config,
        report: {
          project,
          detectedFiles: {
            packageJson: '',
          },
          recommendations: ['Run `tddai init` to auto-detect project type'],
          warnings: ['Project analysis incomplete - re-run init for better detection'],
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new ConfigError('Failed to load configuration', {
        cwd: this.cwd,
        error: String(error),
      });
    }
  }

  /**
   * Create CommandContext from analysis result
   */
  createCommandContext(result: ProjectAnalysisResult): CommandContext {
    return {
      cwd: this.cwd,
      config: result.config,
      projectInfo: result.project,
      dryRun: false,
      verbose: false,
      logger: new ConsoleLogger(),
    };
  }

  /**
   * Merge detection results with config
   */
  private mergeDetectionWithConfig(project: ProjectInfo, config: ConfigV1): ConfigV1 {
    // If config framework is 'auto', use detected framework
    if (config.framework === 'auto') {
      return {
        ...config,
        framework: project.framework !== 'unknown' ? project.framework : 'vitest',
      };
    }

    return config;
  }

  /**
   * Get analysis for dry-run display
   */
  async getDryRunAnalysis(): Promise<{
    project: ProjectInfo;
    config: ConfigV1;
    message: string;
  }> {
    const result = await this.analyze();

    return {
      project: result.project,
      config: result.config,
      message: `
Project Analysis (Dry-run):
- Type: ${result.project.type}
- Framework: ${result.project.framework}
- Test Directory: ${result.config.testDir}
- Test Pattern: ${result.config.testPattern}
- Confidence: ${(result.project.confidence * 100).toFixed(0)}%
      `.trim(),
    };
  }
}

export async function analyzeProject(cwd: string = process.cwd()): Promise<ProjectAnalysisResult> {
  const analyzer = new ProjectAnalyzer(cwd);
  return analyzer.analyze();
}

export async function analyzeProjectReport(
  cwd: string = process.cwd()
): Promise<DetectionReport> {
  const analyzer = new ProjectAnalyzer(cwd);
  const result = await analyzer.analyze();
  return result.report;
}
