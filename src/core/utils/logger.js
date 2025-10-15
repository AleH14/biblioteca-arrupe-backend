const { createLogger, format, transports } = require("winston");
const path = require("path");

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info", // 'error' | 'warn' | 'info' | 'debug'
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp, stack }) =>
      stack
        ? `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`
        : `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    // En consola (útil en desarrollo)
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    }),

    // En archivo (útil en producción)
    new transports.File({
      filename: path.join(__dirname, "../../../logs/app.log"),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    })
  ],
  exitOnError: false,
});

module.exports = logger;
