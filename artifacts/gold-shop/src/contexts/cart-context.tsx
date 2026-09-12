import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey, type Product } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export type CartItem = {
  productId: number;
  name: string;
  price: string;
  imageUrl?: string | null;
  quantity: number;
};

type ReorderInput = {
  productId: number | null;
  productName: string;
  unitPrice: string;
  imageUrl?: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number) => void;
  reorderItems: (items: ReorderInput[]) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "gold-hub-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  // Only a logged-in user may add to cart.
  const { data: me, isLoading: authLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  useEffect(() => {
    if (!authLoading && !me) {
      setItems([]);
    }
  }, [authLoading, me]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }, [items]);

  function requireAuth(): boolean {
    if (!me) {
      toast({
        title: "Please sign in first",
        description: "You need an account to add items to your cart.",
        variant: "destructive",
      });
      setLocation("/login");
      return false;
    }
    return true;
  }

  function mergeItem(prev: CartItem[], productId: number, name: string, price: string, imageUrl: string | null | undefined, quantity: number): CartItem[] {
    const existing = prev.find((i) => i.productId === productId);
    if (existing) {
      return prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i));
    }
    return [...prev, { productId, name, price, imageUrl, quantity }];
  }

  function addToCart(product: Product, quantity: number = 1) {
    if (!requireAuth()) return;
    setItems((prev) => mergeItem(prev, product.id, product.name, product.price, product.imageUrl, quantity));
    toast({ title: "Added to cart", description: product.name });
  }

  // Re-adds items from a past order to the cart (used by "Buy Again" in
  // the Account Center). Items whose product no longer exists (productId
  // is null — the product was deleted) are skipped, since there's nothing
  // left to add.
  function reorderItems(orderItems: ReorderInput[]) {
    if (!requireAuth()) return;

    const available = orderItems.filter((i) => i.productId !== null) as (ReorderInput & { productId: number })[];
    const skipped = orderItems.length - available.length;

    if (available.length === 0) {
      toast({
        title: "Can't reorder",
        description: "None of these items are available anymore.",
        variant: "destructive",
      });
      return;
    }

    setItems((prev) => {
      let next = prev;
      for (const item of available) {
        next = mergeItem(next, item.productId, item.productName, item.unitPrice, item.imageUrl, item.quantity);
      }
      return next;
    });

    toast({
      title: "Added to cart",
      description: skipped > 0
        ? `${available.length} item(s) added — ${skipped} item(s) are no longer available.`
        : `${available.length} item(s) added from your order.`,
    });
  }

  function removeFromCart(productId: number) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  function clearCart() {
    setItems([]);
  }

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, totalCount, totalPrice, addToCart, reorderItems, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}