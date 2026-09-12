import { Link } from "wouter";
import { useListFeaturedProducts, useListCategories } from "@workspace/api-client-react";
import { ArrowRight, Gem, ShoppingBag, ShieldCheck, Headphones, Truck } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

export default function Home() {
  const { data: featured, isLoading: featuredLoading } = useListFeaturedProducts();
  const { data: categories } = useListCategories();
  const { addToCart } = useCart();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative min-h-[80vh] flex items-center text-left px-6 pt-16"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20,15,10,0.55), rgba(20,15,10,0.55)), url('https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1600&q=70')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-2xl">
          <p className="text-primary text-xs tracking-[0.5em] uppercase mb-6 font-light">
            Est. 2024 — Fine Gold Jewellery
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-white font-light leading-tight mb-6">
            Timeless Beauty,<br />
            <span className="text-primary">Made for You</span>
          </h1>
          <p className="text-white/80 text-base md:text-lg font-light leading-relaxed mb-10 max-w-lg">
            Heirloom-quality gold jewellery, handcrafted for those who understand that true luxury is timeless.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/products"
              data-testid="link-explore-collections"
              className="inline-block bg-primary text-primary-foreground px-10 py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
            >
              Explore Collections
            </Link>
            <Link
              href="/products"
              className="inline-block border border-white/40 text-white px-10 py-4 text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-colors"
            >
              View All Pieces
            </Link>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Gem, title: "Premium Quality", desc: "Finest materials & craftsmanship" },
            { icon: Truck, title: "Cash on Delivery", desc: "Pay when your order arrives" },
            { icon: ShieldCheck, title: "Secure Checkout", desc: "Your data stays protected" },
            { icon: Headphones, title: "Personal Support", desc: "We're here if you need us" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <f.icon size={22} className="text-primary shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">Browse By</p>
            <h2 className="font-serif text-4xl text-foreground font-light">Collections</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                data-testid={`link-category-${cat.id}`}
                className="group border border-border bg-card p-6 text-center hover:border-primary transition-colors gold-hover"
              >
                <Gem size={24} className="mx-auto mb-3 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
                <p className="font-serif text-lg text-foreground font-light">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="gold-divider mx-6" />

      {/* Featured Products */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-primary text-xs tracking-[0.4em] uppercase mb-3">Handpicked For You</p>
          <h2 className="font-serif text-4xl text-foreground font-light">Featured Pieces</h2>
        </div>

        {featuredLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border animate-pulse h-80" />
            ))}
          </div>
        )}

        {featured && featured.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                data-testid={`card-product-${product.id}`}
                className="group block border border-border bg-card gold-hover overflow-hidden"
              >
                <div className="relative overflow-hidden h-64 bg-muted">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gem size={40} className="text-primary opacity-30" />
                    </div>
                  )}
                  {!product.inStock && (
                    <div className="absolute top-3 left-3 bg-background/90 text-muted-foreground text-xs px-3 py-1 tracking-wider uppercase">
                      Sold Out
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs text-primary tracking-widest uppercase mb-1">{product.categoryName}</p>
                  <h3 className="font-serif text-xl text-foreground font-light mb-1">{product.name}</h3>
                  {product.material && (
                    <p className="text-xs text-muted-foreground mb-3">{product.material}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg text-primary">${product.price}</span>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
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
        )}

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-block border border-border text-muted-foreground px-10 py-3 text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-colors"
          >
            View All Pieces
          </Link>
        </div>
      </section>

      <div className="gold-divider mx-6" />

      {/* About strip */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <p className="text-primary text-xs tracking-[0.4em] uppercase mb-4">Our Craft</p>
        <h2 className="font-serif text-4xl md:text-5xl text-foreground font-light mb-6">
          Gold, shaped by hand.<br />Worn across generations.
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
          Every GOLD HUB piece is cast, set, and finished by a single master jeweller. No assembly lines — only hands, tools, and an uncompromising standard. We work exclusively in 18K and 22K gold, with stones sourced from certified ethical suppliers.
        </p>
        <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
          {[
            { value: "100%", label: "Ethically Sourced" },
            { value: "18K+", label: "Gold Purity" },
            { value: "Lifetime", label: "Craftsmanship Warranty" },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-serif text-3xl text-primary font-light">{item.value}</p>
              <p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-10 px-6 text-center">
        <p className="font-serif text-xl text-primary tracking-[0.2em] mb-3">GOLD HUB</p>
        <p className="text-xs text-muted-foreground tracking-wider">
          Fine Gold Jewellery — Handcrafted with Purpose
        </p>
        <p className="text-xs text-muted-foreground mt-4 opacity-40">
          &copy; {new Date().getFullYear()} Gold Hub. All rights reserved.
        </p>
      </footer>
    </div>
  );
}