import { Link } from "wouter";
import {
  useGetAdminStats,
  useListOrders,
  useResetRevenue,
  useResetProfit,
  getGetAdminStatsQueryKey,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, ShoppingBag, TrendingUp, Clock, BarChart2, Users, RotateCcw, Coins } from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin-header";

export default function AdminDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isChecking } = useRequireAdmin();
  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() },
  });
  const { data: orders } = useListOrders({ query: { queryKey: getListOrdersQueryKey() } });

  const resetRevenue = useResetRevenue({
    mutation: {
      onSuccess: () => {
        toast({ title: "Revenue reset", description: "Only orders placed from now on will count toward revenue." });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error resetting revenue", variant: "destructive" });
      },
    },
  });

  const resetProfit = useResetProfit({
    mutation: {
      onSuccess: () => {
        toast({ title: "Profit reset", description: "Only sales placed from now on will count toward profit." });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error resetting profit", variant: "destructive" });
      },
    },
  });

  function handleResetRevenue() {
    if (
      window.confirm(
        "This resets the Total Revenue figure to $0 going forward. It does NOT delete, archive, or otherwise affect any orders — only the revenue count. Continue?"
      )
    ) {
      resetRevenue.mutate({});
    }
  }

  function handleResetProfit() {
    if (
      window.confirm(
        "This resets the Total Profit figure to $0 going forward. It does NOT delete, archive, or otherwise affect any orders, revenue, or product cost prices — only the profit count. Continue?"
      )
    ) {
      resetProfit.mutate({});
    }
  }

  const recentOrders = orders?.slice(-5).reverse() ?? [];

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400",
    confirmed: "text-blue-400",
    shipped: "text-purple-400",
    delivered: "text-green-400",
    cancelled: "text-red-400",
  };

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
        <div className="mb-10">
          <h1 className="font-serif text-4xl text-foreground font-light">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your store</p>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card border border-border p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            {[
              { icon: Package, label: "Total Products", value: stats.totalProducts, color: "text-blue-400" },
              { icon: ShoppingBag, label: "Total Orders", value: stats.totalOrders, color: "text-purple-400" },
              { icon: TrendingUp, label: "Total Revenue", value: `$${Number(stats.totalRevenue).toLocaleString()}`, color: "text-primary", resetKey: "revenue" as const },
              { icon: Coins, label: "Total Profit", value: `$${Number(stats.totalProfit).toLocaleString()}`, color: "text-green-400", resetKey: "profit" as const },
              { icon: Clock, label: "Pending Orders", value: stats.pendingOrders, color: "text-yellow-400" },
            ].map(({ icon: Icon, label, value, color, resetKey }) => (
              <div key={label} data-testid={`stat-${label.toLowerCase().replace(/ /g, "-")}`} className="bg-card border border-border p-6 relative">
                <Icon size={20} className={`${color} mb-3 opacity-80`} />
                <p className="font-serif text-3xl text-foreground font-light">{value}</p>
                <p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">{label}</p>
                {resetKey === "revenue" && (
                  <button
                    type="button"
                    data-testid="button-reset-revenue"
                    onClick={handleResetRevenue}
                    disabled={resetRevenue.isPending}
                    title="Reset revenue to zero (does not affect orders)"
                    className="absolute top-6 right-6 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                {resetKey === "profit" && (
                  <button
                    type="button"
                    data-testid="button-reset-profit"
                    onClick={handleResetProfit}
                    disabled={resetProfit.isPending}
                    title="Reset profit to zero (does not affect orders, revenue, or product costs)"
                    className="absolute top-6 right-6 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* Secondary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-card border border-border p-6">
              <Users size={18} className="text-muted-foreground mb-3" />
              <p className="font-serif text-2xl text-foreground font-light">{stats.recentOrdersCount}</p>
              <p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">Orders — Last 7 Days</p>
            </div>
            <div className="bg-card border border-border p-6">
              <Coins size={18} className="text-green-400 opacity-80 mb-3" />
              <p className="font-serif text-2xl text-foreground font-light">${Number(stats.recentProfit).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">Profit — Last 7 Days</p>
            </div>
            <div className="bg-card border border-border p-6">
              <BarChart2 size={18} className="text-muted-foreground mb-3" />
              <p className="font-serif text-2xl text-foreground font-light">{stats.lowStockProducts}</p>
              <p className="text-xs text-muted-foreground tracking-wider uppercase mt-1">Out of Stock Products</p>
            </div>
            <div className="bg-card border border-border p-6">
              <Package size={18} className="text-muted-foreground mb-3" />
              <div className="flex flex-wrap gap-2 mt-1">
                {stats.categoryCounts?.slice(0, 4).map(c => (
                  <span key={c.categoryName} className="text-xs border border-border px-2 py-1 text-muted-foreground">
                    {c.categoryName}: {c.count}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground tracking-wider uppercase mt-2">Products by Category</p>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl text-foreground font-light">Recent Orders</h2>
            <Link href="/admin/orders">
              <a className="text-xs text-primary tracking-widest uppercase hover:opacity-80 transition-opacity">
                View All
              </a>
            </Link>
          </div>
          <div className="border border-border bg-card overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No orders yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {["Order", "Customer", "Amount", "Status", "Date"].map(h => (
                      <th key={h} className="text-left text-xs text-muted-foreground tracking-widest uppercase px-4 py-3 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => (
                    <tr key={order.id} data-testid={`row-order-${order.id}`} className={i !== recentOrders.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">#{order.id}</td>
                      <td className="px-4 py-3 text-foreground">{order.customerName}</td>
                      <td className="px-4 py-3 text-primary font-serif">${order.totalAmount}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs tracking-wider uppercase ${statusColors[order.status] ?? "text-muted-foreground"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}