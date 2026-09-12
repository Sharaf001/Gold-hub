import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCreateOrder } from "@workspace/api-client-react";
import { useCart } from "@/contexts/cart-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useToast } from "@/hooks/use-toast";
import { Gem, Minus, Plus, Trash2, ArrowLeft } from "lucide-react";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isChecking, me } = useRequireAuth();
  const { items, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  useEffect(() => {
    if (me?.username && !form.name) {
      setForm((f) => ({ ...f, name: me.username }));
    }
  }, [me, form.name]);

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: () => {
        toast({ title: "Order placed", description: "Our team will be in touch within 24 hours." });
        clearCart();
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Error placing order", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    createOrder.mutate({
      data: {
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone || null,
        shippingAddress: form.address || null,
        notes: null,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      },
    });
  }

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
          href="/products"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase mb-10"
        >
          <ArrowLeft size={12} />
          Continue Shopping
        </Link>

        <h1 className="font-serif text-4xl text-foreground font-light mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-24 border border-border bg-card">
            <Gem size={32} className="mx-auto text-primary opacity-30 mb-4" />
            <p className="font-serif text-2xl text-foreground font-light mb-2">Your cart is empty</p>
            <p className="text-muted-foreground text-sm mb-6">Browse the collection and add a piece you love.</p>
            <Link
              href="/products"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
            >
              View Collection
            </Link>
          </div>
        ) : (
          <>
            <div className="border border-border bg-card divide-y divide-border">
              {items.map((item) => (
                <div key={item.productId} data-testid={`cart-item-${item.productId}`} className="flex items-center gap-4 p-4">
                  <div className="w-20 h-20 bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Gem size={24} className="text-primary opacity-30" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-serif text-foreground">{item.name}</p>
                    <p className="text-sm text-primary">${item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 border border-border">
                    <button
                      type="button"
                      data-testid={`button-decrease-${item.productId}`}
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm text-foreground">{item.quantity}</span>
                    <button
                      type="button"
                      data-testid={`button-increase-${item.productId}`}
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="w-20 text-right font-serif text-foreground">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    data-testid={`button-remove-${item.productId}`}
                    onClick={() => removeFromCart(item.productId)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove from cart"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <span className="text-sm tracking-widest uppercase text-muted-foreground">Total</span>
              <span className="font-serif text-2xl text-primary">${totalPrice.toFixed(2)}</span>
            </div>

            {!showCheckout ? (
              <button
                type="button"
                data-testid="button-checkout"
                onClick={() => setShowCheckout(true)}
                className="w-full mt-6 bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
              >
                Proceed to Checkout
              </button>
            ) : (
              <form onSubmit={handleCheckout} className="mt-8 border border-border bg-card p-6 space-y-4">
                <h2 className="font-serif text-xl text-foreground font-light mb-2">Checkout Details</h2>
                {[
                  { id: "name", label: "Full Name *", type: "text", required: true },
                  { id: "email", label: "Email *", type: "email", required: true },
                  { id: "phone", label: "Phone", type: "tel", required: false },
                ].map((f) => (
                  <div key={f.id}>
                    <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-1.5">{f.label}</label>
                    <input
                      data-testid={`input-checkout-${f.id}`}
                      type={f.type}
                      value={(form as any)[f.id]}
                      required={f.required}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      className="w-full bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-1.5">Shipping Address</label>
                  <textarea
                    data-testid="input-checkout-address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    rows={2}
                    className="w-full bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-1.5">Payment Method</label>
                  <div className="flex items-center gap-3 border border-primary bg-primary/10 px-3 py-2.5">
                    <input
                      type="radio"
                      checked
                      readOnly
                      data-testid="input-payment-cod"
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm text-foreground">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay in cash when your order arrives.</p>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  data-testid="button-submit-checkout"
                  disabled={createOrder.isPending}
                  className="w-full bg-primary text-primary-foreground py-3 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createOrder.isPending ? "Placing order..." : "Place Order"}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-border mt-16 py-10 px-6 text-center">
        <p className="font-serif text-xl text-primary tracking-[0.2em] mb-2">GOLD HUB</p>
        <p className="text-xs text-muted-foreground opacity-40">&copy; {new Date().getFullYear()} Gold Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}