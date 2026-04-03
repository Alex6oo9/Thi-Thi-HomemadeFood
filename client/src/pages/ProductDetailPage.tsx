/**
 * Product Detail Page — redesigned
 * Compact gallery with arrows + thumbnail strip, split layout, sticky cart CTA.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Star,
  Leaf,
} from 'lucide-react';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { Toast } from '../components/Toast';
import { ContactStrip } from '../components/ContactStrip';
import { queryKeys } from '../lib/queryKeys';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [activeIdx, setActiveIdx] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: queryKeys.products.detail(id!),
    queryFn: () => api.getProduct(id!),
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    setAdded(true);
    setShowToast(true);
    setTimeout(() => setAdded(false), 1800);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F1EB' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#DC2626' }} />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F4F1EB' }}>
        <div className="text-center">
          <AlertCircle className="w-14 h-14 mx-auto mb-4" style={{ color: '#DC2626' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C2C2C' }}>Product Not Found</h2>
          <p className="mb-6" style={{ color: '#7A7A7A' }}>The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-full text-white font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#DC2626' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.imageUrl];
  const ingredients = product.ingredients ?? [];
  const hasMultiple = images.length > 1;

  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx((i) => (i + 1) % images.length);

  return (
    <div className="min-h-screen pb-24 md:pb-0" style={{ background: '#F4F1EB', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 border-b backdrop-blur-sm" style={{ background: 'rgba(244,241,235,0.92)', borderColor: '#E8E2D6' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: '#2C2C2C' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-start">

          {/* ── LEFT: Gallery ── */}
          <div className="space-y-3">

            {/* Main image with nav arrows */}
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: 24,
                boxShadow: '0px 10px 30px rgba(0,0,0,0.07)',
                aspectRatio: '4/5',
                background: '#fff',
              }}
            >
              <img
                key={activeIdx}
                src={images[activeIdx]}
                alt={`${product.name} — photo ${activeIdx + 1}`}
                className="w-full h-full object-cover"
                style={{ transition: 'opacity 0.2s ease' }}
              />

              {/* Counter pill */}
              {hasMultiple && (
                <div
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', letterSpacing: '0.05em' }}
                >
                  {activeIdx + 1} / {images.length}
                </div>
              )}

              {/* Best seller ribbon */}
              {product.isBestSeller && (
                <div
                  className="absolute top-3 left-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: '#F59E0B', color: '#fff' }}
                >
                  <Star className="w-3 h-3 fill-white" />
                  Best Seller
                </div>
              )}

              {/* Out of stock overlay */}
              {!product.available && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.45)' }}
                >
                  <span
                    className="text-white font-bold text-lg tracking-wide px-5 py-2 rounded-full"
                    style={{ background: 'rgba(220,38,38,0.85)' }}
                  >
                    Out of Stock
                  </span>
                </div>
              )}

              {/* Nav arrows — only when multiple images */}
              {hasMultiple && (
                <>
                  {/* Left arrow — white bg, dark icon */}
                  <button
                    onClick={prev}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#FFFFFF',
                      boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" style={{ color: '#1B4D30' }} />
                  </button>

                  {/* Right arrow — green bg, white icon */}
                  <button
                    onClick={next}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#1B4D30',
                      boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
                    }}
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {hasMultiple && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    aria-label={`View image ${i + 1}`}
                    className="flex-shrink-0 transition-all"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: i === activeIdx ? '2px solid #1B4D30' : '2px solid transparent',
                      opacity: i === activeIdx ? 1 : 0.6,
                      boxShadow: i === activeIdx ? '0 2px 8px rgba(27,77,48,0.2)' : 'none',
                    }}
                  >
                    <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="flex flex-col gap-5">

            {/* Name */}
            <div>
              <h1
                className="text-3xl font-bold leading-tight mb-1"
                style={{ color: '#2C2C2C', fontFamily: '"Playfair Display", serif' }}
              >
                {product.name}
              </h1>
              <p className="text-sm" style={{ color: '#B89768' }}>
                Homemade · Authentic Burmese
              </p>
            </div>

            {/* Price */}
            <div
              className="inline-flex items-baseline gap-1.5 px-4 py-2 rounded-2xl self-start"
              style={{ background: 'rgba(220,38,38,0.08)' }}
            >
              <span className="text-3xl font-bold" style={{ color: '#DC2626' }}>
                {product.price.toLocaleString()}
              </span>
              <span className="text-base font-semibold" style={{ color: '#DC2626', opacity: 0.75 }}>
                Ks
              </span>
            </div>

            {/* Description */}
            <div>
              <p className="text-base leading-relaxed" style={{ color: '#4A4A4A' }}>
                {product.description}
              </p>
            </div>

            {/* Ingredients */}
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ border: '1.5px solid #E8E2D6', background: '#F4F1EB' }}
            >
              {/* Floating decorative emojis */}
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                {['🫚', '🧄', '🌶️', '🧅'].map((emoji, i) => (
                  <span
                    key={i}
                    className="absolute text-2xl animate-pulse"
                    style={{
                      opacity: 0.1,
                      top: ['12%', '55%', '20%', '60%'][i],
                      left: ['8%', '22%', '72%', '85%'][i],
                      animationDelay: `${i * 0.6}s`,
                      animationDuration: '3s',
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>

              {/* Header */}
              <div className="relative px-4 pt-4 pb-2 flex items-center gap-2">
                <Leaf className="w-4 h-4 flex-shrink-0" style={{ color: '#1B4D30' }} />
                <span className="text-sm font-semibold tracking-wide" style={{ color: '#1B4D30' }}>
                  ပါ၀င်ပစ္စည်းများ 🌿
                </span>
                {ingredients.length > 0 && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full ml-1"
                    style={{ background: '#fff', color: '#7A7A7A', border: '1px solid #E8E2D6' }}
                  >
                    {ingredients.length}
                  </span>
                )}
              </div>

              {/* Pills */}
              <div className="relative px-4 pb-4 pt-1">
                {ingredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="text-sm px-3 py-1 rounded-full"
                        style={{ background: '#fff', color: '#4A4A4A', border: '1px solid #E8E2D6' }}
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#9A9A9A' }}>မဖော်ပြရသေး</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" style={{ borderColor: '#E8E2D6' }} />

            {/* Add to cart — desktop */}
            <div className="hidden md:block">
              <button
                onClick={handleAddToCart}
                disabled={!product.available || added}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-full font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: added ? '#1B4D30' : '#DC2626',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(220,38,38,0.25)',
                  transition: 'background 0.3s ease',
                }}
              >
                <ShoppingCart className="w-5 h-5" />
                {added ? 'Added to Cart!' : product.available ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            {/* Contact strip */}
            <ContactStrip variant="compact" />
          </div>
        </div>
      </div>

      {/* ── Sticky mobile CTA ── */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 py-3"
        style={{
          background: 'rgba(244,241,235,0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #E8E2D6',
        }}
      >
        <button
          onClick={handleAddToCart}
          disabled={!product.available || added}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-full font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: added ? '#1B4D30' : '#DC2626',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(220,38,38,0.22)',
            transition: 'background 0.3s ease',
          }}
        >
          <ShoppingCart className="w-5 h-5" />
          {added ? 'Added!' : product.available ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>

      {showToast && (
        <Toast
          message={`${product.name} added to cart!`}
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
