import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { Package, RefreshCw, Trash2, CheckCircle, XCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminProductsPage = () => {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 12 });

  const { data, isLoading, isFetching } = useQuery([
    'admin-products', filters
  ], () => adminAPI.getProducts(filters), { keepPreviousData: true });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || { currentPage: 1, totalPages: 1, totalProducts: 0 };

  const approveMut = useMutation(({ id, status, reason }) => adminAPI.approveProduct(id, { status, reason }), {
    onSuccess: () => { toast.success('Product updated'); qc.invalidateQueries('admin-products'); }
  });

  const deleteMut = useMutation((id) => adminAPI.deleteProduct(id), {
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries('admin-products'); }
  });

  const cleanupMut = useMutation(() => adminAPI.cleanupProductsWithoutImage(), {
    onSuccess: (res) => { toast.success(`Cleanup done. Deleted ${res.data.deletedCount} items`); qc.invalidateQueries('admin-products'); }
  });

  const handlePage = (page) => setFilters((f) => ({ ...f, page }));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Products</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => cleanupMut.mutate()}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Cleanup no-image
            </button>
            <button
              onClick={() => qc.invalidateQueries('admin-products')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                className="input-field pl-9"
                placeholder="Search products..."
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
              className="input-field w-48"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-4">
                <div className="shimmer h-48 mb-3 rounded" />
                <div className="shimmer h-4 w-3/4 mb-2 rounded" />
                <div className="shimmer h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p._id} className="card overflow-hidden">
                <div className="h-48 bg-gray-100">
                  <img src={p.images?.[0]?.url || '/placeholder-product.jpg'} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{p.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">₹{p.price}</span>
                    <span className="text-xs text-gray-500">Stock: {p.stock}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => approveMut.mutate({ id: p._id, status: 'approved' })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" /> Approve
                    </button>
                    <button
                      onClick={() => approveMut.mutate({ id: p._id, status: 'rejected' })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4 text-red-600" /> Reject
                    </button>
                  </div>
                  <button
                    onClick={() => deleteMut.mutate(p._id)}
                    className="w-full mt-2 px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePage(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-2 border border-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">Page {pagination.currentPage} of {pagination.totalPages}</span>
            <button
              onClick={() => handlePage(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
