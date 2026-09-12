import { Link, useLocation } from "wouter";
import { useLogout } from "@workspace/api-client-react";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export default function AdminHeader() {
  const [, setLocation] = useLocation();
  const logout = useLogout({
    mutation: {
      onSuccess: () => setLocation("/login"),
    },
  });

  return (
    <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-serif text-lg text-primary tracking-[0.2em]">GOLD HUB</span>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">Admin</span>
        <Link
          href="/account"
          data-testid="link-account"
          className="text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
        >
          Account
        </Link>
      </div>
      <nav className="hidden md:flex items-center gap-6">
        {NAV_LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <button
        data-testid="button-logout"
        onClick={() => logout.mutate({})}
        className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}