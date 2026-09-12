import { useState } from "react";
import { Link, useSearch } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Gem, ArrowRight, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

export default function Products() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCat = params.get("categoryId") ? Number(params.get("categoryId")) : undefined;

  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCat);
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { data: products, isLoading } = useListProducts(
    { categoryId: selectedCategory ?? null, search: searchQuery || null },
    { query: { queryKey: ["products", selectedCategory, searchQuery] } }
  );
  const { data: categories } = useListCategories();
  const { addToCart } = useCart();

  const min = minPrice ? Number(minPrice) : undefined;
  const max = maxPrice ? Number(maxPrice) : undefined;
  const filteredProducts = products?.filter(p => {
    const price = Number(p.price);
    if (min !== undefined && price < min) return false;
    if (max !== undefined && price > max) return false;
    return true;
  });

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div
        className="py-20 px-6 text-center border-b border-border"
        style={{ background: "radial-gradient(ellipse at center, hsl(28 35% 7%) 0%, hsl(28 40% 3%) 80%)" }}
      >
        <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">The Collection</p>
        <h1 className="font-serif text-5xl text-foreground font-light">All Pieces</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:flex-wrap gap-4 mb-10">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              data-testid="input-search"
              type="search"
              placeholder="Search pieces..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              data-testid="filter-all"
              onClick={() => setSelectedCategory(undefined)}
              className={`px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${
                !selectedCategory
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              All
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                data-testid={`filter-category-${cat.id}`}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? undefined : cat.id)}
                className={`px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${
                  selectedCategory === cat.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tracking-wider uppercase shrink-0">Price</span>
            <input
              data-testid="input-min-price"
              type="number"
              min={0}
              placeholder="Min"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="w-24 bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <span className="text-muted-foreground text-xs">&ndash;</span>
            <input
              data-testid="input-max-price"
              type="number"
              min={0}
              placeholder="Max"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="w-24 bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {(minPrice || maxPrice) && (
              <button
                type="button"
                data-testid="button-clear-price"
                onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card border border-border animate-pulse h-72" />
            ))}
          </div>
        )}

        {!isLoading && filteredProducts?.length === 0 && (
          <div className="text-center py-24">
            <Gem size={32} className="mx-auto text-primary opacity-30 mb-4" />
            <p className="font-serif text-2xl text-foreground font-light mb-2">No pieces found</p>
            <p className="text-muted-foreground text-sm">Try a different category, price range, or search term.</p>
          </div>
        )}

        {filteredProducts && filteredProducts.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-6 tracking-wider uppercase">
              {filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  data-testid={`card-product-${product.id}`}
                  className="group block border border-border bg-card gold-hover overflow-hidden"
                >
                  <div className="relative overflow-hidden h-56 bg-muted">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gem size={32} className="text-primary opacity-30" />
                      </div>
                    )}
                    {!product.inStock && (
                      <div className="absolute top-2 left-2 bg-background/90 text-muted-foreground text-xs px-2 py-1 tracking-wider uppercase">
                        Sold Out
                      </div>
                    )}
                    {product.featured && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 tracking-wider uppercase">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-primary tracking-widest uppercase mb-1">{product.categoryName}</p>
                    <h3 className="font-serif text-lg text-foreground font-light">{product.name}</h3>
                    {product.material && (
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2">{product.material}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-serif text-base text-primary">${product.price}</span>
                      <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <button
                      type="button"
                      data-testid={`button-add-to-cart-${product.id}`}
                      disabled={!product.inStock}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full mt-3 flex items-center justify-center gap-2 border border-border py-2 text-xs tracking-widest uppercase text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag size={12} />
                      Add to Cart
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-border mt-16 py-10 px-6 text-center">
        <p className="font-serif text-xl text-primary tracking-[0.2em] mb-2">GOLD HUB</p>
        <p className="text-xs text-muted-foreground opacity-40">&copy; {new Date().getFullYear()} Gold Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}