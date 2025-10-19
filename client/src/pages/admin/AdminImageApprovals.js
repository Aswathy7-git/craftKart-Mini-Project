import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { Image as ImageIcon, Check, X, RefreshCw } from 'lucide-react';

const AdminImageApprovals = () => {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    'admin-pending-images',
    async () => {
      const res = await adminAPI.getPendingImages();
      return res.data || { items: [] };
    }
  );

  const approveMutation = useMutation((id) => adminAPI.approveImage(id), {
    onSuccess: () => qc.invalidateQueries('admin-pending-images')
  });

  const rejectMutation = useMutation(({ id, reason }) => adminAPI.rejectImage(id, reason), {
    onSuccess: () => qc.invalidateQueries('admin-pending-images')
  });

  const pending = data?.items || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Image Approvals</h1>
            <p className="text-gray-600 mt-2">Review and approve sender images submitted by users</p>
          </div>
          <button
            onClick={() => refetch()}
            className="btn-outline flex items-center space-x-2"
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="card p-6">
            <div className="shimmer h-6 w-40 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shimmer h-56 rounded"></div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="card p-6">
            <p className="text-red-600">Failed to load pending images. Please try again.</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="card p-10 text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending images</h3>
            <p className="text-gray-600">New submissions will appear here for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pending.map((item) => (
              <div key={item._id} className="card p-4 flex flex-col">
                <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-3">
                  <img src={item.url || item.imageUrl} alt={item.user?.name || 'submission'} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Submitted by</div>
                  <div className="font-medium text-gray-900">{item.user?.name || item.userName || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{item.user?.email || item.userEmail || '—'}</div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => approveMutation.mutate(item._id)}
                    disabled={approveMutation.isLoading}
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Reason for rejection (optional):') || '';
                      rejectMutation.mutate({ id: item._id, reason });
                    }}
                    disabled={rejectMutation.isLoading}
                    className="btn-outline flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminImageApprovals;
