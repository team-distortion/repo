/**
 * Logger utility with structured logging support
 */

import { config } from '@config';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const LOG_LEVEL_ORDER = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

type LogLevelKey = keyof typeof LOG_LEVEL_ORDER;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  error?: any;
}

class Logger {
  private currentLevel: LogLevelKey;

  constructor(level: string = config.logging.level.toUpperCase()) {
    this.currentLevel = (level in LOG_LEVEL_ORDER ? level : 'INFO') as LogLevelKey;
  }

  private shouldLog(level: LogLevelKey): boolean {
    return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[this.currentLevel];
  }

  private format(level: LogLevel, message: string, data?: any, error?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toString(),
      message,
      ...(data && { data }),
      ...(error && { error: this.serializeError(error) }),
    };

    if (config.logging.format === 'json') {
      return JSON.stringify(entry);
    }

    // Simple format for development
    let output = `[${entry.timestamp}] [${entry.level}] ${message}`;
    if (data) output += ` ${JSON.stringify(data)}`;
    if (error) output += ` ${JSON.stringify(this.serializeError(error))}`;
    return output;
  }

  private serializeError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return error;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('DEBUG')) {
      console.debug(this.format(LogLevel.DEBUG, message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('INFO')) {
      console.log(this.format(LogLevel.INFO, message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('WARN')) {
      console.warn(this.format(LogLevel.WARN, message, data));
    }
  }

  error(message: string, error?: any, data?: any): void {
    if (this.shouldLog('ERROR')) {
      console.error(this.format(LogLevel.ERROR, message, data, error));
    }
  }
}

export default new Logger();
