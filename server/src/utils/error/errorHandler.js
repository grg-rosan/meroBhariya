// src/utils/error/errorHandler.js
import logger from "../../infrastructure/logger/index.js";
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
export function globalErrorMiddleware(err, req, res, next) {
  const statusCode    = err.statusCode  || 500;
  const isOperational = err.isOperational ?? false;
  const message        = err.message || "Internal server error.";

  const logContext = {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    userId: req.userId ?? null,
    userRole: req.userRole ?? null,
    err,
  };

  if (statusCode >= 500) {
    logger.error("Unhandled Server error", logContext);
  } else {
    logger.warn("Client Error", logContext);
  }

  return res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : "Something Went Wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}