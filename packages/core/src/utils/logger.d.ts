export interface Logger {
    log(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    debug(message: string): void;
}
export declare class ConsoleLogger implements Logger {
    log(message: string): void;
    error(message: string): void;
    warn(message: string): void;
    debug(message: string): void;
}
//# sourceMappingURL=logger.d.ts.map