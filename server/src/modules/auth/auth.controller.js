// src/modules/auth/auth.controller.js

import * as authService from "./auth.services.js";

function handleError(res, err) {
  if (err.status && err.message) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error("[Auth] Unhandled error:", err);
  return res.status(500).json({ message: "Internal server error." });
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function loginHandler(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }
  try {
    const result = await authService.login({ email, password });
    console.log("server: ", email,password)
    return res.status(200).json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── POST /api/auth/register/rider ───────────────────────────────────────────

export async function  registerRiderHandler(req, res) {
  const { name, email, phone, password, vehicleType, plateNumber, address } = req.body;
  const missing = ["name", "email", "phone", "password", "vehicleType", "plateNumber", "address"]
    .filter(k => !req.body[k]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  }
  try {
    const result = await authService.registerRider({ name, email, phone, password, vehicleType, plateNumber, address });
    return res.status(201).json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── POST /api/auth/register/merchant ────────────────────────────────────────

export async function registerMerchantHandler(req, res) {
  const { name, email, phone, password, businessName, address, panNumber } = req.body;
  const missing = ["name", "email", "phone", "password", "businessName", "address"]
    .filter(k => !req.body[k]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  }
  try {
    const result = await authService.registerMerchant({ name, email, phone, password, businessName, address, panNumber });
    return res.status(201).json(result);
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function getMeHandler(req, res) {
  try {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json({ user });
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export async function logoutHandler(req, res) {
  return res.status(200).json({ message: "Logged out successfully." });
}

// ─── POST /api/admin/staff ────────────────────────────────────────────────────
// Creates an ADMIN or DISPATCHER account.
// Only accessible by existing ADMIN (enforced by requireRole in admin.routes.js)

export async function createStaffHandler(req, res) {
  const { name, email, phone, password, role } = req.body;

  const missing = ["name", "email", "phone", "password", "role"]
    .filter(k => !req.body[k]);
  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  try {
    const user = await authService.createStaff({
      name, email, phone, password, role,
      createdByUserId: req.userId, // from requireAuth middleware
    });
    return res.status(201).json({
      message: `${role} account created. They can now sign in at /login.`,
      user,
    });
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── GET /api/admin/staff ─────────────────────────────────────────────────────

export async function getStaffListHandler(req, res) {
  try {
    const staff = await authService.getStaffList();
    return res.status(200).json(staff);
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── PATCH /api/admin/staff/:userId/toggle ────────────────────────────────────

export async function toggleStaffStatusHandler(req, res) {
  try {
    const user = await authService.toggleStaffStatus(req.params.userId, req.userId);
    return res.status(200).json(user);
  } catch (err) {
    return handleError(res, err);
  }
}