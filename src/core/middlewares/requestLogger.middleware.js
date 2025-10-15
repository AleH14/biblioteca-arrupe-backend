const morgan = require("morgan");
const logger = require("../utils/logger");

// Define formato personalizado para Morgan
const stream = {
  write: (message) => logger.info(message.trim()),
};

const skip = () => {
  // En producción, puedes omitir logs de salud o estáticos
  return false;
};

// Middleware de logging
const requestLogger = morgan(
  ":method :url :status - :response-time ms :remote-addr",
  { stream, skip }
);

module.exports = requestLogger;
