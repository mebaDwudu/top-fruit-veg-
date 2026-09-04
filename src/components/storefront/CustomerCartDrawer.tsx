import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
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
  onTrackOrder?: (orderCode: string) => void;
}

export const CustomerCartDrawer: React.FC<CustomerCartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearBag,
  onTrackOrder,
}) => {
  const { formatCurrency, settings, addCustomerOrder, customerOrders, products } = useStore();
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<CustomerOnlineOrder | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent background scrolling and interaction when order screen is open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      };
    }
  }, [isOpen]);

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

    // 3rd Requirement: check if fruit is out of stock - do not accept order!
    for (const item of items) {
      const liveProduct = products.find((p) => p.id === item.product.id);
      if (!liveProduct || liveProduct.stock <= 0) {
        setSubmitError(`"${item.product.name}" is currently out of stock. Please remove it from your basket.`);
        return;
      }
      if (item.quantity > liveProduct.stock) {
        setSubmitError(`Only ${liveProduct.stock} ${liveProduct.unit || 'unit(s)'} of "${item.product.name}" available in stock. Please adjust quantity.`);
        return;
      }
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
    <div
      className="fixed inset-0 z-50 w-full h-full min-h-screen bg-slate-100 flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-200"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Full Screen Top Navigation Bar */}
      <header className="sticky top-0 z-20 bg-emerald-900 text-white px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 border-b border-emerald-800 shadow-md shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <button
            onClick={handleCloseAndReset}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 hover:text-white transition-all text-xs sm:text-sm font-bold shadow-xs cursor-pointer border border-emerald-700/60 shrink-0 active:scale-95"
            title="Return to Produce Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Produce</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div className="h-6 w-px bg-emerald-700/60 shrink-0" />
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-bold shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-sm sm:text-base text-white tracking-tight leading-tight truncate">
                Place Your Order
              </h2>
              <p className="text-[11px] text-emerald-200 font-medium truncate">
                Top Fruit and Veg • Pitch 18 Brixton Market
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800/80 text-emerald-200 text-xs font-semibold rounded-full border border-emerald-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in order</span>
          </span>
          <button
            onClick={handleCloseAndReset}
            className="p-2 text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
            aria-label="Close order screen"
            title="Close order screen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Content Area */}
      <main className="flex-1 overflow-y-auto overscroll-contain bg-slate-100 p-4 sm:p-6 lg:p-8">

        {/* 1. ORDER SUCCESS SCREEN (FULL SCREEN CENTERED CARD) */}
        {submittedOrder ? (
          <div className="max-w-xl mx-auto my-4 sm:my-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Order placed successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your order has been recorded in our Pitch 18 Brixton system.
              </p>
            </div>
            
            {/* Prominent Order Code Badge */}
            <div className="inline-flex flex-col items-center justify-center px-8 py-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Your Order Code
              </span>
              <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-950 tracking-wider mt-0.5">
                {submittedOrder.orderCode || submittedOrder.orderNumber}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {submittedOrder.fulfillmentType === 'delivery'
                ? `Your delivery order has been received. We will deliver to: ${submittedOrder.deliveryLocation || 'your specified address'}.`
                : `Your order is reserved at Pitch 18 Pope's Road, Brixton Market. Please quote order code ${submittedOrder.orderCode || submittedOrder.orderNumber} upon collection.`}
            </p>

            {/* Order summary details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs text-left">
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
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  const code = submittedOrder.orderCode || submittedOrder.orderNumber;
                  handleCloseAndReset();
                  if (onTrackOrder) {
                    onTrackOrder(code);
                  }
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md"
              >
                <Truck className="w-4 h-4" />
                <span>Track</span>
              </button>

              <button
                onClick={handleCopyOrder}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              >
                {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-700" />}
                <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleCloseAndReset}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* 2. EMPTY STATE SCREEN */
          <div className="max-w-md mx-auto my-12 sm:my-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-md text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="font-black text-slate-900 text-lg mb-1">Your Basket is Empty</h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
              Browse fresh fruits, vegetables, yams, and plantains at Brixton Market and add items to place your order.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md transition-colors cursor-pointer"
            >
              Explore
            </button>
          </div>
        ) : (
          /* 3. ACTIVE BASKET & CHECKOUT (FULL-SCREEN RESPONSIVE LAYOUT) */
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* LEFT COLUMN: FULFILLMENT & CUSTOMER DETAILS (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Fulfillment Method Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 text-sm font-black text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
                    <h3>How do you want to receive your produce?</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pick Up Myself */}
                    <button
                      type="button"
                      onClick={() => {
                        setFulfillmentType('pickup');
                        setAddressError(null);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        fulfillmentType === 'pickup'
                          ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${fulfillmentType === 'pickup' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          <Store className="w-5 h-5" />
                        </div>
                        {fulfillmentType === 'pickup' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-black">Pick Up Myself</div>
                        <div className="text-xs text-slate-500 mt-0.5">Collect at Pitch 18 Pope's Road, Brixton</div>
                      </div>
                    </button>

                    {/* Delivery */}
                    <button
                      type="button"
                      onClick={() => {
                        setFulfillmentType('delivery');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        fulfillmentType === 'delivery'
                          ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${fulfillmentType === 'delivery' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        {fulfillmentType === 'delivery' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-black">Delivery</div>
                        <div className="text-xs text-slate-500 mt-0.5">We deliver fresh to your address</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Customer Details Form */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 text-sm font-black text-slate-900">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">2</span>
                    <h3>{fulfillmentType === 'pickup' ? 'Your Contact Information' : 'Delivery Details'}</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Customer Name Field */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Customer Full Name <span className="text-rose-600 font-black">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (nameError) setNameError(null);
                        }}
                        onBlur={() => {
                          window.scrollTo({ top: window.scrollY, behavior: 'instant' });
                        }}
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-base sm:text-sm outline-hidden font-medium transition-colors ${
                          nameError
                            ? 'border-rose-400 focus:border-rose-600 bg-rose-50/40 text-slate-900'
                            : 'border-slate-300 focus:border-emerald-600 focus:bg-white'
                        }`}
                        required
                      />
                      {nameError && (
                        <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {nameError}
                        </p>
                      )}
                    </div>

                    {/* Delivery Address (if delivery selected) */}
                    {fulfillmentType === 'delivery' && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Delivery Street Address <span className="text-rose-600 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Flat 3, 42 Atlantic Road, Brixton, SW9 8GW"
                          value={deliveryAddress}
                          onChange={(e) => {
                            setDeliveryAddress(e.target.value);
                            if (addressError) setAddressError(null);
                          }}
                          onBlur={() => {
                            window.scrollTo({ top: window.scrollY, behavior: 'instant' });
                          }}
                          className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-base sm:text-sm outline-hidden font-medium transition-colors ${
                            addressError
                              ? 'border-rose-400 focus:border-rose-600 bg-rose-50/40 text-slate-900'
                              : 'border-slate-300 focus:border-emerald-600 focus:bg-white'
                          }`}
                          required
                        />
                        {addressError && (
                          <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            {addressError}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Market Location Info Notice */}
                    <div className="flex items-start space-x-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800">
                          {fulfillmentType === 'delivery' ? 'Direct Market Delivery' : 'Brixton Market Stall Collection'}
                        </span>
                        <p className="text-slate-500 text-[11px]">
                          {fulfillmentType === 'delivery'
                            ? 'Orders are prepared fresh at Brixton Market and delivered to your designated address.'
                            : 'Collect directly at Pitch 18 Pope\'s Road, Brixton Market. Payment can be settled upon collection.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: BASKET ITEMS REVIEW & PLACE ORDER (5 cols on lg) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Basket Items Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm font-black text-slate-900">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">3</span>
                      <h3>Review Items ({totalItemsCount})</h3>
                    </div>
                    <button
                      onClick={onClearBag}
                      className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Clear basket
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {items.map((item) => {
                      const liveProd = products.find((p) => p.id === item.product.id) || item.product;
                      const isItemOutOfStock = liveProd.stock <= 0;
                      const isItemOverStock = item.quantity > liveProd.stock;

                      return (
                      <div
                        key={item.product.id}
                        className={`p-3 border rounded-2xl flex items-center justify-between gap-3 ${
                          isItemOutOfStock ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'
                        }`}
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
                            {isItemOutOfStock ? (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                                Out of stock
                              </span>
                            ) : isItemOverStock ? (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                                Only {liveProd.stock} left in stock
                              </span>
                            ) : null}
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
                                Math.min(liveProd.stock, item.quantity + 1)
                              )
                            }
                            disabled={isItemOutOfStock || item.quantity >= liveProd.stock}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
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
                    );
                    })}
                  </div>

                  {/* Summary & Submit Action */}
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    {showPrices && (
                      <div className="flex items-center justify-between text-slate-800">
                        <span className="text-sm font-bold">Estimated Total:</span>
                        <span className="text-2xl font-black text-emerald-800">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    )}

                    {items.some((it) => {
                      const lp = products.find((x) => x.id === it.product.id);
                      return !lp || lp.stock <= 0;
                    }) && (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-center space-x-2 text-rose-800 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Some items in your basket are out of stock. Please remove them before placing order.</span>
                      </div>
                    )}

                    {submitError && (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-center space-x-2 text-rose-800 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <button
                      id="btn-place-customer-order"
                      onClick={handlePlaceOrder}
                      disabled={
                        isSubmitting ||
                        items.some((it) => {
                          const lp = products.find((x) => x.id === it.product.id);
                          return !lp || lp.stock <= 0;
                        })
                      }
                      className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-sm font-black flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting...' : 'Order'}</span>
                    </button>

                    <p className="text-center text-[11px] text-slate-500 font-medium">
                      🔒 No upfront online payment required. Pay when you collect or upon delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

