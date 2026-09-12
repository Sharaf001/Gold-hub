import { Router } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, productsTable, categoriesTable, usersTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  CreateProductBody,
  CreateProductResponse,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  DeleteProductResponse,
  ListFeaturedProductsResponse,
} from "@workspace/api-zod";
import { getSessionUserId } from "./auth";
import { requireAdmin } from "../lib/require-admin";
import type { Request } from "express";

const router = Router();

async function isAdminRequest(req: Request): Promise<boolean> {
  const token = req.cookies?.session;
  const userId = getSessionUserId(token);
  if (!userId) return false;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return users[0]?.role === "admin";
}

function formatProduct(
  p: typeof productsTable.$inferSelect & { categoryName?: string | null },
  includeCost: boolean,
) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    price: p.price?.toString() ?? "0.00",
    // Cost price is wholesale/business-sensitive data — never sent to
    // non-admin requesters, regardless of what's stored.
    costPrice: includeCost ? (p.costPrice?.toString() ?? null) : null,
    material: p.material ?? null,
    weight: p.weight ?? null,
    imageUrl: p.imageUrl ?? null,
    categoryId: p.categoryId,
    categoryName: p.categoryName ?? null,
    inStock: p.inStock,
    featured: p.featured,
    createdAt: p.createdAt.toISOString(),
  };
}

const productColumns = {
  id: productsTable.id,
  name: productsTable.name,
  slug: productsTable.slug,
  description: productsTable.description,
  price: productsTable.price,
  costPrice: productsTable.costPrice,
  material: productsTable.material,
  weight: productsTable.weight,
  imageUrl: productsTable.imageUrl,
  categoryId: productsTable.categoryId,
  categoryName: categoriesTable.name,
  inStock: productsTable.inStock,
  featured: productsTable.featured,
  createdAt: productsTable.createdAt,
};

router.get("/products/featured", async (req, res): Promise<void> => {
  const includeCost = await isAdminRequest(req);
  const rows = await db
    .select(productColumns)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.featured, true))
    .limit(6);

  res.json(ListFeaturedProductsResponse.parse(rows.map(r => formatProduct(r, includeCost))));
});

router.get("/products", async (req, res): Promise<void> => {
  const includeCost = await isAdminRequest(req);

  const queryParsed = ListProductsQueryParams.safeParse({
    categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
    featured: req.query.featured !== undefined ? req.query.featured === "true" : undefined,
    search: req.query.search ?? undefined,
  });

  const params = queryParsed.success ? queryParsed.data : {};

  const conditions = [];
  if (params.categoryId) conditions.push(eq(productsTable.categoryId, params.categoryId));
  if (params.featured !== undefined && params.featured !== null)
    conditions.push(eq(productsTable.featured, params.featured));
  if (params.search) conditions.push(ilike(productsTable.name, `%${params.search}%`));

  const rows = await db
    .select(productColumns)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json(ListProductsResponse.parse(rows.map(r => formatProduct(r, includeCost))));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const includeCost = await isAdminRequest(req);
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = GetProductParams.parse({ id: parseInt(raw, 10) });

  const rows = await db
    .select(productColumns)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id));

  if (!rows[0]) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(formatProduct(rows[0], includeCost)));
});

router.post("/products", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = {
    ...parsed.data,
    price: parsed.data.price,
    inStock: parsed.data.inStock ?? true,
    featured: parsed.data.featured ?? false,
  };

  const [row] = await db.insert(productsTable).values(data).returning();
  const category = await db.select().from(categoriesTable).where(eq(categoriesTable.id, row.categoryId));
  res.status(201).json(CreateProductResponse.parse(formatProduct({ ...row, categoryName: category[0]?.name ?? null }, true)));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = UpdateProductParams.parse({ id: parseInt(raw, 10) });
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.update(productsTable).set(parsed.data).where(eq(productsTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const category = await db.select().from(categoriesTable).where(eq(categoriesTable.id, row.categoryId));
  res.json(UpdateProductResponse.parse(formatProduct({ ...row, categoryName: category[0]?.name ?? null }, true)));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = DeleteProductParams.parse({ id: parseInt(raw, 10) });

  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json(DeleteProductResponse.parse({ message: "Product deleted" }));
});

export default router;