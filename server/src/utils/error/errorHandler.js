// src/utils/error/errorHandler.js
import logger from "../services/logger.js";
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function globalErrorMiddleware(err, req, res, next) {
  const statusCode   = err.statusCode  || 500;
  const isOperational = err.isOperational ?? false;
  const message = err.message || "Internal server error.";

  const logContext = {
    statusCode,
    method: req.method,
    url:req.originalUrl,
    userId: req.userId ?? null,
    userRole: req.userRole ?? null,
    err: {
      message:err.message,
      stack:err.stack,
    }
  }
  if (statusCode >= 500) {
    logger.error(logContext,'Unhandled Server error');
  }else{
    logger.warn(logContext,'Client Error')
  }

  return res.status(statusCode).json({ 
    success:false,
    message: isOperational ? err.message : "Something Went Wrong"
   });
}
