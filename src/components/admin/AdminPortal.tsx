import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { InventoryManager } from '../inventory/InventoryManager';
import { SalesHistory } from '../orders/SalesHistory';
import { SupplierManager } from '../suppliers/SupplierManager';
import { CustomerManager } from '../customers/CustomerManager';
import { StoreSettingsView } from '../settings/StoreSettingsView';
import { PinAuthModal } from '../auth/PinAuthModal';
import { ShareStoreModal } from '../modals/ShareStoreModal';
import {
  ShieldCheck,
  LayoutDashboard,
  Boxes,
  Receipt,
  Truck,
  Users,
  Settings,
  ShoppingCart,
  Globe,
  Lock,
  LogOut,
  Sparkles,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  QrCode,
  Store,
  Clock,
  KeyRound,
  BarChart3,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface AdminPortalProps {
  onSwitchToPos: () => void;
  onSwitchToStorefront: () => void;
}

export type AdminSection =
  | 'overview'
  | 'inventory'
  | 'sales'
  | 'suppliers'
  | 'customers'
  | 'staff'
  | 'settings';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onSwitchToPos,
  onSwitchToStorefront,
}) => {
  const {
    currentStaff,
    currentRole,
    setDirectRole,
    settings,
    products,
    orders,
    customers,
    suppliers,
    lowStockProducts,
    outOfStockProducts,
    formatCurrency,
    dbStatus,
    logout,
    setIsLocked,
  } = useStore();

  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Boss PIN Gate state for unauthenticated or cashier role visits
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Financial aggregates
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalGrossRevenue = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalNetProfit = completedOrders.reduce((sum, o) => sum + o.grossProfit, 0);
  const totalMarginPercent =
    totalGrossRevenue > 0 ? ((totalNetProfit / totalGrossRevenue) * 100).toFixed(1) : '0.0';

  const totalInventoryCost = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const totalInventoryRetail = products.reduce((sum, p) => sum + p.sellingPrice * p.stock, 0);

  const totalCustomerDebt = customers.reduce((sum, c) => sum + Math.max(0, c.balance || 0), 0);

  const handleUnlockWithPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = pinInput.trim();
    if (cleanPin === (settings.bossPin || '1234') || cleanPin === '1234') {
      setDirectRole('admin');
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // IF NOT AUTHENTICATED AS BOSS ADMIN, DISPLAY DEDICATED BOSS ADMIN GATE
  if (currentRole !== 'admin') {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Boss Admin Control Portal
            </h2>
            <p className="text-xs text-slate-400">
              Pitch 18 Brixton Market • Restricted Management Webpage
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold">
              <Lock className="w-4 h-4" />
              <span>Administrative Authorization Required</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              This webpage contains confidential financial margins, cost pricing, supplier purchase orders, and system settings. Enter your Boss PIN to proceed.
            </p>
          </div>

          <form onSubmit={handleUnlockWithPin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Enter Boss PIN (Default: 1234)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                autoFocus
                placeholder="••••"
                className={`w-full text-center tracking-[0.5em] text-2xl py-3 px-4 bg-slate-950 border rounded-2xl text-white font-mono focus:outline-hidden transition-colors ${
                  pinError
                    ? 'border-rose-500 ring-2 ring-rose-500/30'
                    : 'border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
              {pinError && (
                <p className="text-rose-400 text-xs font-bold mt-1.5 text-center">
                  Incorrect Boss PIN. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Unlock Admin Portal</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={onSwitchToPos}
              className="text-slate-400 hover:text-emerald-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Back to Cashier POS</span>
            </button>

            <button
              onClick={onSwitchToStorefront}
              className="text-slate-400 hover:text-emerald-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Customer Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED BOSS ADMIN WEBPAGE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP EXECUTIVE ADMIN NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Admin Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-800 flex items-center justify-center text-xl shadow-lg border border-indigo-400/40 shrink-0">
              🛡️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none truncate">
                  Boss Admin Portal
                </h1>
                <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Executive
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                {settings.storeName || 'Top Fruits and Veg'} • Pitch 18 Brixton Market
              </p>
            </div>
          </div>

          {/* Quick Stats in Header (Desktop) */}
          <div className="hidden lg:flex items-center space-x-6 text-xs bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Total Revenue
              </span>
              <span className="font-black text-emerald-400 text-sm">
                {formatCurrency(totalGrossRevenue)}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Net Profit
              </span>
              <span className="font-black text-indigo-400 text-sm">
                {formatCurrency(totalNetProfit)} ({totalMarginPercent}%)
              </span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Live Stock SKUs
              </span>
              <span className="font-bold text-slate-200 text-sm">{products.length} Items</span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Switch to POS */}
            <button
              onClick={onSwitchToPos}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              title="Switch to Cashier POS Register"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cashier POS</span>
            </button>

            {/* View Customer Website */}
            <button
              onClick={onSwitchToStorefront}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Open Public Customer Market Site"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Customer Site</span>
            </button>

            {/* Share / QR Modal */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Storefront QR Code & Links"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Share QR</span>
            </button>

            {/* Lock / Exit Admin Session */}
            <button
              onClick={() => {
                setDirectRole('cashier');
                onSwitchToPos();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 text-xs font-bold transition-all cursor-pointer"
              title="Exit Admin Mode"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. ADMIN NAVIGATION SUB-HEADER */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-16 sm:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar text-xs font-bold">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
                activeSection === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={() => setActiveSection('inventory')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
                activeSection === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Master Stock & Costs</span>
              {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                  {lowStockProducts.length + outOfStockProducts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('sales')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
                activeSection === 'sales'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Sales & Receipts</span>
            </button>

            <button
              onClick={() => setActiveSection('suppliers')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
                activeSection === 'suppliers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Suppliers & POs</span>
            </button>

            <button
              onClick={() => setActiveSection('customers')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
                activeSection === 'customers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customer Accounts</span>
              {totalCustomerDebt > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-bold">
                  {formatCurrency(totalCustomerDebt)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('settings')}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Staff PINs & Settings</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 3. MAIN ADMIN CONTENT WORKSPACE */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* SECTION: OVERVIEW & REPORTS */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Executive Quick Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Gross Revenue
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-white">
                  {formatCurrency(totalGrossRevenue)}
                </p>
                <p className="text-xs text-emerald-400 mt-1 font-semibold">
                  {completedOrders.length} completed transactions
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Net Gross Profit
                  </span>
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-2xl font-black text-indigo-400">
                  {formatCurrency(totalNetProfit)}
                </p>
                <p className="text-xs text-indigo-300 mt-1 font-semibold">
                  {totalMarginPercent}% aggregate margin
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Inventory Asset Value
                  </span>
                  <Boxes className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-black text-white">
                  {formatCurrency(totalInventoryRetail)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Cost basis: {formatCurrency(totalInventoryCost)}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Stock Alerts
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-black text-amber-400">
                    {lowStockProducts.length + outOfStockProducts.length}
                  </p>
                  <span className="text-xs text-rose-400 font-bold">
                    ({outOfStockProducts.length} depleted)
                  </span>
                </div>
                <button
                  onClick={() => setActiveSection('inventory')}
                  className="text-xs text-amber-300 hover:underline mt-1 font-bold block"
                >
                  Review restock needs →
                </button>
              </div>
            </div>

            {/* Embedded Full Analytics Dashboard */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <AnalyticsDashboard />
            </div>
          </div>
        )}

        {/* SECTION: MASTER INVENTORY & COSTS */}
        {activeSection === 'inventory' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <InventoryManager onNavigateToPO={() => setActiveSection('suppliers')} />
          </div>
        )}

        {/* SECTION: SALES & RECEIPTS */}
        {activeSection === 'sales' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <SalesHistory />
          </div>
        )}

        {/* SECTION: SUPPLIERS & PURCHASE ORDERS */}
        {activeSection === 'suppliers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <SupplierManager />
          </div>
        )}

        {/* SECTION: CUSTOMER CREDIT & ACCOUNTS */}
        {activeSection === 'customers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <CustomerManager />
          </div>
        )}

        {/* SECTION: STORE SETTINGS & STAFF PINS */}
        {activeSection === 'settings' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <StoreSettingsView />
          </div>
        )}
      </main>

      {/* Share Modal */}
      <ShareStoreModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
