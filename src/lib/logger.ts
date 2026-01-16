/**
 * Structured logging utility
 * Provides consistent logging format across the application
 */

import { config } from './config'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  requestId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private requestId?: string
  private isDevelopment = config.env.isDevelopment

  setRequestId(requestId: string) {
    this.requestId = requestId
  }

  clearRequestId() {
    this.requestId = undefined
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(config.logging.level)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private formatMessage(entry: LogEntry): string {
    if (this.isDevelopment) {
      const levelUpper = entry.level.toUpperCase()
      const parts = [
        '[' + entry.timestamp + ']',
        '[' + levelUpper + ']',
        this.requestId ? '[' + this.requestId + ']' : null,
        entry.message,
      ].filter(Boolean)

      let message = parts.join(' ')

      if (entry.context && Object.keys(entry.context).length > 0) {
        message += '\n' + JSON.stringify(entry.context, null, 2)
      }

      if (entry.error) {
        message += '\n' + entry.error.message
        if (entry.error.stack) {
          message += '\n' + entry.error.stack
        }
      }

      return message
    } else {
      return JSON.stringify(entry)
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(this.requestId && { requestId: this.requestId }),
      ...(context && Object.keys(context).length > 0 && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          ...(this.isDevelopment && error.stack && { stack: error.stack }),
        },
      }),
    }

    const formatted = this.formatMessage(entry)

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error)
  }

  async trackPerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T> {
    if (!config.logging.performance) {
      return fn()
    }

    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      this.debug(operation, {
        ...context,
        duration: duration + 'ms',
        status: 'success',
      })
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.error(operation, error as Error, {
        ...context,
        duration: duration + 'ms',
        status: 'error',
      })
      throw error
    }
  }
}

export const logger = new Logger()

export function createLogger(defaultContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...defaultContext, ...context }),
    error: (message: string, error?: Error, context?: LogContext) =>
      logger.error(message, error, { ...defaultContext, ...context }),
  }
}
