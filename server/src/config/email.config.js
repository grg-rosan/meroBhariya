// src/config/email.config.js
import nodemailer from "nodemailer";
import AppError from "../utils/error/appError.js";
import logger from "../infrastructure/logger/index.js";
const required = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS"];
for (const key of required) {
  if (!process.env[key]) throw new AppError(`Missing env var: ${key}`);
}
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) logger.error("[Email] SMTP failed:", error.message);
  else logger.info("[Email] SMTP ready");
});