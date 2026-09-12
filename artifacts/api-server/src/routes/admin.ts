import { Router } from "express";
import { eq, count, sum, and, gte, isNotNull } from "drizzle-orm";
import { db, productsTable, ordersTable, orderItemsTable, categoriesTable, adminSettingsTable } from "@workspace/db";
import { GetAdminStatsResponse } from "@workspace/api-zod";
import { requireAdmin } from "../lib/require-admin";

const router = Router();

async function getSettings() {
  const rows = await db.select().from(adminSettingsTable);
  if (rows[0]) return rows[0];
  const [created] = await db.insert(adminSettingsTable).values({}).returning();
  return created;
}

/**
 * Profit = sum((unitPrice - unitCost) * quantity) across order items whose
 * order was placed after `since` (if given). Items with no cost recorded
 * (product had no cost price set at the time of sale) are skipped rather
 * than treated as 100% profit.
 */
async function computeProfit(since?: Date): Promise<number> {
  const rows = await db
    .select({
      unitPrice: orderItemsTable.unitPrice,
      unitCost: orderItemsTable.unitCost,
      quantity: orderItemsTable.quantity,
    })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(
      and(
        isNotNull(orderItemsTable.unitCost),
        since ? gte(ordersTable.createdAt, since) : undefined,
      ),
    );

  return rows.reduce((sum, row) => {
    const price = parseFloat(row.unitPrice?.toString() ?? "0");
    const cost = parseFloat(row.unitCost?.toString() ?? "0");
    return sum + (price - cost) * row.quantity;
  }, 0);
}

router.get("/admin/stats", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const settings = await getSettings();

  const [productCount] = await db.select({ count: count() }).from(productsTable);
  const [orderCount] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.archived, false));

  // Revenue and profit are intentionally NOT filtered by `archived` —
  // archiving orders is purely organizational and must never change
  // either figure. They only change when the admin explicitly resets
  // them (see the /admin/reset-* routes below), which just moves the
  // cutoff date used here — orders themselves are never touched.
  const revenueWhere = settings.revenueResetAt
    ? gte(ordersTable.createdAt, settings.revenueResetAt)
    : undefined;
  const [revenueResult] = await db
    .select({ total: sum(ordersTable.totalAmount) })
    .from(ordersTable)
    .where(revenueWhere);

  const totalProfit = await computeProfit(settings.profitResetAt ?? undefined);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const profitSince = settings.profitResetAt && settings.profitResetAt > sevenDaysAgo
    ? settings.profitResetAt
    : sevenDaysAgo;
  const recentProfit = await computeProfit(profitSince);

  const [pendingCount] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(and(eq(ordersTable.status, "pending"), eq(ordersTable.archived, false)));

  // Recent orders (last 7 days)
  const [recentCount] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(and(gte(ordersTable.createdAt, sevenDaysAgo), eq(ordersTable.archived, false)));

  // Out-of-stock products
  const [outOfStockCount] = await db
    .select({ count: count() })
    .from(productsTable)
    .where(eq(productsTable.inStock, false));

  // Category counts
  const categories = await db.select().from(categoriesTable);
  const categoryCounts = await Promise.all(
    categories.map(async (cat) => {
      const [cnt] = await db
        .select({ count: count() })
        .from(productsTable)
        .where(eq(productsTable.categoryId, cat.id));
      return { categoryName: cat.name, count: cnt.count };
    })
  );

  res.json(
    GetAdminStatsResponse.parse({
      totalProducts: productCount.count,
      totalOrders: orderCount.count,
      totalRevenue: revenueResult.total?.toString() ?? "0.00",
      totalProfit: totalProfit.toFixed(2),
      recentProfit: recentProfit.toFixed(2),
      pendingOrders: pendingCount.count,
      lowStockProducts: outOfStockCount.count,
      recentOrdersCount: recentCount.count,
      categoryCounts,
    })
  );
});

// Manually resets the revenue figure to zero going forward. This never
// touches order records — it just moves the cutoff date used above, so
// archiving/clearing orders never has any side effect on revenue.
router.post("/admin/reset-revenue", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const settings = await getSettings();
  await db
    .update(adminSettingsTable)
    .set({ revenueResetAt: new Date() })
    .where(eq(adminSettingsTable.id, settings.id));

  res.json({ message: "Revenue reset" });
});

// Manually resets the profit figure to zero going forward. Fully
// independent of the revenue reset and of order archiving — orders and
// their cost/price data are never touched.
router.post("/admin/reset-profit", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const settings = await getSettings();
  await db
    .update(adminSettingsTable)
    .set({ profitResetAt: new Date() })
    .where(eq(adminSettingsTable.id, settings.id));

  res.json({ message: "Profit reset" });
});

export default router;