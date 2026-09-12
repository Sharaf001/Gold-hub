import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { useLogout, useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });
  const logout = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        setLocation('/login');
      },
    },
  });

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-[hsl(24_8%_6%)]">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-64 flex-shrink-0 border-r border-[rgba(201,168,76,0.12)] flex flex-col"
        style={{ background: 'hsl(24 8% 8%)' }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-[rgba(201,168,76,0.1)]">
          <Link href="/" className="flex flex-col">
            <span className="font-serif text-xl tracking-[0.35em] text-[hsl(43_56%_60%)] font-light leading-none">AURUM</span>
            <span className="text-[8px] tracking-[0.3em] uppercase text-[hsl(38_15%_40%)] mt-0.5 font-sans">Admin Console</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location === item.href
              : location.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-[11px] tracking-[0.15em] uppercase font-medium transition-all duration-200 rounded-sm ${
                  isActive
                    ? 'bg-[rgba(201,168,76,0.1)] text-[hsl(43_56%_65%)] border border-[rgba(201,168,76,0.2)]'
                    : 'text-[hsl(42_25%_55%)] hover:text-[hsl(42_35%_75%)] hover:bg-[rgba(201,168,76,0.05)]'
                }`}
                data-testid={`link-admin-${item.label.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-6 border-t border-[rgba(201,168,76,0.1)]">
          {me && (
            <div className="px-4 py-2 mb-3">
              <div className="text-[10px] tracking-[0.15em] uppercase text-[hsl(38_15%_45%)]">Signed in as</div>
              <div className="text-[13px] text-[hsl(42_35%_75%)] mt-0.5">{me.username}</div>
            </div>
          )}
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="w-full flex items-center gap-3 px-4 py-3 text-[11px] tracking-[0.15em] uppercase text-[hsl(42_25%_50%)] hover:text-[hsl(0_55%_60%)] transition-colors duration-200 rounded-sm hover:bg-[rgba(255,100,100,0.05)]"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
