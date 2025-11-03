import { z } from 'zod';
import type { ValidationError } from './config.js';

const FrameworkSchema = z.enum(['vitest', 'jest', 'mocha', 'auto']).default('auto');

const GenerationSchema = z
  .object({
    colocate: z.boolean().default(false),
    naming: z.enum(['mirror', 'kebab', 'flat']).default('mirror'),
  })
  .optional();

export const ConfigSchemaV1 = z.object({
  version: z.literal('1.0.0').default('1.0.0'),
  framework: FrameworkSchema,
  testDir: z
    .string()
    .default('tests')
    .refine((path) => !path.startsWith('/'), {
      message: 'testDir must be relative',
    }),
  testPattern: z.string().default('**/*.test.ts'),
  plugins: z.array(z.string()).default([]),
  generation: GenerationSchema,
});

export type ConfigSchemaType = z.infer<typeof ConfigSchemaV1>;

export interface ValidationResult {
  success: boolean;
  data: ConfigSchemaType | null;
  errors: ValidationError[];
}

export function validateConfig(input: unknown): ValidationResult {
  try {
    const data = ConfigSchemaV1.parse(input);
    return {
      success: true,
      data,
      errors: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          type: mapZodErrorType(err.code),
        })),
      };
    }
    throw error;
  }
}

function mapZodErrorType(
  code: z.ZodIssueCode
): 'required' | 'invalid' | 'incompatible' {
  switch (code) {
    case 'invalid_type':
      return 'invalid';
    case 'custom':
      return 'incompatible';
    default:
      return 'required';
  }
}
