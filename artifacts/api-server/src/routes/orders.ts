import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, usersTable } from "@workspace/db";
import {
  ListOrdersResponse,
  CreateOrderBody,
  CreateOrderResponse,
  GetOrderParams,
  GetOrderResponse,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
  ArchiveOrderParams,
  ArchiveOrderResponse,
} from "@workspace/api-zod";
import { getSessionUserId } from "./auth";
import { requireAdmin } from "../lib/require-admin";
import { sendAdminOrderNotification, sendOrderConfirmationEmail } from "../lib/mailer";
import { logger } from "../lib/logger";

const router = Router();

async function getOrderWithItems(orderId: number) {
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  const order = orders[0];
  if (!order) return null;

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  return {
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone ?? null,
    shippingAddress: order.shippingAddress ?? null,
    totalAmount: order.totalAmount?.toString() ?? "0.00",
    status: order.status,
    archived: order.archived,
    notes: order.notes ?? null,
    createdAt: order.createdAt.toISOString(),
    items: items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice?.toString() ?? "0.00",
      imageUrl: item.imageUrl ?? null,
    })),
  };
}

// Lists every order for every customer — admin only.
router.get("/orders", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
  const ordersWithItems = await Promise.all(orders.map(o => getOrderWithItems(o.id)));
  res.json(ListOrdersResponse.parse(ordersWithItems.filter(Boolean)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, ...orderData } = parsed.data;

  // Calculate total
  let total = 0;
  const enrichedItems: Array<{ productId: number; productName: string; quantity: number; unitPrice: number; unitCost: number | null; imageUrl: string | null }> = [];

  for (const item of items) {
    const products = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    const product = products[0];
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const price = parseFloat(product.price?.toString() ?? "0");
    const cost = product.costPrice !== null && product.costPrice !== undefined
      ? parseFloat(product.costPrice.toString())
      : null;
    total += price * item.quantity;
    enrichedItems.push({
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: price,
      unitCost: cost,
      imageUrl: product.imageUrl ?? null,
    });
  }

  const token = req.cookies?.session;
  const userId = getSessionUserId(token);

  const [order] = await db.insert(ordersTable).values({
    ...orderData,
    userId: userId ?? null,
    totalAmount: total.toFixed(2),
    customerPhone: orderData.customerPhone ?? null,
    shippingAddress: orderData.shippingAddress ?? null,
    notes: orderData.notes ?? null,
    status: "pending",
  }).returning();

  for (const item of enrichedItems) {
    await db.insert(orderItemsTable).values({
      orderId: order.id,
      ...item,
      unitPrice: item.unitPrice.toFixed(2),
      unitCost: item.unitCost !== null ? item.unitCost.toFixed(2) : null,
    });
  }

  const full = await getOrderWithItems(order.id);

  // Fire-and-forget notification to every admin with an email on file —
  // never blocks or fails the order response if email sending has issues.
  db.select().from(usersTable).where(eq(usersTable.role, "admin"))
    .then((admins) => {
      const adminEmails = admins.map(a => a.email).filter((e): e is string => !!e);
      if (full) return sendAdminOrderNotification(adminEmails, full);
    })
    .catch((err) => logger.error({ err, orderId: order.id }, "Failed to send admin order notification"));

  res.status(201).json(CreateOrderResponse.parse(full));
});

// Archives every currently-active order (admin only). Orders are kept,
// not deleted — they just stop counting toward active stats/revenue and
// move into order history for both the admin and the customer.
router.delete("/orders", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  await db
    .update(ordersTable)
    .set({ archived: true })
    .where(eq(ordersTable.archived, false));

  res.json({ message: "All active orders moved to history" });
});

// Archives a single order (admin only).
router.patch("/orders/:id/archive", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = ArchiveOrderParams.parse({ id: parseInt(raw, 10) });

  const [order] = await db
    .update(ordersTable)
    .set({ archived: true })
    .where(eq(ordersTable.id, id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const full = await getOrderWithItems(id);
  res.json(ArchiveOrderResponse.parse(full));
});

// Any logged-in customer can see their own orders.
router.get("/orders/mine", async (req, res): Promise<void> => {
  const token = req.cookies?.session;
  const userId = getSessionUserId(token);

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const ordersWithItems = await Promise.all(orders.map(o => getOrderWithItems(o.id)));
  res.json(ListOrdersResponse.parse(ordersWithItems.filter(Boolean)));
});

// Fetching an arbitrary order by id exposes another customer's contact
// details — admin only. Customers use /orders/mine instead.
router.get("/orders/:id", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = GetOrderParams.parse({ id: parseInt(raw, 10) });

  const order = await getOrderWithItems(id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(GetOrderResponse.parse(order));
});

// Changing order status is an admin action.
router.patch("/orders/:id", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = UpdateOrderStatusParams.parse({ id: parseInt(raw, 10) });
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status, notes: parsed.data.notes ?? undefined })
    .where(eq(ordersTable.id, id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const full = await getOrderWithItems(id);

  if (parsed.data.status === "confirmed" && full) {
    sendOrderConfirmationEmail(full).catch((err) =>
      logger.error({ err, orderId: id }, "Failed to send order confirmation email")
    );
  }

  res.json(UpdateOrderStatusResponse.parse(full));
});

export default router;