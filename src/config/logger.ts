import winston, { createLogger, format, transports } from 'winston';
const { combine, timestamp, json, colorize } = format;

const logger = createLogger({
  level: 'debug',
  format: combine(colorize(), timestamp(), json()),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message }) => `${level}: ${message}`),
      ),
    }),
    new winston.transports.File({
      filename: 'app.log',
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}] ${message}`;
        }),
      ),
    }),
  ],
});

export default logger;
