import AppError from "../error/appError.js";
import logger from "../../infrastructure/logger/index.js";

let resendClientPromise;
async function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClientPromise) {
    resendClientPromise = import("resend").then(({ Resend }) => new Resend(process.env.RESEND_API_KEY));
  }
  return resendClientPromise;
}

export async function sendEmail({ to, subject, html }) {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.EMAIL_USER
      ? `MeroBhariya <${process.env.EMAIL_USER}>`
      : "MeroBhariya <onboarding@resend.dev>");

  const resend = await getResendClient();
  if (!resend) throw new AppError("Email provider not configured.", 500);

  try {
    const result = await Promise.race([
      resend.emails.send({ from, to, subject, html }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email timeout")), 10000),
      ),
    ]);

    if (result?.error) {
      logger.error("[Email] Resend failed", { err: result.error, to, subject });
      throw new AppError("Could not send email. Please try again later.", 503);
    }
  } catch (err) {
    logger.error("[Email] Resend exception", { err, to, subject });
    throw new AppError("Could not send email. Please try again later.", 503);
  }
}

