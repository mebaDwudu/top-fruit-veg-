import React, { useState, useEffect, useCallback } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ActiveTab } from './types/store';
import { Sidebar } from './components/layout/Sidebar';
import { PageBanner } from './components/layout/PageBanner';
import { PosRegister } from './components/pos/PosRegister';
import { InventoryManager } from './components/inventory/InventoryManager';
import { SalesHistory } from './components/orders/SalesHistory';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { SupplierManager } from './components/suppliers/SupplierManager';
import { CustomerManager } from './components/customers/CustomerManager';
import { StoreSettingsView } from './components/settings/StoreSettingsView';
import { CustomerStorefront } from './components/storefront/CustomerStorefront';
import { AdminPortal } from './components/admin/AdminPortal';
import { CashierPortal } from './components/cashier/CashierPortal';
import { LoginPage } from './components/auth/LoginPage';
import { LockScreen } from './components/auth/LockScreen';
import { PinAuthModal } from './components/auth/PinAuthModal';

function StoreAppContent() {
  const {
    isAuthenticated,
    isLocked,
    currentRole,
    currentStaff,
    setDirectRole,
    settings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const pathname = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const rawHash = window.location.hash.replace('#/', '').replace('#', '').trim().toLowerCase();

    if (
      pathname.includes('customer') ||
      rawHash === 'storefront' ||
      rawHash === 'customer' ||
      rawHash === 'market' ||
      searchParams.get('page') === 'customer' ||
      searchParams.get('view') === 'customer'
    ) {
      return 'storefront';
    }
    if (
      pathname.includes('admin') ||
      rawHash === 'admin' ||
      rawHash === 'boss' ||
      rawHash === 'management' ||
      searchParams.get('page') === 'admin' ||
      searchParams.get('view') === 'admin'
    ) {
      return 'admin';
    }
    if (
      pathname.includes('cashier') ||
      rawHash === 'cashier' ||
      searchParams.get('page') === 'cashier' ||
      searchParams.get('view') === 'cashier'
    ) {
      return 'cashier';
    }
    return 'pos';
  });
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
  const [isBossPinOpen, setIsBossPinOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);

  // Hash-based and URL routing handler
  const handleHashChange = useCallback(() => {
    const pathname = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const rawHash = window.location.hash.replace('#/', '').replace('#', '').trim().toLowerCase();

    if (
      pathname.includes('customer') ||
      rawHash === 'storefront' ||
      rawHash === 'customer' ||
      rawHash === 'market' ||
      searchParams.get('page') === 'customer' ||
      searchParams.get('view') === 'customer'
    ) {
      setActiveTab('storefront');
      return;
    }

    if (
      pathname.includes('admin') ||
      rawHash === 'admin' ||
      rawHash === 'boss' ||
      rawHash === 'management' ||
      searchParams.get('page') === 'admin' ||
      searchParams.get('view') === 'admin'
    ) {
      setActiveTab('admin');
      return;
    }

    if (
      pathname.includes('cashier') ||
      rawHash === 'cashier' ||
      searchParams.get('page') === 'cashier' ||
      searchParams.get('view') === 'cashier'
    ) {
      setActiveTab('cashier');
      return;
    }

    if (!rawHash) {
      setActiveTab('pos');
      return;
    }

    if (rawHash === 'login') {
      setActiveTab('login');
      return;
    }

    const validTabs: ActiveTab[] = [
      'pos',
      'cashier',
      'inventory',
      'admin',
      'orders',
      'analytics',
      'suppliers',
      'customers',
      'settings',
      'storefront',
    ];

    if (validTabs.includes(rawHash as ActiveTab)) {
      const target = rawHash as ActiveTab;

      // Cashier security boundary check for sidebar tabs
      const adminOnlyTabs: ActiveTab[] = [
        'orders',
        'analytics',
        'suppliers',
        'customers',
        'settings',
      ];

      if (currentRole === 'cashier' && adminOnlyTabs.includes(target)) {
        setPendingTab(target);
        setIsBossPinOpen(true);
        setRedirectNotice(
          `Boss PIN Required: The "${target.toUpperCase()}" tab is restricted. Enter PIN 1234 to proceed.`
        );
        return;
      }

      setActiveTab(target);
      setRedirectNotice(null);
    }
  }, [currentRole]);

  useEffect(() => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  const handleTabChange = (tab: ActiveTab) => {
    const adminOnlyTabs: ActiveTab[] = [
      'orders',
      'analytics',
      'suppliers',
      'customers',
      'settings',
    ];

    if (currentRole === 'cashier' && adminOnlyTabs.includes(tab)) {
      setPendingTab(tab);
      setIsBossPinOpen(true);
      return;
    }

    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
    setRedirectNotice(null);
  };

  const handleBossUnlockSuccess = () => {
    setDirectRole('admin');
    setIsBossPinOpen(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      window.location.hash = `#/${pendingTab}`;
      setPendingTab(null);
    }
    setRedirectNotice(null);
  };

  // If on the dedicated Cashier Webpage (#/cashier), render the CashierPortal directly!
  if (activeTab === 'cashier' || (currentRole === 'cashier' && activeTab === 'pos')) {
    return (
      <CashierPortal
        onSwitchToAdmin={() => {
          setActiveTab('admin');
          window.location.hash = '#/admin';
        }}
        onSwitchToStorefront={() => {
          setActiveTab('storefront');
          window.location.hash = '#/storefront';
        }}
      />
    );
  }

  // If on the dedicated Admin Webpage (#/admin), render the AdminPortal directly!
  if (activeTab === 'admin') {
    return (
      <AdminPortal
        onSwitchToPos={() => {
          setActiveTab('pos');
          window.location.hash = '#/pos';
        }}
        onSwitchToStorefront={() => {
          setActiveTab('storefront');
          window.location.hash = '#/storefront';
        }}
      />
    );
  }

  // If on the public customer storefront, render it directly without requiring staff login!
  if (activeTab === 'storefront') {
    return (
      <CustomerStorefront
        onSwitchToStaff={() => {
          if (!isAuthenticated) {
            setActiveTab('login');
            window.location.hash = '#/login';
          } else {
            setActiveTab('pos');
            window.location.hash = '#/pos';
          }
        }}
      />
    );
  }

  // If user is not authenticated or explicitly on the login tab, show LoginPage
  if (!isAuthenticated || activeTab === 'login') {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setActiveTab('pos');
          window.location.hash = '#/pos';
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-row overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Left Sidebar Navigation (Single-word labels) */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Workspace Area (Full Screen Utilization) */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Page Context Banner & Role Alert */}
        {redirectNotice && (
          <PageBanner
            activeTab={activeTab}
            onUnlockBoss={() => {
              setPendingTab(activeTab);
              setIsBossPinOpen(true);
            }}
            redirectNotice={redirectNotice}
            onClearNotice={() => setRedirectNotice(null)}
          />
        )}

        {/* Content Workspace */}
        <main className="flex-1 w-full h-full overflow-y-auto p-2 sm:p-3 lg:p-4 bg-slate-950">
          {activeTab === 'pos' && <PosRegister />}
          {activeTab === 'inventory' && (
            <InventoryManager onNavigateToPO={() => handleTabChange('suppliers')} />
          )}
          {activeTab === 'orders' && <SalesHistory />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'suppliers' && <SupplierManager />}
          {activeTab === 'customers' && <CustomerManager />}
          {activeTab === 'settings' && <StoreSettingsView />}
        </main>
      </div>

      {/* Screen Lock Overlay */}
      {isLocked && <LockScreen />}

      {/* Boss Elevation PIN Modal */}
      <PinAuthModal
        isOpen={isBossPinOpen}
        onClose={() => {
          setIsBossPinOpen(false);
          setPendingTab(null);
        }}
        onSuccess={handleBossUnlockSuccess}
        title="Boss Admin Access Required"
        description="Enter the 4-digit Boss PIN (Default: 1234) to unlock management tabs."
      />
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

