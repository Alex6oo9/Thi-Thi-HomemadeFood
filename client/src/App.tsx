/**
 * Main application component with React Router setup.
 */

import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { CartSidebar } from './components/CartSidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderReviewPage } from './pages/OrderReviewPage';
import { PaymentUploadPage } from './pages/PaymentUploadPage';
import { OrderPage } from './pages/OrderPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { DashboardLayout } from './components/dashboard';
import { OverviewPage, ProductsPage, OrdersPage, SettingsPage } from './pages/dashboard';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { useCart } from './context/CartContext';
import { CheckoutProvider } from './context/CheckoutContext';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cart } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        cartItemCount={cart.itemCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {children}
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes without navigation */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Product detail page - must come before /products redirect */}
      <Route
        path="/products/:id"
        element={
          <AppLayout>
            <ProductDetailPage />
          </AppLayout>
        }
      />

      {/* Google OAuth redirect - redirects to homepage */}
      <Route path="/products" element={<Navigate to="/" replace />} />

      {/* Routes with navigation layout */}
      <Route
        path="/"
        element={
          <AppLayout>
            <HomePage />
          </AppLayout>
        }
      />

      {/* Order review — public, no auth required */}
      <Route
        path="/order-review"
        element={
          <AppLayout>
            <OrderReviewPage />
          </AppLayout>
        }
      />

      {/* Payment + Checkout wrapped in CheckoutProvider */}
      <Route element={<CheckoutProvider><Outlet /></CheckoutProvider>}>
        <Route
          path="/payment"
          element={
            <AppLayout>
              <ProtectedRoute>
                <PaymentUploadPage />
              </ProtectedRoute>
            </AppLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <AppLayout>
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            </AppLayout>
          }
        />
      </Route>

      <Route
        path="/orders"
        element={
          <AppLayout>
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          </AppLayout>
        }
      />

      <Route
        path="/orders/:orderId"
        element={
          <AppLayout>
            <ProtectedRoute>
              <OrderPage />
            </ProtectedRoute>
          </AppLayout>
        }
      />

      {/* Dashboard routes - no AppLayout, uses its own DashboardLayout */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
