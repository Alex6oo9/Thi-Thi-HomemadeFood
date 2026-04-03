import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import { ContactStrip } from '../components/ContactStrip';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export function OrderReviewPage() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const [copied, setCopied] = useState(false);

  const { settings: bizSettings } = useBusinessSettings();
  const total = cart.subtotal;

  const handleCopy = () => {
    navigator.clipboard.writeText(bizSettings.kbzPayNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-burmese-ruby mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

        {/* Page title */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Complete Your Order
            </h1>
            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
              Step 1 of 3
            </span>
          </div>
        </div>

        <ContactStrip variant="compact" className="mb-6" />

        {/* Empty cart check */}
        {cart.items.length === 0 ? (
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
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left: Order items */}
            <div className="lg:col-span-2">
              <Card>
                <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-burmese-ruby" />
                  Your Order
                </h2>

                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.qty} &times; {item.price.toLocaleString()} Ks
                        </p>
                      </div>
                      <p className="font-semibold flex-shrink-0">
                        {(item.qty * item.price).toLocaleString()} Ks
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({cart.itemCount} items)
                    </span>
                    <span className="font-medium">
                      {cart.subtotal.toLocaleString()} Ks
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-lg font-bold text-burmese-ruby">
                        {total.toLocaleString()} Ks
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Payment info */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-burmese-ruby" />
                  KBZPay နဲ့ ငွေပေးချေရန်
                </h2>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-semibold">
                        အောက်ပါအကောင့်ထဲသို ပေးချင်နိုင်ပါတယ်ရှင့်
                      </p>
                      <div className="mt-2 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                        <p className="font-mono text-2xl font-bold text-gray-900">
                          {bizSettings.kbzPayNumber}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Name: {bizSettings.kbzPayName}
                        </p>
                      </div>
                      {/* Copy button */}
                      <button
                        onClick={handleCopy}
                        className="mt-2 inline-flex items-center gap-1.5 text-sm transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-500 hover:text-gray-700">
                              Copy number
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      2
                    </span>
                    <p className="pt-0.5">
                      SS အား FB page တွင်လည်း လာရောက်ပေးပိုနိုင်ပါတယ်
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={() => navigate('/payment')}
                  >
                    I've Paid — Upload Proof &rarr;
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
