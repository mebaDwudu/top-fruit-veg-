import React, { useState, useEffect, useCallback } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ActiveTab } from './types/store';
import { CustomerStorefront } from './components/storefront/CustomerStorefront';
import { AdminPortal } from './components/admin/AdminPortal';
import { ShoppingBag, Shield, ArrowRight, ExternalLink, Sparkles, Store } from 'lucide-react';

function parseCurrentRoute(): 'customer' | 'admin' | 'hub' {
  try {
    const pathname = (window?.location?.pathname || '').toLowerCase();
    const rawHash = (window?.location?.hash || '').replace('#/', '').replace('#', '').trim().toLowerCase();
    
    let searchPage = '';
    let searchView = '';
    try {
      if (window?.location?.search) {
        const searchParams = new URLSearchParams(window.location.search);
        searchPage = searchParams.get('page') || '';
        searchView = searchParams.get('view') || '';
      }
    } catch {
      // Fallback
    }

    if (
      pathname.includes('customer') ||
      pathname.includes('market') ||
      pathname.includes('store') ||
      rawHash === 'storefront' ||
      rawHash === 'customer' ||
      rawHash === 'market' ||
      searchPage === 'customer' ||
      searchView === 'customer'
    ) {
      return 'customer';
    }

    if (
      pathname.includes('admin') ||
      pathname.includes('boss') ||
      pathname.includes('management') ||
      rawHash === 'admin' ||
      rawHash === 'boss' ||
      rawHash === 'management' ||
      searchPage === 'admin' ||
      searchView === 'admin'
    ) {
      return 'admin';
    }

    if (pathname.includes('hub') || rawHash === 'hub' || searchPage === 'hub') {
      return 'hub';
    }

    return 'customer';
  } catch {
    return 'customer';
  }
}

function StoreAppContent() {
  const { isOnline } = useStore();

  const [activePortal, setActivePortal] = useState<'customer' | 'admin' | 'hub'>(() => parseCurrentRoute());

  // Hash-based and URL routing handler
  const handleRouting = useCallback(() => {
    setActivePortal(parseCurrentRoute());
  }, []);

  useEffect(() => {
    handleRouting();
    window.addEventListener('popstate', handleRouting);
    window.addEventListener('hashchange', handleRouting);
    return () => {
      window.removeEventListener('popstate', handleRouting);
      window.removeEventListener('hashchange', handleRouting);
    };
  }, [handleRouting]);

  const navigateTo = (portal: 'customer' | 'admin' | 'hub') => {
    setActivePortal(portal);
    try {
      if (portal === 'customer') {
        window.location.hash = '#/customer';
      } else if (portal === 'admin') {
        window.location.hash = '#/admin';
      } else {
        window.location.hash = '';
      }
    } catch {
      // Safe fallback
    }
  };

  // 1. CUSTOMER STOREFRONT PORTAL
  if (activePortal === 'customer') {
    return (
      <CustomerStorefront
        onSwitchToStaff={() => navigateTo('admin')}
      />
    );
  }

  // 2. ADMIN PORTAL (Matches Customer styling & Left-side navigation)
  if (activePortal === 'admin') {
    return (
      <AdminPortal
        onSwitchToStorefront={() => navigateTo('customer')}
      />
    );
  }

  // 3. CLEAN HUB SELECTION (If visited explicitly)
  return (
    <div className="min-h-screen bg-emerald-50/40 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs text-xl">
            🥭
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
              Top Fruit & Vegetables
            </h1>
            <p className="text-xs text-emerald-800 font-medium">Pitch 18 Brixton Market, London</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${
              isOnline
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'
              }`}
            />
            {isOnline ? 'Live Cloud Sync' : 'Offline'}
          </span>
        </div>
      </header>

      {/* Main Dual Portal Selection */}
      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> 2 Independent Portals
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Top Fruit & Veg Portals
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Choose whether you want to browse as a customer or access administrative store management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Customer Portal */}
          <div
            onClick={() => navigateTo('customer')}
            className="group relative bg-white border border-emerald-100 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-900/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                  /customer
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Customer Storefront
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Clean customer produce market. Browse fresh seasonal fruits, vegetables, root crops, create grocery bags, and place WhatsApp orders.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-50 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
              <span className="flex items-center gap-1.5">
                Open Customer Store <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Public</span>
            </div>
          </div>

          {/* 2. Admin Portal */}
          <div
            onClick={() => navigateTo('admin')}
            className="group relative bg-white border border-emerald-100 hover:border-emerald-600 rounded-3xl p-6 sm:p-8 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-900/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                  /admin
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Admin & Store Management
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Full back-office system: Inventory stock manager, price & margin updates, sales history, supplier purchase orders, and profit analytics.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-50 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
              <span className="flex items-center gap-1.5">
                Open Admin Portal <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Protected Access</span>
            </div>
          </div>
        </div>

        {/* Quick Links Bar */}
        <div className="mt-8 bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
          <div className="text-slate-500 font-medium">
            <span className="font-bold text-slate-800">Direct URLs:</span> Bookmark these individual links:
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/customer"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('customer');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
            >
              your-domain/customer <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('admin');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
            >
              your-domain/admin <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-100 py-4 text-center text-xs text-slate-500">
        Top Fruit & Veg • Pitch 18 Brixton Market, London • Retail & Wholesale Management
      </footer>
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <StoreAppContent />
    </StoreProvider>
  );
}

export default App;
