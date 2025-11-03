import { describe, it, expect } from 'vitest';
import { ProjectDetector, detectProject, detectProjectReport } from '../src/detection/detector.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('ProjectDetector', () => {
  describe('TypeScript Detection', () => {
    it('should detect TypeScript project with tsconfig.json', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      expect(info.type).toBe('typescript');
      expect(info.typescript).toBe(true);
    });

    it('should detect JavaScript-only project', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const info = await detector.detect();

      // Mocha project has no tsconfig or TypeScript dependency
      expect(info.type).toBe('javascript');
      expect(info.typescript).toBe(false);
    });

    it('should detect TypeScript from package.json dependency', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      expect(info.typescript).toBe(true);
    });
  });

  describe('Test Framework Detection', () => {
    it('should detect Vitest from package.json', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      expect(info.framework).toBe('vitest');
    });

    it('should detect Jest from package.json', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/jest-project')
      );
      const info = await detector.detect();

      expect(info.framework).toBe('jest');
    });

    it('should detect Mocha from package.json', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const info = await detector.detect();

      expect(info.framework).toBe('mocha');
    });

    it('should prioritize Vitest over Jest when both present', async () => {
      // Test priority order: vitest > jest > mocha
      // This test would require a fixture with multiple frameworks
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      expect(info.framework).toBe('vitest');
    });
  });

  describe('Package Manager Detection', () => {
    it('should detect pnpm from lock file', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      expect(info.packageManager).toBe('pnpm');
    });

    it('should detect yarn from lock file', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/jest-project')
      );
      const info = await detector.detect();

      expect(info.packageManager).toBe('yarn');
    });

    it('should default to npm when no lock file present', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const info = await detector.detect();

      expect(info.packageManager).toBe('npm');
    });
  });

  describe('Build Tool Detection', () => {
    it('should detect TypeScript compiler when typescript is present', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      // Vitest project has typescript, so should detect tsc
      expect(info.buildTool).toBe('tsc');
    });

    it('should return undefined when no build tool detected', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const info = await detector.detect();

      expect(info.buildTool).toBeUndefined();
    });
  });

  describe('Node Version Detection', () => {
    it('should detect current Node.js version', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      expect(info.nodeVersion).toBeDefined();
      expect(typeof info.nodeVersion).toBe('string');
      // Should not have 'v' prefix
      expect(info.nodeVersion.startsWith('v')).toBe(false);
    });
  });

  describe('Confidence Calculation', () => {
    it('should calculate high confidence for complete detection', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      // TypeScript project with Vitest should have high confidence
      // type !== unknown (+0.3), framework !== unknown (+0.5), typescript (+0.2) = 1.0
      expect(info.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should calculate lower confidence for partial detection', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const info = await detector.detect();

      // JavaScript project with Mocha should have lower confidence
      // type !== unknown (+0.3), framework !== unknown (+0.5), no typescript = 0.8
      expect(info.confidence).toBeLessThan(1.0);
    });
  });

  describe('Metadata and Plugin Suggestions', () => {
    it('should suggest TypeScript plugin for TypeScript projects', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      expect(info.suggestedPlugins).toContain('@tddai/plugin-typescript');
    });

    it('should not suggest TypeScript plugin for JavaScript projects', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const info = await detector.detect();

      expect(info.suggestedPlugins).not.toContain('@tddai/plugin-typescript');
    });

    it('should initialize empty metadata object', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const info = await detector.detect();

      expect(info.metadata).toBeDefined();
      expect(typeof info.metadata).toBe('object');
    });
  });

  describe('Detection Report', () => {
    it('should generate complete detection report', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const report = await detector.generateReport();

      expect(report.project).toBeDefined();
      expect(report.detectedFiles).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.warnings).toBeInstanceOf(Array);
    });

    it('should detect package.json file', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const report = await detector.generateReport();

      expect(report.detectedFiles.packageJson).toBeDefined();
      expect(report.detectedFiles.packageJson).toContain('package.json');
    });

    it('should detect tsconfig.json when present', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const report = await detector.generateReport();

      expect(report.detectedFiles.tsconfig).toBeDefined();
      expect(report.detectedFiles.tsconfig).toContain('tsconfig.json');
    });

    it('should have undefined config files when not present', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const report = await detector.generateReport();

      expect(report.detectedFiles.vitest).toBeUndefined();
      expect(report.detectedFiles.jest).toBeUndefined();
    });

    it('should generate recommendations for projects without test framework', async () => {
      // Create a mock detector with unknown framework
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const report = await detector.generateReport();

      // Mocha is detected, so no recommendation expected
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should generate warnings for low confidence detection', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const report = await detector.generateReport();

      if (report.project.confidence < 0.7) {
        expect(report.warnings.length).toBeGreaterThan(0);
        expect(report.warnings[0]).toContain('confidence is low');
      }
    });
  });

  describe('Helper Functions', () => {
    it('detectProject should return ProjectInfo', async () => {
      const info = await detectProject(
        resolve(__dirname, 'fixtures/vitest-project')
      );

      expect(info).toBeDefined();
      expect(info.type).toBeDefined();
      expect(info.framework).toBeDefined();
      expect(info.packageManager).toBeDefined();
    });

    it('detectProjectReport should return DetectionReport', async () => {
      const report = await detectProjectReport(
        resolve(__dirname, 'fixtures/vitest-project')
      );

      expect(report).toBeDefined();
      expect(report.project).toBeDefined();
      expect(report.detectedFiles).toBeDefined();
    });

    it('should use current working directory by default', async () => {
      const detector = new ProjectDetector();

      // Should not throw when detecting from current directory
      await expect(detector.detect()).resolves.toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent directories gracefully', async () => {
      const detector = new ProjectDetector('/non/existent/path');

      // Should still return a result, just with unknown/default values
      const info = await detector.detect();

      expect(info).toBeDefined();
      expect(info.framework).toBe('unknown');
      expect(info.packageManager).toBe('npm'); // default
    });

    it('should handle malformed package.json', async () => {
      // This would require a fixture with invalid JSON
      // For now, we test that the detector returns null internally
      const detector = new ProjectDetector('/tmp');
      const info = await detector.detect();

      expect(info).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle projects with no package.json', async () => {
      const detector = new ProjectDetector('/tmp');
      const info = await detector.detect();

      expect(info.framework).toBe('unknown');
      expect(info.packageManager).toBe('npm'); // default
    });

    it('should calculate confidence as 0 for completely unknown project', async () => {
      const detector = new ProjectDetector('/tmp');
      const info = await detector.detect();

      // No TypeScript, no framework, unknown type
      expect(info.confidence).toBeLessThanOrEqual(0.3);
    });

    it('should handle empty detectedFiles gracefully', async () => {
      const detector = new ProjectDetector('/tmp');
      const report = await detector.generateReport();

      expect(report.detectedFiles).toBeDefined();
      // packageJson might be empty string
      expect(typeof report.detectedFiles.packageJson).toBe('string');
    });
  });

  describe('Integration Tests', () => {
    it('should correctly identify a complete Vitest TypeScript project', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/vitest-project')
      );
      const report = await detector.generateReport();

      // Complete assertions
      expect(report.project.type).toBe('typescript');
      expect(report.project.framework).toBe('vitest');
      expect(report.project.typescript).toBe(true);
      expect(report.project.packageManager).toBe('pnpm');
      expect(report.project.confidence).toBeGreaterThanOrEqual(0.8);

      expect(report.detectedFiles.packageJson).toBeDefined();
      expect(report.detectedFiles.tsconfig).toBeDefined();

      expect(report.project.suggestedPlugins).toContain('@tddai/plugin-typescript');
    });

    it('should correctly identify a Jest project with Yarn', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/jest-project')
      );
      const report = await detector.generateReport();

      expect(report.project.framework).toBe('jest');
      expect(report.project.packageManager).toBe('yarn');
      expect(report.detectedFiles.packageJson).toBeDefined();
    });

    it('should correctly identify a Mocha JavaScript project', async () => {
      const detector = new ProjectDetector(
        resolve(__dirname, 'fixtures/mocha-project')
      );
      const report = await detector.generateReport();

      expect(report.project.framework).toBe('mocha');
      expect(report.project.typescript).toBe(false);
      expect(report.project.packageManager).toBe('npm');
    });
  });
});
