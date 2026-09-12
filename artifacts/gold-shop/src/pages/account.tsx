import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useListMyOrders,
  getListMyOrdersQueryKey,
  useUpdateProfile,
  useLogout,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/contexts/cart-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useToast } from "@/hooks/use-toast";
import { Gem, LogOut } from "lucide-react";
import Navbar from "@/components/navbar";
import AdminHeader from "@/components/admin-header";

export default function Account() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isChecking, me } = useRequireAuth();
  const isAdmin = me?.role === "admin";

  const [tab, setTab] = useState<"orders" | "profile">(isAdmin ? "profile" : "orders");
  const [address, setAddress] = useState("");
  const [addressLoaded, setAddressLoaded] = useState(false);

  useEffect(() => {
    if (me && !addressLoaded) {
      setAddress(me.address ?? "");
      setAddressLoaded(true);
    }
  }, [me, addressLoaded]);

  const { data: orders, isLoading: ordersLoading } = useListMyOrders({
    query: { queryKey: getListMyOrdersQueryKey(), enabled: !isAdmin },
  });

  const { reorderItems } = useCart();

  const updateProfile = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast({ title: "Address saved" });
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => {
        toast({ title: "Error saving address", variant: "destructive" });
      },
    },
  });

  const logout = useLogout({
    mutation: {
      onSuccess: () => {
        qc.removeQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      },
    },
  });

  function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate({ data: { address: address || null } });
  }

  function handleBuyAgain(order: NonNullable<typeof orders>[0]) {
    if (!order.items || order.items.length === 0) return;
    reorderItems(
      order.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        unitPrice: i.unitPrice,
        imageUrl: i.imageUrl,
        quantity: i.quantity,
      }))
    );
  }

  if (isChecking) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center text-muted-foreground">
        Checking access...
      </div>
    );
  }

  const sortedOrders = orders
    ? [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return (
    <div className={isAdmin ? "min-h-screen bg-background" : "min-h-screen pt-16"}>
      {isAdmin ? <AdminHeader /> : <Navbar />}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl text-foreground font-light mb-10">Account</h1>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar */}
          <aside className="md:w-48 flex-shrink-0">
            <nav className="flex md:flex-col gap-6 md:gap-3">
              {!isAdmin && (
                <button
                  type="button"
                  data-testid="tab-orders"
                  onClick={() => setTab("orders")}
                  className={`text-left text-sm tracking-wide transition-colors ${
                    tab === "orders" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Orders
                </button>
              )}
              <button
                type="button"
                data-testid="tab-profile"
                onClick={() => setTab("profile")}
                className={`text-left text-sm tracking-wide transition-colors ${
                  tab === "profile" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Profile
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {tab === "orders" && !isAdmin && (
              <div className="space-y-6">
                {ordersLoading && (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-card border border-border animate-pulse h-40" />
                    ))}
                  </div>
                )}

                {!ordersLoading && sortedOrders.length === 0 && (
                  <div className="border border-border bg-card p-12 text-center">
                    <p className="text-foreground font-serif text-xl mb-2">No orders yet</p>
                    <p className="text-muted-foreground text-sm mb-6">Once you place an order, it will show up here.</p>
                    <Link
                      href="/products"
                      className="inline-block bg-primary text-primary-foreground px-6 py-3 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
                    >
                      View Collection
                    </Link>
                  </div>
                )}

                {sortedOrders.map((order) => (
                  <div key={order.id} data-testid={`order-card-${order.id}`} className="border border-border bg-card p-6">
                    {/* Thumbnails */}
                    <div className="flex gap-3 mb-5 flex-wrap">
                      {order.items?.map((item) => (
                        <div key={item.id} className="w-20 h-20 bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Gem size={20} className="text-primary opacity-30" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-serif text-xl text-foreground capitalize">
                          {order.status} {new Date(order.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          #{order.id} &middot; ${order.totalAmount} USD
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid={`button-buy-again-${order.id}`}
                        onClick={() => handleBuyAgain(order)}
                        className="border border-border px-5 py-2.5 text-xs tracking-widest uppercase text-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        Buy Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "profile" && (
              <div className="max-w-md space-y-8">
                <div className="border border-border bg-card p-6">
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Username</p>
                  <p className="font-serif text-xl text-foreground mb-4">{me?.username}</p>
                  <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">Account Type</p>
                  <p className="text-foreground capitalize">{isAdmin ? "Admin" : "Customer"}</p>
                </div>

                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="inline-block border border-primary text-primary px-6 py-3 text-xs tracking-widest uppercase hover:bg-primary/10 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <form onSubmit={handleSaveAddress} className="border border-border bg-card p-6 space-y-4">
                    <div>
                      <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-1.5">
                        Shipping Address
                      </label>
                      <textarea
                        data-testid="input-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        placeholder="Add a default shipping address for faster checkout"
                        className="w-full bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      data-testid="button-save-address"
                      disabled={updateProfile.isPending}
                      className="bg-primary text-primary-foreground px-6 py-2.5 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {updateProfile.isPending ? "Saving..." : "Save Address"}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  data-testid="button-sign-out"
                  onClick={() => logout.mutate({})}
                  className="flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-border mt-16 py-10 px-6 text-center">
        <p className="font-serif text-xl text-primary tracking-[0.2em] mb-2">GOLD HUB</p>
        <p className="text-xs text-muted-foreground opacity-40">&copy; {new Date().getFullYear()} Gold Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}