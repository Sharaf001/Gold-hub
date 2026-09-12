import { Link } from "wouter";
import { useListMyOrders, getListMyOrdersQueryKey } from "@workspace/api-client-react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Gem, ArrowLeft, Package } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400",
  confirmed: "text-blue-400",
  shipped: "text-purple-400",
  delivered: "text-green-400",
  cancelled: "text-red-400",
};

export default function MyOrders() {
  const { isChecking } = useRequireAuth();
  const { data: orders, isLoading } = useListMyOrders({
    query: { queryKey: getListMyOrdersQueryKey() },
  });

  if (isChecking) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center text-muted-foreground">
        Checking access...
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase mb-10"
        >
          <ArrowLeft size={12} />
          Back to Store
        </Link>

        <h1 className="font-serif text-4xl text-foreground font-light mb-8">My Orders</h1>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border animate-pulse h-32" />
            ))}
          </div>
        )}

        {!isLoading && (!orders || orders.length === 0) && (
          <div className="text-center py-24 border border-border bg-card">
            <Package size={32} className="mx-auto text-primary opacity-30 mb-4" />
            <p className="font-serif text-2xl text-foreground font-light mb-2">No orders yet</p>
            <p className="text-muted-foreground text-sm mb-6">Once you place an order, it will show up here.</p>
            <Link
              href="/products"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
            >
              View Collection
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} data-testid={`order-${order.id}`} className="border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <p className="font-serif text-lg text-foreground">Order #{order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={`text-xs tracking-widest uppercase ${STATUS_COLORS[order.status] ?? "text-muted-foreground"}`}>
                    {order.status}
                  </span>
                </div>

                <div className="divide-y divide-border border-t border-border">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2.5">
                      <div className="w-12 h-12 bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Gem size={16} className="text-primary opacity-30" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                      </div>
                      <p className="text-sm text-foreground">${item.unitPrice}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-xs tracking-widest uppercase text-muted-foreground">Total</span>
                  <span className="font-serif text-lg text-primary">${order.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-border mt-16 py-10 px-6 text-center">
        <p className="font-serif text-xl text-primary tracking-[0.2em] mb-2">GOLD HUB</p>
        <p className="text-xs text-muted-foreground opacity-40">&copy; {new Date().getFullYear()} Gold Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}