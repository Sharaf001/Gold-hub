import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  useListProducts,
  useListCategories,
} from '@workspace/api-client-react';
import ProductCard from '@/components/ProductCard';

export default function ProductsPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories } = useListCategories();
  const { data: products, isLoading } = useListProducts(
    {
      search: search || undefined,
      categoryId: selectedCategory,
    },
    {
      query: {
        queryKey: ['/api/products', { search, categoryId: selectedCategory }],
      },
    }
  );

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const catId = params.get('categoryId');
    if (catId) setSelectedCategory(Number(catId));
  }, [location]);

  return (
    <div className="grain-overlay bg-[hsl(24_8%_7%)] min-h-[100dvh]">
      {/* Page header */}
      <div className="pt-32 pb-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[10px] tracking-[0.35em] uppercase text-[hsl(43_45%_50%)] block mb-4">The Collection</span>
            <h1 className="font-serif text-6xl md:text-7xl font-light text-[hsl(42_35%_88%)] mb-6">
              All Pieces
            </h1>
            <div className="divider-gold w-32" />
          </motion.div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="sticky top-20 z-30 bg-[hsl(24_8%_7%/0.95)] backdrop-blur-md border-b border-[rgba(201,168,76,0.1)] py-4 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(38_15%_40%)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pieces..."
              className="w-full bg-[hsl(24_8%_11%)] border border-[rgba(201,168,76,0.15)] pl-9 pr-4 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_38%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors"
              data-testid="input-product-search"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-[hsl(38_15%_40%)]" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase border transition-all whitespace-nowrap ${
                !selectedCategory
                  ? 'border-[rgba(201,168,76,0.5)] text-[hsl(43_56%_62%)] bg-[rgba(201,168,76,0.05)]'
                  : 'border-[rgba(201,168,76,0.12)] text-[hsl(38_15%_50%)] hover:border-[rgba(201,168,76,0.3)] hover:text-[hsl(42_25%_65%)]'
              }`}
              data-testid="button-category-all"
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? undefined : cat.id)}
                className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase border transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'border-[rgba(201,168,76,0.5)] text-[hsl(43_56%_62%)] bg-[rgba(201,168,76,0.05)]'
                    : 'border-[rgba(201,168,76,0.12)] text-[hsl(38_15%_50%)] hover:border-[rgba(201,168,76,0.3)] hover:text-[hsl(42_25%_65%)]'
                }`}
                data-testid={`button-category-${cat.id}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="md:hidden flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[hsl(42_25%_60%)] border border-[rgba(201,168,76,0.15)] px-3 py-2"
            data-testid="button-mobile-filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>

          {/* Count */}
          <div className="ml-auto text-[11px] text-[hsl(38_15%_45%)] whitespace-nowrap">
            {isLoading ? '—' : `${products?.length || 0} pieces`}
          </div>
        </div>

        {/* Mobile category filter */}
        {filtersOpen && (
          <div className="md:hidden max-w-7xl mx-auto mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase border transition-all ${
                !selectedCategory
                  ? 'border-[rgba(201,168,76,0.5)] text-[hsl(43_56%_62%)]'
                  : 'border-[rgba(201,168,76,0.12)] text-[hsl(38_15%_50%)]'
              }`}
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? undefined : cat.id)}
                className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase border transition-all ${
                  selectedCategory === cat.id
                    ? 'border-[rgba(201,168,76,0.5)] text-[hsl(43_56%_62%)]'
                    : 'border-[rgba(201,168,76,0.12)] text-[hsl(38_15%_50%)]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[hsl(24_8%_12%)]" style={{ aspectRatio: '3/4' }} />
                <div className="mt-4 space-y-2">
                  <div className="h-2 bg-[hsl(24_8%_14%)] w-1/3 rounded-none" />
                  <div className="h-4 bg-[hsl(24_8%_14%)] w-2/3 rounded-none" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <div className="w-16 h-16 mx-auto mb-6 opacity-20">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 8L8 24L32 40L56 24L32 8Z" stroke="hsl(43 56% 49%)" strokeWidth="1.5" fill="none"/>
                <path d="M8 24V40L32 56L56 40V24" stroke="hsl(43 56% 49%)" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <h3 className="font-serif text-3xl font-light text-[hsl(38_15%_45%)] mb-3">
              No pieces found
            </h3>
            <p className="text-[13px] text-[hsl(38_15%_38%)] tracking-wide">
              Refine your search or browse the full collection
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory(undefined); }}
              className="mt-8 btn-gold-outline px-8 py-3"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
