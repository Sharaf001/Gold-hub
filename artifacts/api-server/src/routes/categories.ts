import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import {
  ListCategoriesResponse,
  CreateCategoryBody,
  CreateCategoryResponse,
  DeleteCategoryParams,
  DeleteCategoryResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/require-admin";

const router = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  res.json(ListCategoriesResponse.parse(rows.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? null,
    createdAt: r.createdAt.toISOString(),
  }))));
});

router.post("/categories", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json(CreateCategoryResponse.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { id } = DeleteCategoryParams.parse({ id: parseInt(raw, 10) });

  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.json(DeleteCategoryResponse.parse({ message: "Category deleted" }));
});

export default router;