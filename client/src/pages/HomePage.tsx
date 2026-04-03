/**
 * Home page with product listing fetched from API.
 */

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import { ChevronDown, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../components/ui/carousel';
import type { Product } from '../types';

export function HomePage() {
  const dishesRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { settings: bizSettings } = useBusinessSettings();

  // Fetch products from API
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.products.list({ available: true }),
    queryFn: () => api.getProducts({ available: true }),
  });

  // Fetch best sellers
  const { data: bestSellersData } = useQuery({
    queryKey: queryKeys.products.list({ isBestSeller: true }),
    queryFn: () => api.getProducts({ isBestSeller: true }),
  });

  const products = data?.products ?? [];
  const bestSellers = bestSellersData?.products?.slice(0, 3) ?? [];

  const scrollToDishes = () => {
    dishesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#B91C1C] via-[#991B1B] to-[#7F1D1D] text-white py-20 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>🍜</div>
          <div className="absolute top-32 right-20 text-5xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>🥗</div>
          <div className="absolute bottom-20 left-32 text-5xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>🍛</div>
          <div className="absolute bottom-40 right-40 text-4xl animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.2s' }}>🥟</div>
        </div>

        <div className="max-w-container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold leading-snug">
                Thi Thi အိမ်ချက် မိသားစုအိမ်ချက်မှ ကြိုဆိုပါတယ် 🍜
              </h1>
              <p className="text-base md:text-lg text-white/90 leading-relaxed">
                လတ်ဆတ်ပီး အရသာရှိတဲ့ ဟင်းများမှာယူနိုင်ပါပီရှင့် 🍽️
              </p>
              <div className="pt-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={scrollToDishes}
                  className="bg-white text-burmese-ruby hover:bg-gray-50 hover:text-burmese-ruby border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4"
                  icon={<ChevronDown className="w-6 h-6" />}
                  iconPosition="right"
                >
                  ဟင်းများကြည့်ရန်
                </Button>
              </div>
            </div>

            {/* Right Column - Logo */}
            <div className="relative flex items-center justify-center animate-scale-in">
              <div className="relative z-10 bg-white rounded-full p-8 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <img
                  src="/thithi_logo.jpg"
                  alt="Thi Thi"
                  className="w-64 h-64 object-contain rounded-full"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 bg-white/20 rounded-full blur-3xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer" onClick={scrollToDishes}>
          <ChevronDown className="w-8 h-8 text-white/80" />
        </div>
      </div>

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <div className="bg-gradient-to-b from-[#FFFAF7] to-gray-50 py-10 -mt-8 relative z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="inline-block px-6 py-2 bg-burmese-ruby/10 border-2 border-burmese-ruby rounded-full">
                <span className="text-burmese-ruby font-bold text-sm uppercase tracking-wide">
                  အရောင်းရဆုံး ဟင်းများ
                </span>
              </div>
            </div>

            {/* Mobile Carousel - visible only on mobile */}
            <div className="md:hidden px-8">
              <Carousel className="w-full max-w-sm mx-auto">
                <CarouselContent>
                  {bestSellers.map((product) => (
                    <CarouselItem key={product._id}>
                      <div
                        className="relative h-64 rounded-2xl overflow-hidden shadow-xl cursor-pointer group"
                        onClick={() => navigate(`/products/${product._id}`)}
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-bold text-lg">{product.name}</h3>
                          <p className="text-white/80 text-sm">{product.price.toLocaleString()} Ks</p>
                        </div>
                        <div className="absolute top-4 right-4 bg-golden-saffron text-white px-3 py-1 rounded-full text-xs font-bold">
                          Best Seller
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>

            {/* Desktop Grid - visible only on md and larger screens */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {bestSellers.map((product) => (
                <div
                  key={product._id}
                  className="relative h-64 rounded-2xl overflow-hidden shadow-xl cursor-pointer group"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg">{product.name}</h3>
                    <p className="text-white/80 text-sm">{product.price.toLocaleString()} Ks</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-golden-saffron text-white px-3 py-1 rounded-full text-xs font-bold">
                    Best Seller
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div ref={dishesRef} className="max-w-container mx-auto px-4 py-12">
        {/* Section Header */}
        <div className="mb-8 flex flex-col items-center gap-1">
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-burmese-ruby/30" />
            <h2 className="text-xl font-semibold text-burmese-ruby tracking-wide whitespace-nowrap">
              လတ်ဆတ်သော အိမ်ချက်လက်ရာ
            </h2>
            <div className="flex-1 h-px bg-burmese-ruby/30" />
          </div>
          <span className="text-sm font-normal text-gray-400">
            {products.length} {products.length === 1 ? 'dish' : 'dishes'} available
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-burmese-ruby" />
            <span className="ml-2 text-gray-600">Loading menu...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p className="text-lg text-gray-600 mb-2">Unable to load menu</p>
            <p className="text-sm text-gray-500">Please try again later</p>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-gray-600 mb-2">No dishes available</p>
            <p className="text-sm text-gray-500">Check back soon for new items!</p>
          </div>
        )}

        {!isLoading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#FFFAF7] via-white to-[#FFF8F3] border-t-2 border-[#F5E6E0] py-8 mt-16">
        <div className="max-w-container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <img src="/thithi_logo.jpg" alt="Thi Thi" className="h-12 w-12 object-contain rounded-full" />
                <h3 className="text-2xl font-bold text-gray-900">Thi Thi</h3>
              </div>
              <p className="text-gray-600 text-sm max-w-xs">
                Bringing authentic homemade Burmese flavors to your table with love and tradition.
              </p>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-3">
              <a href={`tel:${bizSettings.phoneNumber.replace(/\s/g, '')}`} className="flex items-center gap-2 text-gray-700 hover:text-burmese-ruby transition-colors">
                <span className="text-sm font-medium">{bizSettings.phoneNumber}</span>
              </a>
              {bizSettings.contactEmail && (
                <a href={`mailto:${bizSettings.contactEmail}`} className="flex items-center gap-2 text-gray-700 hover:text-burmese-ruby transition-colors">
                  <span className="text-sm font-medium">{bizSettings.contactEmail}</span>
                </a>
              )}
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} Thi Thi. Made with love for homemade Burmese food lovers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
