import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.config.js";
import asyncHandler from "../utils/asyncHandlers.js";
import AppError from "../utils/appError.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract Token
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError("Not authorized, no token provided", 401));
  }

  // 2. Verify Token 
  // (If this fails, jwt.verify throws an error, asyncHandler catches it)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Check User
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, isActive: true, role: true }
  });

  if (!user) {
    return next(new AppError("The user belonging to this token no longer exists", 401));
  }

  if (!user.isActive) {
    return next(new AppError("This account has been deactivated", 403));
  }

  // 4. Grant Access
  req.user = user;
  next();
});