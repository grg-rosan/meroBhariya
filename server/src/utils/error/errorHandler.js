// src/utils/errorHandler.js



// ─── Controller catch helper ──────────────────────────────────────────────────

/**
 * Wraps a controller handler so you never need to write try/catch manually.
 *
 * Usage:
 *   router.get("/stats", catchAsync(getStatsHandler));
 *
 * Instead of:
 *   router.get("/stats", async (req, res) => { try { ... } catch (e) { ... } });
 */
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ─── Global Express error middleware ─────────────────────────────────────────
// Mount this LAST in app.js:  app.use(globalErrorMiddleware);

export function globalErrorMiddleware(err, req, res, next) {
  const status  = err.status  || 500;
  const message = err.message || "Internal server error.";

  if (status >= 500) {
    console.error(`[Error] ${req.method} ${req.path}`, err);
  }

  return res.status(status).json({ message });
}
