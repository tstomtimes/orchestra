export class ConsoleLogger {
    log(message) {
        console.log(message);
    }
    error(message) {
        console.error(`Error: ${message}`);
    }
    warn(message) {
        console.warn(`Warning: ${message}`);
    }
    debug(message) {
        if (process.env.DEBUG) {
            console.log(`Debug: ${message}`);
        }
    }
}
//# sourceMappingURL=logger.js.map