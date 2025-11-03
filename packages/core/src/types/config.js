import { z } from 'zod';
export const ConfigSchema = z.object({
    version: z.literal('1.0.0').default('1.0.0'),
    framework: z.enum(['vitest', 'jest', 'mocha', 'auto']).default('auto'),
    testDir: z.string().default('tests'),
    testPattern: z.string().default('**/*.test.ts'),
    plugins: z.array(z.string()).default([]),
    generation: z
        .object({
        colocate: z.boolean().default(false),
        naming: z.enum(['mirror', 'kebab', 'flat']).default('mirror'),
    })
        .optional(),
});
//# sourceMappingURL=config.js.map