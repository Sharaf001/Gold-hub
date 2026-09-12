import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Package, Mail, Phone, MapPin, FileText, Clock } from 'lucide-react';
import {
  useListOrders,
  useUpdateOrderStatus,
  useGetOrder,
  getListOrdersQueryKey,
  getGetOrderQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'rgba(201,168,76,0.08)', text: 'hsl(43 60% 60%)', border: 'rgba(201,168,76,0.25)' },
  confirmed: { bg: 'rgba(100,180,220,0.08)', text: 'hsl(200 60% 58%)', border: 'rgba(100,180,220,0.25)' },
  shipped: { bg: 'rgba(140,120,220,0.08)', text: 'hsl(250 50% 68%)', border: 'rgba(140,120,220,0.25)' },
  delivered: { bg: 'rgba(80,180,120,0.08)', text: 'hsl(140 45% 52%)', border: 'rgba(80,180,120,0.25)' },
  cancelled: { bg: 'rgba(200,80,80,0.08)', text: 'hsl(0 55% 58%)', border: 'rgba(200,80,80,0.25)' },
};

function OrderDetail({ orderId }: { orderId: number }) {
  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId) },
  });

  if (isLoading) {
    return (
      <div className="px-6 py-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-3 bg-[hsl(24_8%_14%)] animate-pulse rounded-none" />
        ))}
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="px-6 py-5 border-t border-[rgba(201,168,76,0.06)] bg-[hsl(24_8%_9%)]">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-[9px] tracking-[0.25em] uppercase text-[hsl(38_15%_42%)]">Client Details</h4>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Mail className="w-3.5 h-3.5 text-[hsl(38_15%_40%)]" />
              <span className="text-[12px] text-[hsl(42_25%_62%)]">{order.customerEmail}</span>
            </div>
            {order.customerPhone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[hsl(38_15%_40%)]" />
                <span className="text-[12px] text-[hsl(42_25%_62%)]">{order.customerPhone}</span>
              </div>
            )}
            {order.shippingAddress && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[hsl(38_15%_40%)] mt-0.5" />
                <span className="text-[12px] text-[hsl(42_25%_62%)]">{order.shippingAddress}</span>
              </div>
            )}
            {order.notes && (
              <div className="flex items-start gap-2.5">
                <FileText className="w-3.5 h-3.5 text-[hsl(38_15%_40%)] mt-0.5" />
                <span className="text-[12px] text-[hsl(42_25%_55%)] italic">{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-[9px] tracking-[0.25em] uppercase text-[hsl(38_15%_42%)] mb-4">Order Items</h4>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3" data-testid={`order-item-${item.id}`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 object-cover border border-[rgba(201,168,76,0.1)]" />
                ) : (
                  <div className="w-10 h-10 bg-[hsl(24_8%_13%)] border border-[rgba(201,168,76,0.1)] flex items-center justify-center">
                    <Package className="w-3.5 h-3.5 text-[hsl(38_15%_35%)]" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-[12px] text-[hsl(42_30%_72%)]">{item.productName}</div>
                  <div className="text-[10px] text-[hsl(38_15%_42%)]">Qty: {item.quantity}</div>
                </div>
                <div className="font-serif text-[13px] text-[hsl(43_50%_58%)]">${item.unitPrice}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(201,168,76,0.08)] flex justify-between">
            <span className="text-[11px] tracking-[0.15em] uppercase text-[hsl(38_15%_45%)]">Total</span>
            <span className="font-serif text-lg text-[hsl(43_56%_62%)]">${order.totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders, isLoading } = useListOrders({
    query: { queryKey: getListOrdersQueryKey() },
  });

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
        toast({ title: 'Order status updated' });
      },
      onError: () => toast({ title: 'Failed to update status', variant: 'destructive' }),
    },
  });

  const filteredOrders = orders?.filter((o) =>
    statusFilter === 'all' ? true : o.status === statusFilter
  ) ?? [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="p-8 lg:p-10 min-h-full">
      {/* Header */}
      <div className="mb-10">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[hsl(43_35%_45%)]">Console</span>
        <h1 className="font-serif text-4xl font-light text-[hsl(42_35%_88%)] mt-1">Orders</h1>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['all', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase border transition-all ${
              statusFilter === s
                ? 'border-[rgba(201,168,76,0.5)] text-[hsl(43_56%_62%)] bg-[rgba(201,168,76,0.05)]'
                : 'border-[rgba(201,168,76,0.12)] text-[hsl(38_15%_50%)] hover:border-[rgba(201,168,76,0.25)]'
            }`}
            data-testid={`button-filter-${s}`}
          >
            {s}
            {s !== 'all' && orders && (
              <span className="ml-1.5 opacity-60">
                ({orders.filter((o) => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] overflow-hidden"
      >
        {isLoading ? (
          <div className="divide-y divide-[rgba(201,168,76,0.05)]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-5 flex items-center gap-6">
                <div className="h-3 bg-[hsl(24_8%_14%)] animate-pulse w-36 rounded-none" />
                <div className="h-3 bg-[hsl(24_8%_14%)] animate-pulse w-48 rounded-none" />
                <div className="h-3 bg-[hsl(24_8%_14%)] animate-pulse w-20 ml-auto rounded-none" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="divide-y divide-[rgba(201,168,76,0.06)]">
            {filteredOrders.map((order) => {
              const style = statusStyle[order.status] ?? statusStyle.pending;
              const isExpanded = expandedOrder === order.id;

              return (
                <div key={order.id} data-testid={`row-order-${order.id}`}>
                  <div
                    className="px-6 py-4 flex items-center gap-4 hover:bg-[rgba(201,168,76,0.02)] transition-colors cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    {/* Expand icon */}
                    <div className="text-[hsl(38_15%_40%)]">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] text-[hsl(42_35%_78%)]">{order.customerName}</span>
                        <span className="text-[10px] text-[hsl(38_15%_42%)] hidden sm:block">{order.customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-[hsl(38_15%_42%)]">
                          <Clock className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </div>
                        <span className="text-[10px] text-[hsl(38_15%_38%)]">
                          {order.items?.length ?? 0} {order.items?.length === 1 ? 'piece' : 'pieces'}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="font-serif text-[15px] text-[hsl(43_50%_60%)] mr-4">
                      ${order.totalAmount}
                    </div>

                    {/* Status select */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateStatus.mutate({ id: order.id, data: { status: e.target.value } })
                          }
                          className="appearance-none pl-3 pr-8 py-1.5 text-[10px] tracking-[0.12em] uppercase border cursor-pointer focus:outline-none bg-transparent"
                          style={{
                            background: style.bg,
                            color: style.text,
                            borderColor: style.border,
                          }}
                          data-testid={`select-order-status-${order.id}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option
                              key={s}
                              value={s}
                              style={{ background: 'hsl(24 8% 12%)', color: 'hsl(42 35% 78%)' }}
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: style.text }} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <OrderDetail orderId={order.id} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Package className="w-8 h-8 text-[hsl(38_15%_32%)] mx-auto mb-3" />
            <div className="font-serif text-xl font-light text-[hsl(38_15%_42%)]">No orders found</div>
            <div className="text-[12px] text-[hsl(38_15%_35%)] mt-1">
              {statusFilter !== 'all' ? 'Try a different filter' : 'Client enquiries will appear here'}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
