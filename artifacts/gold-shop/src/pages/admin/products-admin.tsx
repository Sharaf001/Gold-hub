import { useState } from "react";
import {
  useListProducts,
  useListCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import AdminHeader from "@/components/admin-header";

type ProductForm = {
  name: string; slug: string; description: string; price: string; costPrice: string;
  material: string; weight: string; imageUrl: string;
  categoryId: number; inStock: boolean; featured: boolean;
};

const emptyForm: ProductForm = {
  name: "", slug: "", description: "", price: "", costPrice: "", material: "",
  weight: "", imageUrl: "", categoryId: 0, inStock: true, featured: false,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminProducts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isChecking } = useRequireAdmin();

  const { data: products, isLoading } = useListProducts({}, { query: { queryKey: getListProductsQueryKey() } });
  const { data: categories } = useListCategories();

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListProductsQueryKey() });

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => { toast({ title: "Product created" }); invalidate(); setModal(null); },
      onError: () => toast({ title: "Error creating product", variant: "destructive" }),
    },
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => { toast({ title: "Product updated" }); invalidate(); setModal(null); },
      onError: () => toast({ title: "Error updating product", variant: "destructive" }),
    },
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => { toast({ title: "Product deleted" }); invalidate(); setDeleteConfirm(null); },
      onError: () => toast({ title: "Error deleting product", variant: "destructive" }),
    },
  });

  function openCreate() {
    setForm({ ...emptyForm, categoryId: categories?.[0]?.id ?? 0 });
    setModal("create");
  }

  function openEdit(p: NonNullable<typeof products>[0]) {
    setForm({
      name: p.name, slug: p.slug, description: p.description ?? "",
      price: p.price, costPrice: p.costPrice ?? "", material: p.material ?? "", weight: p.weight ?? "",
      imageUrl: p.imageUrl ?? "", categoryId: p.categoryId,
      inStock: p.inStock, featured: p.featured,
    });
    setEditId(p.id);
    setModal("edit");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      ...form,
      description: form.description || null,
      costPrice: form.costPrice || null,
      material: form.material || null,
      weight: form.weight || null,
      imageUrl: form.imageUrl || null,
    };
    if (modal === "create") createProduct.mutate({ data });
    else if (modal === "edit" && editId) updateProduct.mutate({ id: editId, data });
  }

  const inputCls = "w-full bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors";
  const labelCls = "block text-xs tracking-widest uppercase text-muted-foreground mb-1.5";

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Checking access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-serif text-4xl text-foreground font-light">Products</h1>
            <p className="text-muted-foreground text-sm mt-1">{products?.length ?? 0} pieces in collection</p>
          </div>
          <button
            data-testid="button-add-product"
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>

        {/* Table */}
        <div className="border border-border bg-card overflow-hidden overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center"><div className="animate-pulse text-muted-foreground text-sm">Loading...</div></div>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead className="border-b border-border">
                <tr>
                  {["Image", "Name", "Category", "Price", "Stock", "Featured", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs text-muted-foreground tracking-widest uppercase px-4 py-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products?.map((p, i) => (
                  <tr key={p.id} data-testid={`row-product-${p.id}`} className={i !== (products.length - 1) ? "border-b border-border" : ""}>
                    <td className="px-4 py-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 bg-muted border border-border" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium">{p.name}</p>
                      {p.material && <p className="text-xs text-muted-foreground">{p.material}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs tracking-wider uppercase">{p.categoryName}</td>
                    <td className="px-4 py-3 text-primary font-serif">${p.price}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs tracking-wider uppercase ${p.inStock ? "text-green-400" : "text-red-400"}`}>
                        {p.inStock ? "In Stock" : "Out"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs tracking-wider uppercase ${p.featured ? "text-primary" : "text-muted-foreground"}`}>
                        {p.featured ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          data-testid={`button-edit-product-${p.id}`}
                          onClick={() => openEdit(p)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          data-testid={`button-delete-product-${p.id}`}
                          onClick={() => setDeleteConfirm(p.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-6 py-10 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-card border border-border p-8 my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-foreground font-light">
                {modal === "create" ? "Add Product" : "Edit Product"}
              </h2>
              <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input
                    data-testid="input-product-name"
                    type="text" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Price (USD) *</label>
                  <input
                    data-testid="input-product-price"
                    type="text" required value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 1250.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Cost Price (USD)</label>
                  <input
                    data-testid="input-product-cost-price"
                    type="text" value={form.costPrice}
                    onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                    placeholder="e.g. 800.00 — used for profit tracking"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Slug *</label>
                <input type="text" required value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Category *</label>
                <select
                  data-testid="input-product-category"
                  required value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
                  className={inputCls}
                >
                  {categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Material</label>
                  <input type="text" value={form.material}
                    onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
                    className={inputCls} placeholder="e.g. 18K Yellow Gold"
                  />
                </div>
                <div>
                  <label className={labelCls}>Weight</label>
                  <input type="text" value={form.weight}
                    onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                    className={inputCls} placeholder="e.g. 4.2g"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Image URL</label>
                <input type="url" value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className={inputCls} placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.inStock}
                    onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm text-foreground">In Stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured}
                    onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm text-foreground">Featured</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 border border-border text-muted-foreground py-3 text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-colors">
                  Cancel
                </button>
                <button
                  data-testid="button-save-product"
                  type="submit"
                  disabled={createProduct.isPending || updateProduct.isPending}
                  className="flex-1 bg-primary text-primary-foreground py-3 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createProduct.isPending || updateProduct.isPending ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border border-border p-8 text-center">
            <h3 className="font-serif text-xl text-foreground font-light mb-3">Delete Product?</h3>
            <p className="text-muted-foreground text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-border text-muted-foreground py-3 text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-colors">
                Cancel
              </button>
              <button
                data-testid="button-confirm-delete"
                onClick={() => deleteProduct.mutate({ id: deleteConfirm })}
                disabled={deleteProduct.isPending}
                className="flex-1 bg-destructive text-destructive-foreground py-3 text-xs tracking-widest uppercase hover:opacity-90 disabled:opacity-50">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}