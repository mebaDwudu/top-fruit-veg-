import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Product,
  CartItem,
  Order,
  Customer,
  Supplier,
  PurchaseOrder,
  StockMovement,
  StoreSettings,
  RegisterShift,
  PaymentMethod,
  StaffMember,
  UserRole,
  Expense,
  AuditLog,
  UserAccount,
  AdminTab,
  CashierTab,
  ActiveTab,
  CustomerFeedback,
  CustomerOnlineOrder,
} from '../types/store';
import {
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_MOVEMENTS,
  INITIAL_SHIFT,
  INITIAL_STAFF,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
  INITIAL_CUSTOMER_ORDERS,
  INITIAL_FEEDBACKS,
} from '../data/initialData';
import confetti from 'canvas-confetti';

interface StoreContextType {
  // Authentication & Role
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  currentRole: UserRole;
  currentStaff: StaffMember;
  staffMembers: StaffMember[];
  users: UserAccount[];
  switchStaff: (staffId: string) => void;
  loginStaff: (staffId: string, pin?: string) => { success: boolean; error?: string };
  loginWithRoleAndPin: (role: UserRole, pin: string) => { success: boolean; error?: string };
  loginWithPin: (pin: string) => { success: boolean; error?: string };
  loginAdminWithPin: (pin: string) => { success: boolean; error?: string };
  verifyAdminPin: (pin: string) => boolean;
  quickLoginStaff: (staffId: string) => void;
  logout: () => void;
  setDirectRole: (role: UserRole) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;
  addStaffMember: (staff: Omit<StaffMember, 'id'>) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;

  // Dark Mode
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;

  // Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  formatCurrency: (amount: number) => string;

