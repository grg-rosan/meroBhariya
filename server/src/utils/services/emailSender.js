import AppError from "../error/appError.js";
import logger from "../../infrastructure/logger/index.js";

const isProd = process.env.NODE_ENV === "production";

// ── Production: Resend ──────────────────────────────
let resendClientPromise;
async function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClientPromise) {
    resendClientPromise = import("resend").then(({ Resend }) => new Resend(process.env.RESEND_API_KEY));
  }
  return resendClientPromise;
}

async function sendViaResend({ to, subject, html }) {
  if (!process.env.EMAIL_FROM) {
    throw new AppError(
      "EMAIL_FROM is not configured for production. Set it to an address on a Resend-verified domain.",
      500,
    );
  }
  const resend = await getResendClient();
  if (!resend) throw new AppError("Email provider not configured.", 500);

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (result?.error) {
    throw new Error(JSON.stringify(result.error));
  }
}

// ── Development: Gmail SMTP via Nodemailer ──────────
let nodemailerTransportPromise;
async function getNodemailerTransport() {
  if (!nodemailerTransportPromise) {
    nodemailerTransportPromise = import("nodemailer").then(({ default: nodemailer }) =>
      nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false, // true for 465, false for 587
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }),
    );
  }
  return nodemailerTransportPromise;
}

async function sendViaGmail({ to, subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new AppError("EMAIL_USER/EMAIL_PASS not configured for development.", 500);
  }
  const transport = await getNodemailerTransport();

  await transport.sendMail({
    from: `MeroBhariya <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// ── Unified entry point ─────────────────────────────
export async function sendEmail({ to, subject, html }) {
  try {
    await Promise.race([
      isProd ? sendViaResend({ to, subject, html }) : sendViaGmail({ to, subject, html }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email timeout")), 10000),
      ),
    ]);

    logger.info("[Email] Sent", { to, subject, provider: isProd ? "resend" : "gmail-smtp" });
  } catch (err) {
    logger.error("[Email] Send failed", { err, to, subject, provider: isProd ? "resend" : "gmail-smtp" });
    throw new AppError("Could not send email. Please try again later.", 503);
  }
} 