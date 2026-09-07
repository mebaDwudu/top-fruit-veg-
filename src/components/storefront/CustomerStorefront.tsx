import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types/store';
import { getProduceMeta } from '../../utils/produceImages';
import { ProductDetailModal } from './ProductDetailModal';
import { CustomerCartDrawer, CustomerCartItem } from './CustomerCartDrawer';
import { CustomerFeedbackModal } from '../modals/CustomerFeedbackModal';
import { ShareStoreModal } from '../modals/ShareStoreModal';
import { CustomerOrderTrackerModal } from './CustomerOrderTrackerModal';
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
  Truck,
  Sparkles,
} from 'lucide-react';

interface CustomerStorefrontProps {
  onSwitchToStaff: () => void;
}

type CustomerPageTab = 'landing' | 'home' | 'about_contact';

export const CustomerStorefront: React.FC<CustomerStorefrontProps> = ({ onSwitchToStaff }) => {
  const { products, categories, formatCurrency, settings } = useStore();

  // Navigation & view state (defaults to landing page on open)
  const [currentTab, setCurrentTab] = useState<CustomerPageTab>('landing');
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
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [preFilledOrderCode, setPreFilledOrderCode] = useState('');

  const showPrices = settings.showPricesToCustomers ?? false;

  // Single featured fruit spotlight for landing page (e.g. Dominican Sweet Mango, Papaya, or top stall fruit)
  const featuredFruit = useMemo(() => {
    return (
      products.find(
        (p) =>
          (p.name.toLowerCase().includes('mango') ||
            p.name.toLowerCase().includes('papaya') ||
            p.name.toLowerCase().includes('pineapple') ||
            p.name.toLowerCase().includes('passion') ||
            p.name.toLowerCase().includes('plantain') ||
            p.name.toLowerCase().includes('melon')) &&
          p.stock > 0
      ) ||
      products.find((p) => p.category.toLowerCase().includes('fruit') && p.stock > 0) ||
      products[0] ||
      null
    );
  }, [products]);

  const featuredFruitMeta = useMemo(() => {
    if (!featuredFruit) return null;
    return getProduceMeta(featuredFruit.name, featuredFruit.category, featuredFruit.image);
  }, [featuredFruit]);

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
    <div className={`min-h-screen w-full max-w-full text-slate-900 flex flex-row overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-white ${
      currentTab === 'landing' ? 'bg-white' : 'bg-emerald-50/40'
    }`}>
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
        className={`fixed top-0 left-0 z-40 h-screen w-60 max-w-[85vw] bg-white border-r border-emerald-100 shadow-xl lg:shadow-none flex flex-col justify-between p-3 sm:p-4 transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          <div>
            {/* Brand Header with Secret 3-Click Admin Trigger */}
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-3">
              <div
                onClick={handleSecretAdminTrigger}
                className="flex items-center space-x-2.5 cursor-pointer group select-none"
                title="Top Fruit and Veg"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center text-white shadow-2xs text-xl">
                  🥭
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none truncate">
                    Top Fruit & Veg
                  </h1>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                    <span>Pitch 18 Brixton</span>
                  </p>
                </div>
              </div>
              {/* Mobile close button */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Primary Navigation Buttons in Left Sidebar */}
            <nav className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 pb-0.5">
                Stall Navigation
              </div>

              {/* Button 1: Home / Landing */}
              <button
                id="customer-nav-landing"
                onClick={() => {
                  setCurrentTab('landing');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentTab === 'landing'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>🏠</span>
                  <span>Home</span>
                </div>
              </button>

              {/* Button 2: Produce Catalog */}
              <button
                id="customer-nav-home"
                onClick={() => {
                  setCurrentTab('home');
                  setSelectedCategory('All');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentTab === 'home'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>🥭</span>
                  <span>Produce</span>
                </div>
                <span className={`text-[11px] ${currentTab === 'home' ? 'text-slate-300' : 'text-slate-400'}`}>
                  {products.length}
                </span>
              </button>

              {/* Button 3: Track Order */}
              <button
                id="customer-nav-track"
                onClick={() => {
                  setIsTrackerModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-slate-500" />
                  <span>Track Order</span>
                </div>
              </button>

              {/* Button 4: Feedback */}
              <button
                id="customer-nav-feedback"
                onClick={() => {
                  setIsFeedbackModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">⭐</span>
                  <span>Feedback</span>
                </div>
              </button>

              {/* Button 5: About */}
              <button
                id="customer-nav-about-contact"
                onClick={() => {
                  setCurrentTab('about_contact');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentTab === 'about_contact'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>About Stall</span>
                </div>
                <span className={`text-[11px] ${currentTab === 'about_contact' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Pitch 18
                </span>
              </button>
            </nav>
          </div>

          <div className="space-y-2">
            {/* Brixton Market Clean Info */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <div className="flex items-center space-x-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-600" />
                  <span>Brixton Market</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">Open Daily</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pitch 18 Pope's Road, London SW9
              </p>
              <div className="flex items-center space-x-1 text-[11px] text-slate-600 pt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <a href="tel:+447449338679" className="hover:text-emerald-700 transition-colors">
                  +44 7449 338679
                </a>
              </div>
            </div>

            {/* Action Buttons: WhatsApp & Share */}
            <div className="grid grid-cols-2 gap-1.5">
              <a
                href="https://wa.me/447449338679?text=Hello%20Top%20Fruits%20and%20Veg%20Brixton!%20I%20would%20like%20to%20place%20a%20pre-order."
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer border border-slate-200"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-2 border-t border-emerald-100">
          <div
            onClick={handleSecretAdminTrigger}
            className="text-center text-[10px] text-slate-400 select-none cursor-pointer hover:text-slate-600 transition-colors"
            title="Pitch 18 Brixton Market"
          >
            <span>Brixton Market • Pitch 18</span>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT AREA (PC OFFSET BY FIXED SIDEBAR) */}
      {/* ========================================================= */}
      <div className="flex-1 min-w-0 lg:pl-60 flex flex-col min-h-screen bg-transparent">
        {/* Top Header Bar (Solid bright clean look) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 leading-tight flex items-center gap-1.5 sm:gap-2">
                {currentTab === 'landing' ? (
                  <>
                    <Store className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 inline-block shrink-0" />
                    <span className="sm:hidden">Top Fruit & Veg</span>
                    <span className="hidden sm:inline">Top Fruit & Veg • Pitch 18 Brixton Market</span>
                  </>
                ) : currentTab === 'home' ? (
                  <>
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 inline-block shrink-0" />
                    <span className="sm:hidden">Produce</span>
                    <span className="hidden sm:inline">Fresh Produce Catalog</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 inline-block shrink-0" />
                    <span className="sm:hidden">About</span>
                    <span className="hidden sm:inline">About Us & Stall Contacts</span>
                  </>
                )}
              </h2>
              <p className="text-[11px] text-emerald-700 font-bold hidden sm:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <span>Brixton Market Pitch 18 • Fresh Daily</span>
              </p>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Customer Track Order Button */}
            <button
              id="header-btn-track"
              onClick={() => setIsTrackerModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span>Track</span>
            </button>

            {/* Customer Feedback Button in Header */}
            <button
              id="header-btn-feedback"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Feedback</span>
            </button>

            {/* Direct Stall Call */}
            <a
              href="tel:+447449338679"
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>+44 7449 338679</span>
            </a>

            {/* Shopping Basket Drawer Trigger */}
            <button
              id="header-btn-orders"
              onClick={() => setIsCartOpen(true)}
              className="relative py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-emerald-800 rounded-full text-[10px] font-bold leading-none">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* VIEW 0: LANDING PAGE (LIGHTER PALETTE: 5% YELLOW, 5% GREEN, 5% PINK, REST WHITE) */}
        {/* ========================================================= */}
        {currentTab === 'landing' && (
          <main
            className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200"
            style={{
              background:
                'radial-gradient(ellipse 70% 35% at 10% 5%, rgba(254, 240, 138, 0.22) 0%, transparent 60%), ' +
                'radial-gradient(ellipse 70% 35% at 90% 10%, rgba(167, 243, 208, 0.22) 0%, transparent 60%), ' +
                'radial-gradient(ellipse 60% 45% at 50% 95%, rgba(251, 207, 232, 0.20) 0%, transparent 60%), #ffffff',
            }}
          >
            {/* Lighter Color Hero Banner: White with 5% Yellow, 5% Green, 5% Pink Accents */}
            <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-7 md:p-8 lg:p-10 shadow-xs">
              {/* Soft Ambient Corner Accents (5% Yellow, 5% Green, 5% Pink) */}
              <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-yellow-100/50 blur-3xl pointer-events-none" />
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 left-1/3 w-64 h-64 rounded-full bg-pink-100/50 blur-3xl pointer-events-none" />

              {/* Main 2-Column Responsive Layout: Left Info & Actions, Right 1 Fruit Spotlight */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
                {/* LEFT SIDE: Text, Badges, CTAs, Location (md:col-span-7) */}
                <div className="md:col-span-7 space-y-4">
                  {/* 3 Balanced Soft Color Badges: Yellow (5%), Green (5%), Pink (5%) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200/80 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
                      <span>Sun-Fresh Daily</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                      <span>Pitch 18 • Brixton Market</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-pink-50 text-pink-800 border border-pink-200/80 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block" />
                      <span>Tropical & Exotic Goods</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight font-display">
                    Top Fruit & Veg
                  </h1>

                  <p className="text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed max-w-xl font-normal">
                    Fresh tropical produce, Jamaican yams, sweet plantains, and market goods delivered fresh to our stall at 5:00 AM daily.
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <button
                      onClick={() => {
                        setCurrentTab('home');
                        setSelectedCategory('All');
                      }}
                      className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 active:scale-95 shadow-2xs"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Browse Produce</span>
                      <span>→</span>
                    </button>

                    <button
                      onClick={() => setIsTrackerModalOpen(true)}
                      className="px-3.5 sm:px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      Track Order
                    </button>

                    <a
                      href="https://wa.me/447449338679"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 sm:px-4 py-2.5 bg-white hover:bg-pink-50 text-slate-700 hover:text-pink-700 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* Minimal Location & Schedule Strip */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Pope's Road, London SW9 8PB
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                      Mon–Sat 8:00–18:30 • Sun 9:00–16:00
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                      Daily Selection
                    </span>
                  </div>
                </div>

                {/* RIGHT SIDE: 1 FRUIT SPOTLIGHT WITH BALANCED PROPORTIONS (md:col-span-5) */}
                <div className="md:col-span-5 w-full">
                  {featuredFruit && (
                    <div
                      onClick={() => setSelectedProduct(featuredFruit)}
                      className="group relative bg-white/95 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between max-w-sm sm:max-w-md mx-auto md:max-w-none"
                    >
                      {/* Top Header inside fruit card: 5% Yellow / Green accents */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="px-2.5 py-1 rounded-md bg-yellow-50 text-yellow-900 border border-yellow-200/80 text-[11px] font-semibold flex items-center gap-1.5 truncate">
                          <span>☀️</span>
                          <span>Today's Spotlight</span>
                        </span>
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70 flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          <span>Pitch 18 Pick</span>
                        </span>
                      </div>

                      {/* Fruit Image Container: Responsively proportioned on phone, tablet, and desktop */}
                      <div className="relative w-full h-40 sm:h-48 md:h-44 lg:h-52 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <img
                          src={featuredFruitMeta?.imageUrl || featuredFruit.image}
                          alt={featuredFruit.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80';
                          }}
                        />

                        {/* Top Right Ripeness Badge (Pink 5% touch) */}
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-pink-50/95 border border-pink-200/80 text-pink-900 text-[10px] font-semibold shadow-2xs">
                          {featuredFruitMeta?.estimatedWeight || 'Tropical Fresh'}
                        </span>

                        {/* Bottom Left Origin Badge */}
                        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-white/95 text-slate-800 text-[10px] font-medium shadow-2xs border border-slate-200/80 flex items-center gap-1 backdrop-blur-xs">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {featuredFruitMeta?.origin || 'Brixton Stall'}
                          </span>
                          {featuredFruitMeta?.isOrganic && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-semibold flex items-center gap-1">
                              <Leaf className="w-3 h-3" />
                              Organic
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fruit Metadata & Add to Cart button */}
                      <div className="pt-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
                            {featuredFruit.category}
                          </span>
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {featuredFruit.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            {showPrices ? (
                              <span className="text-xs sm:text-sm font-bold text-slate-900">
                                {formatCurrency(featuredFruit.sellingPrice)}{' '}
                                <span className="text-[10px] font-normal text-slate-500">
                                  / {featuredFruit.unit}
                                </span>
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Sold per {featuredFruit.unit || 'kg'}
                              </span>
                            )}
                            <span className="text-[10px] text-emerald-700 font-medium">
                              {featuredFruit.stock > 0 ? `${featuredFruit.stock} in stock` : 'Fresh arrival'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(featuredFruit);
                          }}
                          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs active:scale-95"
                          title="Add to Basket"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3 Accent Feature Cards: 5% Yellow, 5% Green, 5% Pink seated on White */}
              <div className="relative z-10 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 5% Yellow Card */}
                <div className="bg-yellow-50/80 border border-yellow-200/80 rounded-xl p-3.5 space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs font-bold mb-1">
                    ☀️
                  </div>
                  <div className="text-xs font-bold text-yellow-950">5:00 AM Dawn Fresh</div>
                  <div className="text-[11px] text-yellow-900/80 leading-relaxed">
                    Morning wholesale deliveries picked for top ripeness and authentic flavor.
                  </div>
                </div>

                {/* 5% Green Card */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold mb-1">
                    🌱
                  </div>
                  <div className="text-xs font-bold text-emerald-950">Pitch 18 Pope's Road</div>
                  <div className="text-[11px] text-emerald-900/80 leading-relaxed">
                    Iconic Brixton Market stall. Reserve online for stall collection or delivery.
                  </div>
                </div>

                {/* 5% Pink Card */}
                <div className="bg-pink-50/80 border border-pink-200/80 rounded-xl p-3.5 space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-800 flex items-center justify-center text-xs font-bold mb-1">
                    🌸
                  </div>
                  <div className="text-xs font-bold text-pink-950">Authentic Tropical Produce</div>
                  <div className="text-[11px] text-pink-900/80 leading-relaxed">
                    Yellow yams, sweet plantains, mangoes, breadfruit & Caribbean specialties.
                  </div>
                </div>
              </div>
            </section>

            {/* Produce Categories on Landing: Clean White with 5% Yellow, Green, Pink accents */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Produce Categories
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select a category to view fresh produce
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCurrentTab('home');
                    setSelectedCategory('All');
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>View all ({products.length})</span>
                  <span>→</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map((cat, idx) => {
                  const emoji = getCategoryEmoji(cat);
                  const count = products.filter((p) => p.category === cat).length;
                  const mod = idx % 3;
                  const accentBadge =
                    mod === 0
                      ? 'bg-yellow-50 text-yellow-800 border-yellow-200/60'
                      : mod === 1
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                      : 'bg-pink-50 text-pink-800 border-pink-200/60';
                  const hoverBorder =
                    mod === 0
                      ? 'hover:border-yellow-300'
                      : mod === 1
                      ? 'hover:border-emerald-300'
                      : 'hover:border-pink-300';

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setCurrentTab('home');
                        setSelectedCategory(cat);
                      }}
                      className={`p-4 rounded-xl bg-white border border-slate-200/80 ${hoverBorder} transition-all text-left group cursor-pointer hover:shadow-2xs`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{emoji}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${accentBadge}`}>
                          {count} {count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {cat}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </main>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: HOME (ONLY ALL THE FRUITS + TOP CATEGORY BUTTONS) */}
        {/* ========================================================= */}
        {currentTab === 'home' && (
          <main className="flex-1 w-full p-3 sm:p-6 lg:p-8 space-y-6">
            {/* Top Category Buttons Bar (Clean Solid Styling) */}
            <section className="w-full bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                    Produce Category
                  </h3>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing <span className="text-emerald-700 font-semibold">{filteredProducts.length}</span> of {products.length} items
                </div>
              </div>

              {/* Category Pill Buttons with Clean Solid Active States */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-200">
                {/* All Fruits Master Button */}
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                    selectedCategory === 'All'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span className="text-sm">🥭</span>
                  <span>All</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      selectedCategory === 'All'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'bg-slate-200 text-slate-700 font-medium'
                    }`}
                  >
                    {products.length}
                  </span>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span className="text-sm">{emoji}</span>
                      <span>{cat}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] ${
                          isSelected
                            ? 'bg-slate-800 text-white font-semibold'
                            : 'bg-emerald-100 text-emerald-800 font-medium'
                        }`}
                      >
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Fast Filters & Search Row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
                {/* Quick Search */}
                <div className="relative flex-1 min-w-[180px] max-w-sm">
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
                    placeholder="Search produce..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-900 focus:bg-white"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() =>
                      setSelectedOrganicFilter((prev) => (prev === 'organic' ? 'all' : 'organic'))
                    }
                    className={`px-3 py-2 rounded-lg font-medium flex items-center space-x-1 transition-colors cursor-pointer ${
                      selectedOrganicFilter === 'organic'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Organic</span>
                  </button>

                  <button
                    onClick={() =>
                      setSelectedAvailabilityFilter((prev) =>
                        prev === 'in-stock' ? 'all' : 'in-stock'
                      )
                    }
                    className={`px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedAvailabilityFilter === 'in-stock'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>In Stock</span>
                  </button>

                  {/* Sort Selection */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 text-xs font-medium focus:outline-hidden focus:border-slate-900 focus:bg-white"
                  >
                    <option value="name_asc">A–Z</option>
                    <option value="name_desc">Z–A</option>
                    {showPrices && (
                      <>
                        <option value="price_asc">Price Low</option>
                        <option value="price_desc">Price High</option>
                      </>
                    )}
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>
            </section>

            {/* FULL SCREEN FRUITS GRID: 5 ITEMS PER ROW ON PC & LARGER CARDS */}
            <section className="w-full">
              {filteredProducts.length === 0 ? (
                <div className="w-full bg-white border border-slate-200 rounded-xl p-12 text-center my-6">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-500">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">No produce matched</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Try clearing your search query or selecting "All".
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedOrganicFilter('all');
                      setSelectedAvailabilityFilter('all');
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
                  {filteredProducts.map((prod) => {
                    const meta = getProduceMeta(prod.name, prod.category, prod.image);
                    const isOutOfStock = prod.stock <= 0;
                    const isLowStock = prod.stock > 0 && prod.stock <= prod.minStockLevel;
                    const existingCartItem = cartItems.find((item) => item.product.id === prod.id);
                    const cartQty = existingCartItem?.quantity || 0;

                    return (
                      <div
                        key={prod.id}
                        className="group bg-white hover:border-slate-400 border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 flex flex-col hover:shadow-sm"
                      >
                        {/* Fruit Image Container (Enlarged for 5-per-row layout on PC) */}
                        <div
                          onClick={() => setSelectedProduct(prod)}
                          className="relative w-full h-44 sm:h-52 md:h-56 lg:h-64 bg-emerald-50/50 overflow-hidden cursor-pointer flex items-center justify-center"
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

        {/* Comprehensive Storefront Footer */}
        <footer className="mt-auto border-t border-emerald-200/80 bg-white text-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Col 1: Stall Heritage */}
              <div className="space-y-3">
                <div
                  onClick={handleSecretAdminTrigger}
                  className="flex items-center space-x-2.5 cursor-pointer group select-none"
                  title="Top Fruit and Veg • Pitch 18"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg shadow-2xs group-hover:bg-emerald-700 transition-colors">
                    🥭
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-900 transition-colors">
                      Top Fruit & Veg
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-bold">Pitch 18 Brixton Market</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Brixton's trusted family produce stall since 1998. Supplying the freshest tropical fruits, Jamaican yellow yams, green plantains, scotch bonnet peppers, and fresh daily greens.
                </p>
                <div className="flex items-center gap-2 pt-1 text-xs text-emerald-800 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Fresh Wholesale Stock Daily at 5am</span>
                </div>
              </div>

              {/* Col 2: Quick Links */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Quick Navigation
                </h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <button
                      onClick={() => setCurrentTab('landing')}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🏠</span>
                      <span>Home / Welcome</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setCurrentTab('home');
                        setSelectedCategory('All');
                      }}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🥭</span>
                      <span>Browse Fresh Produce</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsTrackerModalOpen(true)}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Track Your Order</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsFeedbackModalOpen(true)}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>Customer Reviews & Feedback</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentTab('about_contact')}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>About Stall & Contact</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 3: Stall Opening Hours */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stall Opening Hours</span>
                </h4>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-semibold text-slate-800">Monday – Saturday</span>
                    <span className="font-bold text-emerald-800">8:00 AM – 6:30 PM</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-semibold text-slate-800">Sunday</span>
                    <span className="font-bold text-emerald-800">9:00 AM – 4:00 PM</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                    <span>Wholesale Delivery</span>
                    <span>5:00 AM Daily</span>
                  </div>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 font-medium">
                  📍 Located on Pope's Road opposite Brixton Station archways.
                </div>
              </div>

              {/* Col 4: Contact & Orders */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stall Contact & WhatsApp</span>
                </h4>
                <p className="text-xs text-slate-600">
                  Pre-order, check today's fresh arrivals, or place large restaurant orders directly with Masgana.
                </p>
                <div className="space-y-2 pt-1">
                  <a
                    href="https://wa.me/447449338679"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>
                  <a
                    href="tel:+447449338679"
                    className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-3 rounded-xl text-xs font-bold transition-all border border-slate-200"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>+44 7449 338679</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex items-center space-x-1.5">
                <span>© {new Date().getFullYear()} Top Fruit and Veg Ltd. Pitch 18 Brixton Market. All rights reserved.</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-500">
                <button
                  onClick={handleSecretAdminTrigger}
                  className="hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Staff Portal (Click 3 times)"
                >
                  Stall Partner Access
                </button>
                <span>•</span>
                <span>Pope's Road, London SW9 8PB</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* MINIMALIST FLOATING ORDER BUTTON (LIGHT COLOR, MINIMALIST, ITEMS ONLY + CLEAN BUTTON) */}
      {/* ========================================================= */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 inset-x-0 mx-auto w-fit z-40 animate-in slide-in-from-bottom-3 duration-200 px-3">
          <div className="bg-white/95 text-slate-800 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-full px-3.5 py-1.5 flex items-center gap-3">
            <div
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 pl-1"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black shrink-0">
                {totalCartCount}
              </div>
              <span className="whitespace-nowrap">
                {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <button
              id="sticky-order-now-btn"
              onClick={() => setIsCartOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3.5 py-1.5 rounded-full text-xs flex items-center space-x-1 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <span>Place Order</span>
              <span className="text-xs">→</span>
            </button>
          </div>
        </div>
      )}

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
        onTrackOrder={(code) => {
          setPreFilledOrderCode(code);
          setIsTrackerModalOpen(true);
        }}
      />

      {/* Share QR Code Modal */}
      <ShareStoreModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Customer Order Tracker Modal */}
      <CustomerOrderTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        initialOrderCode={preFilledOrderCode}
      />
    </div>
  );
};
