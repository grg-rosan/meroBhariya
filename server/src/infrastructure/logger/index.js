import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

// Handles BigInt from raw Prisma/PostGIS queries showing up in log metadata
const safeStringify = (obj) =>
  JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v));

const normalizeMessage = winston.format((info) => {
  if (typeof info.message === "object" && info.message !== null) {
    info.message = safeStringify(info.message);
  }
  return info;
});

const normalizeErrorMeta = winston.format((info) => {
  const err = info?.err;
  if (err instanceof Error) {
    info.err = {
      ...err,
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      address: err.address,
      port: err.port,
      responseCode: err.responseCode,
      response: err.response,
      command: err.command,
    };
  }
  return info;
});

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const extras = Object.keys(meta).length ? safeStringify(meta) : "";
  return `${timestamp} [${level}]: ${message} ${extras}`;
});

const isProd = process.env.NODE_ENV === "production";

// Always keep Console in prod too — Render captures stdout regardless of Logtail status
const transports = [new winston.transports.Console()];

if (isProd && process.env.BETTERSTACK_TOKEN) {
  const logtail = new Logtail(process.env.BETTERSTACK_TOKEN);
  transports.push(new LogtailTransport(logtail));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    errors({ stack: true }),
    normalizeMessage(),
    normalizeErrorMeta(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    isProd ? json() : combine(colorize({ all: true }), devFormat),
  ),
  transports,
  exceptionHandlers: transports,
  rejectionHandlers: transports,
});

export const logError = (msg, meta) => logger.error(msg, meta);
export const logWarn = (msg, meta) => logger.warn(msg, meta);
export const logInfo = (msg, meta) => logger.info(msg, meta);
export default logger;