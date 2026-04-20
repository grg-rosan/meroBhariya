// src/modules/auth/auth.controller.js

import * as authService from "./auth.services.js";
import { catchAsync} from "../../utils/error/errorHandler.js";
import AppError from "../../utils/error/appError.js";

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export const loginHandler = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw AppError("Invalid email or password", 401);
  }
  const result = await authService.login({ email, password });
  return res.status(200).json(result);
});

// ─── POST /api/auth/register/rider ───────────────────────────────────────────

export const initiateRegistrationHandler = catchAsync(async (req, res) => {
  const { role, ...payload } = req.body;
  if (!role) throw new AppError("Role is required.", 400);
  const result = await authService.initiateRegistration(role, payload);
  return res.status(200).json(result);
});

export const completeRegistrationHandler = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const missing = ["email", "otp"].filter(k => !req.body[k]);
  if (missing.length) throw new AppError(`Missing: ${missing.join(", ")}`, 400);
  const result = await authService.completeRegistration(email, otp);
  return res.status(201).json(result);
});

export const resendRegistrationOtpHandler = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError("Email is required.", 400);
  const result = await authService.resendRegistrationOtp(email);
  return res.status(200).json(result);
});
  // ─── POST /api/auth/otp/send ─────────────────────────────────────────────────

  export const sendOtpHandler = catchAsync(async (req, res) => {
    const {  email } = req.body;
 if (!email) throw new AppError("Email is required.", 400);

 const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("User not found.", 404);

    const result = await authService.sendOtp(user.id, email);
    return res.status(200).json(result);
  });

  // ─── POST /api/auth/otp/verify ───────────────────────────────────────────────

  export const verifyOtpHandler = catchAsync(async (req, res) => {
    const { email, otp } = req.body;

    const missing = ["email", "otp"].filter((k) => !req.body[k]);
    if (missing.length)
      throw new AppError(`Missing fields: ${missing.join(", ")}`, 400);

    const result = await authService.verifyOtp(user.id, otp);
    return res.status(200).json(result);
  });

  // ─── POST /api/auth/password/forgot ──────────────────────────────────────────

  export const forgotPasswordHandler = catchAsync(async (req, res) => {
    const { email } = req.body;
    console.log(email)
    if (!email) throw new AppError("Email is required.", 400);

    const result = await authService.forgotPassword(email);
    return res.status(200).json(result);
  });

  // ─── POST /api/auth/password/reset ───────────────────────────────────────────

  export const  resetPasswordHandler = catchAsync(async (req, res) => {
    const { email,code, newPassword } = req.body;

    const missing = ["token", "newPassword"].filter((k) => !req.body[k]);
    if (missing.length)
      throw new AppError(`Missing fields: ${missing.join(", ")}`, 400);

    const result = await authService.resetPassword(code, newPassword);
    return res.status(200).json(result);
  });

// ________ GET /api/auth/me ____________

export const getMeHandler = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return res.status(200).json({ user });
});

// _________ POST /api/auth/logout ____________

export const logoutHandler = catchAsync(async (req, res) => {
  return res.status(200).json({ message: "Logged out successfully." });
});

// ─── POST /api/admin/staff ────────────────────────────────────────────────────
// Creates an ADMIN or DISPATCHER account.
// Only accessible by existing ADMIN (enforced by requireRole in admin.routes.js)

export const createStaffHandler = catchAsync(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  const missing = ["name", "email", "phone", "password", "role"].filter(
    (k) => !req.body[k],
  );
  if (missing.length) {
    throw AppError(`Missing fields: ${missing.join(", ")}`, 400);
  }
  const user = await authService.createStaff({
    name,
    email,
    phone,
    password,
    role,
    createdByUserId: req.userId, // from requireAuth middleware
  });
  return res.status(201).json({
    message: `${role} account created. They can now sign in at /login.`,
    user,
  });
});

// ─── GET /api/admin/staff ─────────────────────────────────────────────────────

export const getStaffListHandler = catchAsync(async (req, res) => {
  const staff = await authService.getStaffList();
  return res.status(200).json(staff);
});

// ─── PATCH /api/admin/staff/:userId/toggle ────────────────────────────────────

export const toggleStaffStatusHandler = catchAsync(async (req, res) => {
  const user = await authService.toggleStaffStatus(
    req.params.userId,
    req.userId,
  );
  return res.status(200).json(user);
});
