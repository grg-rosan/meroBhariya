import pino from "pino";

const logger = pino({
  level: import.meta.env.VITE_LOG_LEVEL || "info",
});

export default logger;
