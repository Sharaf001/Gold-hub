import {
  useListOrders,
  useUpdateOrderStatus,
  useClearOrders,
  useArchiveOrder,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Archive } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import AdminHeader from "@/components/admin-header";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "text-yellow-400 border-yellow-400/30",
  confirmed: "text-blue-400 border-blue-400/30",
  shipped: "text-purple-400 border-purple-400/30",
  delivered: "text-green-400 border-green-400/30",
  cancelled: "text-red-400 border-red-400/30",
};

export default function AdminOrders() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isChecking } = useRequireAdmin();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"active" | "history">("active");

  const { data: orders, isLoading } = useListOrders({ query: { queryKey: getListOrdersQueryKey() } });

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        toast({ title: "Order status updated" });
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setUpdatingId(null);
      },
      onError: () => {
        toast({ title: "Error updating order", variant: "destructive" });
        setUpdatingId(null);
      },
    },
  });

  const archiveOrder = useArchiveOrder({
    mutation: {
      onSuccess: () => {
        toast({ title: "Order moved to history" });
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        qc.invalidateQueries({ queryKey: ["admin", "stats"] });
        qc.invalidateQueries({ queryKey: ["orders", "mine"] });
        setArchivingId(null);
      },
      onError: () => {
        toast({ title: "Error archiving order", variant: "destructive" });
        setArchivingId(null);
      },
    },
  });

  const clearOrders = useClearOrders({
    mutation: {
      onSuccess: () => {
        toast({ title: "Active orders moved to history", description: "Order stats have been reset. Revenue is unaffected — use \"Reset Revenue\" on the dashboard for that." });
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        qc.invalidateQueries({ queryKey: ["admin", "stats"] });
        qc.invalidateQueries({ queryKey: ["orders", "mine"] });
      },
      onError: () => {
        toast({ title: "Error archiving orders", variant: "destructive" });
      },
    },
  });

  function handleClearOrders() {
    if (
      window.confirm(
        "This will move ALL active orders (for every customer) into order history. Orders are kept, not deleted, and remain visible under History. This does not affect revenue — reset that separately from the dashboard if needed. Continue?"
      )
    ) {
      clearOrders.mutate({});
    }
  }

  function handleArchiveOrder(orderId: number) {
    setArchivingId(orderId);
    archiveOrder.mutate({ id: orderId });
  }

  function handleStatusChange(orderId: number, status: string) {
    setUpdatingId(orderId);
    updateStatus.mutate({ id: orderId, data: { status } });
  }

  const activeOrders = orders?.filter(o => !o.archived) ?? [];
  const historyOrders = orders?.filter(o => o.archived) ?? [];
  const visibleOrders = tab === "active" ? activeOrders : historyOrders;

  const sortedOrders = [...visibleOrders].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-4xl text-foreground font-light">Orders</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {activeOrders.length} active &middot; {historyOrders.length} in history
            </p>
          </div>
          <button
            type="button"
            data-testid="button-clear-orders"
            onClick={handleClearOrders}
            disabled={clearOrders.isPending || activeOrders.length === 0}
            className="flex items-center gap-2 border border-destructive text-destructive px-4 py-2 text-xs tracking-widest uppercase hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Archive size={14} />
            {clearOrders.isPending ? "Archiving..." : "Archive All Active Orders"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <button
            type="button"
            data-testid="tab-active-orders"
            onClick={() => setTab("active")}
            className={`px-4 py-2.5 text-xs tracking-widest uppercase border-b-2 transition-colors ${
              tab === "active" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            type="button"
            data-testid="tab-history-orders"
            onClick={() => setTab("history")}
            className={`px-4 py-2.5 text-xs tracking-widest uppercase border-b-2 transition-colors ${
              tab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            History ({historyOrders.length})
          </button>
        </div>

        {/* Summary pills (active tab only) */}
        {tab === "active" && orders && (
          <div className="flex flex-wrap gap-3 mb-8">
            {STATUSES.map(s => {
              const count = activeOrders.filter(o => o.status === s).length;
              return (
                <div key={s} className={`text-xs px-3 py-1.5 border tracking-widest uppercase ${statusColors[s] ?? "text-muted-foreground border-border"}`}>
                  {s}: {count}
                </div>
              );
            })}
          </div>
        )}

        {/* Orders Table */}
        <div className="border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center">
              <div className="animate-pulse text-muted-foreground text-sm">Loading orders...</div>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground text-sm">
                {tab === "active" ? "No active orders." : "No orders in history yet."}
              </p>
            </div>
          ) : (
            <div>
              {sortedOrders.map((order, i) => (
                <div
                  key={order.id}
                  data-testid={`row-order-${order.id}`}
                  className={i !== sortedOrders.length - 1 ? "border-b border-border" : ""}
                >
                  {/* Order Row */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4">
                    <div className="flex-none w-16">
                      <p className="text-xs text-muted-foreground font-mono">#{order.id}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.customerEmail}</p>
                    </div>
                    <div className="flex-none">
                      <p className="font-serif text-primary text-lg">${order.totalAmount}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex-none">
                      <select
                        data-testid={`select-status-${order.id}`}
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className={`bg-background border text-xs tracking-widest uppercase px-3 py-2 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 cursor-pointer ${statusColors[order.status] ?? "border-border text-muted-foreground"}`}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s} className="text-foreground bg-background normal-case tracking-normal">
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!order.archived && (
                      <button
                        type="button"
                        data-testid={`button-archive-${order.id}`}
                        onClick={() => handleArchiveOrder(order.id)}
                        disabled={archivingId === order.id}
                        title="Move to history"
                        className="flex-none text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      >
                        <Archive size={16} />
                      </button>
                    )}
                    <button
                      data-testid={`button-expand-order-${order.id}`}
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      className="flex-none text-muted-foreground hover:text-primary transition-colors"
                    >
                      {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {expanded === order.id && (
                    <div className="bg-muted/30 border-t border-border px-5 py-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer info */}
                        <div>
                          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Customer Details</p>
                          <div className="space-y-1.5">
                            {[
                              { label: "Name", value: order.customerName },
                              { label: "Email", value: order.customerEmail },
                              order.customerPhone && { label: "Phone", value: order.customerPhone },
                              order.shippingAddress && { label: "Address", value: order.shippingAddress },
                              order.notes && { label: "Notes", value: order.notes },
                            ].filter(Boolean).map((item: any) => (
                              <div key={item.label} className="flex gap-3">
                                <span className="text-xs text-muted-foreground w-16 shrink-0">{item.label}</span>
                                <span className="text-xs text-foreground">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Items */}
                        <div>
                          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">
                            Items ({order.items?.length ?? 0})
                          </p>
                          <div className="space-y-2">
                            {order.items?.map(item => (
                              <div key={item.id} data-testid={`item-order-${item.id}`} className="flex items-center gap-3">
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt={item.productName} className="w-8 h-8 object-cover border border-border shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-foreground truncate">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.quantity} × ${item.unitPrice}
                                  </p>
                                </div>
                                <p className="text-xs text-primary font-serif shrink-0">
                                  ${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-border mt-3 pt-3 flex justify-between">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
                            <span className="text-primary font-serif">${order.totalAmount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}