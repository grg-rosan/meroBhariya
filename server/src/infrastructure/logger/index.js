import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const { combine, timestamp, colorize, printf, json } = winston.format;


const normalizeMessage = winston.format((info) => {
  if (typeof info.message === "object" && info.message !== null) {
    info.message = JSON.stringify(info.message);
  }
  return info;
});

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const extras = Object.keys(meta).length ? JSON.stringify(meta) : "";
  return `${timestamp} [${level}]: ${message} ${extras}`;
});

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  new winston.transports.File({ filename: "logs/combined.log" }),
];

if (process.env.NODE_ENV === "production" && process.env.BETTERSTACK_TOKEN) {
  const logtail = new Logtail(process.env.BETTERSTACK_TOKEN);
  transports.push(new LogtailTransport(logtail));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    normalizeMessage(), 
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    process.env.NODE_ENV === "production"
      ? json()
      : combine(colorize(), devFormat)
  ),
  transports,
});

export default logger;