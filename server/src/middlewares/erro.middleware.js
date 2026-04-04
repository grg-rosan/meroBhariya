export const globalMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.statusCode < 500 ? 'fail' : 'error';

  console.error(`[${req.method}] ${req.url} →`, err);

  // Normalize known error types
  if (err.name === 'CastError')         err = castErrorHandler(err);
  if (err.code === 11000)               err = duplicateKeyHandler(err);
  if (err.name === 'ValidationError')   err = validationErrorHandler(err);
  if (err.name === 'JsonWebTokenError') err = jwtErrorHandler();
  if (err.name === 'TokenExpiredError') err = jwtExpiredHandler();

  const isDev = process.env.NODE_ENV === 'development';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};

// Handlers
const castErrorHandler    = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);
const duplicateKeyHandler = (err) => new AppError(`Duplicate value: ${Object.keys(err.keyValue)} already exists`, 400);
const validationErrorHandler = (err) => {
  const messages = Object.values(err.errors).map(e => e.message).join(', ');
  return new AppError(`Validation failed: ${messages}`, 400);
};
const jwtErrorHandler  = () => new AppError('Invalid token', 401);
const jwtExpiredHandler = () => new AppError('Token expired, please log in again', 401);