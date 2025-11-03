export interface ProjectInfo {
    type: 'typescript' | 'javascript' | 'unknown';
    framework: 'vitest' | 'jest' | 'mocha' | 'unknown';
    typescript: boolean;
    buildTool?: string;
    suggestedPlugins: string[];
}
//# sourceMappingURL=detection.d.ts.map