import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import util from 'util';
import { env } from '@root/app/env';

const logDir = path.join(process.cwd(), 'logs');

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'app-%DATE%.log',
  dirname: logDir,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '31d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format((info) => {
      info.version = env.APP_VERSION;
      return info;
    })(),
    winston.format.json()
  )
});

const logger = winston.createLogger({
  level: 'info',
  transports: [
    fileRotateTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message }) => {
          return `${level}: ${String(message)}`;
        })
      )
    })
  ]
});

// Override console methods to capture all logs
console.log = (...args: unknown[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  logger.info(util.format(...args));
};

console.error = (...args: unknown[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  logger.error(util.format(...args));
};

console.warn = (...args: unknown[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  logger.warn(util.format(...args));
};

console.info = (...args: unknown[]) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  logger.info(util.format(...args));
};

export default logger;

