export const resetEmailTemplate = (userName, resetLink) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #2D3FEF; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Mero Bhariya</h1>
      </div>
      <div style="padding: 30px; color: #333; line-height: 1.6;">
        <h2 style="margin-top: 0;">Password Reset Request</h2>
        <p>Namaste ${userName},</p>
        <p>We received a request to reset the password for your Mero Bhariya account. Click the button below to set a new one:</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetLink}" style="background-color: #2D3FEF; color: white; padding: 14px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset My Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
        <p style="font-size: 12px; color: #999;">
          If the button above doesn't work, copy and paste this link into your browser:<br>
          <span style="color: #2D3FEF;">${resetLink}</span>
        </p>
      </div>
    </div>
  `;
};