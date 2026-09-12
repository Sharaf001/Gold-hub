import "dotenv/config";
import { createHmac, randomBytes } from "crypto";
import { db, categoriesTable, productsTable, usersTable } from "./index";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Seeding database...");

  const [rings] = await db
    .insert(categoriesTable)
    .values({ name: "Rings", slug: "rings", description: "Gold rings" })
    .returning();
  const [necklaces] = await db
    .insert(categoriesTable)
    .values({ name: "Necklaces", slug: "necklaces", description: "Gold necklaces" })
    .returning();

  await db.insert(productsTable).values([
    {
      name: "Classic Gold Band",
      slug: "classic-gold-band",
      description: "A timeless 18k gold band.",
      price: "899.00",
      material: "18k Gold",
      weight: "4.2g",
      categoryId: rings.id,
      inStock: true,
      featured: true,
    },
    {
      name: "Filigree Pendant",
      slug: "filigree-pendant",
      description: "Handcrafted filigree pendant necklace.",
      price: "1249.00",
      material: "22k Gold",
      weight: "6.8g",
      categoryId: necklaces.id,
      inStock: true,
      featured: true,
    },
  ]);

  await db.insert(usersTable).values({
    username: "admin",
    passwordHash: hashPassword("admin123"),
    role: "admin",
  });

  console.log("Done. Admin login: admin / admin123");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
