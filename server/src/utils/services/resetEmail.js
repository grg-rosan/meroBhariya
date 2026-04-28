export const resetEmailTemplate = (userName, code) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #2D3FEF; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Mero Bhariya</h1>
      </div>
      <div style="padding: 30px; color: #333; line-height: 1.6;">
        <h2 style="margin-top: 0;">Password Reset Request</h2>
        <p>Namaste ${userName},</p>
        <p>We received a request to reset your Mero Bhariya password. Use the code below:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2D3FEF; border-radius: 8px; margin: 25px 0;">
          ${code}
        </div>
        <p style="font-size: 14px; color: #666;">
          This code expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
};