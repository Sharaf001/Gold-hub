import { useState } from "react";
import { Link, useParams } from "wouter";
import { useGetProduct, getGetProductQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { Gem, ArrowLeft, Shield, Package, RotateCcw, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/cart-context";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { toast } = useToast();
  const { addToCart } = useCart();

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) },
  });

  const [showInquiry, setShowInquiry] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: () => {
        toast({ title: "Enquiry submitted", description: "Our team will be in touch within 24 hours." });
        setShowInquiry(false);
        setForm({ name: "", email: "", phone: "", address: "" });
      },
      onError: () => {
        toast({ title: "Error", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    createOrder.mutate({
      data: {
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone || null,
        shippingAddress: form.address || null,
        notes: null,
        items: [{ productId: product.id, quantity: 1 }],
      },
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Gem size={32} className="text-primary opacity-30 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center text-center">
        <div>
          <p className="font-serif text-2xl text-foreground mb-4">Piece not found</p>
          <Link href="/products" className="text-xs text-primary tracking-widest uppercase">
            Back to Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase mb-10"
        >
          <ArrowLeft size={12} />
          Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image */}
          <div className="relative bg-card border border-border overflow-hidden aspect-square">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gem size={64} className="text-primary opacity-20" />
              </div>
            )}
            {!product.inStock && (
              <div className="absolute top-4 left-4 bg-background/90 text-muted-foreground text-xs px-3 py-1 tracking-wider uppercase">
                Sold Out
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <p className="text-xs text-primary tracking-[0.4em] uppercase mb-3">{product.categoryName}</p>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground font-light mb-4">{product.name}</h1>
            <p className="font-serif text-3xl text-primary font-light mb-6">${product.price}</p>

            <div className="gold-divider mb-6" />

            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-8">{product.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8">
              {product.material && (
                <div className="border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground tracking-wider uppercase mb-1">Material</p>
                  <p className="text-foreground font-light">{product.material}</p>
                </div>
              )}
              {product.weight && (
                <div className="border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground tracking-wider uppercase mb-1">Weight</p>
                  <p className="text-foreground font-light">{product.weight}</p>
                </div>
              )}
            </div>

            {product.inStock ? (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button
                  data-testid="button-add-to-cart"
                  onClick={() => addToCart(product)}
                  className="flex-1 flex items-center justify-center gap-2 border border-primary text-primary py-4 text-xs tracking-widest uppercase hover:bg-primary/10 transition-colors"
                >
                  <ShoppingBag size={14} />
                  Add to Cart
                </button>
                <button
                  data-testid="button-inquire"
                  onClick={() => setShowInquiry(true)}
                  className="flex-1 bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity"
                >
                  Enquire to Purchase
                </button>
              </div>
            ) : (
              <div className="w-full border border-border text-muted-foreground py-4 text-xs tracking-widest uppercase text-center mb-4">
                Currently Unavailable
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mt-2">
              {[
                { icon: Shield, label: "Lifetime Warranty" },
                { icon: Package, label: "Insured Shipping" },
                { icon: RotateCcw, label: "30-Day Returns" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <Icon size={16} className="mx-auto text-primary opacity-60 mb-1" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      {showInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-foreground font-light">Place Enquiry</h2>
              <button onClick={() => setShowInquiry(false)} className="text-muted-foreground hover:text-foreground text-xs tracking-wider uppercase">
                Close
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Complete your details and our team will contact you within 24 hours to finalise the purchase.
            </p>
            <form onSubmit={handleOrder} className="space-y-4">
              {[
                { id: "name", label: "Full Name *", type: "text", required: true, value: form.name, field: "name" },
                { id: "email", label: "Email *", type: "email", required: true, value: form.email, field: "email" },
                { id: "phone", label: "Phone", type: "tel", required: false, value: form.phone, field: "phone" },
              ].map(f => (
                <div key={f.id}>
                  <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-1.5">{f.label}</label>
                  <input
                    data-testid={`input-order-${f.id}`}
                    type={f.type}
                    value={f.value}
                    required={f.required}
                    onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                    className="w-full bg-background border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs tracking-widest uppercase text-muted-foreground mb-1.5">Shipping Address</label>
                <textarea
                  data-testid="input-order-address"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
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
                data-testid="button-submit-order"
                type="submit"
                disabled={createOrder.isPending}
                className="w-full bg-primary text-primary-foreground py-3 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {createOrder.isPending ? "Submitting..." : "Submit Enquiry"}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-border mt-16 py-10 px-6 text-center">
        <p className="font-serif text-xl text-primary tracking-[0.2em] mb-2">GOLD HUB</p>
        <p className="text-xs text-muted-foreground opacity-40">&copy; {new Date().getFullYear()} Gold Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}