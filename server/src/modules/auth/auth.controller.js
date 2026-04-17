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

export const registerRiderHandler = catchAsync(async (req, res) => {
  const { name, email, phone, password, vehicleType, plateNumber, address } =
    req.body;
  const missing = [
    "name",
    "email",
    "phone",
    "password",
    "vehicleType",
    "plateNumber",
    "address",
  ].filter((k) => !req.body[k]);
  if (missing.length) {
    throw AppError(`Missing fields: ${missing.join(", ")}`, 400);
  }
  const result = await authService.registerRider({
    name,
    email,
    phone,
    password,
    vehicleType,
    plateNumber,
    address,
  });
  return res.status(201).json(result);
});

// ─── POST /api/auth/register/merchant ────────────────────────────────────────

export const registerMerchantHandler = catchAsync(async (req, res) => {
  const { name, email, phone, password, businessName, address, panNumber } =
    req.body;
  const missing = [
    "name",
    "email",
    "phone",
    "password",
    "businessName",
    "address",
  ].filter((k) => !req.body[k]);
  if (missing.length) {
    throw AppError(`Missing fields: ${missing.join(", ")}`, 400);
  }
  const result = await authService.registerMerchant({
    name,
    email,
    phone,
    password,
    businessName,
    address,
    panNumber,
  });
  return res.status(201).json(result);
});

  // ─── POST /api/auth/otp/send ─────────────────────────────────────────────────

  export const sendOtpHandler = catchAsync(async (req, res) => {
    const { userId, email } = req.body;
    const missing = ["userId", "email"].filter((k) => !req.body[k]);
    if (missing.length)
      throw new AppError(`Missing fields: ${missing.join(", ")}`, 400);

    const result = await authService.sendOtp(userId, email);
    return res.status(200).json(result);
  });

  // ─── POST /api/auth/otp/verify ───────────────────────────────────────────────

  export const verifyOtpHandler = catchAsync(async (req, res) => {
    const { userId, otp } = req.body;

    const missing = ["userId", "otp"].filter((k) => !req.body[k]);
    if (missing.length)
      throw new AppError(`Missing fields: ${missing.join(", ")}`, 400);

    const result = await authService.verifyOtp(userId, otp);
    return res.status(200).json(result);
  });

  // ─── POST /api/auth/password/forgot ──────────────────────────────────────────

  export const forgotPasswordHandler = catchAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new AppError("Email is required.", 400);

    const result = await authService.forgotPassword(email);
    return res.status(200).json(result);
  });

  // ─── POST /api/auth/password/reset ───────────────────────────────────────────

  export const  resetPasswordHandler = catchAsync(async (req, res) => {
    const { token, newPassword } = req.body;

    const missing = ["token", "newPassword"].filter((k) => !req.body[k]);
    if (missing.length)
      throw new AppError(`Missing fields: ${missing.join(", ")}`, 400);

    const result = await authService.resetPassword(token, newPassword);
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
