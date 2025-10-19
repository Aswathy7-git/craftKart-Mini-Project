import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['admin-users', { search: searchQuery, role: selectedRole, page: currentPage }],
    () => adminAPI.getUsers({ search: searchQuery, role: selectedRole, page: currentPage }),
    {
      keepPreviousData: true
    }
  );

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || {};

  const escapeCsv = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const buildCsv = (rows) => {
    const headers = [
      'Name','Email','Role','Active','Joined','Phone','Street','City','State','Zip','Country'
    ];
    const lines = [headers.join(',')];
    rows.forEach(u => {
      const addr = u.address || {};
      const line = [
        escapeCsv(u.name),
        escapeCsv(u.email),
        escapeCsv(u.role),
        escapeCsv(u.isActive ? 'Yes' : 'No'),
        escapeCsv(new Date(u.createdAt).toISOString()),
        escapeCsv(u.phone || ''),
        escapeCsv(addr.street || ''),
        escapeCsv(addr.city || ''),
        escapeCsv(addr.state || ''),
        escapeCsv(addr.zipCode || ''),
        escapeCsv(addr.country || '')
      ].join(',');
      lines.push(line);
    });
    return lines.join('\n');
  };

  const handleDownloadUsers = async () => {
    try {
      const all = [];
      let page = 1;
      // Fetch all pages with current filters
      while (true) {
        const res = await adminAPI.getUsers({ search: searchQuery, role: selectedRole, page });
        const list = res?.data?.users || [];
        const pag = res?.data?.pagination || {};
        all.push(...list);
        if (!pag.hasNext) break;
        page += 1;
      }
      if (all.length === 0) {
        toast('No users to export');
        return;
      }
      const csv = buildCsv(all);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `users-${selectedRole || 'all'}-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Users CSV downloaded');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to download users');
    }
  };

  const updateUserStatusMutation = useMutation(
    ({ userId, isActive }) => adminAPI.updateUserStatus(userId, { isActive }),
    {
      onSuccess: () => {
        toast.success('User status updated successfully');
        queryClient.invalidateQueries('admin-users');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user status');
      }
    }
  );

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'user', label: 'Users' },
    { value: 'seller', label: 'Sellers' },
    { value: 'admin', label: 'Admins' }
  ];

  const handleStatusToggle = (userId, currentStatus) => {
    updateUserStatusMutation.mutate({
      userId,
      isActive: !currentStatus
    });
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'seller':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="shimmer h-8 w-48 rounded"></div>
            <div className="card p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="shimmer w-12 h-12 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="shimmer h-4 rounded"></div>
                      <div className="shimmer h-4 w-2/3 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
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
            <p className="text-gray-600 mb-4">We couldn't load the users. Please try again.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 w-64"
                />
              </div>
              
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field w-48"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                {pagination.totalUsers} user(s) found
              </div>
              <button onClick={handleDownloadUsers} className="btn-outline flex items-center space-x-2 text-sm">
                <Download className="w-4 h-4" />
                <span>Download CSV</span>
              </button>
              <button onClick={async () => {
                try {
                  const all = [];
                  let page = 1;
                  while (true) {
                    const res = await adminAPI.getUsers({ search: searchQuery, role: selectedRole, page });
                    const list = res?.data?.users || [];
                    const pag = res?.data?.pagination || {};
                    all.push(...list);
                    if (!pag.hasNext) break;
                    page += 1;
                  }
                  if (all.length === 0) {
                    toast('No users to print');
                    return;
                  }
                  const rows = all.map((u, i) => {
                    const a = u.address || {};
                    return `<tr>
                      <td>${i + 1}</td>
                      <td>${u.name || ''}</td>
                      <td>${u.email || ''}</td>
                      <td>${u.role || ''}</td>
                      <td>${u.isActive ? 'Active' : 'Inactive'}</td>
                      <td>${new Date(u.createdAt).toLocaleString()}</td>
                      <td>${a.city || ''}</td>
                      <td>${a.state || ''}</td>
                    </tr>`;
                  }).join('');
                  const html = `<!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8" />
                        <title>Users List</title>
                        <style>
                          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
                          h1 { font-size: 20px; margin: 0 0 8px; }
                          .muted { color: #6b7280; font-size: 12px; }
                          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                          th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
                          th { background: #f9fafb; text-align: left; }
                        </style>
                      </head>
                      <body>
                        <h1>Registered Users</h1>
                        <div class="muted">Generated on ${new Date().toLocaleString()}</div>
                        <table>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Status</th>
                              <th>Joined</th>
                              <th>City</th>
                              <th>State</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${rows}
                          </tbody>
                        </table>
                        <script>
                          window.onload = function(){ setTimeout(function(){ window.print(); }, 200); };
                        <\/script>
                      </body>
                    </html>`;
                  const w = window.open('', 'USERS_PRINT', 'height=800,width=1000');
                  if (!w) return;
                  w.document.open();
                  w.document.write(html);
                  w.document.close();
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Failed to print users');
                }
              }} className="btn-outline flex items-center space-x-2 text-sm">
                <Download className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatar}
                              alt={user.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.isActive)}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          className={`p-1 ${
                            user.isActive 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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

        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {selectedUser.avatar ? (
                      <img
                        className="h-16 w-16 rounded-full"
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h4>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Role:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedUser.isActive)}`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Joined:</span>
                      <span className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</span>
                    </div>

                    {selectedUser.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm text-gray-900">{selectedUser.phone}</span>
                      </div>
                    )}

                    {selectedUser.address && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-600">Address:</span>
                          <div className="text-sm text-gray-900">
                            <p>{selectedUser.address.street}</p>
                            <p>{selectedUser.address.city}, {selectedUser.address.state} {selectedUser.address.zipCode}</p>
                            <p>{selectedUser.address.country}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedUser.businessInfo && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Business Information</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Business Name:</span> {selectedUser.businessInfo.businessName}</p>
                          <p><span className="font-medium">Type:</span> {selectedUser.businessInfo.businessType}</p>
                          {selectedUser.businessInfo.description && (
                            <p><span className="font-medium">Description:</span> {selectedUser.businessInfo.description}</p>
                          )}
                          <p><span className="font-medium">Approved:</span> 
                            <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full ${
                              selectedUser.businessInfo.isApproved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedUser.businessInfo.isApproved ? 'Yes' : 'Pending'}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleStatusToggle(selectedUser._id, selectedUser.isActive)}
                    className={`btn-primary ${
                      selectedUser.isActive 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {selectedUser.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
