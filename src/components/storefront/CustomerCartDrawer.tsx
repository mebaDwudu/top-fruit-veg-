import React, { useState } from 'react';
import { Product, CustomerOnlineOrder } from '../../types/store';
import { useStore } from '../../context/StoreContext';
import { sanitizeText } from '../../utils/sanitize';
import {
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ShoppingBag,
  Send,
  AlertCircle,
  Store,
  Truck,
  User,
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
  const { formatCurrency, settings, addCustomerOrder, customerOrders } = useStore();
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<CustomerOnlineOrder | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const showPrices = settings.showPricesToCustomers ?? false;
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  // Construct structured text summary for Clipboard
  const generateOrderText = (orderCode?: string) => {
    const cleanName = sanitizeText(customerName, 80) || 'Customer';
    const cleanAddress = sanitizeText(deliveryAddress, 200);

    let text = `🛒 *NEW ORDER (${orderCode || 'FR-0000'})*`;
    text += `\n*Stall:* ${settings.storeName || 'Top Fruit and Veg'}\n`;
    text += `*Location:* Pitch 18 Brixton Market Pope's Road London SW9\n\n`;
    text += `👤 *Customer Name:* ${cleanName}\n`;
    text += `📦 *Fulfillment:* ${fulfillmentType === 'delivery' ? '🚚 Delivery' : '🏪 Pick Up Myself'}\n`;
    if (fulfillmentType === 'delivery' && cleanAddress) {
      text += `📍 *Delivery Address:* ${cleanAddress}\n`;
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
    if (fulfillmentType === 'pickup') {
      text += `*Collection Point:* Pitch 18 Pope's Road, Brixton Market\n`;
    }
    text += `Thank you!`;
    return text;
  };

  // Generate unique order code (FR-XXXX) ensuring no collision with existing orders
  const generateUniqueOrderCode = (): string => {
    const existingCodes = new Set(
      customerOrders.map((o) => (o.orderCode || o.orderNumber || '').toUpperCase())
    );
    let code = '';
    let attempts = 0;
    do {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      code = `FR-${randNum}`;
      attempts++;
    } while (existingCodes.has(code) && attempts < 200);
    return code;
  };

  // Direct submit to Firestore with unique Order Code
  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    
    // Clear previous errors
    setNameError(null);
    setAddressError(null);
    setSubmitError(null);

    const trimmedName = customerName.trim();
    const trimmedAddress = deliveryAddress.trim();

    let hasValidationError = false;

    // Validate Customer Name (Required for both Pickup and Delivery)
    if (!trimmedName) {
      setNameError('Please enter your name.');
      hasValidationError = true;
    }

    // Validate Delivery Address (Required for Delivery)
    if (fulfillmentType === 'delivery' && !trimmedAddress) {
      setAddressError('Please enter your delivery address.');
      hasValidationError = true;
    }

    if (hasValidationError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const orderCode = generateUniqueOrderCode();

      const newOrder = addCustomerOrder({
        orderCode,
        customerName: sanitizeText(trimmedName, 80),
        customerPhone: 'Not provided',
        fulfillmentType,
        deliveryLocation: fulfillmentType === 'delivery' ? sanitizeText(trimmedAddress, 200) : undefined,
        pickupTime: fulfillmentType === 'pickup' ? 'Pitch 18 Collection' : undefined,
        notes: '',
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
      });

      setSubmittedOrder(newOrder);
      setIsSubmitting(false);
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to submit order. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCopyOrder = async () => {
    const text = generateOrderText(submittedOrder?.orderCode || submittedOrder?.orderNumber);
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
      setDeliveryAddress('');
      setNameError(null);
      setAddressError(null);
      setSubmitError(null);
      setFulfillmentType('pickup');
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
                Customer Order Basket
              </h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} ready to order
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseAndReset}
            className="p-2 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
            aria-label="Close basket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ORDER SUCCESS SCREEN */}
        {submittedOrder ? (
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="text-center space-y-3 pt-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto shadow-sm animate-in zoom-in-90 duration-300">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Order placed successfully!
              </h3>
              
              {/* Prominent Order Code Badge */}
              <div className="inline-flex flex-col items-center justify-center px-6 py-3 bg-emerald-50 border-2 border-emerald-500 rounded-2xl shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Your Order Code
                </span>
                <span className="font-mono text-3xl font-black text-emerald-950 tracking-wider">
                  {submittedOrder.orderCode || submittedOrder.orderNumber}
                </span>
              </div>

              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                {submittedOrder.fulfillmentType === 'delivery'
                  ? `Your delivery order has been received. We will deliver to: ${submittedOrder.deliveryLocation || 'your specified address'}.`
                  : `Your order is reserved at Pitch 18 Pope's Road, Brixton Market. Please quote order code ${submittedOrder.orderCode || submittedOrder.orderNumber} upon collection.`}
              </p>
            </div>

            {/* Order summary details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="font-bold text-slate-900">{submittedOrder.customerName}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Fulfillment Method:</span>
                <span className="font-bold inline-flex items-center gap-1 text-emerald-800">
                  {submittedOrder.fulfillmentType === 'delivery' ? (
                    <>
                      <Truck className="w-3.5 h-3.5" /> Delivery
                    </>
                  ) : (
                    <>
                      <Store className="w-3.5 h-3.5" /> Pick Up Myself
                    </>
                  )}
                </span>
              </div>

              {submittedOrder.fulfillmentType === 'delivery' && submittedOrder.deliveryLocation && (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Address:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[200px] break-words">
                    {submittedOrder.deliveryLocation}
                  </span>
                </div>
              )}

              {showPrices && submittedOrder.totalAmount !== undefined && (
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>Estimated Total:</span>
                  <span className="font-black text-emerald-800 text-sm">
                    {formatCurrency(submittedOrder.totalAmount)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">
                  Reserved Produce ({submittedOrder.totalItems}):
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {submittedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>• {it.productName}</span>
                      <span className="font-bold text-slate-900">{it.quantity} {it.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCopyOrder}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-2xs"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{copiedSummary ? 'Order Code & Details Copied!' : 'Copy Order Code & Summary'}</span>
              </button>

              <button
                onClick={handleCloseAndReset}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center transition-colors cursor-pointer shadow-xs"
              >
                Done & Return to Storefront
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-1">Your Basket is Empty</h4>
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
                <span>Selected Produce ({totalItemsCount})</span>
                <span className="text-emerald-700 font-semibold">Fresh Daily</span>
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
                        <Store className="w-5 h-5 text-emerald-600" />
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
                      aria-label="Decrease quantity"
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
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total & Remove */}
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

            {/* STEP 1: Choose Pick Up Myself or Delivery */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="text-xs font-black text-slate-900">
                1. How do you want to receive your order?
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Option 1: Pick Up Myself */}
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentType('pickup');
                    setAddressError(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    fulfillmentType === 'pickup'
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Store className={`w-4 h-4 ${fulfillmentType === 'pickup' ? 'text-emerald-700' : 'text-slate-500'}`} />
                    {fulfillmentType === 'pickup' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black">Pick Up Myself</div>
                    <div className="text-[10px] text-slate-500">Collect at Pitch 18</div>
                  </div>
                </button>

                {/* Option 2: Delivery */}
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentType('delivery');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    fulfillmentType === 'delivery'
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Truck className={`w-4 h-4 ${fulfillmentType === 'delivery' ? 'text-emerald-700' : 'text-slate-500'}`} />
                    {fulfillmentType === 'delivery' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black">Delivery</div>
                    <div className="text-[10px] text-slate-500">We deliver to you</div>
                  </div>
                </button>
              </div>
            </div>

            {/* STEP 2: Required Fields Form */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-emerald-950">
                <User className="w-4 h-4 text-emerald-700" />
                <span>
                  2. {fulfillmentType === 'pickup' ? 'Enter Customer Name' : 'Enter Delivery Details'}
                </span>
              </div>

              {/* Customer Name Field (Required for both) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Customer Name <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  onBlur={() => {
                    // Reset mobile viewport scroll after virtual keyboard closes
                    window.scrollTo({ top: window.scrollY, behavior: 'instant' });
                  }}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-base sm:text-sm outline-hidden font-medium transition-colors ${
                    nameError
                      ? 'border-rose-400 focus:border-rose-600 bg-rose-50/40 text-slate-900'
                      : 'border-slate-300 focus:border-emerald-600'
                  }`}
                  required
                />
                {nameError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                    {nameError}
                  </p>
                )}
              </div>

              {/* Delivery Address Field (Required for Delivery ONLY) */}
              {fulfillmentType === 'delivery' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Delivery Address <span className="text-rose-600 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your delivery address"
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      if (addressError) setAddressError(null);
                    }}
                    onBlur={() => {
                      window.scrollTo({ top: window.scrollY, behavior: 'instant' });
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-base sm:text-sm outline-hidden font-medium transition-colors ${
                      addressError
                        ? 'border-rose-400 focus:border-rose-600 bg-rose-50/40 text-slate-900'
                        : 'border-slate-300 focus:border-emerald-600'
                    }`}
                    required
                  />
                  {addressError && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                      {addressError}
                    </p>
                  )}
                </div>
              )}
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
              <span>
                {fulfillmentType === 'delivery'
                  ? 'Delivery to your specified address'
                  : 'Collect at Pitch 18 Pope\'s Road, Brixton Market'}
              </span>
            </div>

            {/* Main Submit Order Button */}
            <div>
              <button
                id="btn-place-customer-order"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Order...' : 'Place Order Now'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

