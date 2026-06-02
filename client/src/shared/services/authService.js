import { API, apiGet, apiPost, apiPatch } from "../hooks/useApi";

export const authAPI = {
  initiateRegistration: (role, payload) =>
    apiPost(`/api/auth/register/initiate`, { role, ...payload }),

  completeRegistration: (email, otp) =>
    apiPost(`/api/auth/register/complete`, { email, otp }),

  resendRegistrationOtp: (email) =>
    apiPost(`/api/auth/register/resend-otp`, { email }),

  logout: () => apiPost(`/api/auth/logout`).catch(() => {}),
  
  me: () => apiGet(`/api/auth/me`),
  login: (email, password) =>
    apiPost(`/api/auth/login`, { email, password }),

  sendOtp: (email) => apiPost(`/api/auth/otp/send`, { email }),
  verifyOtp: (email, otp) =>
    apiPost(`/api/auth/otp/verify`, { email, otp }),

  forgotPassword: (email) =>
    apiPost(`/api/auth/password/forgot`, { email }),

  verifyPasswordReset: (email, code) =>
    apiPost(`/api/auth/password/verify-code`, { email, code }),

  resetPassword: (email, resetCode, password) =>
    apiPost(`/api/auth/password/reset`, {
      email,
      code: resetCode,
      newPassword: password,
    }),

  changePassword: (currentPassword, newPassword) =>
    apiPatch(`/api/auth/password/change`, { currentPassword, newPassword }),
};