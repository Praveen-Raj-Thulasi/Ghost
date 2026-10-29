// src/middleware/errorHandler.js
/**
 * Central error‑handling middleware used by app.js.
 * It formats errors into a stable JSON shape and avoids leaking
 * internal details such as stack traces or filesystem paths.
 */
export default (err, req, res, next) => {
  console.error("❌ API error:", err);
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "An unexpected error occurred.";
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};
