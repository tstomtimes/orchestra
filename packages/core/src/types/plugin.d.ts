import type { Config } from './config';
export interface PluginMetadata {
    name: string;
    version: string;
    description: string;
    author?: string;
}
export interface PluginContext {
    config: Config;
    projectRoot: string;
}
export interface PluginAPI {
    onInit?(context: PluginContext): Promise<void>;
}
export interface Plugin {
    metadata: PluginMetadata;
    api: PluginAPI;
}
//# sourceMappingURL=plugin.d.ts.map