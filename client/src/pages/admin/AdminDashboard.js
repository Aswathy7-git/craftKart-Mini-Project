import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { adminAPI } from '../../services/api';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);

  const { data: dashboardData, isLoading } = useQuery(
    'admin-dashboard',
    () => adminAPI.getDashboard(),
    {
      select: (data) => data.data
    }
  );

  const stats = dashboardData?.stats || {};
  const recentOrders = dashboardData?.recentOrders || [];
  const salesData = dashboardData?.salesData || [];

  // Fetch a small list of latest users for overview
  const { data: usersLite } = useQuery(
    ['admin-users-lite', { limit: 10 }],
    async () => {
      const res = await adminAPI.getUsers({ page: 1, limit: 10, sort: '-createdAt' });
      return res.data;
    }
  );
  const users = usersLite?.users || usersLite?.items || [];
  const usersTotal = usersLite?.total || usersLite?.count || stats.totalUsers || 0;

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers || 0,
      change: 12.5,
      changeType: 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      name: 'Total Sellers',
      value: stats.totalSellers || 0,
      change: 8.3,
      changeType: 'positive',
      icon: Users,
      color: 'green'
    },
    {
      name: 'Total Products',
      value: stats.totalProducts || 0,
      change: 15.2,
      changeType: 'positive',
      icon: Package,
      color: 'purple'
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders || 0,
      change: 22.1,
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'orange'
    },
    {
      name: 'Pending Products',
      value: stats.pendingProducts || 0,
      change: -5.2,
      changeType: 'negative',
      icon: Clock,
      color: 'yellow'
    },
    {
      name: 'Pending Sellers',
      value: stats.pendingSellers || 0,
      change: -12.8,
      changeType: 'negative',
      icon: AlertCircle,
      color: 'red'
    },
    {
      name: 'Monthly Revenue',
      value: formatINR(stats.monthlyRevenue || 0),
      change: 18.7,
      changeType: 'positive',
      icon: DollarSign,
      color: 'emerald'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      emerald: 'bg-emerald-100 text-emerald-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  // Map backend status to display label and badge classes
  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return { label: 'delivered', classes: 'bg-green-100 text-green-800' };
      case 'shipped':
        return { label: 'shipped', classes: 'bg-blue-100 text-blue-800' };
      case 'pending':
        // Show as 'ordered' instead of 'pending'
        return { label: 'ordered', classes: 'bg-indigo-100 text-indigo-800' };
      default:
        return { label: status || '—', classes: 'bg-gray-100 text-gray-800' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="shimmer h-8 w-48 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(7)].map((_, index) => (
                <div key={index} className="card p-6">
                  <div className="shimmer h-20 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Users Overview */}
        <div className="mt-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Users Overview</h2>
              <div className="text-sm text-gray-600">Total users: <span className="font-medium">{usersTotal}</span></div>
            </div>
            {users.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {users.map((u) => (
                  <div key={u._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{u.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-600">{u.email}</div>
                    </div>
                    <span className="text-xs text-gray-500">{u.role || 'user'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No users to display.</div>
            )}
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor and manage your CraftKart platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change > 0 ? '+' : ''}{stat.change}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <a href="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View all
              </a>
            </div>

            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.user?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatINR(order.pricing?.total || 0)}</p>
                      {(() => {
                        const b = getOrderStatusBadge(order.status);
                        return (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${b.classes}`}>
                            {b.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent orders</h3>
                <p className="text-gray-600">Orders will appear here as they come in</p>
              </div>
            )}
          </div>

          {/* Sales Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Sales Overview</h2>
            
            {salesData.length > 0 ? (
              <div>
                {(() => {
                  const points = salesData.slice(-6); // last 6 buckets
                  const maxVal = Math.max(1, ...points.map(p => Number(p.revenue || 0)));
                  const barWidth = 40;
                  const gap = 20;
                  const height = 160;
                  const width = points.length * (barWidth + gap) + gap;
                  return (
                    <div className="w-full overflow-x-auto">
                      <svg width={width} height={height + 40}>
                        {points.map((p, i) => {
                          const val = Number(p.revenue || 0);
                          const h = Math.round((val / maxVal) * height);
                          const x = gap + i * (barWidth + gap);
                          const y = height - h + 10;
                          const label = new Date(p._id.year, p._id.month - 1).toLocaleDateString('en-US', { month: 'short' });
                          return (
                            <g key={i}>
                              <rect x={x} y={y} width={barWidth} height={h} rx="6" className="fill-primary-500 opacity-90" />
                              <text x={x + barWidth / 2} y={height + 28} textAnchor="middle" className="fill-gray-600 text-xs">
                                {label}
                              </text>
                              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="fill-gray-900 text-xs font-medium">
                                {formatINR(val)}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sales data</h3>
                <p className="text-gray-600">Sales data will appear here over time</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/admin/users"
                className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Manage Users</div>
                  <div className="text-sm text-gray-600">View and manage user accounts</div>
                </div>
              </a>

              <a
                href="/admin/products"
                className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
              >
                <Package className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Manage Products</div>
                  <div className="text-sm text-gray-600">Approve and manage products</div>
                </div>
              </a>

              <a
                href="/admin/orders"
                className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
              >
                <ShoppingCart className="w-6 h-6 text-purple-600" />
                <div>
                  <div className="font-medium text-gray-900">View Orders</div>
                  <div className="text-sm text-gray-600">Monitor and manage orders</div>
                </div>
              </a>

              <a
                href="/admin/analytics"
                className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200"
              >
                <BarChart3 className="w-6 h-6 text-orange-600" />
                <div>
                  <div className="font-medium text-gray-900">Analytics</div>
                  <div className="text-sm text-gray-600">View detailed reports</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="mt-8">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">System Alerts</h2>
            
            <div className="space-y-4">
              {stats.pendingSellers > 0 && (
                <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      {stats.pendingSellers} seller(s) waiting for approval
                    </p>
                    <p className="text-sm text-yellow-700">
                      Review and approve pending seller applications
                    </p>
                  </div>
                  <a
                    href="/admin/sellers"
                    className="ml-auto btn-outline text-sm"
                  >
                    Review
                  </a>
                </div>
              )}

              {stats.pendingProducts > 0 && (
                <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">
                      {stats.pendingProducts} product(s) waiting for approval
                    </p>
                    <p className="text-sm text-blue-700">
                      Review and approve pending product listings
                    </p>
                  </div>
                  <a
                    href="/admin/products"
                    className="ml-auto btn-outline text-sm"
                  >
                    Review
                  </a>
                </div>
              )}

              {stats.pendingSellers === 0 && stats.pendingProducts === 0 && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">All caught up!</p>
                    <p className="text-sm text-green-700">
                      No pending approvals at this time
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
