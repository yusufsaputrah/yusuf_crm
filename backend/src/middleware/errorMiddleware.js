/**
 * @file errorMiddleware.js
 * @description Global error handling middleware for Express.
 */

/**
 * Centralized error handler.
 * Catches errors passed via next(err) from any route or middleware.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler for unmatched routes.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
};

module.exports = { errorHandler, notFoundHandler };
