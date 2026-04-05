// src/modules/auth/auth.controller.js
import * as authService from "./auth.service.js";

// ─── Helper ───────────────────────────────────────────────────────────────────

function handleError(res, err) {
  // Service throws { status, message } for known errors
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
    return res.status(200).json(result);
    // result: { token, user }
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── POST /api/auth/register/rider ───────────────────────────────────────────

export async function registerRiderHandler(req, res) {
  const { name, email, phone, password, vehicleType, plateNumber, address } = req.body;

  const missing = ["name", "email", "phone", "password", "vehicleType", "plateNumber", "address"]
    .filter(k => !req.body[k]);

  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  try {
    const result = await authService.registerRider({
      name, email, phone, password, vehicleType, plateNumber, address,
    });
    return res.status(201).json(result);
    // result: { token, user }
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
    const result = await authService.registerMerchant({
      name, email, phone, password, businessName, address, panNumber,
    });
    return res.status(201).json(result);
    // result: { token, user }
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function getMeHandler(req, res) {
  // req.userId is set by requireAuth middleware
  try {
    const user = await authService.getMe(req.userId);
    return res.status(200).json({ user });
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// JWT is stateless — logout is handled client-side by deleting the token.
// This endpoint exists so the frontend has a consistent API surface.

export async function logoutHandler(req, res) {
  return res.status(200).json({ message: "Logged out successfully." });
}