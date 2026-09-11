import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types/store';
import { getProduceMeta } from '../../utils/produceImages';
import { ProductDetailModal } from './ProductDetailModal';
import { CustomerCartDrawer, CustomerCartItem } from './CustomerCartDrawer';
import { CustomerFeedbackModal } from '../modals/CustomerFeedbackModal';
import { ShareStoreModal } from '../modals/ShareStoreModal';
import { CustomerOrderTrackerModal } from './CustomerOrderTrackerModal';
import { LivingBackground } from '../common/LivingBackground';
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
  Check,
  Home,
} from 'lucide-react';

const formatCategoryName = (cat: string): string => {
  const lower = cat.toLowerCase();
  if (lower.includes('fruit')) return 'Fruits';
  if (lower.includes('veg')) return 'Vegetables';
  if (lower.includes('root') || lower.includes('tuber')) return 'Roots';
  if (lower.includes('herb')) return 'Herbs';
  if (lower.includes('exotic') || lower.includes('tropical')) return 'Exotics';
  if (lower.includes('drink') || lower.includes('grocer')) return 'Groceries';
  return cat.split(' ')[0] || cat;
};

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

  // Micro-interaction states for tactile feedback
  const [cartBounce, setCartBounce] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [cartToastMessage, setCartToastMessage] = useState<string | null>(null);
  const cartToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Secret Admin Access Trigger (Keyboard shortcut & 4-click event on logo/footer trigger areas)
  const secretClickCountRef = React.useRef(0);
  const secretClickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretAdminTrigger = () => {
    if (secretClickTimerRef.current) {
      clearTimeout(secretClickTimerRef.current);
    }
    secretClickCountRef.current += 1;
    if (secretClickCountRef.current >= 4) {
      secretClickCountRef.current = 0;
      onSwitchToStaff();
    } else {
      secretClickTimerRef.current = setTimeout(() => {
        secretClickCountRef.current = 0;
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

  // Hash-based routing synchronization across desktop & mobile
  const applyHashRoute = useCallback((hashStr: string) => {
    const clean = hashStr.replace(/^#\/?/, '').toLowerCase().trim();
    if (!clean) return;

    if (clean === 'home' || clean === 'landing') {
      setCurrentTab('landing');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (clean === 'products' || clean === 'produce' || clean === 'catalog') {
      setCurrentTab('home');
      setSelectedCategory('All');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (clean === 'track-order' || clean === 'track' || clean === 'trackorder') {
      setIsTrackerModalOpen(true);
      setIsFeedbackModalOpen(false);
    } else if (clean === 'about-us' || clean === 'about' || clean === 'contact' || clean === 'about_contact') {
      setCurrentTab('about_contact');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (clean === 'feedback' || clean === 'reviews' || clean === 'review') {
      setIsFeedbackModalOpen(true);
      setIsTrackerModalOpen(false);
    }
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      applyHashRoute(window.location.hash);
    }

    const handleHashChange = () => {
      applyHashRoute(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [applyHashRoute]);

  // Navigation click handler for hash-based routing paths
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: '#/home' | '#/products' | '#/track-order' | '#/about-us' | '#/feedback'
  ) => {
    if (hash === '#/track-order') {
      setIsTrackerModalOpen(true);
      setIsFeedbackModalOpen(false);
    } else if (hash === '#/feedback') {
      setIsFeedbackModalOpen(true);
      setIsTrackerModalOpen(false);
    } else if (hash === '#/home') {
      setCurrentTab('landing');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hash === '#/products') {
      setCurrentTab('home');
      setSelectedCategory('All');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hash === '#/about-us') {
      setCurrentTab('about_contact');
      setIsTrackerModalOpen(false);
      setIsFeedbackModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileSidebarOpen(false);
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  };

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

    // Tactile micro-interaction feedback
    setRecentlyAddedId(product.id);
    setCartBounce(true);
    setCartToastMessage(`Added ${product.name} to basket`);

    if (cartToastTimeoutRef.current) {
      clearTimeout(cartToastTimeoutRef.current);
    }
    cartToastTimeoutRef.current = setTimeout(() => {
      setRecentlyAddedId(null);
      setCartBounce(false);
      setCartToastMessage(null);
    }, 1800);
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

  const renderProduceCatalogContent = () => (
    <div className="space-y-4">
      {/* Category Filter: Clean Minimal Single-Word Buttons */}
      <section className="w-full bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const singleWord = formatCategoryName(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {singleWord}
              </button>
            );
          })}
        </div>

        {/* Secondary Fast Filters & Search Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Quick Search */}
          <div className="relative w-full max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fruits, veg, herbs..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-900 focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* Produce Grid */}
      <section className="w-full">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <div className="text-3xl">🧺</div>
            <h4 className="text-base font-bold text-slate-800">No Produce Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No fresh produce matched "{searchQuery}". Try searching for another fruit, vegetable, or reset the filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedOrganicFilter('all');
                setSelectedAvailabilityFilter('all');
              }}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset Filters
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
                  className="group bg-white hover:border-emerald-400 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 card-hover-lift transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Fruit Image Container with Real Photo */}
                  <div
                    onClick={() => setSelectedProduct(prod)}
                    className="relative w-full aspect-square bg-slate-50 rounded-xl overflow-hidden cursor-pointer flex items-center justify-center"
                  >
                    <img
                      src={meta.imageUrl}
                      alt={prod.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80';
                      }}
                    />

                    {/* Stock Status Badge */}
                    {isOutOfStock && (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold rounded-md">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fruit Info & Pricing */}
                  <div className="pt-2.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        {formatCategoryName(prod.category)}
                      </span>

                      <h4
                        onClick={() => setSelectedProduct(prod)}
                        className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors cursor-pointer mt-0.5 truncate"
                        title={prod.name}
                      >
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 hidden sm:block">
                        {prod.description || `Fresh ${prod.name}`}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div>
                        {showPrices ? (
                          <>
                            <div className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                              {formatCurrency(prod.sellingPrice)}
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5">
                              per {prod.unit || 'kg'}
                            </div>
                          </>
                        ) : (
                          <div>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                              per {prod.unit || 'kg'}
                            </span>
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
                          <span className="w-4 text-center font-bold text-xs text-emerald-800">
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : recentlyAddedId === prod.id
                              ? 'bg-emerald-700 text-white shadow-emerald-500/20 scale-105'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {recentlyAddedId === prod.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 animate-in zoom-in-50" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </>
                          )}
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
    </div>
  );

  return (
    <div className={`relative min-h-screen w-full max-w-full text-slate-900 flex flex-row overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-white ${
      currentTab === 'landing' ? 'bg-white' : 'bg-emerald-50/40'
    }`}>
      {/* Living animated backdrop with subtle gradient orbs & dot grid */}
      <LivingBackground />
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
        className={`fixed top-0 left-0 z-50 h-screen w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl lg:hidden flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Brand Header with Secret 4-Click Admin Trigger */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div
                id="drawer-brand-admin-trigger"
                className="flex items-center space-x-2.5 group select-none"
                title="Top Fruit & Veg"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center text-white shadow-2xs text-xl">
                  🥭
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none truncate">
                    Top Fruit & Veg
                  </h1>
                </div>
              </div>
              {/* Mobile close button */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary Navigation Links in Mobile Drawer */}
            <nav className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 pb-0.5">
                Navigation
              </div>

              {/* Link 1: Home */}
              <a
                href="#/home"
                id="customer-nav-landing"
                onClick={(e) => handleNavClick(e, '#/home')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentTab === 'landing' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span>🏠</span>
                  <span>Home</span>
                </div>
              </a>

              {/* Link 2: Products */}
              <a
                href="#/products"
                id="customer-nav-home"
                onClick={(e) => handleNavClick(e, '#/products')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span>🥭</span>
                  <span>Products</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                  {products.length}
                </span>
              </a>

              {/* Link 3: Track Order */}
              <a
                href="#/track-order"
                id="customer-nav-track"
                onClick={(e) => handleNavClick(e, '#/track-order')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isTrackerModalOpen
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Track Order</span>
                </div>
              </a>

              {/* Link 4: About Us */}
              <a
                href="#/about-us"
                id="customer-nav-about-contact"
                onClick={(e) => handleNavClick(e, '#/about-us')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  currentTab === 'about_contact' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span>📍</span>
                  <span>About Us</span>
                </div>
              </a>

              {/* Link 5: Feedback */}
              <a
                href="#/feedback"
                id="customer-nav-feedback"
                onClick={(e) => handleNavClick(e, '#/feedback')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isFeedbackModalOpen
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-sm">⭐</span>
                  <span>Feedback</span>
                </div>
              </a>
            </nav>
          </div>

          <div className="space-y-2">
            {/* Brixton Market Clean Info */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <div className="flex items-center space-x-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Brixton Market</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">Open Daily</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pitch 18 Pope's Road, London SW9
              </p>
              <div className="flex items-center space-x-1 text-[11px] text-slate-700 pt-0.5">
                <Phone className="w-3 h-3 text-emerald-600" />
                <a href="tel:+447449338679" className="hover:text-emerald-700 font-semibold transition-colors">
                  +44 7449 338679
                </a>
              </div>
            </div>

            {/* Action Buttons: WhatsApp & Share */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://wa.me/447449338679?text=Hello%20Top%20Fruits%20and%20Veg%20Brixton!%20I%20would%20like%20to%20place%20a%20pre-order."
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="pt-2 border-t border-slate-100 text-center text-[10px] text-slate-400">
          <span>Pitch 18 Brixton Market</span>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT AREA (CLEAN FULL WIDTH TOP-HEADER LAYOUT) */}
      {/* ========================================================= */}
      <div className="flex-1 min-w-0 w-full flex flex-col min-h-screen bg-transparent">
        {/* ========================================================= */}
        {/* FULL-WIDTH STICKY HEADER (AT THE VERY TOP OF THE WEBSITE) */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
            {/* Logo & Mobile Menu Toggle */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200 cursor-pointer transition-colors"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <a
                href="#/home"
                id="header-brand-admin-trigger"
                onClick={(e) => {
                  e.preventDefault();
                  onSwitchToStaff();
                }}
                className="flex items-center space-x-2.5 cursor-pointer select-none group"
                title="Top Fruit & Veg"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 transition-colors flex items-center justify-center text-white text-xl shadow-xs">
                  🥭
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight group-hover:text-emerald-700 transition-colors">
                    Top Fruit & Veg
                  </h1>
                </div>
              </a>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {/* 1. Home */}
              <a
                href="#/home"
                id="header-nav-home"
                onClick={(e) => handleNavClick(e, '#/home')}
                className={`group relative py-2 px-3 text-sm font-medium tracking-tight cursor-pointer select-none transition-colors duration-200 ${
                  currentTab === 'landing' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="inline-block transition-transform duration-200 ease-out group-hover:-translate-y-[1px]">
                  Home
                </span>
                <span
                  className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-emerald-600 transition-all duration-200 ease-out origin-center ${
                    currentTab === 'landing' && !isTrackerModalOpen && !isFeedbackModalOpen
                      ? 'scale-x-100 opacity-100'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                  }`}
                />
              </a>

              {/* 2. Products */}
              <a
                href="#/products"
                id="header-nav-products"
                onClick={(e) => handleNavClick(e, '#/products')}
                className={`group relative py-2 px-3 text-sm font-medium tracking-tight cursor-pointer select-none transition-colors duration-200 ${
                  currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="inline-block transition-transform duration-200 ease-out group-hover:-translate-y-[1px]">
                  Products
                </span>
                <span
                  className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-emerald-600 transition-all duration-200 ease-out origin-center ${
                    currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen
                      ? 'scale-x-100 opacity-100'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                  }`}
                />
              </a>

              {/* 3. Track Order */}
              <a
                href="#/track-order"
                id="header-btn-track"
                onClick={(e) => handleNavClick(e, '#/track-order')}
                className={`group relative py-2 px-3 text-sm font-medium tracking-tight cursor-pointer select-none transition-colors duration-200 ${
                  isTrackerModalOpen
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="inline-block transition-transform duration-200 ease-out group-hover:-translate-y-[1px]">
                  Track Order
                </span>
                <span
                  className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-emerald-600 transition-all duration-200 ease-out origin-center ${
                    isTrackerModalOpen
                      ? 'scale-x-100 opacity-100'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                  }`}
                />
              </a>

              {/* 4. About Us */}
              <a
                href="#/about-us"
                id="header-nav-about"
                onClick={(e) => handleNavClick(e, '#/about-us')}
                className={`group relative py-2 px-3 text-sm font-medium tracking-tight cursor-pointer select-none transition-colors duration-200 ${
                  currentTab === 'about_contact' && !isTrackerModalOpen && !isFeedbackModalOpen
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="inline-block transition-transform duration-200 ease-out group-hover:-translate-y-[1px]">
                  About Us
                </span>
                <span
                  className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-emerald-600 transition-all duration-200 ease-out origin-center ${
                    currentTab === 'about_contact' && !isTrackerModalOpen && !isFeedbackModalOpen
                      ? 'scale-x-100 opacity-100'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                  }`}
                />
              </a>

              {/* 5. Feedback */}
              <a
                href="#/feedback"
                id="header-btn-feedback"
                onClick={(e) => handleNavClick(e, '#/feedback')}
                className={`group relative py-2 px-3 text-sm font-medium tracking-tight cursor-pointer select-none transition-colors duration-200 ${
                  isFeedbackModalOpen
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="inline-block transition-transform duration-200 ease-out group-hover:-translate-y-[1px]">
                  Feedback
                </span>
                <span
                  className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-emerald-600 transition-all duration-200 ease-out origin-center ${
                    isFeedbackModalOpen
                      ? 'scale-x-100 opacity-100'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                  }`}
                />
              </a>
            </nav>

            {/* Header Right Actions / CTAs */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* WhatsApp CTA Button */}
              <a
                href="https://wa.me/447449338679?text=Hello%20Top%20Fruit%20and%20Veg!%20I%20would%20like%20to%20place%20an%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 text-xs font-semibold transition-colors duration-200"
                title="Chat with stall on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {/* Shopping Basket Button with subtle micro-bounce */}
              <button
                id="header-btn-orders"
                onClick={() => setIsCartOpen(true)}
                className={`relative py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-2 transition-colors duration-200 cursor-pointer shadow-xs active:scale-95 ${
                  cartBounce ? 'animate-cart-bounce ring-2 ring-emerald-400 ring-offset-1' : ''
                }`}
                title="View shopping bag"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Orders</span>
                {totalCartCount > 0 && (
                  <span className={`px-1.5 py-0.5 bg-white text-emerald-800 rounded-full text-[10px] font-black leading-none ${
                    cartBounce ? 'animate-badge-pop' : ''
                  }`}>
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Horizontal Navigation Bar */}
        <nav className="md:hidden w-full bg-white border-b border-slate-200 px-4 py-2.5 flex items-center space-x-4 overflow-x-auto scrollbar-none text-xs font-medium">
          <a
            href="#/home"
            id="mobile-nav-home"
            onClick={(e) => handleNavClick(e, '#/home')}
            className={`shrink-0 transition-colors ${
              currentTab === 'landing' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Home
          </a>
          <a
            href="#/products"
            id="mobile-nav-products"
            onClick={(e) => handleNavClick(e, '#/products')}
            className={`shrink-0 transition-colors ${
              currentTab === 'home' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Products
          </a>
          <a
            href="#/track-order"
            id="mobile-nav-track"
            onClick={(e) => handleNavClick(e, '#/track-order')}
            className={`shrink-0 transition-colors ${
              isTrackerModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Track Order
          </a>
          <a
            href="#/about-us"
            id="mobile-nav-about"
            onClick={(e) => handleNavClick(e, '#/about-us')}
            className={`shrink-0 transition-colors ${
              currentTab === 'about_contact' && !isTrackerModalOpen && !isFeedbackModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            About Us
          </a>
          <a
            href="#/feedback"
            id="mobile-nav-feedback"
            onClick={(e) => handleNavClick(e, '#/feedback')}
            className={`shrink-0 transition-colors ${
              isFeedbackModalOpen ? 'text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Feedback
          </a>
        </nav>

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

              {/* Main Responsive Layout: Left Info & Actions */}
              <div className="relative z-10 max-w-3xl space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight font-display animate-enter stagger-1">
                  Top Fruit & Veg
                </h1>

                <p className="text-slate-600 text-xs sm:text-sm lg:text-base leading-relaxed max-w-xl font-normal animate-enter stagger-2">
                  Fresh tropical produce, Jamaican yams, sweet plantains, and market goods delivered fresh daily.
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:gap-3 animate-enter stagger-3">
                  <a
                    href="#/products"
                    id="hero-cta-browse-products"
                    onClick={(e) => handleNavClick(e, '#/products')}
                    className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Browse Produce</span>
                    <span>→</span>
                  </a>

                  <a
                    href="#/track-order"
                    id="hero-cta-track-order"
                    onClick={(e) => handleNavClick(e, '#/track-order')}
                    className="px-3.5 sm:px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-2xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                  >
                    Track Order
                  </a>

                  <a
                    href="https://wa.me/447449338679"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 sm:px-4 py-2.5 bg-white hover:bg-pink-50/60 text-slate-700 hover:text-pink-700 border border-slate-200 hover:border-pink-200 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Minimal Location & Schedule Strip */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 animate-enter stagger-4">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Pope's Road, London SW9 8PB
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                    Mon–Sat 8:00–18:30 • Sun 9:00–16:00
                  </span>
                </div>
              </div>
            </section>

            {/* DIRECT PRODUCE CATALOG ON LANDING */}
            <section id="market-produce" className="w-full space-y-4 pt-2">
              {renderProduceCatalogContent()}
            </section>
          </main>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: PRODUCE CATALOG (DEDICATED FULL VIEW) */}
        {/* ========================================================= */}
        {currentTab === 'home' && (
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="pb-2 border-b border-slate-100">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Products
              </h2>
            </div>

            {renderProduceCatalogContent()}
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
                  id="footer-brand-admin-trigger"
                  className="flex items-center space-x-2.5 select-none"
                  title="Top Fruit & Veg • Pitch 18"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg shadow-2xs">
                    🥭
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Top Fruit & Veg
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-bold">Pitch 18 Brixton Market</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Brixton's trusted family produce stall. Supplying the freshest tropical fruits, Jamaican yellow yams, green plantains, scotch bonnet peppers, and fresh daily greens.
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
                    <a
                      href="#/home"
                      id="footer-nav-home"
                      onClick={(e) => handleNavClick(e, '#/home')}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🏠</span>
                      <span>Home / Welcome</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#/products"
                      id="footer-nav-products"
                      onClick={(e) => handleNavClick(e, '#/products')}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🥭</span>
                      <span>Browse Fresh Produce</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#/track-order"
                      id="footer-nav-track"
                      onClick={(e) => handleNavClick(e, '#/track-order')}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Track Your Order</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#/feedback"
                      id="footer-nav-feedback"
                      onClick={(e) => handleNavClick(e, '#/feedback')}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>Customer Reviews & Feedback</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#/about-us"
                      id="footer-nav-about"
                      onClick={(e) => handleNavClick(e, '#/about-us')}
                      className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>About Stall & Contact</span>
                    </a>
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
                  📍 Located at Pitch 18 opposite Brixton Station archways.
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
              <div className="flex items-center space-x-3 text-slate-400">
                <span>Fresh Local & Caribbean Produce</span>
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

      {/* Dynamic Toast Feedback for Basket Actions */}
      {cartToastMessage && (
        <div className="fixed bottom-16 right-4 sm:right-6 z-50 animate-toast-enter flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/95 text-white text-xs font-semibold shadow-xl shadow-slate-900/20 backdrop-blur-md border border-slate-700/60">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3" />
          </div>
          <span>{cartToastMessage}</span>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-1 text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer text-[11px]"
          >
            View Bag
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODALS & DRAWERS */}
      {/* ========================================================= */}

      {/* Customer Feedback Modal */}
      <CustomerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          if (window.location.hash === '#/feedback' || window.location.hash === '#feedback') {
            const fallbackHash = currentTab === 'landing' ? '#/home' : currentTab === 'home' ? '#/products' : '#/about-us';
            window.location.hash = fallbackHash;
          }
        }}
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
          window.location.hash = '#/track-order';
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
        onClose={() => {
          setIsTrackerModalOpen(false);
          if (window.location.hash === '#/track-order' || window.location.hash === '#track-order') {
            const fallbackHash = currentTab === 'landing' ? '#/home' : currentTab === 'home' ? '#/products' : '#/about-us';
            window.location.hash = fallbackHash;
          }
        }}
        initialOrderCode={preFilledOrderCode}
      />
    </div>
  );
};
