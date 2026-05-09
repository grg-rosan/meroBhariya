// src/utils/services/emailTemplates.js

// ─── Base Layout ──────────────────────────────────────────────────────────────

const baseTemplate = ({ title, bodyHtml }) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
    <div style="background-color: #2D3FEF; padding: 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">meroBhariya</h1>
    </div>
    <div style="padding: 30px; color: #333; line-height: 1.6;">
      <h2 style="margin-top: 0;">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee;">
      &copy; ${new Date().getFullYear()} meroBhariya. All rights reserved.
    </div>
  </div>
`;

const codeBlock = (code) => `
  <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2D3FEF; border-radius: 8px; margin: 25px 0;">
    ${code}
  </div>
`;

// ─── OTP / Registration Verification ─────────────────────────────────────────

export const otpEmailTemplate = (otp) =>
  baseTemplate({
    title: "Verify Your Account",
    bodyHtml: `
      <p>Use the code below to verify your meroBhariya account:</p>
      ${codeBlock(otp)}
      <p style="font-size: 13px; color: #888;">
        This code expires in <strong>5 minutes</strong>. If you didn't request this, you can safely ignore this email.
      </p>
    `,
  });

// ─── Password Reset ───────────────────────────────────────────────────────────

export const resetEmailTemplate = (userName, code) =>
  baseTemplate({
    title: "Password Reset Request",
    bodyHtml: `
      <p>Namaste ${userName},</p>
      <p>We received a request to reset your meroBhariya password. Use the code below:</p>
      ${codeBlock(code)}
      <p style="font-size: 13px; color: #888;">
        This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.
      </p>
    `,
  });

// ─── Wallet Topup Confirmation ────────────────────────────────────────────────

export const topupConfirmationEmailTemplate = (userName, amount, transactionId) =>
  baseTemplate({
    title: "Wallet Top-up Successful",
    bodyHtml: `
      <p>Namaste ${userName},</p>
      <p>Your meroBhariya wallet has been topped up successfully.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0; color: #666;">Amount</td>
          <td style="padding: 10px 0; font-weight: bold; text-align: right;">NPR ${amount}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666;">Transaction ID</td>
          <td style="padding: 10px 0; font-weight: bold; text-align: right; font-size: 13px;">${transactionId}</td>
        </tr>
      </table>
      <p style="font-size: 13px; color: #888;">
        If you did not initiate this top-up, please contact support immediately.
      </p>
    `,
  });