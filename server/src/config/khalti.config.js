export const khaltiConfig = {
  baseUrl: process.env.KHALTI_BASE_URL || 'https://a.khalti.com/api/v2',
  secretKey: process.env.KHALTI_SECRET_KEY,
  returnUrl: `${process.env.FRONTEND_URL}/merchant/payment/verify`,
  websiteUrl: process.env.FRONTEND_URL,
};