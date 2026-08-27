import React, { useState } from 'react';
import { Product, CustomerOnlineOrder } from '../../types/store';
import { useStore } from '../../context/StoreContext';
import { sanitizeText, sanitizePhone } from '../../utils/sanitize';
import {
  X,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ShoppingBag,
  Send,
  ArrowRight,
  AlertCircle,
  Store,
} from 'lucide-react';

export interface CustomerCartItem {
  product: Product;
  quantity: number;
}

interface CustomerCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CustomerCartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearBag: () => void;
}

export const CustomerCartDrawer: React.FC<CustomerCartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearBag,
}) => {
  const { formatCurrency, settings, addCustomerOrder } = useStore();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<CustomerOnlineOrder | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const showPrices = settings.showPricesToCustomers ?? false;
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  const marketPhone = settings.storePhone || '+44 7449 338679';

  // Construct structured text summary for WhatsApp or Clipboard
  const generateOrderText = (orderNum?: string) => {
    const cleanName = sanitizeText(customerName, 80);
    const cleanPhone = sanitizePhone(customerPhone);
    const cleanNote = sanitizeText(pickupNote, 300);

    let text = `🛒 *NEW ORDER / CLICK & COLLECT INQUIRY*`;
    if (orderNum) text += ` (${orderNum})`;
    text += `\n*Stall:* ${settings.storeName || 'Top Fruit and Veg'}\n`;
    text += `*Location:* Pitch 18 Brixton Market Pope's Road London SW9\n\n`;

    if (cleanName) {
      text += `👤 *Customer:* ${cleanName}\n`;
    }
    if (cleanPhone) {
      text += `📞 *Phone:* ${cleanPhone}\n`;
    }
    if (cleanNote) {
      text += `📝 *Pickup Note:* ${cleanNote}\n`;
    }

    text += `\n*ITEMS ORDERED:*\n`;
    items.forEach((item, index) => {
      text += `${index + 1}. ${item.product.name} x ${item.quantity} ${item.product.unit || 'item'}`;
      if (showPrices) {
        text += ` @ £${item.product.sellingPrice.toFixed(2)} = £${(item.product.sellingPrice * item.quantity).toFixed(2)}`;
      }
      text += `\n`;
    });

    if (showPrices) {
      text += `\n*TOTAL ESTIMATE:* £${totalAmount.toFixed(2)}\n`;
    }
    text += `*Collection Point:* Pitch 18 Pope's Road, Brixton Market\n`;
    text += `Thank you!`;
    return text;
  };

  // Direct submit to Admin orders list
  const handleSendOrderToAdmin = () => {
    if (items.length === 0) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `ORD-${randomSuffix}`;

      const newOrder: CustomerOnlineOrder = {
        id: `cust_order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        orderNumber,
        customerName: sanitizeText(customerName.trim() || 'Walk-in Customer', 80),
        customerPhone: sanitizePhone(customerPhone.trim() || 'Not provided'),
        pickupTime: sanitizeText(pickupNote.trim() || 'Today at Pitch 18', 200),
        notes: sanitizeText(pickupNote.trim(), 400),
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          unit: i.product.unit || 'kg',
          category: i.product.category,
          image: i.product.image,
        })),
        totalItems: totalItemsCount,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      addCustomerOrder(newOrder);
      setSubmittedOrder(newOrder);
      setIsSubmitting(false);
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to submit order. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppSend = () => {
    const text = generateOrderText(submittedOrder?.orderNumber);
    const cleanPhone = marketPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyOrder = async () => {
    const text = generateOrderText(submittedOrder?.orderNumber);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    }
  };

  const handleCloseAndReset = () => {
    if (submittedOrder) {
      onClearBag();
      setSubmittedOrder(null);
      setCustomerName('');
      setCustomerPhone('');
      setPickupNote('');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-slate-900 border-l border-slate-200 animate-in slide-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-900/10 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-white">
                Customer Order List
              </h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} for Pitch 18 collection
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseAndReset}
            className="p-2 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ORDER SUCCESS SCREEN */}
        {submittedOrder ? (
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="text-center space-y-3 pt-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto shadow-sm animate-in zoom-in-90 duration-300">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Order Sent to Stall Admin!
              </h3>
              <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-full font-mono text-xs font-black text-emerald-900">
                {submittedOrder.orderNumber}
              </div>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Your order list has been received by the Admin Portal at Pitch 18. Our team will pack and reserve your fresh produce for collection.
              </p>
            </div>

            {/* Summary details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="font-bold text-slate-900">{submittedOrder.customerName}</span>
              </div>
              {submittedOrder.customerPhone && (
                <div className="flex justify-between text-slate-600">
                  <span>Phone:</span>
                  <span className="font-bold text-slate-900">{submittedOrder.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Collection:</span>
                <span className="font-bold text-emerald-800">Pitch 18 Brixton Market</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Reserved Produce:</span>
                <div className="space-y-1">
                  {submittedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>• {it.productName}</span>
                      <span className="font-bold text-slate-900">{it.quantity} {it.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional WhatsApp button & Done */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleWhatsAppSend}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Also Notify Stall on WhatsApp</span>
              </button>

              <button
                onClick={handleCopyOrder}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copiedSummary ? 'Order Copied to Clipboard!' : 'Copy Order Text'}</span>
              </button>

              <button
                onClick={handleCloseAndReset}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Done & Return to Stall
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mb-3 text-slate-400">
              🛒
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-1">Your Order List is Empty</h4>
            <p className="text-xs text-slate-500 max-w-xs mb-6">
              Browse fresh fruits, vegetables, yams, and plantains at Brixton Market and add items to reserve.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition-colors cursor-pointer"
            >
              Explore Fresh Produce
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Items list */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 px-1">
                <span>Selected Items ({totalItemsCount})</span>
                <span className="text-emerald-700">Fresh Daily</span>
              </div>

              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xl">🥬</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-emerald-800 font-bold">
                        {item.quantity} {item.product.unit || 'unit'}
                        {showPrices && (
                          <span className="text-slate-500 font-normal ml-1.5">
                            (£{item.product.sellingPrice.toFixed(2)}/unit)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-1 shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateQuantity(
                          item.product.id,
                          Math.min(item.product.stock, item.quantity + 1)
                        )
                      }
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total (if prices enabled) & Remove */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    {showPrices && (
                      <span className="font-black text-xs text-slate-900 block">
                        {formatCurrency(item.product.sellingPrice * item.quantity)}
                      </span>
                    )}
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Bag Button */}
            <div className="flex justify-end">
              <button
                onClick={onClearBag}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear list
              </button>
            </div>

            {/* Customer Details Form */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-emerald-950">
                <Store className="w-4 h-4 text-emerald-700" />
                <span>Customer & Collection Info</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Your Name (Optional / Recommended):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah K."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Contact Phone (Optional):
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 07911 123456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Pickup Time / Special Note:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Collecting around 3:30pm today"
                  value={pickupNote}
                  onChange={(e) => setPickupNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-center space-x-2 text-rose-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        )}

        {/* Drawer Footer Buttons */}
        {!submittedOrder && items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            {showPrices && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Estimated Total:</span>
                <span className="text-xl font-black text-emerald-800">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Collect & pay at <strong>Pitch 18 Brixton Market</strong></span>
            </div>

            {/* Main Order Buttons */}
            <div className="space-y-2">
              <button
                id="btn-send-order-admin"
                onClick={handleSendOrderToAdmin}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending Order...' : 'Send Order to Admin'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleWhatsAppSend}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyOrder}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedSummary ? 'Copied!' : 'Copy List'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
