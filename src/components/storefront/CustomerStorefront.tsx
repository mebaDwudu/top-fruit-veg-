import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types/store';
import { getProduceMeta } from '../../utils/produceImages';
import { ProductDetailModal } from './ProductDetailModal';
import { CustomerCartDrawer, CustomerCartItem } from './CustomerCartDrawer';
import { CustomerFeedbackModal } from '../modals/CustomerFeedbackModal';
import { ShareStoreModal } from '../modals/ShareStoreModal';
import { StoreLogo } from '../common/StoreLogo';
import { LiquidOrderButton } from './LiquidOrderButton';
import { sanitizeText, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';
import { validateHumanSubmission } from '../../utils/security';
import {
  Search,
  ShoppingBag,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Share2,
  Sparkles,
  Store,
  Leaf,
  Heart,
  Globe,
  Handshake,
  Send,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Plus,
  Minus,
  Star,
  Tag,
  Lock,
} from 'lucide-react';

interface CustomerStorefrontProps {
  onSwitchToStaff: () => void;
}

type CustomerPageTab = 'home' | 'about_contact';

export const CustomerStorefront: React.FC<CustomerStorefrontProps> = ({ onSwitchToStaff }) => {
  const { products, categories, formatCurrency, settings } = useStore();

  // Navigation & view state
  const [currentTab, setCurrentTab] = useState<CustomerPageTab>('home');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedOrganicFilter, setSelectedOrganicFilter] = useState<'all' | 'organic' | 'non-organic'>('all');
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'newest'>('name_asc');

  // Interactive state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CustomerCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');

  const showPrices = settings.showPricesToCustomers ?? false;

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    _website_hp: '', // Honeypot field for bot trap
  });
  const [formRenderedAt, setFormRenderedAt] = useState<number>(() => Date.now());
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Secret Admin Access Trigger (Keyboard shortcut & Triple-click on logo/footer)
  const [secretClickCount, setSecretClickCount] = useState(0);
  const secretClickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretAdminTrigger = () => {
    if (secretClickTimerRef.current) {
      clearTimeout(secretClickTimerRef.current);
    }
    const nextCount = secretClickCount + 1;
    setSecretClickCount(nextCount);
    if (nextCount >= 3) {
      setSecretClickCount(0);
      onSwitchToStaff();
    } else {
      secretClickTimerRef.current = setTimeout(() => {
        setSecretClickCount(0);
      }, 1500);
    }
  };

  // Keyboard shortcut: Ctrl+Shift+A or Cmd+Shift+A or Alt+Shift+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey || e.altKey) &&
        e.shiftKey &&
        (e.key === 'A' || e.key === 'a' || e.key === 'B' || e.key === 'b')
      ) {
        e.preventDefault();
        onSwitchToStaff();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwitchToStaff]);

  // Cart helper functions
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc, item) => acc + item.product.sellingPrice * item.quantity,
    0
  );

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearBag = () => {
    setCartItems([]);
  };

  // Filtered products for full-screen display
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const meta = getProduceMeta(p.name, p.category, p.image);

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesCategory = p.category.toLowerCase().includes(q);
          const matchesSku = p.sku.toLowerCase().includes(q);
          const matchesDesc = (p.description || '').toLowerCase().includes(q);
          const matchesOrigin = meta.origin.toLowerCase().includes(q);
          if (!matchesName && !matchesCategory && !matchesSku && !matchesDesc && !matchesOrigin) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'All' && p.category !== selectedCategory) {
          return false;
        }

        // Organic filter
        if (selectedOrganicFilter === 'organic' && !meta.isOrganic) return false;
        if (selectedOrganicFilter === 'non-organic' && meta.isOrganic) return false;

        // Availability filter
        if (selectedAvailabilityFilter === 'in-stock' && p.stock <= 0) return false;
        if (selectedAvailabilityFilter === 'out-of-stock' && p.stock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
        if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
        if (sortBy === 'newest') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        return 0;
      });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedOrganicFilter,
    selectedAvailabilityFilter,
    sortBy,
  ]);

  // Category Emoji & Icon Helper for rich colorful market presentation
  const getCategoryEmoji = (cat: string) => {
    if (cat.includes('Roots') || cat.includes('Yams')) return '🍠';
    if (cat.includes('Tropical') || cat.includes('Plantains')) return '🍌';
    if (cat.includes('Peppers') || cat.includes('Chillies') || cat.includes('Squashes')) return '🌶️';
    if (cat.includes('Tomatoes')) return '🍅';
    if (cat.includes('Citrus') || cat.includes('Fruits') || cat.includes('Orchard')) return '🍊';
    if (cat.includes('Onions') || cat.includes('Herbs') || cat.includes('Garlic')) return '🧅';
    if (cat.includes('Vegetables') || cat.includes('Greens')) return '🥬';
    return '🥭';
  };

  // Contact form submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    // Bot detection check
    const botCheck = validateHumanSubmission({
      honeypotValue: contactForm._website_hp,
      renderedTimestamp: formRenderedAt,
    });

    if (!botCheck.isHuman) {
      setContactError('Submission rejected: automated bot behavior detected.');
      return;
    }

    const cleanName = sanitizeText(contactForm.name, 100);
    const cleanEmail = sanitizeEmail(contactForm.email);
    const cleanPhone = sanitizePhone(contactForm.phone);
    const cleanMessage = sanitizeText(contactForm.message, 1500);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setContactError('Please enter your name, a valid email address, and a message.');
      return;
    }

    setContactSuccess(true);
    setContactError(null);
    setTimeout(() => {
      setContactSuccess(false);
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '', _website_hp: '' });
      setFormRenderedAt(Date.now());
    }, 4000);
  };

  return (
    <div className="min-h-screen w-full max-w-full bg-emerald-50/40 text-slate-900 flex flex-row overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-white">
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (Clean bright solid theme, no scrollbar, no admin login) */}
      {/* ========================================================= */}
      
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 max-w-[85vw] bg-white border-r border-emerald-100 shadow-xl lg:shadow-sm flex flex-col justify-between p-3.5 sm:p-4 transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto lg:overflow-hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Bright Fresh Brand Header with Secret 3-Click Admin Trigger */}
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
              <StoreLogo
                size="lg"
                onClick={handleSecretAdminTrigger}
              />
              {/* Mobile close button */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary Navigation Buttons in Left Sidebar */}
            <nav className="space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 flex items-center justify-between">
                <span>Browse Stall</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>

              {/* Button 1: Home / All Fruits */}
              <button
                id="customer-nav-home"
                onClick={() => {
                  setCurrentTab('home');
                  setSelectedCategory('All');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  currentTab === 'home'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">🥭</span>
                  <span>All Fresh Produce</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    currentTab === 'home'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {/* Button 2: Place Order / Basket */}
              <button
                id="customer-nav-basket"
                onClick={() => {
                  setIsCartOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">🧺</span>
                  <span>Order List</span>
                </div>
                {totalCartCount > 0 ? (
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-extrabold">
                      {totalCartCount}
                    </span>
                    {showPrices && (
                      <span className="text-[11px] text-amber-900 font-extrabold">
                        {formatCurrency(cartSubtotal)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400">0 items</span>
                )}
              </button>

              {/* Button 3: Customer Feedback */}
              <button
                id="customer-nav-feedback"
                onClick={() => {
                  setIsFeedbackModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-950 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">⭐</span>
                  <span>Leave Feedback</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                  Review
                </span>
              </button>

              {/* Button 4: About Us & Contacts */}
              <button
                id="customer-nav-about-contact"
                onClick={() => {
                  setCurrentTab('about_contact');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  currentTab === 'about_contact'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">📍</span>
                  <span>About & Contact</span>
                </div>
                <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 font-extrabold">
                  Pitch 18
                </span>
              </button>
            </nav>
          </div>

          <div className="space-y-2.5">
            {/* Brixton Market Quick Info Card */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900">
                <div className="flex items-center space-x-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Brixton Market Stall</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-bold">Open</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-snug">
                Pitch 18 Pope's Road, London SW9 8PB.
              </p>
              <div className="flex items-center space-x-1 text-[11px] text-emerald-800 font-extrabold">
                <Phone className="w-3 h-3 text-emerald-600" />
                <a href="tel:+447449338679" className="hover:underline">
                  +44 7449 338679
                </a>
              </div>
            </div>

            {/* WhatsApp Direct Order CTA (Solid bright green) */}
            <a
              href="https://wa.me/447449338679?text=Hello%20Top%20Fruits%20and%20Veg%20Brixton!%20I%20would%20like%20to%20place%20a%20pre-order."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>WhatsApp Pre-Order</span>
            </a>
          </div>
        </div>

        {/* Sidebar Footer: Share Store QR Code & Discreet Stall Details */}
        <div className="pt-3 border-t border-emerald-100 space-y-2">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-slate-200"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Share Stall QR Code</span>
          </button>

          {/* Discreet copyright trigger (Triple click secret) */}
          <div
            onClick={handleSecretAdminTrigger}
            className="py-1 text-center text-[10px] text-slate-400 select-none cursor-pointer hover:text-slate-600 transition-colors"
            title="Pitch 18 Brixton Market"
          >
            <span>Pitch 18 Pope's Road • Brixton</span>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT AREA (FULL SCREEN WIDTH) */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto bg-transparent">
        {/* Top Header Bar (Solid bright clean look) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5 sm:gap-4 shadow-2xs">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200 shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Prominent Logo on Mobile */}
            <div className="lg:hidden shrink-0">
              <StoreLogo
                size="sm"
                compactOnMobile={false}
                showSubtitle={false}
                onClick={handleSecretAdminTrigger}
              />
            </div>

            {/* Desktop Brand Context */}
            <div className="hidden lg:block min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight flex items-center gap-2">
                {currentTab === 'home' ? (
                  <>
                    <ShoppingBag className="w-5 h-5 text-emerald-600 inline-block" />
                    <span>Fresh Tropical Produce & Farm Goods</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 text-emerald-600 inline-block" />
                    <span>About Us & Stall Contacts</span>
                  </>
                )}
              </h2>
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <span>Brixton Market Pitch 18 • Hand-Picked Farm Direct Daily</span>
              </p>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Customer Feedback Button in Header */}
            <button
              id="header-btn-feedback"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-extrabold transition-all shadow-2xs cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Feedback</span>
            </button>

            {/* Direct Stall Call */}
            <a
              href="tel:+447449338679"
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-extrabold transition-all shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>+44 7449 338679</span>
            </a>

            {/* Shopping Basket Drawer Trigger */}
            <button
              id="header-btn-orders"
              onClick={() => setIsCartOpen(true)}
              className="relative py-2 px-3.5 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold flex items-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-emerald-800 rounded-full text-[11px] font-black leading-none shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* VIEW 1: HOME (ONLY ALL THE FRUITS + TOP CATEGORY BUTTONS) */}
        {/* ========================================================= */}
        {currentTab === 'home' && (
          <main className="flex-1 w-full p-3 sm:p-6 lg:p-8 space-y-6">
            {/* Top Category Buttons Bar (Clean Solid Styling) */}
            <section className="w-full bg-white border border-emerald-100 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
                    Filter by Produce Category
                  </h3>
                </div>
                <div className="text-xs text-slate-500 font-bold">
                  Showing <span className="text-emerald-700 font-black">{filteredProducts.length}</span> of {products.length} fresh items
                </div>
              </div>

              {/* Category Pill Buttons with Clean Solid Active States */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-200">
                {/* All Fruits Master Button */}
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center space-x-2 shadow-2xs ${
                    selectedCategory === 'All'
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="text-base">🥭</span>
                  <span>All Fresh Produce ({products.length})</span>
                </button>

                {/* Individual Category Buttons */}
                {categories.map((cat) => {
                  const emoji = getCategoryEmoji(cat);
                  const isSelected = selectedCategory === cat;
                  const catCount = products.filter((p) => p.category === cat).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center space-x-2 shadow-2xs ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                          : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span className="text-base">{emoji}</span>
                      <span>{cat}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          isSelected
                            ? 'bg-emerald-800 text-white font-extrabold'
                            : 'bg-emerald-100 text-emerald-800 font-bold'
                        }`}
                      >
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Fast Filters & Search Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-100 text-xs">
                {/* Quick Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (window.innerWidth < 768) {
                        window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
                      }
                    }}
                    placeholder="Search sweet mangoes, plantains, yams, citrus..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setSelectedOrganicFilter((prev) => (prev === 'organic' ? 'all' : 'organic'))
                    }
                    className={`px-3 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      selectedOrganicFilter === 'organic'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Organic Only</span>
                  </button>

                  <button
                    onClick={() =>
                      setSelectedAvailabilityFilter((prev) =>
                        prev === 'in-stock' ? 'all' : 'in-stock'
                      )
                    }
                    className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      selectedAvailabilityFilter === 'in-stock'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>In Stock Only</span>
                  </button>

                  {/* Sort Selection */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-extrabold focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="name_asc">Sort: A–Z</option>
                    <option value="name_desc">Sort: Z–A</option>
                    {showPrices && (
                      <>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                      </>
                    )}
                    <option value="newest">Sort: New Arrivals</option>
                  </select>
                </div>
              </div>
            </section>

            {/* FULL SCREEN FRUITS GRID (Solid clean white cards with full width) */}
            <section className="w-full">
              {filteredProducts.length === 0 ? (
                <div className="w-full bg-white border border-emerald-100 rounded-3xl p-12 text-center my-6 shadow-2xs">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
                    <Search className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">No fruits matched your filter</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Try clearing your search query or selecting "All Fruits".
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedOrganicFilter('all');
                      setSelectedAvailabilityFilter('all');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-5">
                  {filteredProducts.map((prod) => {
                    const meta = getProduceMeta(prod.name, prod.category, prod.image);
                    const isOutOfStock = prod.stock <= 0;
                    const isLowStock = prod.stock > 0 && prod.stock <= prod.minStockLevel;
                    const existingCartItem = cartItems.find((item) => item.product.id === prod.id);
                    const cartQty = existingCartItem?.quantity || 0;

                    return (
                      <div
                        key={prod.id}
                        className="group bg-white hover:border-emerald-500 border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-200 flex flex-col shadow-2xs hover:shadow-md hover:-translate-y-0.5"
                      >
                        {/* Fruit Image Container (Full card width & rich vivid photography) */}
                        <div
                          onClick={() => setSelectedProduct(prod)}
                          className="relative w-full h-40 sm:h-48 md:h-52 bg-emerald-50/50 overflow-hidden cursor-pointer flex items-center justify-center"
                        >
                          <img
                            src={meta.imageUrl}
                            alt={prod.name}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Organic Badge */}
                          {meta.isOrganic && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-lg shadow-xs flex items-center gap-0.5">
                              <Leaf className="w-3 h-3" />
                              <span className="hidden sm:inline">Organic</span>
                            </span>
                          )}

                          {/* Origin Country Flag / Badge */}
                          <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/95 text-amber-900 border border-amber-200 text-[10px] font-extrabold rounded-lg uppercase tracking-wider shadow-2xs">
                            {meta.origin}
                          </span>

                          {/* Stock Status Badge */}
                          <div className="absolute bottom-2 left-2">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold rounded-lg">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold rounded-lg">
                                {prod.stock} left
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Fruit Info & Pricing */}
                        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 block truncate">
                              {prod.category}
                            </span>
                            <h4
                              onClick={() => setSelectedProduct(prod)}
                              className="font-extrabold text-xs sm:text-sm md:text-base text-slate-900 group-hover:text-emerald-700 transition-colors cursor-pointer mt-0.5 truncate"
                              title={prod.name}
                            >
                              {prod.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 hidden sm:block">
                              {prod.description || `Fresh top grade ${prod.name}`}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <div>
                              {showPrices ? (
                                <>
                                  <div className="text-sm sm:text-base font-black text-slate-900">
                                    {formatCurrency(prod.sellingPrice)}
                                  </div>
                                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold">
                                    per {prod.unit || 'kg'}
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                                    per {prod.unit || 'kg'}
                                  </span>
                                  <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    Pitch 18 Fresh
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Add / Quantity Stepper Button */}
                            {cartQty > 0 ? (
                              <div className="flex items-center space-x-1 bg-emerald-50 border border-emerald-300 rounded-xl p-0.5 shadow-2xs">
                                <button
                                  onClick={() => handleUpdateCartQuantity(prod.id, cartQty - 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-700 hover:bg-white transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-4 text-center font-black text-xs text-emerald-800">
                                  {cartQty}
                                </span>
                                <button
                                  onClick={() =>
                                   handleUpdateCartQuantity(
                                      prod.id,
                                      Math.min(prod.stock, cartQty + 1)
                                    )
                                  }
                                  className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-700 hover:bg-white transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(prod, 1)}
                                disabled={isOutOfStock}
                                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs ${
                                  isOutOfStock
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ABOUT US & CONTACTS (Compact 2-Column Layout, No Scroll) */}
        {/* ========================================================= */}
        {currentTab === 'about_contact' && (
          <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Stall Profile & Details */}
              <section className="lg:col-span-6 bg-white border border-emerald-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-extrabold">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pitch 18 Pope's Road • Brixton Market</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Top Fruit and Veg
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Brixton's trusted family produce stall. We supply fresh seasonal tropical fruits, root vegetables, yams, plantains, scotch bonnets, and seasonings daily.
                  </p>
                </div>

                {/* 4 Compact Detail Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start space-x-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Stall Location</span>
                      <span className="text-slate-600 text-[11px]">Pitch 18 Pope's Road, Brixton SW9 8PB</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Phone Hotline</span>
                      <a href="tel:+447449338679" className="text-emerald-700 font-extrabold hover:underline text-[11px]">
                        +44 7449 338679
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Opening Hours</span>
                      <span className="text-slate-600 text-[11px]">Mon–Sat: 8am–6:30pm | Sun: 9am–5pm</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Produce In Stock</span>
                      <span className="text-emerald-700 font-bold text-[11px]">{products.length} Fresh Varieties</span>
                    </div>
                  </div>
                </div>

                {/* Direct WhatsApp Callout */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block">Click & Collect via WhatsApp</span>
                    <span className="text-[11px] text-slate-600 block">Pre-order bags or wholesale boxes for fast pickup</span>
                  </div>
                  <a
                    href="https://wa.me/447449338679?text=Hello%20Top%20Fruit%20and%20Veg%20Brixton!%20I%20would%20like%20to%20place%20an%20order."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </section>

              {/* Right Column: Direct Message Form */}
              <section className="lg:col-span-6 bg-white border border-emerald-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900">Send Stall Message</h3>
                  <p className="text-xs text-slate-500">
                    Have questions about seasonal fruit availability or bulk wholesale crates?
                  </p>
                </div>

                {contactSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Message received! We will contact you shortly.</span>
                  </div>
                )}

                {contactError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{contactError}</span>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-3">
                  {/* Honeypot Bot Trap Field */}
                  <div className="hidden" aria-hidden="true" style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}>
                    <label htmlFor="website_hp_sidebar">Website</label>
                    <input
                      id="website_hp_sidebar"
                      type="text"
                      name="_website_hp"
                      tabIndex={-1}
                      autoComplete="off"
                      value={contactForm._website_hp}
                      onChange={(e) => setContactForm({ ...contactForm, _website_hp: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        onBlur={() => {
                          if (window.innerWidth < 768) {
                            window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
                          }
                        }}
                        placeholder="e.g. Samuel Ade"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Email / Phone *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        onBlur={() => {
                          if (window.innerWidth < 768) {
                            window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
                          }
                        }}
                        placeholder="email@example.com or phone"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Subject</label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="Product Availability">Product / Seasonal Fruit Availability</option>
                      <option value="Wholesale Crates">Wholesale / Bulk Crate Inquiries</option>
                      <option value="Click and Collect">Click & Collect Pickup</option>
                      <option value="General Question">General Stall Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Message *</label>
                    <textarea
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      onBlur={() => {
                        if (window.innerWidth < 768) {
                          window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
                        }
                      }}
                      placeholder="Let us know what produce or quantities you need..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </main>
        )}

        {/* Minimal Storefront Footer */}
        <footer className="mt-auto border-t border-emerald-100 bg-white/90 px-4 sm:px-6 lg:px-8 py-4 text-slate-600">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div
              onClick={handleSecretAdminTrigger}
              className="flex items-center space-x-2 text-center sm:text-left cursor-pointer select-none group"
              title="Top Fruit and Veg • Pitch 18"
            >
              <Store className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700 shrink-0" />
              <div>
                <span className="font-extrabold text-slate-900 group-hover:text-emerald-950">Top Fruit and Veg</span>
                <span className="text-slate-400 mx-1.5">•</span>
                <span>Pitch 18 Pope's Road, Brixton Market, London SW9 8PB</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                id="footer-btn-feedback"
                onClick={() => setIsFeedbackModalOpen(true)}
                className="text-amber-800 hover:text-amber-950 font-extrabold flex items-center space-x-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors shadow-2xs"
              >
                <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                <span>Leave Feedback</span>
              </button>

              <button
                id="footer-btn-orders"
                onClick={() => setIsCartOpen(true)}
                className="text-emerald-800 hover:text-emerald-950 font-extrabold flex items-center space-x-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors shadow-2xs"
              >
                <ShoppingBag className="w-3 h-3 text-emerald-600" />
                <span>Order List ({totalCartCount})</span>
              </button>

              <a
                href="https://wa.me/447449338679"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1 px-2 py-1 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp Stall</span>
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* FLOATING LIQUID ORDER BUTTON (FLOWS / FOLLOWS SCROLL, SHOWS ONLY ITEMS & ORDER TYPE) */}
      {/* ========================================================= */}
      <LiquidOrderButton
        totalItems={totalCartCount}
        orderType={orderType}
        onToggleOrderType={setOrderType}
        onClick={() => setIsCartOpen(true)}
      />

      {/* ========================================================= */}
      {/* 3. MODALS & DRAWERS */}
      {/* ========================================================= */}

      {/* Customer Feedback Modal */}
      <CustomerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToBag={(prod, qty) => handleAddToCart(prod, qty)}
          currentBagQuantity={
            cartItems.find((item) => item.product.id === selectedProduct.id)?.quantity || 0
          }
        />
      )}

      {/* Shopping Bag / Order List Slide-Over Drawer */}
      <CustomerCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearBag={handleClearBag}
        fulfillmentType={orderType}
        onFulfillmentTypeChange={setOrderType}
      />

      {/* Share QR Code Modal */}
      <ShareStoreModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
