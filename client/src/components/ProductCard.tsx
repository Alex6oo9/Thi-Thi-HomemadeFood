/**
 * Product card component for displaying products.
 */

import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../types';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate();
  const isAvailable = product.available;

  const handleCardClick = () => {
    navigate(`/products/${product._id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    onAddToCart(product);
  };

  return (
    <Card
      hoverable
      padding="none"
      className="overflow-hidden group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative overflow-hidden aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {/* Image overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {product.isBestSeller && (
            <Badge variant="warning">Best Seller</Badge>
          )}
          {!isAvailable && (
            <Badge variant="error">Sold Out</Badge>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-2xl font-bold text-burmese-ruby">
            {product.price.toLocaleString()} Ks
          </span>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            icon={<ShoppingCart className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}
