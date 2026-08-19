import winston from 'winston';
import {env} from '../config/env';

const isProd = env.NODE_ENV === 'production';

const baseFormat = winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
    winston.format.errors({stack: true}),
    winston.format.metadata({fillExcept: ['message', 'level', 'timestamp', 'stack']})
);

const consoleFormat = isProd
    ? winston.format.combine(baseFormat, winston.format.json())
    : winston.format.combine(
          baseFormat,
          winston.format.colorize(),
          winston.format.printf(({level, message, timestamp, stack, metadata}) => {
              const meta =
                  metadata && Object.keys(metadata as object).length
                      ? ` ${JSON.stringify(metadata)}`
                      : '';
              const body = stack ? `${message}\n${stack}` : message;
              return `${timestamp} [${level}] ${body}${meta}`;
          })
      );

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    defaultMeta: {service: 'pharmacy-api'},
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
        // File transports only when not in pure container stdout mode
        ...(process.env.LOG_TO_FILES === 'true'
            ? [
                  new winston.transports.File({
                      filename: 'logs/error.log',
                      level: 'error',
                      format: winston.format.combine(baseFormat, winston.format.json()),
                      maxsize: 5 * 1024 * 1024,
                      maxFiles: 5,
                  }),
                  new winston.transports.File({
                      filename: 'logs/combined.log',
                      format: winston.format.combine(baseFormat, winston.format.json()),
                      maxsize: 10 * 1024 * 1024,
                      maxFiles: 5,
                  }),
              ]
            : []),
    ],
});

/** Structured helpers for consistent log fields */
export const log = {
    info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
    error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
    debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
    http: (message: string, meta?: Record<string, unknown>) => logger.http?.(message, meta) ?? logger.info(message, meta),
};

export default logger;
