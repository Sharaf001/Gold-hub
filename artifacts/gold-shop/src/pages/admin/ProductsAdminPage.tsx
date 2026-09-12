import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Star, Package, X, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useListCategories,
  useCreateCategory,
  useDeleteCategory,
  getListProductsQueryKey,
  getListCategoriesQueryKey,
} from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  name: z.string().min(1, 'Name required'),
  slug: z.string().min(1, 'Slug required'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price required'),
  material: z.string().optional(),
  weight: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.coerce.number().min(1, 'Category required'),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductsAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [showCatManager, setShowCatManager] = useState(false);

  const { data: products, isLoading } = useListProducts(
    { search: search || undefined },
    { query: { queryKey: getListProductsQueryKey({ search: search || undefined }) } }
  );
  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: 'Product created' });
        closeModal();
      },
      onError: () => toast({ title: 'Failed to create product', variant: 'destructive' }),
    },
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: 'Product updated' });
        closeModal();
      },
      onError: () => toast({ title: 'Failed to update product', variant: 'destructive' }),
    },
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: 'Product deleted' });
        setDeleteConfirm(null);
      },
      onError: () => toast({ title: 'Failed to delete product', variant: 'destructive' }),
    },
  });

  const createCategory = useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        toast({ title: 'Category created' });
        setCatName('');
        setCatSlug('');
      },
      onError: () => toast({ title: 'Failed to create category', variant: 'destructive' }),
    },
  });

  const deleteCategory = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        toast({ title: 'Category deleted' });
      },
      onError: () => toast({ title: 'Failed to delete category', variant: 'destructive' }),
    },
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', slug: '', description: '', price: '', material: '',
      weight: '', imageUrl: '', categoryId: 0, inStock: true, featured: false,
    },
  });

  const openCreate = () => {
    form.reset({
      name: '', slug: '', description: '', price: '', material: '',
      weight: '', imageUrl: '', categoryId: categories?.[0]?.id ?? 0, inStock: true, featured: false,
    });
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    form.reset({
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      price: p.price,
      material: p.material ?? '',
      weight: p.weight ?? '',
      imageUrl: p.imageUrl ?? '',
      categoryId: p.categoryId,
      inStock: p.inStock,
      featured: p.featured,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    form.reset();
  };

  const onSubmit = (data: ProductForm) => {
    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: data.price,
      material: data.material || null,
      weight: data.weight || null,
      imageUrl: data.imageUrl || null,
      categoryId: Number(data.categoryId),
      inStock: data.inStock ?? true,
      featured: data.featured ?? false,
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data: payload });
    } else {
      createProduct.mutate({ data: payload });
    }
  };

  const toggleFeatured = (p: Product) => {
    updateProduct.mutate({ id: p.id, data: { featured: !p.featured } });
  };

  const toggleStock = (p: Product) => {
    updateProduct.mutate({ id: p.id, data: { inStock: !p.inStock } });
  };

  return (
    <div className="p-8 lg:p-10 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-[hsl(43_35%_45%)]">Console</span>
          <h1 className="font-serif text-4xl font-light text-[hsl(42_35%_88%)] mt-1">Products</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCatManager(!showCatManager)}
            className="btn-gold-outline px-4 py-3 flex items-center gap-2"
            data-testid="button-manage-categories"
          >
            <Tag className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={openCreate}
            className="btn-gold px-5 py-3 flex items-center gap-2"
            data-testid="button-add-product"
          >
            <Plus className="w-4 h-4" />
            Add Piece
          </button>
        </div>
      </div>

      {/* Category Manager */}
      <AnimatePresence>
        {showCatManager && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.15)] p-6">
              <h3 className="font-serif text-lg font-light text-[hsl(42_35%_82%)] mb-4">Category Management</h3>
              {/* Create category */}
              <div className="flex gap-3 mb-4">
                <input
                  value={catName}
                  onChange={(e) => { setCatName(e.target.value); setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                  placeholder="Category name"
                  className="flex-1 bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_32%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors"
                  data-testid="input-category-name"
                />
                <input
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="slug"
                  className="w-40 bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_32%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors"
                  data-testid="input-category-slug"
                />
                <button
                  onClick={() => createCategory.mutate({ data: { name: catName, slug: catSlug } })}
                  disabled={!catName || !catSlug || createCategory.isPending}
                  className="btn-gold px-4 py-2.5 disabled:opacity-50"
                  data-testid="button-create-category"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {/* List categories */}
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 bg-[hsl(24_8%_12%)] border border-[rgba(201,168,76,0.12)] px-3 py-1.5">
                    <span className="text-[11px] text-[hsl(42_25%_65%)]">{cat.name}</span>
                    <button
                      onClick={() => deleteCategory.mutate({ id: cat.id })}
                      className="text-[hsl(38_15%_40%)] hover:text-[hsl(0_55%_55%)] transition-colors"
                      data-testid={`button-delete-category-${cat.id}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.15)] px-4 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_38%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors w-full max-w-xs"
          data-testid="input-admin-product-search"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(201,168,76,0.1)]">
                {['Product', 'Category', 'Price', 'Material', 'Stock', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-[9px] tracking-[0.25em] uppercase text-[hsl(38_15%_45%)] font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,168,76,0.05)]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-[hsl(24_8%_14%)] animate-pulse rounded-none" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products && products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-[rgba(201,168,76,0.02)] transition-colors" data-testid={`row-product-${product.id}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover border border-[rgba(201,168,76,0.1)]" />
                        ) : (
                          <div className="w-10 h-10 bg-[hsl(24_8%_13%)] border border-[rgba(201,168,76,0.1)] flex items-center justify-center">
                            <Package className="w-4 h-4 text-[hsl(38_15%_35%)]" />
                          </div>
                        )}
                        <div>
                          <div className="text-[13px] text-[hsl(42_35%_80%)]">{product.name}</div>
                          <div className="text-[10px] text-[hsl(38_15%_42%)]">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-[hsl(38_15%_52%)]">{product.categoryName || '—'}</td>
                    <td className="px-5 py-4 font-serif text-[14px] text-[hsl(43_50%_60%)]">${product.price}</td>
                    <td className="px-5 py-4 text-[12px] text-[hsl(38_15%_52%)]">{product.material || '—'}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleStock(product)}
                        className={`text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 border transition-all ${
                          product.inStock
                            ? 'border-[hsl(140_35%_35%)] text-[hsl(140_40%_50%)] bg-[hsl(140_35%_35%/0.1)]'
                            : 'border-[hsl(38_20%_28%)] text-[hsl(38_20%_45%)]'
                        }`}
                        data-testid={`button-toggle-stock-${product.id}`}
                      >
                        {product.inStock ? 'In Stock' : 'Out'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleFeatured(product)}
                        className={`transition-colors ${product.featured ? 'text-[hsl(43_56%_55%)]' : 'text-[hsl(38_15%_35%)] hover:text-[hsl(43_40%_50%)]'}`}
                        data-testid={`button-toggle-featured-${product.id}`}
                      >
                        <Star className="w-4 h-4" fill={product.featured ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(product)}
                          className="text-[hsl(38_15%_48%)] hover:text-[hsl(43_50%_60%)] transition-colors"
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="text-[hsl(38_15%_48%)] hover:text-[hsl(0_55%_55%)] transition-colors"
                          data-testid={`button-delete-product-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Package className="w-8 h-8 text-[hsl(38_15%_32%)] mx-auto mb-3" />
                    <div className="font-serif text-xl font-light text-[hsl(38_15%_42%)]">No products yet</div>
                    <div className="text-[12px] text-[hsl(38_15%_38%)] mt-1">Add your first piece to the collection</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.2)] p-8 max-w-sm w-full mx-4"
            >
              <h3 className="font-serif text-2xl font-light text-[hsl(42_35%_85%)] mb-3">Delete Product?</h3>
              <p className="text-[13px] text-[hsl(38_15%_52%)] mb-8">This action cannot be undone. The piece will be removed from the collection.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 btn-gold-outline py-3"
                  data-testid="button-cancel-delete"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteProduct.mutate({ id: deleteConfirm })}
                  disabled={deleteProduct.isPending}
                  className="flex-1 py-3 bg-[hsl(0_55%_40%)] hover:bg-[hsl(0_55%_45%)] text-[hsl(42_35%_90%)] text-[11px] tracking-[0.15em] uppercase transition-colors disabled:opacity-50"
                  data-testid="button-confirm-delete"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.2)] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-[rgba(201,168,76,0.1)]">
                <h2 className="font-serif text-2xl font-light text-[hsl(42_35%_88%)]">
                  {editingProduct ? 'Edit Piece' : 'Add New Piece'}
                </h2>
                <button onClick={closeModal} className="text-[hsl(38_15%_45%)] hover:text-[hsl(42_25%_65%)]" data-testid="button-close-modal">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 py-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Name *</label>
                    <input {...form.register('name')} className="w-full bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_32%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors" placeholder="Ring Name" data-testid="input-product-name" />
                    {form.formState.errors.name && <p className="text-[10px] text-[hsl(0_55%_55%)] mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Slug *</label>
                    <input {...form.register('slug')} className="w-full bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_32%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors" placeholder="ring-name" data-testid="input-product-slug" />
                    {form.formState.errors.slug && <p className="text-[10px] text-[hsl(0_55%_55%)] mt-1">{form.formState.errors.slug.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Price *</label>
                    <input {...form.register('price')} className="w-full bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_32%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors" placeholder="2,850.00" data-testid="input-product-price" />
                    {form.formState.errors.price && <p className="text-[10px] text-[hsl(0_55%_55%)] mt-1">{form.formState.errors.price.message}</p>}
                  </div>
                  <div>
                    <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Category *</label>
                    <select {...form.register('categoryId')} className="w-full bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors" data-testid="select-product-category">
                      <option value={0}>Select category</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {form.formState.errors.categoryId && <p className="text-[10px] text-[hsl(0_55%_55%)] mt-1">{form.formState.errors.categoryId.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Material</label>
                    <input {...form.register('material')} className="w-full bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_32%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors" placeholder="18K Yellow Gold" data-testid="input-product-material" />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Weight</label>
                    <input {...form.register('weight')} className="w-full bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_32%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors" placeholder="4.2g" data-testid="input-product-weight" />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Image URL</label>
                  <input {...form.register('imageUrl')} className="w-full bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_32%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors" placeholder="https://..." data-testid="input-product-image" />
                </div>

                <div>
                  <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Description</label>
                  <textarea {...form.register('description')} rows={3} className="w-full bg-[hsl(24_8%_8%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_32%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors resize-none" placeholder="Piece description..." data-testid="input-product-description" />
                </div>

                <div className="flex items-center gap-8">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...form.register('inStock')} className="w-4 h-4 accent-[hsl(43_56%_49%)]" data-testid="checkbox-product-instock" />
                    <span className="text-[11px] tracking-[0.15em] uppercase text-[hsl(38_15%_55%)]">In Stock</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...form.register('featured')} className="w-4 h-4 accent-[hsl(43_56%_49%)]" data-testid="checkbox-product-featured" />
                    <span className="text-[11px] tracking-[0.15em] uppercase text-[hsl(38_15%_55%)]">Featured</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 btn-gold-outline py-3" data-testid="button-cancel-product-modal">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createProduct.isPending || updateProduct.isPending}
                    className="flex-1 btn-gold py-3 disabled:opacity-50"
                    data-testid="button-save-product"
                  >
                    {createProduct.isPending || updateProduct.isPending ? 'Saving...' : editingProduct ? 'Update Piece' : 'Add to Collection'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
