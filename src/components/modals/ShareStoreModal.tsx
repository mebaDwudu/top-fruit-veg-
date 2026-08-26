import React, { useState } from 'react';
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Share2,
  MessageCircle,
  Store,
  X,
  Sparkles,
  ShieldCheck,
  ShoppingCart,
  Globe,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface ShareStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareStoreModal: React.FC<ShareStoreModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<'customer' | 'cashier' | 'admin'>('customer');

  if (!isOpen) return null;

  const origin = window.location.origin;

  // Dedicated webpage URLs
  const customerUrl = `${origin}/customer.html`;
  const cashierUrl = `${origin}/cashier.html`;
  const adminUrl = `${origin}/admin.html`;

  const copyUrl = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const shareText = `Check out today's fresh fruits, vegetables, yams & plantains at ${settings.storeName || 'Top Fruits and Veg'} (Pitch 18 Brixton Market Pope's Road London): ${customerUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const currentUrl =
    activePortalTab === 'customer'
      ? customerUrl
      : activePortalTab === 'cashier'
      ? cashierUrl
      : adminUrl;

  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}&color=022c22&bgcolor=ffffff&margin=8`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-black text-white tracking-tight">
            3 Dedicated Webpages & Links
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Separate standalone web pages for Customers, Cashiers, and Boss Admin
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl mb-4 text-xs font-bold">
          <button
            onClick={() => setActivePortalTab('customer')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activePortalTab === 'customer'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="truncate">1. Customer</span>
          </button>

          <button
            onClick={() => setActivePortalTab('cashier')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activePortalTab === 'cashier'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="truncate">2. Cashier</span>
          </button>

          <button
            onClick={() => setActivePortalTab('admin')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activePortalTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="truncate">3. Boss Admin</span>
          </button>
        </div>

        {/* Dynamic Card based on selected portal */}
        {activePortalTab === 'customer' && (
          <div className="space-y-4">
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 text-xs text-emerald-200">
              <div className="font-black text-emerald-300 flex items-center gap-1.5 mb-1">
                <Globe className="w-4 h-4" />
                <span>Customer Fresh Market Webpage</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Public website for Brixton shoppers. Displays live produce stock, GBP prices, recipe & origin notes, and WhatsApp Click & Collect order bag.
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center shadow-inner">
              <img
                src={qrCodeImgSrc}
                alt="Customer Webpage QR Code"
                className="w-40 h-40 rounded-xl object-contain border border-slate-100"
              />
              <span className="text-[11px] font-bold text-slate-600 mt-2 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                Scan to open customer website on phone
              </span>
            </div>

            {/* URL bar */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Customer Webpage URL:
              </label>
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                <input
                  type="text"
                  readOnly
                  value={customerUrl}
                  className="bg-transparent text-xs text-emerald-300 flex-1 outline-hidden font-mono select-all truncate px-1"
                />
                <button
                  onClick={() => copyUrl(customerUrl, 'customer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    copiedKey === 'customer'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {copiedKey === 'customer' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </a>

              <a
                href="/customer.html"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Open in New Tab</span>
              </a>
            </div>
          </div>
        )}

        {activePortalTab === 'cashier' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300">
              <div className="font-black text-emerald-400 flex items-center gap-1.5 mb-1">
                <ShoppingCart className="w-4 h-4" />
                <span>Cashier POS Register Webpage</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dedicated checkout terminal for stall cashiers. POS barcode/touch item selector and item stock/price check. All confidential boss margins, cost prices, suppliers, and settings are hidden.
              </p>
            </div>

            {/* URL bar */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Cashier Webpage URL:
              </label>
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                <input
                  type="text"
                  readOnly
                  value={cashierUrl}
                  className="bg-transparent text-xs text-emerald-300 flex-1 outline-hidden font-mono select-all truncate px-1"
                />
                <button
                  onClick={() => copyUrl(cashierUrl, 'cashier')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    copiedKey === 'cashier'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {copiedKey === 'cashier' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/cashier.html"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Cashier Register in New Tab</span>
              </a>
            </div>
          </div>
        )}

        {activePortalTab === 'admin' && (
          <div className="space-y-4">
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3.5 text-xs text-indigo-200">
              <div className="font-black text-indigo-300 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Boss Admin Management Webpage</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Complete executive backoffice with profit margins, cost prices, master product catalog editing, supplier POs, customer credit ledgers, staff PINs, and financial reports.
              </p>
            </div>

            {/* URL bar */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Boss Admin Webpage URL:
              </label>
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
                <input
                  type="text"
                  readOnly
                  value={adminUrl}
                  className="bg-transparent text-xs text-indigo-300 flex-1 outline-hidden font-mono select-all truncate px-1"
                />
                <button
                  onClick={() => copyUrl(adminUrl, 'admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    copiedKey === 'admin'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {copiedKey === 'admin' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="/admin.html"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Boss Admin Portal in New Tab</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
