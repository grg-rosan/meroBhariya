// src/config/email.config.js
import nodemailer from "nodemailer";
import AppError from "../utils/error/appError.js";
import logger from "../infrastructure/logger/index.js";
const required = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS"];
for (const key of required) {
  if (!process.env[key]) throw new AppError(`Missing env var: ${key}`);
}

const parseBool = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const v = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  return fallback;
};

const emailPort = Number(process.env.EMAIL_PORT);
const defaultSecure = emailPort === 465;
const secure = parseBool(process.env.EMAIL_SECURE, defaultSecure);
const requireTLS = parseBool(process.env.EMAIL_REQUIRE_TLS, !secure);

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure,
  requireTLS,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error)
    logger.error(
      { err: error, host: process.env.EMAIL_HOST, port: emailPort, secure, requireTLS },
      "[Email] SMTP failed",
    );
  else logger.info("[Email] SMTP ready");
});