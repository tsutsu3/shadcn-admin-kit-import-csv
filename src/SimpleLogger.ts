/**
 * A lightweight logger that prefixes messages with an identifier and can be toggled on/off.
 * Each instance gets a unique short ID for distinguishing log output.
 */
export class SimpleLogger {
  private readonly loggerID = Math.random().toString(32).slice(2, 6);

  /**
   * @param prefix - A label prepended to all log messages (e.g. module name).
   * @param debug - Whether logging is initially enabled.
   */
  constructor(
    private readonly prefix: string,
    private debug: boolean,
  ) {}

  private getLogString() {
    return `shadcn-ra-csv-import:: ${this.prefix} [${this.loggerID}] `;
  }

  /** Returns a bound `console.log` function, or a no-op if logging is disabled. */
  public get log() {
    if (!this.debug) {
      return (..._any: any[]) => {};
    }
    const boundLogFn: (...args: any[]) => void = console.log.bind(console, this.getLogString());
    return boundLogFn;
  }

  /** Returns a bound `console.warn` function, or a no-op if logging is disabled. */
  public get warn() {
    if (!this.debug) {
      return (..._any: any[]) => {};
    }
    const boundLogFn: (...args: any[]) => void = console.warn.bind(console, this.getLogString());
    return boundLogFn;
  }

  /** Returns a bound `console.error` function, or a no-op if logging is disabled. */
  public get error() {
    if (!this.debug) {
      return (..._any: any[]) => {};
    }
    const boundLogFn: (...args: any[]) => void = console.error.bind(console, this.getLogString());
    return boundLogFn;
  }

  /** Enables or disables logging at runtime. */
  setEnabled(logging: boolean) {
    this.debug = logging;
  }
}
