import { z } from 'zod';
export declare const ConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodLiteral<"1.0.0">>;
    framework: z.ZodDefault<z.ZodEnum<["vitest", "jest", "mocha", "auto"]>>;
    testDir: z.ZodDefault<z.ZodString>;
    testPattern: z.ZodDefault<z.ZodString>;
    plugins: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    generation: z.ZodOptional<z.ZodObject<{
        colocate: z.ZodDefault<z.ZodBoolean>;
        naming: z.ZodDefault<z.ZodEnum<["mirror", "kebab", "flat"]>>;
    }, "strip", z.ZodTypeAny, {
        colocate: boolean;
        naming: "flat" | "mirror" | "kebab";
    }, {
        colocate?: boolean | undefined;
        naming?: "flat" | "mirror" | "kebab" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    version: "1.0.0";
    framework: "vitest" | "jest" | "mocha" | "auto";
    testDir: string;
    testPattern: string;
    plugins: string[];
    generation?: {
        colocate: boolean;
        naming: "flat" | "mirror" | "kebab";
    } | undefined;
}, {
    version?: "1.0.0" | undefined;
    framework?: "vitest" | "jest" | "mocha" | "auto" | undefined;
    testDir?: string | undefined;
    testPattern?: string | undefined;
    plugins?: string[] | undefined;
    generation?: {
        colocate?: boolean | undefined;
        naming?: "flat" | "mirror" | "kebab" | undefined;
    } | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
//# sourceMappingURL=config.d.ts.map