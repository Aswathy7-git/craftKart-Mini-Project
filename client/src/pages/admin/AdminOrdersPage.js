import React, { useMemo, useRef } from 'react';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { 
  ShoppingCart,
  Users,
  Clock,
  Download,
} from 'lucide-react';

const AdminOrdersPage = () => {
  const { data, isLoading, error } = useQuery(
    ['admin-orders'],
    () => adminAPI.getOrders(),
    { 
      select: (res) => res?.data || {},
      onError: (err) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to load orders';
        toast.error(msg);
      }
    }
  );

  const orders = data?.orders || [];
  const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);
  const printableRef = useRef(null);

  const summary = useMemo(() => {
    const userSet = new Set();
    let totalRevenue = 0;
    let totalItems = 0;
    orders.forEach((o) => {
      if (o.user?._id) userSet.add(o.user._id);
      totalRevenue += Number(o?.pricing?.total || 0);
      totalItems += (o.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
    });
    return {
      totalOrders: orders.length,
      uniqueUsers: userSet.size,
      totalRevenue,
      totalItems,
    };
  }, [orders]);

  const handleDownloadPDF = () => {
    try {
      const content = printableRef.current?.innerHTML || '';
      const win = window.open('', 'PRINT', 'height=800,width=1000');
      if (!win) return;
      win.document.open();
      win.document.write(`<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Admin Orders Report</title>
            <style>
              html, body { height: 100%; }
              body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
              h1 { font-size: 20px; margin: 0 0 12px; }
              .muted { color: #6b7280; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
              th { background: #f9fafb; }
            </style>
          </head>
          <body>
            ${content || '<h1>Admin Orders Report</h1><div class="muted">No data to print</div>'}
            <script>
              window.onload = function(){
                setTimeout(function(){
                  window.focus();
                  window.print();
                }, 150);
              };
            <\/script>
          </body>
        </html>`);
      win.document.close();
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Orders</h1>
            <p className="text-gray-600">View what users ordered, timing, and export details</p>
          </div>
          <button onClick={handleDownloadPDF} className="btn-outline flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Orders</div>
              <div className="text-2xl font-bold text-gray-900">{summary.totalOrders}</div>
            </div>
            <ShoppingCart className="w-6 h-6 text-primary-600" />
          </div>
          <div className="card p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Unique Users</div>
              <div className="text-2xl font-bold text-gray-900">{summary.uniqueUsers}</div>
            </div>
            <Users className="w-6 h-6 text-primary-600" />
          </div>
          <div className="card p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Items</div>
              <div className="text-2xl font-bold text-gray-900">{summary.totalItems}</div>
            </div>
            <ShoppingCart className="w-6 h-6 text-primary-600" />
          </div>
          <div className="card p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Revenue</div>
              <div className="text-2xl font-bold text-gray-900">{formatINR(summary.totalRevenue)}</div>
            </div>
            <Clock className="w-6 h-6 text-primary-600" />
          </div>
        </div>

        {/* Loading / Error / Empty */}
        {isLoading && (
          <div className="card p-6 text-center text-gray-600">Loading orders…</div>
        )}
        {error && (
          <div className="card p-6 text-center">
            <div className="text-red-600 font-medium">Failed to load orders</div>
            <div className="text-sm text-gray-600 mt-1">{error?.response?.data?.message || error?.message || 'Unknown error'}</div>
          </div>
        )}
        {!isLoading && !error && orders.length === 0 && (
          <div className="card p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-600">Orders will appear here as customers purchase</p>
          </div>
        )}

        {/* Orders Table */}
        {orders.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="text-sm text-gray-600">Showing {orders.length} orders</div>
            </div>

            <div ref={printableRef} className="overflow-x-auto">
              <div className="px-4 pt-4">
                <h1>Admin Orders Report</h1>
                <div className="muted">Generated on {new Date().toLocaleString()}</div>
              </div>
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>User</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>#{o.orderNumber}</td>
                      <td>
                        <div><strong>{o.user?.name || '—'}</strong></div>
                        <div className="muted">{o.user?.email || '—'}</div>
                      </td>
                      <td>
                        {(o.items || []).map((it, idx) => (
                          <div key={idx}>
                            {it.product?.name || 'Item'} × {it.quantity || 0}
                          </div>
                        ))}
                      </td>
                      <td>{formatINR(o?.pricing?.total || 0)}</td>
                      <td className="capitalize">{o.status || '—'}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
