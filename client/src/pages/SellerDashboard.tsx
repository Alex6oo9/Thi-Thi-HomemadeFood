/**
 * Seller dashboard for managing products.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  TrendingUp,
  Star,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import type { Product } from '../types';

export function SellerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'grid' | 'list'>('list');

  // Fetch all products (seller sees their own products)
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.products.lists(),
    queryFn: () => api.getProducts(),
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      api.updateProduct(id, { available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });

  // Toggle best seller mutation
  const toggleBestSellerMutation = useMutation({
    mutationFn: ({ id, isBestSeller }: { id: string; isBestSeller: boolean }) =>
      api.toggleBestSeller(id, isBestSeller),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });

  const products = data?.products ?? [];

  const stats = {
    totalProducts: data?.pagination?.total ?? 0,
    available: products.filter((p: Product) => p.available).length,
    bestSellers: products.filter((p: Product) => p.isBestSeller).length,
    unavailable: products.filter((p: Product) => !p.available).length,
  };

  const handleToggleAvailability = (product: Product) => {
    toggleAvailabilityMutation.mutate({
      id: product._id,
      available: !product.available,
    });
  };

  const handleToggleBestSeller = (product: Product) => {
    toggleBestSellerMutation.mutate({
      id: product._id,
      isBestSeller: !product.isBestSeller,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burmese-ruby" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load products
            </h2>
            <p className="text-gray-600">Please try again later.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Seller Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your products and inventory
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => alert('Add product form coming soon!')}
            >
              Add New Product
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card
              padding="md"
              className="bg-gradient-to-br from-burmese-ruby to-red-700 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Products</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
                </div>
                <Package className="w-10 h-10 opacity-80" />
              </div>
            </Card>

            <Card
              padding="md"
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Available</p>
                  <p className="text-3xl font-bold mt-1">{stats.available}</p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-80" />
              </div>
            </Card>

            <Card
              padding="md"
              className="bg-gradient-to-br from-amber-500 to-amber-600 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Best Sellers</p>
                  <p className="text-3xl font-bold mt-1">{stats.bestSellers}</p>
                </div>
                <Star className="w-10 h-10 opacity-80" />
              </div>
            </Card>

            <Card
              padding="md"
              className="bg-gradient-to-br from-gray-500 to-gray-600 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Unavailable</p>
                  <p className="text-3xl font-bold mt-1">{stats.unavailable}</p>
                </div>
                <EyeOff className="w-10 h-10 opacity-80" />
              </div>
            </Card>
          </div>
        </div>

        {/* Products List */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Products</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 rounded ${
                  view === 'list'
                    ? 'bg-burmese-ruby text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-2 rounded ${
                  view === 'grid'
                    ? 'bg-burmese-ruby text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Grid
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No products yet
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Start by adding your first product
              </p>
              <Button
                variant="primary"
                onClick={() => alert('Add product form coming soon!')}
              >
                Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => navigate(`/products/${product._id}`)}
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900 hover:text-burmese-ruby transition-colors">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">
                          {product.price.toLocaleString()} Ks
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {product.available ? (
                            <Badge variant="success">Available</Badge>
                          ) : (
                            <Badge variant="error">Unavailable</Badge>
                          )}
                          {product.isBestSeller && (
                            <Badge variant="warning">Best Seller</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleBestSeller(product)}
                            className={`p-2 rounded transition-colors ${
                              product.isBestSeller
                                ? 'text-amber-600 bg-amber-50'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Toggle best seller"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleAvailability(product)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Toggle availability"
                          >
                            {product.available ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => alert('Edit form coming soon!')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
