export interface ProjectInfo {
  type: 'typescript' | 'javascript' | 'unknown';
  framework: 'vitest' | 'jest' | 'mocha' | 'unknown';
  typescript: boolean;
  buildTool?: 'vite' | 'webpack' | 'esbuild' | 'tsc' | 'other';
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  nodeVersion: string;
  confidence: number;
  metadata: Record<string, unknown>;
  suggestedPlugins: string[];
}

export interface DetectionReport {
  project: ProjectInfo;
  detectedFiles: {
    packageJson: string;
    tsconfig?: string;
    vitest?: string;
    jest?: string;
    mocha?: string;
  };
  recommendations: string[];
  warnings: string[];
}
