import React from 'react';
import { Truck, Clock, Package, Hash } from 'lucide-react';

// Props can be partial; sensible defaults used on product pages
export default function DeliveryDetails({
  estimated = '3–5 business days',
  partner = 'Standard Courier',
  status = 'Pending',
  trackingId = '',
  compact = false,
}) {
  return (
    <div className={`rounded-lg ${compact ? '' : 'card p-4'} bg-white`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Truck className="w-4 h-4" /> Delivery Details
        </h3>
      </div>
      <div className={`grid grid-cols-2 gap-3 text-sm ${compact ? '' : ''}`}>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium">Estimated</div>
            <div className="text-gray-600">{estimated}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Truck className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium">Shipping Partner</div>
            <div className="text-gray-600">{partner}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Package className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium">Status</div>
            <div className="text-gray-600">{status}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Hash className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium">Tracking ID</div>
            <div className="text-gray-600">{trackingId || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
