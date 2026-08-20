import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const normalizeMessage = winston.format((info) => {
  if (typeof info.message === "object" && info.message !== null) {
    info.message = JSON.stringify(info.message);
  }
  return info;
});

const normalizeErrorMeta = winston.format((info) => {
  const err = info?.err;
  if (err instanceof Error) {
    info.err = {
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
  const extras = Object.keys(meta).length ? JSON.stringify(meta) : "";
  return `${timestamp} [${level}]: ${message} ${extras}`;
});

const isProd = process.env.NODE_ENV === "production";

const transports = isProd
  ? [
      new winston.transports.File({ filename: "logs/error.log", level: "error" }),
      new winston.transports.File({ filename: "logs/combined.log" }),
    ]
  : [
      new winston.transports.Console(),
    ];

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
    isProd
      ? json()
      : combine(colorize(), devFormat)
  ),
  transports,
});

export default logger;