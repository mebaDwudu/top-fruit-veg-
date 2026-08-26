import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types/store';
import {
  Receipt,
  Search,
  RotateCcw,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  Download,
  Calendar,
  X,
  CheckCircle,
} from 'lucide-react';
import { ReceiptModal } from '../pos/ReceiptModal';

export const SalesHistory: React.FC = () => {
  const { orders, refundOrder, formatCurrency } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Receipt Modal for viewing historical receipt
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Refund confirmation modal
  const [refundTargetOrder, setRefundTargetOrder] = useState<Order | null>(null);
  const [returnToInventory, setReturnToInventory] = useState(true);

  // Summary metrics
  const safeOrders = orders || [];
  const completedOrders = safeOrders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalProfit = completedOrders.reduce((sum, o) => sum + (o.grossProfit || 0), 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return safeOrders.filter((o) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.cashierName && o.cashierName.toLowerCase().includes(term)) ||
        (o.items && o.items.some((i) => (i.productName && i.productName.toLowerCase().includes(term)) || (i.sku && i.sku.toLowerCase().includes(term))));

      const matchesPayment = paymentFilter === 'all' || o.paymentMethod === paymentFilter;
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [safeOrders, searchTerm, paymentFilter, statusFilter]);

  const handleExecuteRefund = () => {
    if (!refundTargetOrder) return;
    refundOrder(refundTargetOrder.id, returnToInventory);
    setRefundTargetOrder(null);
  };

  const handleExportCSV = () => {
    const headers = ['Order #', 'Date', 'Customer', 'Cashier', 'Payment', 'Subtotal', 'Tax', 'Grand Total', 'Profit', 'Status'];
    const rows = orders.map((o) => [
      o.orderNumber,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      `"${(o.customerName || 'Walk-in').replace(/"/g, '""')}"`,
      `"${o.cashierName.replace(/"/g, '""')}"`,
      o.paymentMethod,
      o.subtotal.toFixed(2),
      o.taxTotal.toFixed(2),
      o.grandTotal.toFixed(2),
      o.grossProfit.toFixed(2),
      o.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-100 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sales & Orders Ledger</h2>
          <p className="text-sm text-slate-500">
            Audit store transactions, receipts, profit margins, and refund requests
          </p>
        </div>

        <button
          id="export-sales-btn"
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Sales</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-slate-500 mt-1">{completedOrders.length} completed transactions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Profit</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalProfit)}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% net gross margin
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. Basket (AOV)</span>
            <Receipt className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(avgOrderValue)}</p>
          <p className="text-xs text-slate-500 mt-1">Per transaction average</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Refunds</span>
            <RotateCcw className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600">
            {orders.filter((o) => o.status === 'refunded').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Reversed orders</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order #, customer, item..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Payment Types</option>
              <option value="cash">Cash</option>
              <option value="card">Credit / Debit Card</option>
              <option value="mobile">Mobile / QR Pay</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Order Number</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Customer / Cashier</th>
                <th className="px-4 py-3.5">Items Summary</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5 text-right">Grand Total</th>
                <th className="px-4 py-3.5 text-right">Gross Profit</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Receipt / Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isRefunded = order.status === 'refunded';
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Number */}
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Customer / Cashier */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {order.customerName || 'Walk-in Customer'}
                        </p>
                        <p className="text-[10px] text-slate-400">Cashier: {order.cashierName}</p>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5">
                        <span className="text-slate-800 font-medium">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} items:
                        </span>{' '}
                        <span className="text-slate-500 truncate max-w-xs block">
                          {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 rounded-md font-medium text-[11px] text-slate-700 capitalize">
                          {order.paymentMethod === 'cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                          {order.paymentMethod === 'card' && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                          {order.paymentMethod === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-purple-600" />}
                          <span>{order.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className={`px-4 py-3.5 text-right font-bold text-sm ${isRefunded ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {formatCurrency(order.grandTotal)}
                      </td>

                      {/* Gross Profit */}
                      <td className="px-4 py-3.5 text-right font-medium text-emerald-700">
                        {isRefunded ? '-' : formatCurrency(order.grossProfit)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isRefunded
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Slip</span>
                        </button>

                        {!isRefunded && (
                          <button
                            onClick={() => setRefundTargetOrder(order)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Refund</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Historical Receipt Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />

      {/* Refund Confirmation Modal */}
      {refundTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center space-x-2 text-rose-600">
              <RotateCcw className="w-5 h-5" />
              <span>Confirm Order Refund</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to refund transaction{' '}
              <strong className="text-slate-900 font-mono">{refundTargetOrder.orderNumber}</strong> for{' '}
              <strong className="text-slate-900">{formatCurrency(refundTargetOrder.grandTotal)}</strong>?
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-5">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={returnToInventory}
                  onChange={(e) => setReturnToInventory(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Return items back into stock inventory automatically
                </span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setRefundTargetOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRefund}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Execute Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
