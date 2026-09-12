import rateLimit from "express-rate-limit";

// General ceiling for the whole API — generous enough for normal browsing,
// but stops runaway scripts/scrapers from hammering the server.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again shortly." },
});

// Strict limiter for auth endpoints — login, register, code verification,
// resend, and Google sign-in. These are the routes most worth protecting
// against brute-forcing (e.g. guessing the 6-digit verification code or
// password-spraying a username).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});