import jwt from "jsonwebtoken";
import AppError from "../../utils/error/appError.js";
const JWT_SECRET = process.env.JWT_SECRET;

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided.", 401));
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
      return next(new AppError("Session expired. Please sign in again.", 401));
    }
    return next(new AppError("Invalid token.", 401));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    // Safety check: ensure requireAuth was called first
    if (!req.userRole) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!roles.includes(req.userRole)) {
      return next(
        new AppError("Access denied: Insufficient permissions.", 403),
      );
    }
    next();
  };
}
