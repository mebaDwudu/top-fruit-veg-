import React, { useState } from 'react';
import { Product } from '../../types/store';
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
  const { formatCurrency, settings } = useStore();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);

  if (!isOpen) return null;

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  const marketPhone = settings.storePhone || '+44 7449 338679';

  // Construct structured text summary for WhatsApp or Clipboard
  const generateOrderText = () => {
    const cleanName = sanitizeText(customerName, 80);
    const cleanPhone = sanitizePhone(customerPhone);
    const cleanNote = sanitizeText(pickupNote, 300);

    let text = `🛒 *NEW ORDER / CLICK & COLLECT INQUIRY*\n`;
    text += `*Stall:* ${settings.storeName || 'Top Fruits and Veg (Brixton Food)'}\n`;
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
      text += `${index + 1}. ${item.product.name} x ${item.quantity} ${item.product.unit} @ £${item.product.sellingPrice.toFixed(2)} = £${(item.product.sellingPrice * item.quantity).toFixed(2)}\n`;
    });

    text += `\n*TOTAL ESTIMATE:* £${totalAmount.toFixed(2)}\n`;
    text += `*Collection Point:* Pitch 18 Pope's Road, Brixton Market\n`;
    text += `Thank you!`;
    return text;
  };

  const handleWhatsAppSend = () => {
    const text = generateOrderText();
    // Clean phone number for WhatsApp link
    const cleanPhone = marketPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setOrderSentSuccess(true);
  };

  const handleCopyOrder = async () => {
    const text = generateOrderText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-slate-900 border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-white">
                Your Market Basket
              </h3>
              <p className="text-[11px] text-emerald-400">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} ready for Pitch 18 pickup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mb-3 text-slate-400">
              🛒
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-1">Your Basket is Empty</h4>
            <p className="text-xs text-slate-500 max-w-xs mb-6">
              Browse today's fresh fruits, vegetables, yams, and plantains at Brixton Market and add items to reserve.
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
            {/* Order items list */}
            <div className="space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
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
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        {formatCurrency(item.product.sellingPrice)} / {item.product.unit}
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

                  {/* Line Total & Remove */}
                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-slate-900 block">
                      {formatCurrency(item.product.sellingPrice * item.quantity)}
                    </span>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                Clear all items
              </button>
            </div>

            {/* Pickup Details Form */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-950">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Pickup at Pitch 18 Brixton Market</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                  Your Name (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah K."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                  Phone Number (Optional):
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 07911 123456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                  Special Pickup Notes / Time:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Collecting around 3:30pm"
                  value={pickupNote}
                  onChange={(e) => setPickupNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs outline-hidden focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            {/* Success notification if sent */}
            {orderSentSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center space-x-2 text-emerald-900 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WhatsApp order inquiry generated! See you at Pitch 18!</span>
              </div>
            )}
          </div>
        )}

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            {/* Subtotal row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Estimated Total:</span>
              <span className="text-xl font-black text-emerald-800">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <p className="text-[10px] text-slate-500">
              * Payment is made upon collection at Pitch 18 Pope's Road (Cash, Card, or Contactless).
            </p>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleWhatsAppSend}
                className="py-3 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order on WhatsApp</span>
              </button>

              <button
                onClick={handleCopyOrder}
                className={`py-3 px-3.5 border rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  copiedSummary
                    ? 'bg-emerald-900 text-white border-emerald-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copy Order List</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
