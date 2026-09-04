import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerOnlineOrder } from '../../types/store';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Printer,
  Trash2,
  PackageCheck,
  User,
  Copy,
  Check,
  Store,
  Truck,
  MapPin,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface CustomerOrdersViewProps {
  onOpenDedicatedPage?: () => void;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({
  onOpenDedicatedPage,
}) => {
  const {
    customerOrders,
    updateCustomerOrderStatus,
    deleteCustomerOrder,
    formatCurrency,
    settings,
    refreshCloudData,
    dbStatus,
    lastSyncedAt,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | CustomerOnlineOrder['status']>('all');
  const [selectedTypeTab, setSelectedTypeTab] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCloudData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const safeOrders = customerOrders || [];

  // Status counts
  const counts = useMemo(() => {
    return {
      all: safeOrders.length,
      pending: safeOrders.filter((o) => o.status === 'pending').length,
      preparing: safeOrders.filter((o) => o.status === 'preparing').length,
      ready: safeOrders.filter((o) => o.status === 'ready').length,
      completed: safeOrders.filter((o) => o.status === 'completed').length,
      cancelled: safeOrders.filter((o) => o.status === 'cancelled').length,
    };
  }, [safeOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return safeOrders.filter((o) => {
      const matchesStatus = selectedStatusTab === 'all' || o.status === selectedStatusTab;
      const matchesType = selectedTypeTab === 'all' || o.fulfillmentType === selectedTypeTab;

      const q = searchQuery.toLowerCase().trim();
      const codeMatch = (o.orderCode || o.orderNumber || '').toLowerCase().includes(q);
      const nameMatch = (o.customerName || '').toLowerCase().includes(q);
      const locMatch = (o.deliveryLocation || '').toLowerCase().includes(q);
      const itemMatch = o.items.some((i) => i.productName.toLowerCase().includes(q));

      const matchesSearch = !q || codeMatch || nameMatch || locMatch || itemMatch;

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [safeOrders, selectedStatusTab, selectedTypeTab, searchQuery]);

  const handleCopyOrder = (order: CustomerOnlineOrder) => {
    const code = order.orderCode || order.orderNumber;
    let text = `📦 CUSTOMER ORDER #${code}\n`;
    text += `Customer: ${order.customerName}\n`;
    text += `Type: ${order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pick Up Myself'}\n`;
    if (order.fulfillmentType === 'delivery' && order.deliveryLocation) {
      text += `Address: ${order.deliveryLocation}\n`;
    }
    text += `Status: ${order.status.toUpperCase()}\n`;
    text += `\nITEMS:\n`;
    order.items.forEach((it) => {
      text += `- ${it.productName} x ${it.quantity} ${it.unit}\n`;
    });
    if (order.totalAmount) {
      text += `Total: £${order.totalAmount.toFixed(2)}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    });
  };

  const handlePrintOrder = (order: CustomerOnlineOrder) => {
    const code = order.orderCode || order.orderNumber;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${code}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; color: #111; }
            h2 { margin: 0 0 5px 0; text-align: center; }
            .meta { font-size: 12px; margin-bottom: 15px; border-bottom: 1px dashed #666; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
            .total { font-weight: bold; border-top: 1px dashed #666; padding-top: 8px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h2>${settings.storeName || 'Top Fruit & Veg'}</h2>
          <div style="text-align: center; font-size: 11px; margin-bottom: 10px;">Brixton Market Pitch 18 Pope's Road</div>
          <div class="meta">
            <div><strong>ORDER CODE:</strong> ${code}</div>
            <div><strong>CUSTOMER:</strong> ${order.customerName}</div>
            <div><strong>TYPE:</strong> ${order.fulfillmentType === 'delivery' ? 'DELIVERY' : 'PICK UP MYSELF'}</div>
            ${order.deliveryLocation ? `<div><strong>ADDRESS:</strong> ${order.deliveryLocation}</div>` : ''}
            <div><strong>DATE:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <div>
            <strong>ITEMS:</strong>
            ${order.items.map((i) => `<div class="item"><span>${i.productName}</span><span>${i.quantity} ${i.unit}</span></div>`).join('')}
          </div>
          ${order.totalAmount ? `<div class="total item"><span>TOTAL:</span><span>£${order.totalAmount.toFixed(2)}</span></div>` : ''}
          <div style="text-align: center; margin-top: 20px; font-size: 11px;">Thank you for shopping local!</div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getStatusBadge = (status: CustomerOnlineOrder['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" /> Pending Review
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-sky-100 text-sky-900 border border-sky-300 inline-flex items-center gap-1">
            <PackageCheck className="w-3 h-3 text-sky-700" /> Packing Order
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Ready
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-800 border border-slate-300 inline-flex items-center gap-1">
            <Check className="w-3 h-3 text-slate-600" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-700" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Orders</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              {safeOrders.length} Total
            </span>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time Live Sync</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live orders submitted by customers from any phone or PC {lastSyncedAt ? `(Synced at ${lastSyncedAt})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Force refresh orders from Cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Orders'}</span>
          </button>

          {onOpenDedicatedPage && (
            <button
              onClick={onOpenDedicatedPage}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <span>Open Dedicated Orders Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatusTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedStatusTab === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setSelectedStatusTab('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedStatusTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setSelectedStatusTab('preparing')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedStatusTab === 'preparing'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Packing ({counts.preparing})
        </button>
        <button
          onClick={() => setSelectedStatusTab('ready')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedStatusTab === 'ready'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Ready ({counts.ready})
        </button>
        <button
          onClick={() => setSelectedStatusTab('completed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedStatusTab === 'completed'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Completed ({counts.completed})
        </button>
        <button
          onClick={() => setSelectedStatusTab('cancelled')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedStatusTab === 'cancelled'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Cancelled ({counts.cancelled})
        </button>
      </div>

      {/* Search & Type Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order Code (e.g. FR-4821), Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 focus:bg-white font-medium"
          />
        </div>

        <div className="flex items-center bg-slate-50 p-1 border border-slate-200 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setSelectedTypeTab('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              selectedTypeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setSelectedTypeTab('pickup')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              selectedTypeTab === 'pickup' ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pickup</span>
          </button>
          <button
            onClick={() => setSelectedTypeTab('delivery')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              selectedTypeTab === 'delivery' ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivery</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-2">
          <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Customer Orders Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {safeOrders.length === 0
              ? 'New orders placed by customers through the storefront will instantly appear here in real-time.'
              : 'Try changing your search keywords or status filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const code = order.orderCode || order.orderNumber;
            const isPickup = order.fulfillmentType === 'pickup';

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                {/* Header */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-sm font-black px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-slate-900 shadow-2xs tracking-wide">
                      {code}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        isPickup
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-sky-50 text-sky-800 border border-sky-200'
                      }`}
                    >
                      {isPickup ? (
                        <>
                          <Store className="w-3.5 h-3.5 text-emerald-600" /> Pick Up Myself
                        </>
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5 text-sky-600" /> Delivery
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Customer Name
                      </span>
                      <span className="font-black text-slate-900 text-sm">{order.customerName}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        {isPickup ? 'Collection Point' : 'Delivery Address'}
                      </span>
                      {isPickup ? (
                        <span className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          Pitch 18 Pope's Road, Brixton Market
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900 text-xs flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                          <span className="break-words">{order.deliveryLocation || 'Address not specified'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Produce Items */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Reserved Produce ({order.totalItems || order.items.length} items)</span>
                      {order.totalAmount !== undefined && (
                        <span className="text-emerald-800 font-black">
                          Est: {formatCurrency(order.totalAmount)}
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 space-y-1 max-h-36 overflow-y-auto">
                      {order.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs text-slate-700"
                        >
                          <span className="font-medium">• {it.productName}</span>
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'preparing')}
                        className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>Pack</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'ready')}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ready</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'completed')}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    )}

                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'cancelled')}
                        className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Fulfilled
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 ml-auto">
                    <button
                      onClick={() => handleCopyOrder(order)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Copy order details"
                    >
                      {copiedOrderId === order.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>

                    <button
                      onClick={() => handlePrintOrder(order)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Print order slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {deletingOrderId === order.id ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => deleteCustomerOrder(order.id)}
                          className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingOrderId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingOrderId(order.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors cursor-pointer"
                        title="Delete order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
