import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getSessionUserId } from "../routes/auth";
import type { Request, Response } from "express";

/**
 * Confirms the request's session belongs to an admin. Sends the
 * appropriate 401/403 and returns null if not; otherwise returns the
 * admin's userId so the caller can proceed.
 */
export async function requireAdmin(req: Request, res: Response): Promise<number | null> {
  const token = req.cookies?.session;
  const userId = getSessionUserId(token);

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (users[0]?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }

  return userId;
}