/**
 * Product Add/Edit Modal Component
 * Modal dialog for creating and editing products with form validation.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MultiImageUpload } from './MultiImageUpload';
import { IngredientsInput } from './IngredientsInput';
import type { Product } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  product?: Product | null;
  mode: 'create' | 'edit';
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  images: string[];
  ingredients: string[];
  available: boolean;
  isBestSeller: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
}

export function ProductModal({ isOpen, onClose, onSubmit, product, mode }: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    images: [],
    ingredients: [],
    available: true,
    isBestSeller: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (mode === 'edit' && product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        images: product.images || (product.imageUrl ? [product.imageUrl] : []),
        ingredients: product.ingredients || [],
        available: product.available,
        isBestSeller: product.isBestSeller,
      });
    } else {
      // Reset form when creating
      setFormData({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        images: [],
        ingredients: [],
        available: true,
        isBestSeller: false,
      });
    }
    setErrors({});
  }, [mode, product, isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price is required and must be greater than 0';
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch {
      // error surfaced via onSubmit rejection
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 id="product-modal-title" className="text-h3 font-semibold text-gray-900 dark:text-gray-50">
            {mode === 'create' ? 'Add Product' : 'Edit Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label htmlFor="product-name" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Name *
            </label>
            <input
              id="product-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50
                focus:outline-none focus:ring-2 focus:ring-burmese-ruby
                ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
              placeholder="e.g., Mohinga"
            />
            {errors.name && (
              <p className="mt-1 text-body-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="product-description" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="product-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50
                focus:outline-none focus:ring-2 focus:ring-burmese-ruby"
              placeholder="Describe your product..."
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="product-price" className="block text-body-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price (Kyats) *
            </label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="1"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50
                focus:outline-none focus:ring-2 focus:ring-burmese-ruby
                ${errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
              placeholder="5000"
            />
            {errors.price && (
              <p className="mt-1 text-body-sm text-red-500">{errors.price}</p>
            )}
          </div>

          {/* Image Upload */}
          <MultiImageUpload
            images={formData.images}
            thumbnailUrl={formData.imageUrl}
            onImagesChange={(images) => {
              setFormData((prev) => {
                const thumbnail = images.includes(prev.imageUrl) ? prev.imageUrl : (images[0] ?? '');
                return { ...prev, images, imageUrl: thumbnail };
              });
            }}
            onThumbnailChange={(imageUrl) => setFormData((prev) => ({ ...prev, imageUrl }))}
            error={errors.imageUrl}
          />

          {/* Ingredients */}
          <IngredientsInput
            value={formData.ingredients}
            onChange={(ingredients) => setFormData({ ...formData, ingredients })}
          />

          {/* Checkboxes */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                id="product-available"
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="w-4 h-4 text-burmese-ruby border-gray-300 rounded focus:ring-burmese-ruby"
              />
              <span className="text-body text-gray-700 dark:text-gray-300">Available for purchase</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                id="product-bestseller"
                type="checkbox"
                checked={formData.isBestSeller}
                onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                className="w-4 h-4 text-burmese-ruby border-gray-300 rounded focus:ring-burmese-ruby"
              />
              <span className="text-body text-gray-700 dark:text-gray-300">Mark as Best Seller</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-body-sm font-medium text-gray-700 dark:text-gray-300
                bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-body-sm font-medium text-white
                bg-burmese-ruby hover:bg-burmese-ruby/90
                rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
