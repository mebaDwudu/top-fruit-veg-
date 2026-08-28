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
  LogOut,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  QrCode,
  KeyRound,
  BarChart3,
  CheckCircle2,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  Store,
  Sparkles,
  ShoppingBag,
  Star,
  MessageSquare,
  Eye,
  EyeOff,
  Delete,
  Shield,
  Fingerprint,
} from 'lucide-react';

interface AdminPortalProps {
  onSwitchToStorefront: () => void;
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
}) => {
  const {
    currentRole,
    isAuthenticated,
    logout,
    settings,
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
    onSwitchToStorefront();
  };

  // Nav item list for clean left sidebar
  const navItems: {
    id: AdminSection;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview & Reports',
      description: 'Key metrics & performance',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'orders',
      label: 'Customer Orders',
      description: 'Storefront reservations',
      icon: <ShoppingBag className="w-5 h-5" />,
      badge:
        pendingCustomerOrdersCount > 0
          ? `${pendingCustomerOrdersCount} Pending`
          : customerOrders.length > 0
          ? customerOrders.length
          : undefined,
      badgeColor:
        pendingCustomerOrdersCount > 0
          ? 'bg-amber-500 text-white font-black'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'feedback',
      label: 'Customer Feedback',
      description: 'Reviews & star ratings',
      icon: <Star className="w-5 h-5" />,
      badge:
        newFeedbacksCount > 0
          ? `${newFeedbacksCount} New`
          : feedbacks.length > 0
          ? feedbacks.length
          : undefined,
      badgeColor:
        newFeedbacksCount > 0
          ? 'bg-amber-500 text-white font-black'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      description: 'Prices, costs & barcodes',
      icon: <Boxes className="w-5 h-5" />,
      badge:
        lowStockProducts.length + outOfStockProducts.length > 0
          ? lowStockProducts.length + outOfStockProducts.length
          : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'sales',
      label: 'Sales History',
      description: 'Receipts & orders',
      icon: <Receipt className="w-5 h-5" />,
      badge: completedOrders.length > 0 ? completedOrders.length : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'suppliers',
      label: 'Suppliers & Orders',
      description: 'Vendor purchasing',
      icon: <Truck className="w-5 h-5" />,
      badge: suppliers.length > 0 ? suppliers.length : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    },
    {
      id: 'customers',
      label: 'Customer Accounts',
      description: 'Tab balances & debt',
      icon: <Users className="w-5 h-5" />,
      badge: totalCustomerDebt > 0 ? formatCurrency(totalCustomerDebt) : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      id: 'settings',
      label: 'Store Settings',
      description: 'Security & preferences',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  // 2. AUTHENTICATED ADMIN DASHBOARD
  // Styled with matching clean emerald-50/40 background and dedicated left sidebar navigation
  return (
    <div className="min-h-screen w-screen bg-emerald-50/40 text-slate-900 flex flex-row overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* ========================================================= */}
      {/* 1. CLEAN LEFT SIDEBAR FOR ADMIN (Matches Customer Aesthetic) */}
      {/* ========================================================= */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 max-w-[85vw] bg-white border-r border-emerald-100 shadow-xl lg:shadow-sm flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none truncate">
                    Admin Portal
                  </h1>
                </div>
                <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                  <span>Top Fruit and Veg • Pitch 18</span>
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Total Revenue</span>
              <span className="font-extrabold text-emerald-800">
                {formatCurrency(totalGrossRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Net Profit Margin</span>
              <span className="font-bold text-emerald-700">
                {totalMarginPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Stock Catalog</span>
              <span className="font-bold text-slate-700">{products.length} Products</span>
            </div>
          </div>

          {/* Clean Left Side Navigation Buttons */}
          <div className="space-y-1.5 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-1">
              Store Management
            </p>
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                      : 'text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-900 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={isActive ? 'text-white' : 'text-emerald-700'}>
                      {item.icon}
                    </span>
                    <div className="truncate">
                      <p className="text-xs leading-tight font-bold truncate">{item.label}</p>
                      <p
                        className={`text-[10px] leading-tight truncate mt-0.5 ${
                          isActive ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Customer Storefront Link & Actions */}
          <div className="pt-3 border-t border-emerald-100 space-y-2">
            <button
              onClick={onSwitchToStorefront}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-2xl text-xs font-bold text-emerald-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Customer Storefront</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-500" />
                <span>Share QR</span>
              </button>

              <button
                onClick={handleLogoutAndLock}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Lock Admin Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT WORKSPACE (Clean Emerald/White Backdrop) */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar for Mobile & Quick Actions */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:text-emerald-700 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize tracking-tight flex items-center gap-2">
                <span>
                  {navItems.find((n) => n.id === activeSection)?.label || 'Store Management'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                  Boss Admin
                </span>
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Top Fruits & Vegetables • Retail & Wholesale Back-Office
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleLogoutAndLock}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
              title="Lock Admin Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Portal</span>
            </button>

            <button
              onClick={onSwitchToStorefront}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Customer Store</span>
            </button>
          </div>
        </header>

        {/* Dynamic Section Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* SECTION 1: OVERVIEW & REPORTS */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Executive Quick Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Gross Revenue
                    </span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(totalGrossRevenue)}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1 font-bold">
                    {completedOrders.length} completed orders
                  </p>
                </div>

                <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Net Gross Profit
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700">
                    {formatCurrency(totalNetProfit)}
                  </p>
                  <p className="text-xs text-emerald-800 mt-1 font-bold">
                    {totalMarginPercent}% aggregate margin
                  </p>
                </div>

                <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Inventory Valuation
                    </span>
                    <Boxes className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(totalInventoryRetail)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Cost basis: {formatCurrency(totalInventoryCost)}
                  </p>
                </div>

                <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Stock Alerts
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-black text-amber-600">
                      {lowStockProducts.length + outOfStockProducts.length}
                    </p>
                    <span className="text-xs text-rose-600 font-bold">
                      ({outOfStockProducts.length} out of stock)
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveSection('inventory')}
                    className="text-xs text-emerald-700 hover:underline mt-1 font-bold block cursor-pointer"
                  >
                    View stock manager →
                  </button>
                </div>
              </div>

              {/* Embedded Analytics Dashboard */}
              <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
                <AnalyticsDashboard />
              </div>
            </div>
          )}

          {/* CUSTOMER STOREFRONT ORDERS */}
          {activeSection === 'orders' && (
            <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
              <CustomerOrdersView />
            </div>
          )}

          {/* CUSTOMER FEEDBACK & REVIEWS */}
          {activeSection === 'feedback' && (
            <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
              <CustomerFeedbackView />
            </div>
          )}

          {/* SECTION 2: INVENTORY MANAGER */}
          {activeSection === 'inventory' && (
            <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
              <InventoryManager onNavigateToPO={() => setActiveSection('suppliers')} />
            </div>
          )}

          {/* SECTION 3: SALES HISTORY & RECEIPTS */}
          {activeSection === 'sales' && (
            <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
              <SalesHistory />
            </div>
          )}

          {/* SECTION 4: SUPPLIERS & PURCHASE ORDERS */}
          {activeSection === 'suppliers' && (
            <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
              <SupplierManager />
            </div>
          )}

          {/* SECTION 5: CUSTOMER ACCOUNTS & DEBT */}
          {activeSection === 'customers' && (
            <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
              <CustomerManager />
            </div>
          )}

          {/* SECTION 6: STORE SETTINGS & PINS */}
          {activeSection === 'settings' && (
            <div className="bg-white border border-emerald-100 rounded-3xl overflow-hidden shadow-sm p-4 sm:p-6">
              <StoreSettingsView />
            </div>
          )}
        </main>
      </div>

      {/* Share Modal */}
      <ShareStoreModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
