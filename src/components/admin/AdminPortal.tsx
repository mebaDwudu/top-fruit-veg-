import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminPinPage } from './AdminPinPage';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { InventoryManager } from '../inventory/InventoryManager';
import { SalesHistory } from '../orders/SalesHistory';
import { SupplierManager } from '../suppliers/SupplierManager';
import { CustomerManager } from '../customers/CustomerManager';
import { StoreSettingsView } from '../settings/StoreSettingsView';
import { CustomerOrdersView } from './CustomerOrdersView';
import { CustomerFeedbackView } from './CustomerFeedbackView';
import { ShareStoreModal } from '../modals/ShareStoreModal';
import {
  ShieldCheck,
  Boxes,
  Receipt,
  Truck,
  Users,
  Settings,
  Globe,
  Lock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  QrCode,
  BarChart3,
  Menu,
  X,
  Store,
  ShoppingBag,
  Star,
} from 'lucide-react';

interface AdminPortalProps {
  onSwitchToStorefront: () => void;
  onOpenCustomerOrders?: () => void;
}

export type AdminSection =
  | 'overview'
  | 'orders'
  | 'feedback'
  | 'inventory'
  | 'sales'
  | 'suppliers'
  | 'customers'
  | 'settings';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onSwitchToStorefront,
  onOpenCustomerOrders,
}) => {
  const {
    currentRole,
    isAuthenticated,
    logout,
    products,
    orders,
    customers,
    suppliers,
    customerOrders,
    feedbacks,
    lowStockProducts,
    outOfStockProducts,
    formatCurrency,
  } = useStore();

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const pendingCustomerOrdersCount = useMemo(
    () => customerOrders.filter((o) => o.status === 'pending').length,
    [customerOrders]
  );
  const newFeedbacksCount = useMemo(
    () => feedbacks.filter((f) => f.status === 'new').length,
    [feedbacks]
  );

  // Financial aggregates
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'completed'),
    [orders]
  );
  const totalGrossRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.grandTotal, 0),
    [completedOrders]
  );
  const totalNetProfit = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.grossProfit, 0),
    [completedOrders]
  );
  const totalMarginPercent = useMemo(
    () =>
      totalGrossRevenue > 0
        ? ((totalNetProfit / totalGrossRevenue) * 100).toFixed(1)
        : '0.0',
    [totalGrossRevenue, totalNetProfit]
  );

  const totalInventoryCost = useMemo(
    () => products.reduce((sum, p) => sum + p.costPrice * p.stock, 0),
    [products]
  );
  const totalInventoryRetail = useMemo(
    () => products.reduce((sum, p) => sum + p.sellingPrice * p.stock, 0),
    [products]
  );

  const totalCustomerDebt = useMemo(
    () => customers.reduce((sum, c) => sum + Math.max(0, c.balance || 0), 0),
    [customers]
  );

  const handleLogoutAndLock = () => {
    logout();
  };

  // 1. DEDICATED ADMIN PIN ACCESS SCREEN
  if (!isAuthenticated || currentRole !== 'admin') {
    return (
      <AdminPinPage
        onSuccess={() => {}}
        onBackToHome={onSwitchToStorefront}
      />
    );
  }

  // Minimalist single-word nav items
  const navItems: {
    id: AdminSection;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge:
        pendingCustomerOrdersCount > 0
          ? `${pendingCustomerOrdersCount}`
          : customerOrders.length > 0
          ? customerOrders.length
          : undefined,
      badgeColor:
        pendingCustomerOrdersCount > 0
          ? 'bg-amber-500 text-white'
          : 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: <Star className="w-4 h-4" />,
      badge:
        newFeedbacksCount > 0
          ? `${newFeedbacksCount}`
          : feedbacks.length > 0
          ? feedbacks.length
          : undefined,
      badgeColor:
        newFeedbacksCount > 0
          ? 'bg-emerald-600 text-white'
          : 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Boxes className="w-4 h-4" />,
      badge:
        lowStockProducts.length + outOfStockProducts.length > 0
          ? lowStockProducts.length + outOfStockProducts.length
          : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: <Receipt className="w-4 h-4" />,
      badge: completedOrders.length > 0 ? completedOrders.length : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: <Truck className="w-4 h-4" />,
      badge: suppliers.length > 0 ? suppliers.length : undefined,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-4 h-4" />,
      badge: totalCustomerDebt > 0 ? formatCurrency(totalCustomerDebt) : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50/50 text-slate-900 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* ========================================================= */}
      {/* 1. STICKY LEFT SIDEBAR FOR ADMIN (Fixed on PC)           */}
      {/* ========================================================= */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-60 max-w-[85vw] bg-white border-r border-slate-200 shadow-xl lg:shadow-none flex flex-col justify-between p-3.5 transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xs font-black text-slate-900 tracking-tight leading-none">
                  Admin
                </h1>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Pitch 18 Brixton
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Minimalist 1-Line Revenue Badge */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Revenue</span>
            <span className="font-bold text-emerald-800">{formatCurrency(totalGrossRevenue)}</span>
          </div>

          {/* Clean Minimalist Nav Buttons */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'orders' && onOpenCustomerOrders) {
                      onOpenCustomerOrders();
                    } else {
                      setActiveSection(item.id);
                    }
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className={isActive ? 'text-white' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Combined 2-in-1 Action Buttons at bottom */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onSwitchToStorefront}
                className="flex items-center justify-center space-x-1.5 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Customer Storefront"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Store</span>
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center justify-center space-x-1.5 px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Share QR"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-500" />
                <span>Share</span>
              </button>
            </div>

            <button
              onClick={handleLogoutAndLock}
              className="w-full flex items-center justify-center space-x-1.5 px-2 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT WORKSPACE (Offset by lg:pl-60)           */}
      {/* ========================================================= */}
      <div className="flex-1 min-w-0 lg:pl-60 flex flex-col min-h-screen">
        {/* Top Header Bar for Mobile & Actions */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-emerald-700 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer"
              aria-label="Open Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 capitalize tracking-tight flex items-center gap-2">
                <span>
                  {navItems.find((n) => n.id === activeSection)?.label || 'Overview'}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold">
                  Boss
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogoutAndLock}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
              title="Lock Admin"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>

            <button
              onClick={onSwitchToStorefront}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Store</span>
            </button>
          </div>
        </header>

        {/* Dynamic Section Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-4">
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              {/* Executive Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-slate-500">
                      Revenue
                    </span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xl font-black text-slate-900">
                    {formatCurrency(totalGrossRevenue)}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                    {completedOrders.length} orders
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-slate-500">
                      Net Profit
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xl font-black text-emerald-700">
                    {formatCurrency(totalNetProfit)}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
                    {totalMarginPercent}% margin
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-slate-500">
                      Valuation
                    </span>
                    <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xl font-black text-slate-900">
                    {formatCurrency(totalInventoryRetail)}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Cost: {formatCurrency(totalInventoryCost)}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold text-slate-500">
                      Alerts
                    </span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="flex items-baseline space-x-1.5">
                    <p className="text-xl font-black text-amber-600">
                      {lowStockProducts.length + outOfStockProducts.length}
                    </p>
                    <span className="text-[11px] text-rose-600 font-bold">
                      ({outOfStockProducts.length} out)
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveSection('inventory')}
                    className="text-[11px] text-emerald-700 hover:underline font-bold mt-0.5 block cursor-pointer"
                  >
                    Manage →
                  </button>
                </div>
              </div>

              {/* Analytics Dashboard */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
                <AnalyticsDashboard />
              </div>
            </div>
          )}

          {/* CUSTOMER STOREFRONT ORDERS */}
          {activeSection === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <CustomerOrdersView onOpenDedicatedPage={onOpenCustomerOrders} />
            </div>
          )}

          {/* CUSTOMER FEEDBACK & REVIEWS */}
          {activeSection === 'feedback' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <CustomerFeedbackView />
            </div>
          )}

          {/* INVENTORY */}
          {activeSection === 'inventory' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <InventoryManager onNavigateToPO={() => setActiveSection('suppliers')} />
            </div>
          )}

          {/* SALES */}
          {activeSection === 'sales' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <SalesHistory />
            </div>
          )}

          {/* SUPPLIERS */}
          {activeSection === 'suppliers' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <SupplierManager />
            </div>
          )}

          {/* CUSTOMERS */}
          {activeSection === 'customers' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <CustomerManager />
            </div>
          )}

          {/* SETTINGS */}
          {activeSection === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs p-3 sm:p-5">
              <StoreSettingsView />
            </div>
          )}
        </main>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareStoreModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      )}
    </div>
  );
};
