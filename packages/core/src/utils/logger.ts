export interface Logger {
  log(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  debug(message: string): void;
}

export class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(`Error: ${message}`);
  }

  warn(message: string): void {
    console.warn(`Warning: ${message}`);
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(`Debug: ${message}`);
    }
  }
}
