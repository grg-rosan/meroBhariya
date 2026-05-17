import logger from "../infrastructure/logger";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) logger.error("[Email] SMTP failed:", error.message);
  else logger.log("[Email] SMTP ready ✅");
});