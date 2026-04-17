export const otpEmailTemplate = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">Mero Bhariya Verification</h2>
      <p style="font-size: 16px; color: #555;">Your one-time password (OTP) is:</p>
      <div style="background: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2D3FEF;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #888; margin-top: 20px;">
        This code is valid for 5 minutes. If you didn't request this, please ignore this email.
      </p>
    </div>
  `;
};
