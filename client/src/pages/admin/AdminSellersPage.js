import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { Users, CheckCircle, XCircle, Mail, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSellersPage = () => {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery('admin-pending-sellers', async () => {
    const res = await adminAPI.getPendingSellers();
    return res.data || { sellers: [] };
  });

  const approveMutation = useMutation(
    ({ id, approved, reason }) => adminAPI.approveSeller(id, { approved, reason }),
    {
      onSuccess: () => {
        toast.success('Seller status updated');
        qc.invalidateQueries('admin-pending-sellers');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to update');
      }
    }
  );

  const sellers = data?.sellers || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seller Approvals</h1>
            <p className="text-gray-600 mt-2">Review and approve pending seller accounts</p>
          </div>
          <button onClick={() => refetch()} className="btn-outline">Refresh</button>
        </div>

        {isLoading ? (
          <div className="card p-6">
            <div className="shimmer h-6 w-40 mb-4"></div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="shimmer h-16 rounded mb-3"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="card p-6">
            <p className="text-red-600">Failed to load sellers. Please try again.</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="card p-10 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending sellers</h3>
            <p className="text-gray-600">New seller applications will appear here.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sellers.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{s.name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Building2 className="w-4 h-4" />
                          <span>{s.businessInfo?.businessName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Mail className="w-4 h-4" />
                          <span>{s.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => approveMutation.mutate({ id: s._id, approved: true })}
                            disabled={approveMutation.isLoading}
                            className="btn-primary flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              const reason = window.prompt('Reason for rejection (optional):') || '';
                              approveMutation.mutate({ id: s._id, approved: false, reason });
                            }}
                            disabled={approveMutation.isLoading}
                            className="btn-outline flex items-center space-x-2"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
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

export default AdminSellersPage;
