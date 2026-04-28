// src/utils/errorHandler.js

export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function globalErrorMiddleware(err, req, res, next) {
  const status  = err.status  || 500;
  const message = err.message || "Internal server error.";

  if (status >= 500) {
    console.error(`[Error] ${req.method} ${req.path}`, err);
  }

  return res.status(status).json({ message });
}
