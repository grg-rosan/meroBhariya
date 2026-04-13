// src/modules/auth/auth.middleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// ─── requireAuth ─────────────────────────────────────────────────────────────
// Validates Bearer token and attaches req.userId + req.userRole

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.userId, role: payload.role };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Session expired. Please sign in again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
}

// ─── requireRole ─────────────────────────────────────────────────────────────
// Usage: router.get("/admin/...", requireAuth, requireRole("ADMIN"), handler)

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: "Access denied." });
    }
    next();
  };
}