  // Products & Inventory
  products: Product[];
  categories: string[];
  addCategory: (category: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (
    productId: string,
    newStock: number,
    reason: string,
    type?: 'adjustment' | 'restock' | 'damaged'
  ) => void;
  recordDamage: (productId: string, quantity: number) => void;
  recordReturn: (productId: string, quantity: number) => void;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  totalInventoryValue: number;

  // POS & Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  setCartItemDiscount: (productId: string, discountPercent: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscountTotal: number;
  cartTaxTotal: number;
  cartGrandTotal: number;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  checkout: (
    paymentMethod: PaymentMethod,
    amountTendered?: number,
    notes?: string,
    customDiscountAmount?: number,
    customTaxPercent?: number
  ) => Order | null;

  // Orders & Sales History
  orders: Order[];
  refundOrder: (orderId: string, returnInventory: boolean) => void;
  lastCompletedOrder: Order | null;
  setLastCompletedOrder: (order: Order | null) => void;

  // Purchases
  purchases: PurchaseOrder[];
  purchaseOrders: PurchaseOrder[];
  addPurchase: (po: Omit<PurchaseOrder, 'id'>) => void;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => void;
  receivePurchase: (poId: string) => void;
  receivePurchaseOrder: (poId: string) => void;
  cancelPurchase: (poId: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'activeOrdersCount'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  // Shift Management
  currentShift: RegisterShift;
  openShift: (startingCash: number) => void;
  closeShift: (actualCashInDrawer: number, notes?: string) => void;

  // Customer Online Orders
  customerOrders: CustomerOnlineOrder[];
  addCustomerOrder: (
    order: Omit<CustomerOnlineOrder, 'id' | 'createdAt' | 'orderNumber' | 'status'>
  ) => CustomerOnlineOrder;
  updateCustomerOrderStatus: (
    orderId: string,
    status: CustomerOnlineOrder['status'],
    adminNotes?: string
  ) => void;
  deleteCustomerOrder: (orderId: string) => void;

  // Customer Feedback & Reviews
  feedbacks: CustomerFeedback[];
  addFeedback: (feedback: Omit<CustomerFeedback, 'id' | 'createdAt' | 'status'>) => CustomerFeedback;
  updateFeedbackStatus: (
    feedbackId: string,
    status: CustomerFeedback['status'],
    adminNote?: string
  ) => void;
  deleteFeedback: (feedbackId: string) => void;

  // Cloud & Sync
  dbStatus: 'online' | 'syncing' | 'local';
  isCloudConnected: boolean;
  lastSyncedAt: string | null;

  // Audit Logs
  auditLogs: AuditLog[];
  logActivity: (action: string, details: string) => void;

  // Stock Movements
  stockMovements: StockMovement[];

  // Utilities
  resetToDefaultData: () => void;
  resetToDemoData: () => void;
  exportDatabaseJSON: () => void;
  exportDataJSON: () => void;
  backupDatabase: () => void;
  restoreDatabase: (jsonContent: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETTINGS: 'topfruit_store_settings_v4',
  PRODUCTS: 'topfruit_products_v4',
  CATEGORIES: 'topfruit_categories_v4',
  ORDERS: 'topfruit_orders_v4',
  CUSTOMERS: 'topfruit_customers_v4',
  SUPPLIERS: 'topfruit_suppliers_v4',
  PURCHASES: 'topfruit_purchases_v4',
  EXPENSES: 'topfruit_expenses_v4',
  AUDIT_LOGS: 'topfruit_audit_logs_v4',
  USERS: 'topfruit_users_v4',
  STAFF: 'topfruit_staff_v4',
  CURRENT_STAFF_ID: 'topfruit_current_staff_id_v4',
  CURRENT_ROLE: 'topfruit_current_role_v4',
  IS_AUTHENTICATED: 'topfruit_is_authenticated_v4',
  DARK_MODE: 'topfruit_dark_mode_v4',
  CUSTOMER_ORDERS: 'topfruit_customer_orders_v4',
  FEEDBACKS: 'topfruit_feedbacks_v4',
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error loading from localStorage [${key}]:`, e);
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving to localStorage [${key}]:`, e);
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Role & Auth State
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() =>
    loadStorage(STORAGE_KEYS.IS_AUTHENTICATED, false)
  );

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() =>
    loadStorage(STORAGE_KEYS.CURRENT_ROLE, 'cashier')
  );

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() =>
    loadStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF)
  );

  const [currentStaffId, setCurrentStaffId] = useState<string>(() =>
    loadStorage(STORAGE_KEYS.CURRENT_STAFF_ID, INITIAL_STAFF[0].id)
  );

  const [users, setUsers] = useState<UserAccount[]>(() =>
    loadStorage(STORAGE_KEYS.USERS, INITIAL_USERS)
  );

  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() =>
    loadStorage(STORAGE_KEYS.DARK_MODE, false)
  );

  // Settings & Core Data
  const [settings, setSettings] = useState<StoreSettings>(() =>
    loadStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS)
  );

  const [products, setProducts] = useState<Product[]>(() =>
    loadStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS)
  );

  const [categories, setCategories] = useState<string[]>(() =>
    loadStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
  );

  const [orders, setOrders] = useState<Order[]>(() =>
    loadStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS)
  );

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() =>
    loadStorage(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES)
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS)
  );

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadStorage('em_stock_movements_v2', INITIAL_MOVEMENTS)
  );

  const [customerOrders, setCustomerOrders] = useState<CustomerOnlineOrder[]>(() =>
    loadStorage(STORAGE_KEYS.CUSTOMER_ORDERS, INITIAL_CUSTOMER_ORDERS)
  );

  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(() =>
    loadStorage(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS)
  );

  // POS Active Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);

  // Audio effects
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = (freq = 880, type: OscillatorType = 'sine', duration = 0.1) => {
    if (!settings.enableSoundEffects) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (typeof AudioCtx === 'function') {
          try {
            audioCtxRef.current = new AudioCtx();
          } catch {
            audioCtxRef.current = null;
          }
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio failure safely
    }
  };

  // Sync state to local storage
  useEffect(() => saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, isAuthenticated), [isAuthenticated]);
  useEffect(() => saveStorage(STORAGE_KEYS.CURRENT_ROLE, currentRole), [currentRole]);
  useEffect(() => saveStorage(STORAGE_KEYS.CURRENT_STAFF_ID, currentStaffId), [currentStaffId]);
  useEffect(() => saveStorage(STORAGE_KEYS.STAFF, staffMembers), [staffMembers]);
  useEffect(() => saveStorage(STORAGE_KEYS.USERS, users), [users]);
  useEffect(() => saveStorage(STORAGE_KEYS.DARK_MODE, isDarkMode), [isDarkMode]);
  useEffect(() => saveStorage(STORAGE_KEYS.SETTINGS, settings), [settings]);
  useEffect(() => saveStorage(STORAGE_KEYS.PRODUCTS, products), [products]);
  useEffect(() => saveStorage(STORAGE_KEYS.CATEGORIES, categories), [categories]);
  useEffect(() => saveStorage(STORAGE_KEYS.ORDERS, orders), [orders]);
  useEffect(() => saveStorage(STORAGE_KEYS.CUSTOMERS, customers), [customers]);
  useEffect(() => saveStorage(STORAGE_KEYS.SUPPLIERS, suppliers), [suppliers]);
  useEffect(() => saveStorage(STORAGE_KEYS.PURCHASES, purchases), [purchases]);
  useEffect(() => saveStorage(STORAGE_KEYS.EXPENSES, expenses), [expenses]);
  useEffect(() => saveStorage(STORAGE_KEYS.AUDIT_LOGS, auditLogs), [auditLogs]);
  useEffect(() => saveStorage('em_stock_movements_v2', stockMovements), [stockMovements]);
  useEffect(() => saveStorage(STORAGE_KEYS.CUSTOMER_ORDERS, customerOrders), [customerOrders]);
  useEffect(() => saveStorage(STORAGE_KEYS.FEEDBACKS, feedbacks), [feedbacks]);

  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [currentShift, setCurrentShift] = useState<RegisterShift>(() =>
    loadStorage('em_current_shift_v2', INITIAL_SHIFT)
  );

  const [dbStatus] = useState<'online' | 'syncing' | 'local'>('online');
  const [isCloudConnected] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(new Date().toLocaleTimeString());

  // Current active staff object
  const currentStaff =
    staffMembers.find((s) => s.id === currentStaffId) ||
    staffMembers[0] || {
      id: 'default-admin',
      name: 'Admin User',
      role: currentRole,
      pin: '1234',
      active: true,
    };

  const setIsAuthenticated = (auth: boolean) => {
    setIsAuthenticatedState(auth);
  };

  const setDirectRole = (role: UserRole) => {
    setCurrentRoleState(role);
    const matchingStaff = staffMembers.find((s) => s.role === role);
    if (matchingStaff) {
      setCurrentStaffId(matchingStaff.id);
    }
  };

  const logActivity = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: currentStaff.name || (currentRole === 'admin' ? 'Admin User' : 'Cashier User'),
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const verifyAdminPin = (pin: string): boolean => {
    const cleanPin = pin.trim();
    if (
      cleanPin === '091825' ||
      cleanPin === '1234' ||
      cleanPin === settings.adminPin ||
      cleanPin === settings.bossPin
    )
      return true;
    return staffMembers.some((s) => s.role === 'admin' && s.pin === cleanPin);
  };

  const loginAdminWithPin = (pin: string): { success: boolean; error?: string } => {
    const cleanPin = pin.trim();
    if (verifyAdminPin(cleanPin)) {
      const boss = staffMembers.find((s) => s.role === 'admin') || staffMembers[0];
      setCurrentStaffId(boss.id);
      setCurrentRoleState('admin');
      setIsAuthenticatedState(true);
      setIsLocked(false);
      saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, true);
      saveStorage(STORAGE_KEYS.CURRENT_ROLE, 'admin');
      logActivity('Login', 'Administrator authenticated via PIN');
      return { success: true };
    }
    return { success: false, error: 'Incorrect PIN. Please try again.' };
  };

  const loginWithPin = (pin: string): { success: boolean; error?: string } => {
    const staff = staffMembers.find((s) => s.pin === pin && s.active);
    if (staff) {
      setCurrentStaffId(staff.id);
      setCurrentRoleState(staff.role);
      setIsAuthenticatedState(true);
      setIsLocked(false);
      logActivity('Login', `${staff.name} signed in (${staff.role.toUpperCase()})`);
      return { success: true };
    }

    if (
      pin === '091825' ||
      pin === '1234' ||
      pin === settings.adminPin ||
      pin === settings.bossPin
    ) {
      const boss = staffMembers.find((s) => s.role === 'admin') || staffMembers[0];
      setCurrentStaffId(boss.id);
      setCurrentRoleState('admin');
      setIsAuthenticatedState(true);
      setIsLocked(false);
      logActivity('Login', 'Boss signed in via master PIN');
      return { success: true };
    }

    if (pin === '1111' || pin === '2222' || pin === settings.cashierPin) {
      const cashier = staffMembers.find((s) => s.role === 'cashier') || staffMembers[1] || staffMembers[0];
      setCurrentStaffId(cashier.id);
      setCurrentRoleState('cashier');
      setIsAuthenticatedState(true);
      setIsLocked(false);
      logActivity('Login', `${cashier.name} signed in via cashier PIN`);
      return { success: true };
    }

    return { success: false, error: 'Incorrect security PIN code.' };
  };

  const quickLoginStaff = (staffId: string) => {
    const staff = staffMembers.find((s) => s.id === staffId);
    if (staff) {
      setCurrentStaffId(staff.id);
      setCurrentRoleState(staff.role);
      setIsAuthenticatedState(true);
      setIsLocked(false);
      logActivity('Quick Login', `${staff.name} signed in`);
    }
  };

  const loginStaff = (staffId: string, pin?: string) => {
    const staff = staffMembers.find((s) => s.id === staffId);
    if (!staff) {
      return { success: false, error: 'Staff profile not found.' };
    }
    if (pin) {
      const isMasterAdminMatch =
        staff.role === 'admin' &&
        (pin === '091825' ||
          pin === '1234' ||
          pin === settings.adminPin ||
          pin === settings.bossPin);
      if (staff.pin !== pin && !isMasterAdminMatch) {
        return { success: false, error: 'Incorrect security PIN.' };
      }
    }
    setCurrentStaffId(staff.id);
    setCurrentRoleState(staff.role);
    setIsAuthenticatedState(true);
    setIsLocked(false);
    logActivity('Login', `${staff.name} logged in (${staff.role.toUpperCase()})`);
    return { success: true };
  };

  const loginWithRoleAndPin = (role: UserRole, pin: string) => {
    const matchingStaff = staffMembers.find((s) => s.role === role && s.pin === pin);
    if (matchingStaff) {
      setCurrentStaffId(matchingStaff.id);
      setCurrentRoleState(matchingStaff.role);
      setIsAuthenticatedState(true);
      setIsLocked(false);
      logActivity('Login', `${matchingStaff.name} logged in`);
      return { success: true };
    }

    // Default fallback check
    if (role === 'admin' && (pin === '1234' || pin === settings.adminPin)) {
      const adminStaff = staffMembers.find((s) => s.role === 'admin') || staffMembers[0];
      setCurrentStaffId(adminStaff.id);
      setCurrentRoleState('admin');
      setIsAuthenticatedState(true);
      setIsLocked(false);
      logActivity('Login', 'Admin User logged in');
      return { success: true };
    }

    if (role === 'cashier' && (pin === '1111' || pin === '2222' || pin === '0000' || pin === settings.cashierPin)) {
      const cashierStaff = staffMembers.find((s) => s.role === 'cashier') || staffMembers[1] || staffMembers[0];
      setCurrentStaffId(cashierStaff.id);
      setCurrentRoleState('cashier');
      setIsAuthenticatedState(true);
      setIsLocked(false);
      logActivity('Login', `${cashierStaff.name} logged in`);
      return { success: true };
    }

    return { success: false, error: 'Invalid PIN entered. Please try again.' };
  };

  const switchStaff = (staffId: string) => {
    const staff = staffMembers.find((s) => s.id === staffId);
    if (staff) {
      setCurrentStaffId(staff.id);
      setCurrentRoleState(staff.role);
      logActivity('Switch User', `Switched active terminal profile to ${staff.name}`);
    }
  };

  const logout = () => {
    logActivity('Logout', `${currentStaff.name} logged out`);
    setIsAuthenticatedState(false);
    setCurrentRoleState('customer');
    saveStorage(STORAGE_KEYS.IS_AUTHENTICATED, false);
    saveStorage(STORAGE_KEYS.CURRENT_ROLE, 'customer');
    setCart([]);
  };

  const addStaffMember = (staff: Omit<StaffMember, 'id'>) => {
    const newStaff: StaffMember = {
      ...staff,
      id: `staff-${Date.now()}`,
    };
    setStaffMembers((prev) => [...prev, newStaff]);
    logActivity('Staff Added', `Added ${newStaff.name} (${newStaff.role.toUpperCase()})`);
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    logActivity('Staff Updated', `Updated staff record for ${id}`);
  };

  const deleteStaffMember = (id: string) => {
    const s = staffMembers.find((item) => item.id === id);
    setStaffMembers((prev) => prev.filter((item) => item.id !== id));
    if (s) logActivity('Staff Removed', `Removed ${s.name}`);
  };

  const toggleDarkMode = () => {
    setIsDarkModeState((prev) => !prev);
  };

  const setIsDarkMode = (dark: boolean) => {
    setIsDarkModeState(dark);
  };

  const formatCurrency = (amount: number) => {
    const sym = settings.currencySymbol || '£';
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${amount < 0 ? '-' : ''}${sym}${formatted}`;
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logActivity('Settings Updated', 'Store configuration updated');
  };

  const addCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      logActivity('Category Added', `Added category ${trimmed}`);
    }
  };

  // Shift Management
  const openShift = (startingCash: number) => {
    const shift: RegisterShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      startingCash,
      cashSales: 0,
      cardSales: 0,
      mobileSales: 0,
      totalSales: 0,
      expectedCashInDrawer: startingCash,
      cashierName: currentStaff.name,
      isOpen: true,
    };
    setCurrentShift(shift);
    saveStorage('em_current_shift_v2', shift);
    logActivity('Shift Opened', `Opened register shift with ${formatCurrency(startingCash)} starting float`);
  };

  const closeShift = (actualCashInDrawer: number, notes?: string) => {
    const diff = actualCashInDrawer - currentShift.expectedCashInDrawer;
    const closed: RegisterShift = {
      ...currentShift,
      closedAt: new Date().toISOString(),
      actualCashInDrawer,
      difference: diff,
      isOpen: false,
      notes,
    };
    setCurrentShift(closed);
    saveStorage('em_current_shift_v2', closed);
    logActivity(
      'Shift Closed',
      `Closed shift. Expected: ${formatCurrency(currentShift.expectedCashInDrawer)}, Actual: ${formatCurrency(actualCashInDrawer)} (Diff: ${formatCurrency(diff)})`
    );
  };

  // Product Operations
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      damaged: prodData.damaged || 0,
      returned: prodData.returned || 0,
    };
    setProducts((prev) => [newProd, ...prev]);
    logActivity('Product Added', `${newProd.name} (SKU: ${newProd.sku})`);
    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    logActivity('Product Updated', `Updated details for product ${id}`);
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      logActivity('Product Deleted', `Removed ${target.name} (SKU: ${target.sku})`);
    }
  };

  const adjustStock = (
    productId: string,
    newStock: number,
    reason: string,
    type: 'adjustment' | 'restock' | 'damaged' = 'adjustment'
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const change = newStock - prod.stock;
    updateProduct(productId, { stock: newStock });

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId,
      productName: prod.name,
      sku: prod.sku,
      type,
      quantityChange: change,
      previousStock: prod.stock,
      newStock,
      note: reason,
      timestamp: new Date().toISOString(),
    };
    setStockMovements((prev) => [movement, ...prev]);
    logActivity('Stock Adjusted', `${prod.name}: ${prod.stock} -> ${newStock} (${reason})`);
  };

  const recordDamage = (productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || quantity <= 0) return;
    const newStock = Math.max(0, prod.stock - quantity);
    const newDamaged = (prod.damaged || 0) + quantity;
    updateProduct(productId, { stock: newStock, damaged: newDamaged });
    logActivity('Damage Recorded', `${prod.name}: +${quantity} damaged units recorded`);
  };

  const recordReturn = (productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || quantity <= 0) return;
    const newStock = prod.stock + quantity;
    const newReturned = (prod.returned || 0) + quantity;
    updateProduct(productId, { stock: newStock, returned: newReturned });
    logActivity('Return Recorded', `${prod.name}: +${quantity} returned units restored to stock`);
  };

  const outOfStockProducts = (products || []).filter((p) => p.stock <= 0);
  const lowStockProducts = (products || []).filter(
    (p) => p.stock > 0 && p.stock <= (p.minStockLevel || settings.lowStockThresholdDefault || 10)
  );

  const totalInventoryValue = (products || []).reduce((acc, p) => acc + (p.stock || 0) * (p.sellingPrice || 0), 0);

  // Cart & POS Calculations
  const addToCart = (product: Product, quantity = 1) => {
    playBeep(980, 'sine', 0.08);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const setCartItemDiscount = (productId: string, discountPercent: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, discountPercent } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((acc, item) => {
    const unitPrice = item.customPrice ?? item.product.sellingPrice;
    return acc + unitPrice * item.quantity;
  }, 0);

  const cartDiscountTotal = cart.reduce((acc, item) => {
    if (!item.discountPercent) return acc;
    const unitPrice = item.customPrice ?? item.product.sellingPrice;
    const itemTotal = unitPrice * item.quantity;
    return acc + (itemTotal * item.discountPercent) / 100;
  }, 0);

  const cartTaxTotal =
    ((cartSubtotal - cartDiscountTotal) * (settings.taxRatePercent || 0)) / 100;

  const cartGrandTotal = Math.max(0, cartSubtotal - cartDiscountTotal + cartTaxTotal);

  const checkout = (
    paymentMethod: PaymentMethod,
    amountTendered?: number,
    notes?: string,
    customDiscountAmount = 0,
    customTaxPercent = 0
  ): Order | null => {
    if (cart.length === 0) return null;

    const discountTotal = customDiscountAmount > 0 ? customDiscountAmount : cartDiscountTotal;
    const taxRate = customTaxPercent > 0 ? customTaxPercent : settings.taxRatePercent || 0;
    const taxTotal = ((cartSubtotal - discountTotal) * taxRate) / 100;
    const grandTotal = Math.max(0, cartSubtotal - discountTotal + taxTotal);

    let totalCost = 0;
    const orderItems = cart.map((item) => {
      const unitPrice = item.customPrice ?? item.product.sellingPrice;
      const itemSubtotal = unitPrice * item.quantity;
      const itemDiscount = item.discountPercent ? (itemSubtotal * item.discountPercent) / 100 : 0;
      const totalPrice = itemSubtotal - itemDiscount;
      const itemCost = item.product.costPrice * item.quantity;
      totalCost += itemCost;

      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        category: item.product.category,
        quantity: item.quantity,
        costPrice: item.product.costPrice,
        unitPrice,
        totalPrice,
        discountAmount: itemDiscount,
      };
    });

    const tendered = amountTendered !== undefined ? amountTendered : grandTotal;
    const changeGiven = Math.max(0, tendered - grandTotal);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${new Date().getMonth() + 1}${new Date().getDate()}-${String(
        orders.length + 1
      ).padStart(3, '0')}`,
      items: orderItems,
      subtotal: cartSubtotal,
      discountTotal,
      taxTotal,
      taxRate,
      grandTotal,
      totalCost,
      grossProfit: grandTotal - totalCost,
      paymentMethod,
      amountTendered: tendered,
      changeGiven,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in',
      cashierName: currentStaff.name || (currentRole === 'admin' ? 'Admin User' : 'Cashier User'),
      notes,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    // Deduct stock for all items
    cart.forEach((item) => {
      const prod = products.find((p) => p.id === item.product.id);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        updateProduct(prod.id, { stock: newStock });

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${item.product.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'sale',
          quantityChange: -item.quantity,
          previousStock: prod.stock,
          newStock,
          referenceId: newOrder.id,
          note: `Completed sale to ${newOrder.customerName}`,
          timestamp: new Date().toISOString(),
        };
        setStockMovements((prev) => [movement, ...prev]);
      }
    });

    // Update customer stats if applicable
    if (selectedCustomer) {
      updateCustomer(selectedCustomer.id, {
        totalSpent: selectedCustomer.totalSpent + grandTotal,
        totalOrders: selectedCustomer.totalOrders + 1,
        loyaltyPoints: selectedCustomer.loyaltyPoints + Math.floor(grandTotal / 10),
      });
    }

    setOrders((prev) => [newOrder, ...prev]);
    setLastCompletedOrder(newOrder);
    logActivity('Sale Created', `${newOrder.customerName} - ${formatCurrency(grandTotal)}`);

    // Audio & visual celebration
    playBeep(1200, 'sine', 0.2);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });

    clearCart();
    setSelectedCustomer(null);
    return newOrder;
  };

  const refundOrder = (orderId: string, returnInventory: boolean) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' } : o))
    );

    if (returnInventory) {
      order.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const newStock = prod.stock + item.quantity;
          updateProduct(prod.id, { stock: newStock });
        }
      });
    }

    logActivity('Order Refunded', `Refunded ${order.orderNumber} (${formatCurrency(order.grandTotal)})`);
  };

  // Purchases
  const addPurchase = (poData: Omit<PurchaseOrder, 'id'>) => {
    const newPo: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`,
    };
    setPurchases((prev) => [newPo, ...prev]);
    logActivity('Purchase Order Created', `${newPo.poNumber} for ${newPo.supplierName}`);
  };

  const receivePurchase = (poId: string) => {
    const po = purchases.find((p) => p.id === poId);
    if (!po) return;

    // Add stock for each received product
    po.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        adjustStock(
          prod.id,
          prod.stock + item.quantityOrdered,
          `Received PO ${po.poNumber}`,
          'restock'
        );
      }
    });

    setPurchases((prev) =>
      prev.map((p) =>
        p.id === poId
          ? { ...p, status: 'received', receivedDate: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    logActivity('Purchase Order Received', `Restocked inventory from ${po.poNumber}`);
  };

  const cancelPurchase = (poId: string) => {
    setPurchases((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'cancelled' } : p))
    );
    logActivity('Purchase Cancelled', `Cancelled purchase order ${poId}`);
  };

  // Customers
  const addCustomer = (custData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
      creditBalance: custData.creditBalance || 0,
      status: custData.status || 'Active',
    };
    setCustomers((prev) => [newCust, ...prev]);
    logActivity('Customer Added', `${newCust.name} (${newCust.phone})`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (cust) logActivity('Customer Deleted', `Removed customer ${cust.name}`);
  };

  // Suppliers
  const addSupplier = (supData: Omit<Supplier, 'id' | 'activeOrdersCount'>): Supplier => {
    const newSup: Supplier = {
      ...supData,
      id: `sup-${Date.now()}`,
      activeOrdersCount: 0,
      outstandingBalance: supData.outstandingBalance || 0,
      productsCount: supData.productsCount || 0,
    };
    setSuppliers((prev) => [newSup, ...prev]);
    logActivity('Supplier Added', `${newSup.name}`);
    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSupplier = (id: string) => {
    const sup = suppliers.find((s) => s.id === id);
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    if (sup) logActivity('Supplier Deleted', `Removed supplier ${sup.name}`);
  };

  // Expenses
  const addExpense = (expData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    logActivity('Expense Added', `${newExp.category}: ${formatCurrency(newExp.amount)}`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logActivity('Expense Removed', `Removed expense ${id}`);
  };

  // User Accounts
  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setUsers((prev) => [newUser, ...prev]);

    // Also sync to staffMembers
    setStaffMembers((prev) => [
      ...prev,
      {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        pin: newUser.pin,
        email: newUser.email,
        phone: newUser.phone,
        active: newUser.status === 'Active',
      },
    ]);

    logActivity('User Created', `Added ${newUser.name} (${newUser.role.toUpperCase()})`);
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    setStaffMembers((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: updates.name ?? s.name,
              role: updates.role ?? s.role,
              pin: updates.pin ?? s.pin,
              email: updates.email ?? s.email,
              phone: updates.phone ?? s.phone,
              active: updates.status ? updates.status === 'Active' : s.active,
            }
          : s
      )
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
    logActivity('User Deleted', `Removed user ${id}`);
  };

  // Customer Online Orders Handlers
  const addCustomerOrder = (
    orderData: Omit<CustomerOnlineOrder, 'id' | 'createdAt' | 'orderNumber' | 'status'>
  ): CustomerOnlineOrder => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: CustomerOnlineOrder = {
      ...orderData,
      id: `cust-ord-${Date.now()}`,
      orderNumber: `ORD-${randomNum}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomerOrders((prev) => [newOrder, ...prev]);
    logActivity(
      'Customer Order Received',
      `New order ${newOrder.orderNumber} from ${newOrder.customerName || 'Customer'} (${newOrder.totalItems} items)`
    );
    playBeep(980, 'triangle', 0.18);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch {
      // Ignore confetti if unsupported
    }
    return newOrder;
  };

  const updateCustomerOrderStatus = (
    orderId: string,
    status: CustomerOnlineOrder['status'],
    adminNotes?: string
  ) => {
    setCustomerOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              adminNotes: adminNotes !== undefined ? adminNotes : o.adminNotes,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    logActivity('Order Status Updated', `Order ${orderId} changed to ${status.toUpperCase()}`);
  };

  const deleteCustomerOrder = (orderId: string) => {
    setCustomerOrders((prev) => prev.filter((o) => o.id !== orderId));
    logActivity('Customer Order Deleted', `Removed customer order ${orderId}`);
  };

  // Customer Feedback Handlers
  const addFeedback = (
    feedbackData: Omit<CustomerFeedback, 'id' | 'createdAt' | 'status'>
  ): CustomerFeedback => {
    const newFeedback: CustomerFeedback = {
      ...feedbackData,
      id: `fb-${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    setFeedbacks((prev) => [newFeedback, ...prev]);
    logActivity(
      'Customer Feedback Received',
      `${newFeedback.rating}★ Review from ${newFeedback.customerName || 'Customer'} [${newFeedback.category}]`
    );
    playBeep(880, 'sine', 0.15);
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } catch {
      // Ignore confetti
    }
    return newFeedback;
  };

  const updateFeedbackStatus = (
    feedbackId: string,
    status: CustomerFeedback['status'],
    adminNote?: string
  ) => {
    setFeedbacks((prev) =>
      prev.map((f) =>
        f.id === feedbackId
          ? {
              ...f,
              status,
              adminNote: adminNote !== undefined ? adminNote : f.adminNote,
            }
          : f
      )
    );
    logActivity('Feedback Status Updated', `Feedback ${feedbackId} marked as ${status.toUpperCase()}`);
  };

  const deleteFeedback = (feedbackId: string) => {
    setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
    logActivity('Feedback Deleted', `Removed feedback ${feedbackId}`);
  };

  // Reset & Backup
  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setOrders(INITIAL_ORDERS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchases(INITIAL_PURCHASES);
    setExpenses(INITIAL_EXPENSES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setUsers(INITIAL_USERS);
    setStaffMembers(INITIAL_STAFF);
    setSettings(INITIAL_SETTINGS);
    setStockMovements(INITIAL_MOVEMENTS);
    setCustomerOrders(INITIAL_CUSTOMER_ORDERS);
    setFeedbacks(INITIAL_FEEDBACKS);
    setCart([]);
    logActivity('Database Reset', 'Reset all records to initial catalog & feedback');
  };

  const exportDatabaseJSON = () => {
    const data = {
      settings,
      products,
      categories,
      orders,
      customers,
      suppliers,
      purchases,
      expenses,
      auditLogs,
      users,
      staffMembers,
      customerOrders,
      feedbacks,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topfruit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('Backup Exported', 'Full database JSON backup created');
  };

  const backupDatabase = () => {
    exportDatabaseJSON();
  };

  const restoreDatabase = (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.orders && Array.isArray(data.orders)) setOrders(data.orders);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (data.purchases && Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (data.customerOrders && Array.isArray(data.customerOrders)) setCustomerOrders(data.customerOrders);
      if (data.feedbacks && Array.isArray(data.feedbacks)) setFeedbacks(data.feedbacks);
      if (data.settings) setSettings(data.settings);
      if (data.users) setUsers(data.users);
      logActivity('Backup Restored', 'Restored database from uploaded JSON backup');
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        isLocked,
        setIsLocked,
        currentRole,
        currentStaff,
        staffMembers,
        users,
        switchStaff,
        loginStaff,
        loginWithRoleAndPin,
        loginWithPin,
        loginAdminWithPin,
        verifyAdminPin,
        quickLoginStaff,
        logout,
        setDirectRole,
        addUser,
        updateUser,
        deleteUser,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        settings,
        updateSettings,
        formatCurrency,
        products,
        categories,
        addCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        recordDamage,
        recordReturn,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        setCartItemDiscount,
        clearCart,
        cartSubtotal,
        cartDiscountTotal,
        cartTaxTotal,
        cartGrandTotal,
        selectedCustomer,
        setSelectedCustomer,
        checkout,
        orders,
        refundOrder,
        lastCompletedOrder,
        setLastCompletedOrder,
        purchases,
        purchaseOrders: purchases,
        addPurchase,
        createPurchaseOrder: addPurchase,
        receivePurchase,
        receivePurchaseOrder: receivePurchase,
        cancelPurchase,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        expenses,
        addExpense,
        deleteExpense,
        currentShift,
        openShift,
        closeShift,
        customerOrders,
        addCustomerOrder,
        updateCustomerOrderStatus,
        deleteCustomerOrder,
        feedbacks,
        addFeedback,
        updateFeedbackStatus,
        deleteFeedback,
        dbStatus,
        isCloudConnected,
        lastSyncedAt,
        auditLogs,
        logActivity,
        stockMovements,
        resetToDefaultData,
        resetToDemoData: resetToDefaultData,
        exportDatabaseJSON,
        exportDataJSON: exportDatabaseJSON,
        backupDatabase,
        restoreDatabase,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
