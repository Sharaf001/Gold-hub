import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import Navbar from "@/components/navbar";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Login from "@/pages/login";
import Register from "@/pages/register";
import VerifyCode from "@/pages/verify-code";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products-admin";
import AdminOrders from "@/pages/admin/orders-admin";
import MyOrders from "@/pages/my-orders";
import Account from "@/pages/account";
import { CartProvider } from "@/contexts/cart-context";

const queryClient = new QueryClient();

// Pages that use the public navbar
const PUBLIC_PATHS = ["/", "/products", "/cart", "/orders"];

function isPublicPath(path: string) {
  return PUBLIC_PATHS.includes(path) || path.startsWith("/products/");
}

function AppShell() {
  const [location] = useLocation();
  const showNavbar = isPublicPath(location);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      {showNavbar && <Navbar />}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/orders" component={MyOrders} />
        <Route path="/account" component={Account} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-code" component={VerifyCode} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;