/**
 * Checkout page — Step 3 of 3: Delivery details + order placement.
 * Payment file and txLast6 come from CheckoutContext (set on /payment).
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MapPin, Phone, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../context/CheckoutContext';
import { useApiError } from '../hooks/useApiError';
import { contactInfoSchema } from '../lib/validation';
import { ContactStrip } from '../components/ContactStrip';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { paymentFile, txLast6, clearPayment } = useCheckout();
  const { getErrorMessage, getFieldErrors } = useApiError();
  const orderCreated = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  // Redirect to /payment if no payment file (unless order was just created)
  useEffect(() => {
    if (!paymentFile && !orderCreated.current) {
      navigate('/payment');
    }
  }, [paymentFile, navigate]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: {
      items: { productId: string; qty: number }[];
      notes?: string;
      contactInfo: { name: string; phone: string; address: string };
    }) => {
      return api.createOrder(data);
    },
    onSuccess: async (response) => {
      orderCreated.current = true;
      try {
        await api.uploadPaymentProof(
          response.order._id,
          paymentFile!,
          txLast6
        );
      } catch (e) {
        console.error('Upload failed', e);
      }
      clearCart();
      clearPayment();
      navigate(`/orders/${response.order._id}`);
    },
    onError: (error) => {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setGeneralError(getErrorMessage(error));
      }
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    // Validate contact info
    const contactResult = contactInfoSchema.safeParse({
      name: formData.name,
      phone: formData.phone.replace(/\D/g, ''),
      address: formData.address,
    });

    if (!contactResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of contactResult.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    // Check cart is not empty
    if (cart.items.length === 0) {
      setGeneralError('Your cart is empty');
      return;
    }

    // Create order
    createOrderMutation.mutate({
      items: cart.items.map((item) => ({
        productId: item.productId,
        qty: item.qty,
      })),
      notes: formData.notes || undefined,
      contactInfo: {
        name: formData.name,
        phone: formData.phone.replace(/\D/g, ''),
        address: formData.address,
      },
    });
  };

  const total = cart.subtotal;

  // Redirect if cart is empty
  if (cart.items.length === 0 && !createOrderMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some items to your cart before checking out.
            </p>
            <Link to="/">
              <Button variant="primary">Browse Menu</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Link */}
        <Link
          to="/payment"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-burmese-ruby mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payment Upload
        </Link>

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Delivery Details
            </h1>
            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
              Step 3 of 3
            </span>
          </div>
        </div>

        <ContactStrip variant="compact" className="mb-6" />

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-burmese-ruby" />
                Delivery Information
              </h2>

              {generalError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{generalError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Your Name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                  placeholder="Enter your name"
                  required
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  error={errors.phone}
                  placeholder="09xxxxxxxxx"
                  icon={<Phone className="w-5 h-5" />}
                  helperText="7-15 digits, we'll call to confirm your order"
                  required
                />

                <Textarea
                  label="Delivery Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  error={errors.address}
                  placeholder="Enter your full delivery address"
                  rows={3}
                  required
                />

                <Textarea
                  label="Order Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="E.g., less spicy, deliver after 6 PM, etc."
                  rows={2}
                  helperText="Add special instructions for your order"
                />

                {/* Submit Button - Mobile Only */}
                <div className="lg:hidden">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    loading={createOrderMutation.isPending}
                  >
                    Complete Order
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.qty} x {item.price.toLocaleString()} Ks
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm">
                        {(item.qty * item.price).toLocaleString()} Ks
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal ({cart.itemCount} items)
                  </span>
                  <span className="font-medium">
                    {cart.subtotal.toLocaleString()} Ks
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-semibold">
                      Total
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-burmese-ruby">
                      {total.toLocaleString()} Ks
                    </span>
                  </div>
                </div>
              </div>

              {/* Place Order Button - Desktop Only */}
              <div className="hidden lg:block mt-6">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleSubmit}
                  loading={createOrderMutation.isPending}
                >
                  Complete Order
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                By placing this order, you agree to our terms and conditions
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
