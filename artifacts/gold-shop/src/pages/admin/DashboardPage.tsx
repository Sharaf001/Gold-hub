import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, TrendingUp, Clock, AlertTriangle, BarChart2, ArrowRight } from 'lucide-react';
import {
  useGetAdminStats,
  useListOrders,
  getGetAdminStatsQueryKey,
  getListOrdersQueryKey,
} from '@workspace/api-client-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage() {
  const { data: stats, isLoading: loadingStats } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() },
  });

  const { data: orders, isLoading: loadingOrders } = useListOrders({
    query: { queryKey: getListOrdersQueryKey() },
  });

  const statCards = [
    {
      label: 'Total Products',
      value: stats?.totalProducts ?? '—',
      icon: Package,
      sub: `${stats?.lowStockProducts ?? 0} out of stock`,
      color: 'hsl(43 56% 49%)',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? '—',
      icon: ShoppingBag,
      sub: `${stats?.recentOrdersCount ?? 0} this month`,
      color: 'hsl(200 55% 52%)',
    },
    {
      label: 'Revenue',
      value: stats ? `$${stats.totalRevenue}` : '—',
      icon: TrendingUp,
      sub: 'All time',
      color: 'hsl(140 40% 48%)',
    },
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders ?? '—',
      icon: Clock,
      sub: 'Awaiting confirmation',
      color: 'hsl(30 60% 52%)',
    },
  ];

  const recentOrders = orders?.slice(0, 6) ?? [];

  const statusColor: Record<string, string> = {
    pending: 'hsl(43 60% 60%)',
    confirmed: 'hsl(200 60% 55%)',
    shipped: 'hsl(250 50% 65%)',
    delivered: 'hsl(140 45% 50%)',
    cancelled: 'hsl(0 55% 55%)',
  };

  const categoryChartData = stats?.categoryCounts?.map((cc) => ({
    name: cc.categoryName,
    count: cc.count,
  })) ?? [];

  return (
    <div className="p-8 lg:p-10 min-h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-[hsl(43_35%_45%)]">Console</span>
        <h1 className="font-serif text-4xl font-light text-[hsl(42_35%_88%)] mt-1">Dashboard</h1>
      </motion.div>

      {/* Stats cards */}
      {loadingStats ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[hsl(24_8%_11%)] animate-pulse border border-[rgba(201,168,76,0.08)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] p-6 relative overflow-hidden"
                data-testid={`stat-${card.label.toLowerCase().replace(' ', '-')}`}
              >
                <div
                  className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-4 translate-x-4"
                  style={{ background: card.color }}
                />
                <Icon className="w-5 h-5 mb-4 opacity-60" style={{ color: card.color }} />
                <div className="font-serif text-3xl font-light" style={{ color: card.color }}>
                  {card.value}
                </div>
                <div className="text-[10px] tracking-[0.15em] uppercase text-[hsl(42_25%_65%)] mt-1.5">{card.label}</div>
                <div className="text-[11px] text-[hsl(38_15%_45%)] mt-1">{card.sub}</div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(201,168,76,0.08)]">
            <h2 className="font-serif text-xl font-light text-[hsl(42_35%_82%)]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-[10px] tracking-[0.2em] uppercase text-[hsl(43_45%_52%)] hover:text-[hsl(43_56%_62%)] flex items-center gap-1.5 transition-colors">
              All Orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[rgba(201,168,76,0.06)]">
            {loadingOrders ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="h-3 bg-[hsl(24_8%_15%)] animate-pulse w-24 rounded-none" />
                  <div className="h-3 bg-[hsl(24_8%_15%)] animate-pulse flex-1 rounded-none" />
                  <div className="h-3 bg-[hsl(24_8%_15%)] animate-pulse w-16 rounded-none" />
                </div>
              ))
            ) : recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center gap-4" data-testid={`row-order-${order.id}`}>
                  <div>
                    <div className="text-[12px] text-[hsl(42_35%_75%)]">{order.customerName}</div>
                    <div className="text-[10px] text-[hsl(38_15%_45%)] mt-0.5">{order.customerEmail}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-serif text-[14px] text-[hsl(43_50%_60%)]">${order.totalAmount}</div>
                    <div
                      className="text-[10px] tracking-[0.1em] capitalize mt-0.5"
                      style={{ color: statusColor[order.status] ?? 'hsl(38 15% 50%)' }}
                    >
                      {order.status}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-[13px] text-[hsl(38_15%_40%)]">
                No orders yet
              </div>
            )}
          </div>
        </motion.div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Category chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-4 h-4 text-[hsl(43_45%_50%)]" />
              <h3 className="font-serif text-lg font-light text-[hsl(42_35%_82%)]">By Category</h3>
            </div>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={categoryChartData} barCategoryGap="35%">
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'hsl(38 15% 45%)', fontFamily: 'Jost' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: 'hsl(24 8% 12%)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      fontSize: '12px',
                      color: 'hsl(42 35% 78%)',
                    }}
                  />
                  <Bar dataKey="count" radius={0}>
                    {categoryChartData.map((_, index) => (
                      <Cell key={index} fill={`hsla(43, 56%, ${40 + index * 8}%, 0.8)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-[12px] text-[hsl(38_15%_40%)]">
                No data yet
              </div>
            )}
          </motion.div>

          {/* Low stock alert */}
          {stats && stats.lowStockProducts > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.15)] p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[hsl(43_56% 55%)]" />
                <h3 className="text-[11px] tracking-[0.2em] uppercase text-[hsl(43_45%_55%)]">Stock Alert</h3>
              </div>
              <p className="text-[13px] text-[hsl(38_15%_55%)]">
                <span className="font-serif text-xl text-[hsl(43_56%_60%)]">{stats.lowStockProducts}</span>{' '}
                {stats.lowStockProducts === 1 ? 'piece is' : 'pieces are'} currently out of stock.
              </p>
              <Link href="/admin/products" className="mt-4 text-[10px] tracking-[0.2em] uppercase text-[hsl(43_45%_52%)] hover:text-[hsl(43_56%_62%)] flex items-center gap-1.5 transition-colors">
                Manage Products <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          )}

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] p-6"
          >
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/admin/products" className="flex items-center justify-between py-2.5 text-[12px] text-[hsl(42_25%_62%)] hover:text-[hsl(43_45%_60%)] border-b border-[rgba(201,168,76,0.06)] transition-colors" data-testid="link-quick-products">
                Add New Product <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/admin/orders" className="flex items-center justify-between py-2.5 text-[12px] text-[hsl(42_25%_62%)] hover:text-[hsl(43_45%_60%)] border-b border-[rgba(201,168,76,0.06)] transition-colors" data-testid="link-quick-orders">
                Review Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/" className="flex items-center justify-between py-2.5 text-[12px] text-[hsl(42_25%_62%)] hover:text-[hsl(43_45%_60%)] transition-colors" data-testid="link-view-storefront">
                View Storefront <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
