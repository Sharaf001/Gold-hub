import { pgTable, serial, timestamp } from "drizzle-orm/pg-core";

export const adminSettingsTable = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  revenueResetAt: timestamp("revenue_reset_at", { withTimezone: true }),
  profitResetAt: timestamp("profit_reset_at", { withTimezone: true }),
});

export type AdminSettings = typeof adminSettingsTable.$inferSelect;