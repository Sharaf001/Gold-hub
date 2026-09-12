import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ArrowLeft, ShoppingBag } from "lucide-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useCart } from "@/contexts/cart-context";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { totalCount } = useCart();

  const { data: me } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  function handleBack() {
    window.history.back();
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Collections" },
  ];

  const initial = me ? (me.role === "admin" ? "A" : me.username.charAt(0).toUpperCase()) : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-[1fr_auto_1fr] items-center h-16">
        {/* Left: back arrow + page links */}
        <div className="flex items-center gap-6">
          {location !== "/" && (
            <button
              type="button"
              data-testid="button-back"
              onClick={handleBack}
              aria-label="Go back"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <nav className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-xs tracking-widest uppercase transition-colors hover:text-primary ${
                  location === l.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: brand */}
        <Link
          href="/"
          className="font-serif text-xl tracking-[0.2em] text-primary uppercase font-light whitespace-nowrap"
        >
          Gold Hub
        </Link>

        {/* Right: cart + account */}
        <div className="flex items-center justify-end gap-5">
          <Link
            href="/cart"
            data-testid="link-cart"
            aria-label="Cart"
            className="relative text-muted-foreground hover:text-primary transition-colors"
          >
            <ShoppingBag size={20} />
            {totalCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] leading-none w-4 h-4 rounded-full flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </Link>

          {me ? (
            <Link
              href="/account"
              data-testid="link-account"
              aria-label="Account"
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-full border border-border text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
              title={me.role === "admin" ? "Admin" : me.username}
            >
              {initial}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden md:block text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              Login
            </Link>
          )}

          <button
            type="button"
            data-testid="button-mobile-menu"
            className="md:hidden text-muted-foreground hover:text-primary"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-6 space-y-4">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="block text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {me ? (
            <Link
              href="/account"
              className="block text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              Account ({me.role === "admin" ? "Admin" : me.username})
            </Link>
          ) : (
            <Link
              href="/login"
              className="block text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}