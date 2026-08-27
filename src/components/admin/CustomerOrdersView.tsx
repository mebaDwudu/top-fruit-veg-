import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerOnlineOrder } from '../../types/store';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Calendar,
  Search,
  Printer,
  Trash2,
  ArrowRight,
  PackageCheck,
  User,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

export const CustomerOrdersView: React.FC = () => {
  const { customerOrders, updateCustomerOrderStatus, deleteCustomerOrder, settings } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | CustomerOnlineOrder['status']>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Status counts
  const counts = useMemo(() => {
    const pending = customerOrders.filter((o) => o.status === 'pending').length;
    const preparing = customerOrders.filter((o) => o.status === 'preparing').length;
    const ready = customerOrders.filter((o) => o.status === 'ready').length;
    const completed = customerOrders.filter((o) => o.status === 'completed').length;
    const cancelled = customerOrders.filter((o) => o.status === 'cancelled').length;
    return {
      all: customerOrders.length,
      pending,
      preparing,
      ready,
      completed,
      cancelled,
    };
  }, [customerOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return customerOrders.filter((o) => {
      const matchesStatus =
        selectedStatusTab === 'all' || o.status === selectedStatusTab;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.notes && o.notes.toLowerCase().includes(q)) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [customerOrders, selectedStatusTab, searchQuery]);

  const getStatusBadge = (status: CustomerOnlineOrder['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500 text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
            <ShoppingBag className="w-3 h-3" /> Preparing
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
            <PackageCheck className="w-3 h-3" /> Ready for Pickup
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Collected
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Cancelled
          </span>
        );
    }
  };

  const handleCopySummary = (order: CustomerOnlineOrder) => {
    const itemsList = order.items
      .map((i) => `• ${i.productName}: ${i.quantity} ${i.unit}`)
      .join('\n');
    const text = `*${settings.storeName || 'Top Fruit and Veg'} - Order ${order.orderNumber}*\nCustomer: ${order.customerName} (${order.customerPhone})\nPickup: ${order.pickupTime || 'Today'}\n\n*Items:*\n${itemsList}\n${order.notes ? `\nNotes: ${order.notes}` : ''}`;

    navigator.clipboard.writeText(text);
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handlePrintSlip = (order: CustomerOnlineOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items
      .map(
        (i) => `
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px dashed #ccc;">${i.productName}</td>
          <td style="padding: 6px 0; border-bottom: 1px dashed #ccc; text-align: right; font-weight: bold;">${i.quantity} ${i.unit}</td>
        </tr>`
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Order Slip - ${order.orderNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
            h2 { margin: 0; font-size: 16px; text-align: center; }
            p { margin: 4px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 10px; }
            .footer { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; text-align: center; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.storeName || 'TOP FRUIT AND VEG'}</h2>
            <p>Pitch 18 Pope's Road, Brixton Market</p>
            <p>Tel: ${settings.storePhone || '+44 7449 338679'}</p>
            <h3 style="margin: 8px 0;">ORDER #${order.orderNumber}</h3>
            <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
          </div>

          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Phone:</strong> ${order.customerPhone}</p>
          ${order.pickupTime ? `<p><strong>Pickup:</strong> ${order.pickupTime}</p>` : ''}
          ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}

          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left;">Item</th>
                <th style="text-align: right;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="footer">
            <p>Total Items: ${order.totalItems}</p>
            <p>Thank you for ordering at Pitch 18 Brixton Market!</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Customer Storefront Orders
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Produce reservation orders submitted by customers from the online storefront.
          </p>
        </div>

        {/* Quick Pending Alert */}
        {counts.pending > 0 && (
          <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <div>
              <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                {counts.pending} New Pending Order{counts.pending > 1 ? 's' : ''}
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Ready for stall preparation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders by Order #, Customer name, Phone, or Produce item..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Orders', count: counts.all },
            { id: 'pending', label: 'Pending', count: counts.pending, color: 'text-amber-500' },
            { id: 'preparing', label: 'Preparing', count: counts.preparing, color: 'text-blue-500' },
            { id: 'ready', label: 'Ready for Pickup', count: counts.ready, color: 'text-emerald-500' },
            { id: 'completed', label: 'Completed', count: counts.completed },
            { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatusTab === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  selectedStatusTab === tab.id
                    ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No orders found in this section
          </h3>
          <p className="text-xs text-slate-400">
            Customer reservations sent from the storefront will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const cleanPhone = order.customerPhone.replace(/[^0-9+]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
              `Hello ${order.customerName}, this is Masgana from Top Fruit and Veg Pitch 18 Brixton Market regarding your order ${order.orderNumber}.`
            )}`;

            return (
              <div
                key={order.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all shadow-xs space-y-4 ${
                  order.status === 'pending'
                    ? 'border-amber-300 dark:border-amber-900/80 bg-amber-50/10'
                    : order.status === 'ready'
                    ? 'border-emerald-300 dark:border-emerald-900/80 bg-emerald-50/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header: Order # + Status + Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-slate-900 dark:text-white tracking-wider">
                      {order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Grid: Customer Info & Items */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Customer details & Notes */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-500" />
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {order.customerName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="hover:text-emerald-600 transition-colors"
                          >
                            {order.customerPhone}
                          </a>
                        </div>

                        {order.customerPhone && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </a>
                        )}
                      </div>

                      {order.pickupTime && (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 pt-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold">Pickup Time:</span>
                          <span>{order.pickupTime}</span>
                        </div>
                      )}
                    </div>

                    {order.notes && (
                      <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                        <span className="font-extrabold uppercase text-[10px] block text-amber-700 dark:text-amber-400 mb-0.5">
                          Customer Request / Notes:
                        </span>
                        <p className="font-medium">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Ordered Items */}
                  <div className="lg:col-span-7 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                        Produce Requested ({order.totalItems} items total)
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-black text-slate-900 dark:text-white">
                              {item.productName}
                            </span>
                            {item.category && (
                              <span className="block text-[11px] text-slate-400">
                                {item.category}
                              </span>
                            )}
                          </div>

                          <div className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 font-mono font-black text-slate-900 dark:text-white">
                            {item.quantity} {item.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls / Status Changers */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Status Progression buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'preparing')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Start Packing / Preparing</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'ready')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Mark Ready for Pickup at Pitch 18</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'completed')}
                        className="px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Collected & Completed</span>
                      </button>
                    )}

                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <button
                        onClick={() => updateCustomerOrderStatus(order.id, 'cancelled')}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Utility tools: Print & Copy & Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySummary(order)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy order text"
                    >
                      {copiedOrderId === order.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handlePrintSlip(order)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Print packing slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete order ${order.orderNumber}?`)) {
                          deleteCustomerOrder(order.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
