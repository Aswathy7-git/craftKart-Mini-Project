import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { ordersAPI } from '../../services/api';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Star,
  MessageCircle,
  Download,
  Search,
  Filter
} from 'lucide-react';
import DeliveryDetails from '../../components/DeliveryDetails';

// Currency formatter shared in this module
const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);

const SellerOrdersPage = () => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery(
    ['seller-orders', { status: selectedStatus, page: currentPage, search: searchQuery }],
    () => ordersAPI.getSellerOrders({ status: selectedStatus, page: currentPage, search: searchQuery }),
    {
      keepPreviousData: true
    }
  );

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || {};

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-indigo-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-indigo-100 text-indigo-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = (orderId, newStatus) => {
    // This would call the API to update order status
    console.log(`Updating order ${orderId} to ${newStatus}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="shimmer h-8 w-48 rounded"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="card p-6">
                  <div className="flex items-center space-x-4">
                    <div className="shimmer w-16 h-16 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="shimmer h-4 rounded"></div>
                      <div className="shimmer h-4 w-2/3 rounded"></div>
                      <div className="shimmer h-4 w-1/3 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We couldn't load your orders. Please try again.</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">
            Manage and track orders for your products
          </p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-64"
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field w-48"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              {pagination.totalOrders} order(s) found
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} onStatusChange={handleStatusChange} />
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  const isCurrentPage = page === currentPage;
                  
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg ${
                          isCurrentPage
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders found</h2>
            <p className="text-gray-600 mb-8">
              {selectedStatus 
                ? `No orders found with status "${selectedStatus}"` 
                : "You don't have any orders yet."
              }
            </p>
            <a href="/seller/products/add" className="btn-primary">
              Add Products
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-indigo-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-indigo-100 text-indigo-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'processing',
      'processing': 'shipped',
      'shipped': 'delivered'
    };
    return statusFlow[currentStatus];
  };

  const canUpdateStatus = (currentStatus) => {
    return ['pending', 'confirmed', 'processing', 'shipped'].includes(currentStatus);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(order.status)}
            <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {formatDate(order.createdAt)}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Order Items Preview */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex -space-x-2">
          {order.items.slice(0, 3).map((item, index) => (
            <img
              key={index}
              src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
              alt={item.product.name}
              className="w-12 h-12 object-cover rounded-lg border-2 border-white"
            />
          ))}
          {order.items.length > 3 && (
            <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
              +{order.items.length - 3}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            {order.items.length} item(s) • Total: {formatINR(order.pricing.total)}
          </p>
          <p className="text-xs text-gray-500">
            Customer: {order.user?.name}
          </p>
        </div>

        {/* Status Update Button */}
        {canUpdateStatus(order.status) && (
          <button
            onClick={() => onStatusChange(order._id, getNextStatus(order.status))}
            className="btn-primary text-sm"
          >
            Mark as {getNextStatus(order.status)}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-6 space-y-6">
          {/* Order Items */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{item.product.name}</h5>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatINR(item.price)}</p>
                    <p className="text-sm text-gray-500">each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium">{order.user?.name}</p>
              <p className="text-sm text-gray-600">{order.user?.email}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Shipping Address</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Delivery Details */}
          <DeliveryDetails
            estimated={order.tracking?.estimatedDelivery ? new Date(order.tracking.estimatedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            partner={order.tracking?.carrier || '—'}
            status={order.status || 'Pending'}
            trackingId={order.tracking?.trackingNumber || ''}
          />

          {/* Actions */}
          <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
            <button className="btn-outline text-sm flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download Invoice</span>
            </button>
            
            <button className="btn-outline text-sm flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Contact Customer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
