import { FileWriter, writeFileAtomic } from '../fs/writer.js';
import type { FileWriteResult, AtomicWriteOptions, FileDiff } from '../types/index.js';
import { FileSystemError } from '../types/errors.js';

export interface TestTemplate {
  name: string;
  content: string;
  variables?: Record<string, string>;
}

export interface TestWriteOptions extends AtomicWriteOptions {
  template?: string;
  format?: 'javascript' | 'typescript';
}

export class TestWriter {
  private fileWriter: FileWriter;

  constructor() {
    this.fileWriter = new FileWriter();
  }

  /**
   * Write a single test file from template
   */
  async writeTestFile(
    testPath: string,
    template: TestTemplate,
    options: TestWriteOptions = {}
  ): Promise<FileWriteResult> {
    try {
      const content = this.renderTemplate(template.content, template.variables);
      return await this.fileWriter.writeAtomic(testPath, content, options);
    } catch (error) {
      if (error instanceof FileSystemError) throw error;

      throw new FileSystemError('Failed to write test file', {
        testPath,
        template: template.name,
        error: String(error),
      });
    }
  }

  /**
   * Write multiple test files
   */
  async writeTestFiles(
    files: Array<{ path: string; template: TestTemplate }>,
    options: TestWriteOptions = {}
  ): Promise<FileWriteResult[]> {
    return Promise.all(
      files.map((file) => this.writeTestFile(file.path, file.template, options))
    );
  }

  /**
   * Generate test file diff for review
   */
  generateDiff(
    filePath: string,
    templateContent: string,
    variables?: Record<string, string>
  ): FileDiff {
    const content = this.renderTemplate(templateContent, variables);

    return {
      path: filePath,
      action: 'create',
      after: content,
      size: Buffer.byteLength(content, 'utf-8'),
    };
  }

  /**
   * Render template with variables
   */
  private renderTemplate(
    template: string,
    variables: Record<string, string> = {}
  ): string {
    let content = template;

    // Simple variable replacement: {{ VAR_NAME }}
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{ ${key} }}`;
      content = content.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }

    return content;
  }

  /**
   * Get built-in template by name
   */
  getBuiltInTemplate(name: string): TestTemplate {
    const templates: Record<string, string> = {
      'vitest-function': `
import { describe, it, expect } from 'vitest';
import { {{ FUNCTION_NAME }} } from '{{ IMPORT_PATH }}';

describe('{{ FUNCTION_NAME }}', () => {
  it('should work correctly', () => {
    const result = {{ FUNCTION_NAME }}(/* args */);
    expect(result).toBeDefined();
  });
});
      `.trim(),

      'jest-function': `
import { {{ FUNCTION_NAME }} } from '{{ IMPORT_PATH }}';

describe('{{ FUNCTION_NAME }}', () => {
  test('should work correctly', () => {
    const result = {{ FUNCTION_NAME }}(/* args */);
    expect(result).toBeDefined();
  });
});
      `.trim(),

      'vitest-class': `
import { describe, it, expect } from 'vitest';
import { {{ CLASS_NAME }} } from '{{ IMPORT_PATH }}';

describe('{{ CLASS_NAME }}', () => {
  it('should instantiate', () => {
    const instance = new {{ CLASS_NAME }}();
    expect(instance).toBeDefined();
  });
});
      `.trim(),
    };

    if (!templates[name]) {
      throw new FileSystemError('Unknown template', {
        template: name,
        available: Object.keys(templates),
      });
    }

    return {
      name,
      content: templates[name],
    };
  }
}

export async function writeTestFile(
  testPath: string,
  template: TestTemplate,
  options?: TestWriteOptions
): Promise<FileWriteResult> {
  const writer = new TestWriter();
  return writer.writeTestFile(testPath, template, options);
}
