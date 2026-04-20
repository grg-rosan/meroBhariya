import AppError from "../utils/error/appError.js";

// Specialized Handlers
const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);
const handleDuplicateFields = (err) => new AppError(`Duplicate field value. Please use another value!`, 400);
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

export const globalMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = Object.assign(err);
  error.message = err.message;
  error.name = err.name;

  // Log error for the developer
  if (process.env.NODE_ENV === 'development') {
    console.error(`🔥 ERROR [${req.method}] ${req.url}:`, err);
  }

  // Normalize specific library errors
  if (error.name === 'CastError') error = handleCastError(error);
  if (error.code === 11000) error = handleDuplicateFields(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Send Response
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};