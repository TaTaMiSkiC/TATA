import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductsPage from "@/pages/products-page";
import ProductDetailsPage from "@/pages/product-details-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";
import OrderSuccessPage from "@/pages/order-success-page";
import AboutPage from "@/pages/about-page";
import ContactPage from "@/pages/contact-page";
import BlogPage from "@/pages/blog-page";
import ShippingReturnsPage from "@/pages/shipping-returns-page";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import AdminProducts from "@/pages/admin/admin-products";
import AdminCategories from "@/pages/admin/admin-categories";
import AdminScents from "@/pages/admin/admin-scents";
import AdminColors from "@/pages/admin/admin-colors";
import AdminOrders from "@/pages/admin/admin-orders";
import AdminUsers from "@/pages/admin/admin-users";
import DeliverySettingsPage from "@/pages/admin/delivery-settings-page";
import AdminSettings from "@/pages/admin/settings-page";
import PageSettingsPage from "@/pages/admin/page-settings";
import ContactSettingsPage from "@/pages/admin/contact-settings";
import ShippingReturnsSettingsPage from "@/pages/admin/shipping-returns-settings";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { CartProvider } from "./hooks/use-cart";
import { ThemeProvider } from "./hooks/use-theme";
import { LanguageProvider } from "./hooks/use-language";
import CookieConsent from "./components/CookieConsent";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/products/:id" component={ProductDetailsPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/shipping-returns" component={ShippingReturnsPage} />
      <ProtectedRoute path="/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/order-success" component={OrderSuccessPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/products" component={AdminProducts} />
      <ProtectedRoute path="/admin/categories" component={AdminCategories} />
      <ProtectedRoute path="/admin/scents" component={AdminScents} />
      <ProtectedRoute path="/admin/colors" component={AdminColors} />
      <ProtectedRoute path="/admin/orders" component={AdminOrders} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} />
      <ProtectedRoute path="/admin/delivery-settings" component={DeliverySettingsPage} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} />
      <ProtectedRoute path="/admin/page-settings" component={PageSettingsPage} />
      <ProtectedRoute path="/admin/contact-settings" component={ContactSettingsPage} />
      <ProtectedRoute path="/admin/shipping-returns-settings" component={ShippingReturnsSettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
                <CookieConsent />
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
