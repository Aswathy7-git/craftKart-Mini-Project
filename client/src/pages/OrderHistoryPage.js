import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { ordersAPI } from '../services/api';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Star,
  MessageCircle,
  Download
} from 'lucide-react';

const OrderHistoryPage = () => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery(
    ['orders', { status: selectedStatus, page: currentPage }],
    () => ordersAPI.getOrders({ status: selectedStatus, page: currentPage }),
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">
            Track and manage your orders
          </p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by status:</label>
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
              <OrderCard key={order._id} order={order} />
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
                : "You haven't placed any orders yet."
              }
            </p>
            <a href="/products" className="btn-primary">
              Start Shopping
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);

  const handleDownloadInvoice = () => {
    try {
      const orderDate = new Date(order.createdAt).toLocaleString();
      const rows = (order.items || []).map((item, idx) => {
        const name = item.product?.name || 'Item';
        const qty = item.quantity || 0;
        const price = Number(item.price || 0);
        const line = price * qty;
        return `<tr>
          <td>${idx + 1}</td>
          <td>${name}</td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:right;">${formatINR(price)}</td>
          <td style="text-align:right;">${formatINR(line)}</td>
        </tr>`;
      }).join('');

      const addr = order.shippingAddress || {};
      const totals = order.pricing || {};

      const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice #${order.orderNumber}</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 4px; font-size: 20px; }
            .muted { color: #6b7280; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
            table { border-collapse: collapse; width: 100%; margin-top: 16px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
            th { background: #f9fafb; text-align: left; }
            .right { text-align: right; }
            .totals { margin-top: 12px; width: 320px; margin-left: auto; }
            .totals td { border: none; padding: 4px 0; }
            .totals tr:last-child td { border-top: 1px solid #e5e7eb; padding-top: 8px; font-weight: 600; }
            .footer { margin-top: 24px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Invoice</h1>
          <div class="muted">Invoice #: ${order.orderNumber} · Date: ${orderDate}</div>
          <div class="grid">
            <div>
              <div style="font-weight:600; margin-bottom:4px;">Billed To</div>
              <div>${addr.name || ''}</div>
              <div>${addr.street || ''}</div>
              <div>${addr.city || ''} ${addr.state || ''} ${addr.zipCode || ''}</div>
              <div>${addr.country || ''}</div>
              ${addr.phone ? `<div>Phone: ${addr.phone}</div>` : ''}
            </div>
            <div>
              <div style="font-weight:600; margin-bottom:4px;">Seller</div>
              <div>CraftKart</div>
              <div>https://craftkart.local</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th style="text-align:center;">Qty</th>
                <th class="right">Price</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <table class="totals">
            <tr>
              <td class="muted">Subtotal:</td>
              <td class="right">${formatINR(Number(totals.subtotal || totals.total || 0))}</td>
            </tr>
            ${totals.tax ? `<tr><td class="muted">Tax:</td><td class="right">${formatINR(Number(totals.tax))}</td></tr>` : ''}
            ${totals.shipping ? `<tr><td class="muted">Shipping:</td><td class="right">${formatINR(Number(totals.shipping))}</td></tr>` : ''}
            <tr>
              <td>Total:</td>
              <td class="right">${formatINR(Number(totals.total || 0))}</td>
            </tr>
          </table>

          <div class="footer">This is a computer-generated invoice. Thank you for your purchase!</div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
        </body>
      </html>`;

      const w = window.open('', 'INVOICE', 'height=800,width=1000');
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {}
  };

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
            {order.items.length} item(s) • Total: ₹{order.pricing.total.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {order.items[0]?.product.name}
            {order.items.length > 1 && ` and ${order.items.length - 1} more`}
          </p>
        </div>
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
                    <p className="text-sm text-gray-600">by {item.seller.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{item.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">each</p>
                  </div>
                </div>
              ))}
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
              <p className="text-sm text-gray-600 mt-2">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Tracking Information */}
          {order.tracking && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Tracking Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tracking Number: {order.tracking.trackingNumber}</p>
                    <p className="text-sm text-gray-600">Carrier: {order.tracking.carrier}</p>
                  </div>
                  <a
                    href={order.tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    Track Package
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Order Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Order Timeline</h4>
              <div className="space-y-3">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.status}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      {event.note && (
                        <p className="text-xs text-gray-600 mt-1">{event.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4 pt-4 border-top border-gray-200">
            <button onClick={handleDownloadInvoice} className="btn-outline text-sm flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download Invoice</span>
            </button>
            
            {order.status === 'delivered' && (
              <button className="btn-outline text-sm flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Leave Review</span>
              </button>
            )}
            
            {['pending', 'confirmed'].includes(order.status) && (
              <button className="btn-danger text-sm flex items-center space-x-2">
                <XCircle className="w-4 h-4" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
