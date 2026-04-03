/**
 * Dashboard products management page.
 * Full CRUD with search, filter, and modals.
 */

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Loader2,
  Package,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { ProductModal, type ProductFormData } from '../../components/dashboard/ProductModal';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { Pagination } from '../../components/dashboard/Pagination';
import { BulkActionBar } from '../../components/dashboard/BulkActionBar';
import { SortableColumnHeader } from '../../components/dashboard/SortableColumnHeader';
import { useDebounce } from '../../hooks/useDebounce';
import type { Product } from '../../types';

type FilterType = 'all' | 'available' | 'unavailable' | 'bestseller';
type ModalMode = 'create' | 'edit' | null;

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-based state
  const currentPage = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
  const urlSearch = searchParams.get('search') || '';

  // Local state for search input (for immediate UI feedback)
  const [searchInput, setSearchInput] = useState(urlSearch);

  // Debounced search value (triggers API call after 400ms)
  const debouncedSearch = useDebounce(searchInput, 400);

  const [filter, setFilter] = useState<FilterType>('all');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bestSellerError, setBestSellerError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      const newParams: Record<string, string> = { page: '1', sortBy, order };
      if (debouncedSearch) {
        newParams.search = debouncedSearch;
      }
      setSearchParams(newParams);
    }
  }, [debouncedSearch, urlSearch, sortBy, order, setSearchParams]);

  // Sync search input with URL (for browser back/forward)
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Build API filter params based on filter dropdown
  const filterParams = useMemo(() => {
    const params: { available?: boolean; isBestSeller?: boolean } = {};
    if (filter === 'available') params.available = true;
    else if (filter === 'unavailable') params.available = false;
    else if (filter === 'bestseller') params.isBestSeller = true;
    return params;
  }, [filter]);

  // Fetch total best seller count (to enforce max-3 limit client-side)
  const { data: bestSellerData } = useQuery({
    queryKey: [...queryKeys.products.lists(), 'bestSellerCount'],
    queryFn: () => api.getProducts({ isBestSeller: true, limit: 1, page: 1 }),
    staleTime: 0,
  });
  const bestSellerCount = bestSellerData?.pagination?.total ?? 0;

  // Fetch products with pagination, sorting, search, and filters
  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.products.lists(), currentPage, sortBy, order, urlSearch, filterParams],
    queryFn: () => api.getProducts({
      page: currentPage,
      limit: 10,
      sortBy,
      order,
      search: urlSearch || undefined,
      ...filterParams
    }),
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      api.updateProduct(id, { available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => api.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      showSuccess('Product created successfully');
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      api.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      showSuccess('Product updated successfully');
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      showSuccess('Product deleted successfully');
    },
  });

  // Toggle best seller mutation
  const toggleBestSellerMutation = useMutation({
    mutationFn: ({ id, isBestSeller }: { id: string; isBestSeller: boolean }) =>
      api.toggleBestSeller(id, isBestSeller),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (err: any) => {
      const msg = err.error || err.message || 'Failed to update best seller status';
      setBestSellerError(msg);
      setTimeout(() => setBestSellerError(null), 5000);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (productIds: string[]) => api.bulkDeleteProducts(productIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      setSelectedIds(new Set());
      showSuccess(`${data.deleted} products deleted successfully`);
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ productIds, available }: { productIds: string[]; available: boolean }) =>
      api.bulkUpdateProducts(productIds, { available }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      setSelectedIds(new Set());
      showSuccess(`${data.updated} products updated successfully`);
    },
  });

  // Backend handles all filtering and search, so just use products directly
  const filteredProducts = products;

  const handleToggleAvailability = (product: Product) => {
    toggleAvailabilityMutation.mutate({
      id: product._id,
      available: !product.available,
    });
  };

  const handleToggleBestSeller = (product: Product) => {
    // Block client-side before hitting the API
    if (!product.isBestSeller && bestSellerCount >= 3) {
      setBestSellerError('Maximum 3 best sellers allowed. Remove one first.');
      setTimeout(() => setBestSellerError(null), 5000);
      return;
    }
    toggleBestSellerMutation.mutate({
      id: product._id,
      isBestSeller: !product.isBestSeller,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setDeleteConfirmProduct(productId);
  };

  const confirmDelete = () => {
    if (deleteConfirmProduct) {
      deleteProductMutation.mutate(deleteConfirmProduct);
      setDeleteConfirmProduct(null);
    }
  };

  const handleAddProduct = () => {
    setModalMode('create');
    setSelectedProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setModalMode('edit');
    setSelectedProduct(product);
  };

  const handleProductSubmit = async (data: ProductFormData) => {
    if (modalMode === 'create') {
      await createProductMutation.mutateAsync(data);
    } else if (modalMode === 'edit' && selectedProduct) {
      await updateProductMutation.mutateAsync({ id: selectedProduct._id, data });
    }
    setModalMode(null);
    setSelectedProduct(null);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    const newParams: Record<string, string> = { page: String(page), sortBy, order };
    if (urlSearch) newParams.search = urlSearch;
    setSearchParams(newParams);
  };

  // Sorting handlers
  const handleSort = (newSortBy: string) => {
    const newOrder = sortBy === newSortBy && order === 'asc' ? 'desc' : 'asc';
    const newParams: Record<string, string> = { page: String(currentPage), sortBy: newSortBy, order: newOrder };
    if (urlSearch) newParams.search = urlSearch;
    setSearchParams(newParams);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map((p: Product) => p._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (productId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(productId);
    } else {
      newSelectedIds.delete(productId);
    }
    setSelectedIds(newSelectedIds);
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    setBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds));
    setBulkDeleteConfirm(false);
  };

  const handleBulkMarkAvailable = () => {
    bulkUpdateMutation.mutate({ productIds: Array.from(selectedIds), available: true });
  };

  const handleBulkMarkUnavailable = () => {
    bulkUpdateMutation.mutate({ productIds: Array.from(selectedIds), available: false });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-burmese-ruby" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-h3 font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Unable to load products
        </h2>
        <p className="text-body-sm text-gray-500 dark:text-gray-400">
          Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-gray-900 dark:text-gray-100">
            Products
          </h1>
          <p className="text-body-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your product catalog
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleAddProduct}
        >
          Add Product
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products by name..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-body-sm focus:outline-none focus:ring-2 focus:ring-burmese-ruby/50"
          />
        </div>

        {/* Filter dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-body-sm focus:outline-none focus:ring-2 focus:ring-burmese-ruby/50 cursor-pointer"
            >
              <option value="all">All Products</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="bestseller">Best Sellers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-body font-medium text-gray-900 dark:text-gray-100 mb-2">
              {urlSearch || filter !== 'all' ? 'No products found' : 'No products yet'}
            </p>
            <p className="text-body-sm text-gray-500 dark:text-gray-400 mb-6">
              {urlSearch || filter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Start by adding your first product'}
            </p>
            {!urlSearch && filter === 'all' && (
              <Button
                variant="primary"
                onClick={handleAddProduct}
              >
                Add Your First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-burmese-ruby focus:ring-burmese-ruby/50 bg-white dark:bg-gray-800"
                      aria-label="Select all products"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-caption font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    <SortableColumnHeader
                      label="Name"
                      sortKey="name"
                      currentSort={{ sortBy, order }}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-caption font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    <SortableColumnHeader
                      label="Price"
                      sortKey="price"
                      currentSort={{ sortBy, order }}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-caption font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-caption font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product: Product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product._id)}
                        onChange={(e) => handleSelectOne(product._id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-burmese-ruby focus:ring-burmese-ruby/50 bg-white dark:bg-gray-800"
                        aria-label={`Select product ${product.name}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center gap-4 cursor-pointer group"
                        onClick={() => handleEditProduct(product)}
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                        <div>
                          <p className="text-body-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-burmese-ruby transition-colors">
                            {product.name}
                          </p>
                          <p className="text-caption text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-body-sm font-medium text-gray-900 dark:text-gray-100">
                        {product.price.toLocaleString()} Ks
                      </span>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleBestSeller(product)}
                          disabled={toggleBestSellerMutation.isPending}
                          className={`p-2 rounded-md transition-colors ${
                            product.isBestSeller
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30'
                              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          title={product.isBestSeller ? 'Remove from best sellers' : 'Add to best sellers'}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleAvailability(product)}
                          disabled={toggleAvailabilityMutation.isPending}
                          className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title={product.available ? 'Mark as unavailable' : 'Mark as available'}
                        >
                          {product.available ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Edit product"
                          aria-label="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          disabled={deleteProductMutation.isPending}
                          className="p-2 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete product"
                          aria-label="Delete product"
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
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onMarkAvailable={handleBulkMarkAvailable}
        onMarkUnavailable={handleBulkMarkUnavailable}
        onDelete={handleBulkDelete}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={modalMode !== null}
        onClose={() => {
          setModalMode(null);
          setSelectedProduct(null);
        }}
        onSubmit={handleProductSubmit}
        product={selectedProduct}
        mode={modalMode || 'create'}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmProduct !== null}
        onClose={() => setDeleteConfirmProduct(null)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title={`Delete ${selectedIds.size} products`}
        message={`Are you sure you want to delete ${selectedIds.size} selected products? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-lg shadow-xl animate-in slide-in-from-bottom-2 duration-300">
          <CheckCircle className="w-5 h-5" />
          <span className="text-body-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Best Seller Limit Toast */}
      {bestSellerError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full flex items-start gap-3 px-5 py-4 rounded-xl shadow-xl animate-in slide-in-from-bottom-2 duration-300 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700">
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/40">
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-semibold text-gray-900 dark:text-gray-100">
              Best Seller Limit Reached
            </p>
            <p className="text-caption text-gray-500 dark:text-gray-400 mt-0.5">
              Only 3 best sellers allowed. Remove one to add another.
            </p>
          </div>
          <button
            onClick={() => setBestSellerError(null)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
