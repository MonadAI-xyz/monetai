import fs from 'fs';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import moment from 'moment';

// logs dir
const logDir = __dirname + '/../logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// winston format
const { printf } = winston.format;

// Define log format
const logFormat = printf(({ level, message }) => `[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${level?.toUpperCase()}: ${message}`);

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: logFormat,

  transports: [
    // info log setting
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/info', // log file /logs/info/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      json: true,
      zippedArchive: true,
    }),
    // error log setting
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error', // log file /logs/error/*.log in save
      filename: `%DATE%.error.log`,
      maxFiles: 30, // 30 Days saved
      handleExceptions: true,
      json: true,
      zippedArchive: true,
    }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize(), winston.format.simple()),
  }),
);

const stream = {
  write: (message: string) => {
    logger.info(message?.substring(0, message?.lastIndexOf('\n')));
  },
};

export { logger, stream };
