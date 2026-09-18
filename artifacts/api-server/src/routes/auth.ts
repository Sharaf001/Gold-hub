import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
  GetMeResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  GoogleAuthBody,
  GoogleAuthResponse,
  VerifyCodeBody,
  VerifyCodeResponse,
  ResendVerificationBody,
  ResendVerificationResponse,
} from "@workspace/api-zod";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { sendVerificationEmail } from "../lib/mailer";
import { verifyGoogleIdToken } from "../lib/google";
import { logger } from "../lib/logger";
import { authLimiter } from "../lib/rate-limit";

const router = Router();

function hashPasswordWithNewSalt(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${hash}`;
}

function hashPassword(password: string, salt: string): string {
  return createHmac("sha256", salt).update(password).digest("hex");
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  const computed = hashPassword(password, salt);
  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

function generateVerificationCode(): { code: string; expiresAt: Date } {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  return {
    code,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  };
}

// In-memory sessions: token -> userId
const sessions = new Map<string, number>();

export function getSessionUserId(token: string | undefined): number | undefined {
  if (!token) return undefined;
  return sessions.get(token);
}

/**
 * A registration that hasn't been verified yet. Held ONLY in memory,
 * keyed by email — nothing about an unverified signup (including the
 * email address itself) is written to the database until the code is
 * confirmed. If the server restarts before verification, the pending
 * registration is simply gone and the person has to register again.
 */
type PendingRegistration = {
  username: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  code: string;
  expiresAt: Date;
};
const pendingRegistrations = new Map<string, PendingRegistration>();

function toAuthUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    address: user.address ?? null,
    email: user.email ?? null,
    emailVerified: user.emailVerified,
  };
}

function setSessionCookie(res: import("express").Response, userId: number) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, userId);
  res.cookie("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function logAndSend(email: string, code: string, sent: boolean) {
  logger.info(
    { email, code, emailSent: sent },
    sent
      ? "Verification code sent by email (also logged here as a fallback)"
      : "Verification code NOT emailed (Brevo not configured or send failed) — use this code to verify manually"
  );
}

/**
 * Legacy fallback: re-issues a code for a DB row that's somehow still
 * unverified (only possible for accounts created before this in-memory
 * flow existed). New registrations never reach this — see
 * `pendingRegistrations` above.
 */
async function issueVerificationCodeForExistingRow(email: string): Promise<boolean> {
  const { code, expiresAt } = generateVerificationCode();
  await db
    .update(usersTable)
    .set({ verificationToken: code, verificationTokenExpiresAt: expiresAt })
    .where(eq(usersTable.email, email));

  const sent = await sendVerificationEmail(email, code);
  logAndSend(email, code, sent);
  return sent;
}

router.post("/auth/login", authLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username: rawUsername, password } = parsed.data;
  const username = rawUsername.trim();
  const users = await db.select().from(usersTable).where(eq(usersTable.username, username));
  const user = users[0];

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "This account uses Google Sign-In. Please use the Google button instead." });
    return;
  }

  // passwordHash stores "salt:hash"
  const [salt, hash] = user.passwordHash.split(":");
  if (!salt || !hash || !verifyPassword(password, salt, hash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Only reachable for legacy rows created before verification moved
  // in-memory — normal accounts are always emailVerified by the time
  // they exist in the database now.
  if (!user.emailVerified) {
    if (user.email) {
      await issueVerificationCodeForExistingRow(user.email);
    }
    res.status(403).json({
      error: "Please verify your email before logging in. We've sent a new code to your email.",
      needsVerification: true,
      email: user.email,
    });
    return;
  }

  setSessionCookie(res, user.id);
  res.json(LoginResponse.parse(toAuthUser(user)));
});

router.post("/auth/register", authLimiter, async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username: rawUsername, email: rawEmail, password, role, adminCode } = parsed.data;
  const username = rawUsername.trim();
  const email = rawEmail.trim().toLowerCase();

  if (role === "admin") {
    const requiredCode = process.env["ADMIN_SIGNUP_CODE"];
    if (!requiredCode || adminCode !== requiredCode) {
      res.status(403).json({ error: "Invalid admin code" });
      return;
    }
  }

  const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername[0]) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const existingEmail = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail[0]) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const { code, expiresAt } = generateVerificationCode();

  // Nothing is written to the database yet — held in memory until the
  // code is confirmed in /auth/verify-code below.
  pendingRegistrations.set(email, {
    username,
    email,
    passwordHash: hashPasswordWithNewSalt(password),
    role,
    code,
    expiresAt,
  });

  const sent = await sendVerificationEmail(email, code);
  logAndSend(email, code, sent);

  res.status(201).json(RegisterResponse.parse({ pendingVerification: true, email }));
});

router.post("/auth/google", authLimiter, async (req, res): Promise<void> => {
  const parsed = GoogleAuthBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  let profile;
  try {
    profile = await verifyGoogleIdToken(parsed.data.idToken);
  } catch (err) {
    logger.warn({ err }, "Google token verification failed");
    res.status(401).json({ error: "Invalid Google sign-in" });
    return;
  }

  const email = profile.email.toLowerCase();

  // Look up by googleId first, then fall back to matching an existing
  // account by email (so a user who registered normally can link Google).
  const byGoogleId = await db.select().from(usersTable).where(eq(usersTable.googleId, profile.googleId));
  let user = byGoogleId[0];

  if (!user) {
    const byEmail = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (byEmail[0]) {
      const [updated] = await db
        .update(usersTable)
        .set({ googleId: profile.googleId, emailVerified: true })
        .where(eq(usersTable.id, byEmail[0].id))
        .returning();
      user = updated;
    }
  }

  if (!user) {
    res.status(404).json({
      error: "No account found for this Google email. Please register an account first, then sign in with Google.",
    });
    return;
  }

  setSessionCookie(res, user.id);
  res.json(GoogleAuthResponse.parse(toAuthUser(user)));
});

router.post("/auth/verify-code", authLimiter, async (req, res): Promise<void> => {
  const parsed = VerifyCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter the 6-digit code." });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const pending = pendingRegistrations.get(email);

  if (pending) {
    if (pending.code !== parsed.data.code || pending.expiresAt < new Date()) {
      res.status(400).json({ error: "That code is incorrect or has expired." });
      return;
    }

    // Re-check uniqueness in case someone else took the name/email while
    // this registration was pending.
    const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, pending.username));
    const existingEmail = await db.select().from(usersTable).where(eq(usersTable.email, pending.email));
    if (existingUsername[0] || existingEmail[0]) {
      pendingRegistrations.delete(email);
      res.status(409).json({ error: "That username or email was just taken. Please register again." });
      return;
    }

    // Only now does the account actually get written to the database.
    const [created] = await db
      .insert(usersTable)
      .values({
        username: pending.username,
        email: pending.email,
        passwordHash: pending.passwordHash,
        role: pending.role,
        emailVerified: true,
      })
      .returning();

    pendingRegistrations.delete(email);
    setSessionCookie(res, created.id);
    res.json(VerifyCodeResponse.parse(toAuthUser(created)));
    return;
  }

  // Legacy fallback: a DB row from before this flow existed, still
  // carrying an unverified flag and a token on the row itself.
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
  const user = users[0];

  if (
    !user ||
    !user.verificationToken ||
    user.verificationToken !== parsed.data.code ||
    !user.verificationTokenExpiresAt ||
    user.verificationTokenExpiresAt < new Date()
  ) {
    res.status(400).json({ error: "That code is incorrect or has expired." });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ emailVerified: true, verificationToken: null, verificationTokenExpiresAt: null })
    .where(eq(usersTable.id, user.id))
    .returning();

  setSessionCookie(res, updated.id);
  res.json(VerifyCodeResponse.parse(toAuthUser(updated)));
});

router.post("/auth/resend-verification", authLimiter, async (req, res): Promise<void> => {
  const parsed = ResendVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const pending = pendingRegistrations.get(email);

  if (pending) {
    const { code, expiresAt } = generateVerificationCode();
    pending.code = code;
    pending.expiresAt = expiresAt;
    const sent = await sendVerificationEmail(email, code);
    logAndSend(email, code, sent);
    res.json(
      ResendVerificationResponse.parse({
        message: sent
          ? "A new code has been sent to your email."
          : "Couldn't email the code (check server logs), but a new one was generated — check the dev:api console.",
      })
    );
    return;
  }

  // Legacy fallback for pre-existing unverified DB rows.
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
  const user = users[0];

  if (!user) {
    res.status(404).json({ error: "No pending registration found for this email. Please register again." });
    return;
  }

  if (user.emailVerified) {
    res.json({ message: "This email is already verified." });
    return;
  }

  const sent = await issueVerificationCodeForExistingRow(email);
  res.json(
    ResendVerificationResponse.parse({
      message: sent
        ? "A new code has been sent to your email."
        : "Couldn't email the code (check server logs), but a new one was generated — check the dev:api console.",
    })
  );
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.cookies?.session;
  if (token) sessions.delete(token);
  res.clearCookie("session");
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = req.cookies?.session;
  const userId = getSessionUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json(GetMeResponse.parse(toAuthUser(user)));
});

router.patch("/auth/me", async (req, res): Promise<void> => {
  const token = req.cookies?.session;
  const userId = getSessionUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ address: parsed.data.address ?? null })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json(UpdateProfileResponse.parse(toAuthUser(user)));
});

export default router;