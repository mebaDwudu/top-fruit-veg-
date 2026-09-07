import React, { useState } from 'react';
import { Product } from '../../types/store';
import { useStore } from '../../context/StoreContext';
import { getProduceMeta } from '../../utils/produceImages';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  Flame,
  Tag,
  Check,
  Share2,
  ChevronRight,
  Info,
  Leaf,
  Scale,
  Barcode,
  ThermometerSnowflake,
  Utensils,
  HeartHandshake,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToBag: (product: Product, quantity: number) => void;
  onSelectProduct?: (product: Product) => void;
  currentBagQuantity?: number;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToBag,
  onSelectProduct,
  currentBagQuantity = 0,
}) => {
  const { products, formatCurrency, settings } = useStore();
  const [qty, setQty] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!product) return null;

  const meta = getProduceMeta(product.name, product.category, product.image);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStockLevel;

  // Find related products in the same category
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id && p.stock > 0)
    .slice(0, 4);

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToBag(product, qty);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/30 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden text-slate-900 border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-1.5 text-slate-500 hover:text-slate-900 bg-white/90 hover:bg-white rounded-lg border border-slate-200 transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-1.5 text-xs text-slate-500 pr-10">
            <span className="hover:text-slate-900 cursor-pointer" onClick={onClose}>
              Home
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="hover:text-slate-900 cursor-pointer" onClick={onClose}>
              {product.category}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800 truncate">{product.name}</span>
          </nav>

          {/* Top Hero Section (Image + Main Info) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            {/* Produce Photo */}
            <div className="sm:col-span-6 relative rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 h-56 sm:h-64">
              <img
                src={meta.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-semibold rounded uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {meta.origin}
                </span>
                {meta.isOrganic && (
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-semibold rounded flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Organic
                  </span>
                )}
              </div>

              {/* Fresh Daily Badge */}
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-white/95 rounded border border-slate-200 flex items-center gap-1 text-[11px] font-medium text-slate-800">
                <span>Brixton Pitch 18 Fresh</span>
              </div>
            </div>

            {/* Main Info */}
            <div className="sm:col-span-6 space-y-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wide">
                    {product.category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">SKU: {product.sku}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {product.name}
                </h2>
              </div>

              {/* Price / Produce Unit Display */}
              {settings.showPricesToCustomers ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">Price</span>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">
                      {formatCurrency(product.sellingPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700 block">per {product.unit}</span>
                    <span className="text-[11px] text-slate-500">{meta.estimatedWeight}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">Unit</span>
                    <div className="text-base sm:text-lg font-bold text-slate-900">
                      Sold per {product.unit || 'kg'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-xs font-semibold">
                      Pitch 18 Daily Fresh
                    </span>
                  </div>
                </div>
              )}

              {/* Live Market Stall Availability */}
              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  isOutOfStock
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : isLowStock
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isOutOfStock
                        ? 'bg-rose-500'
                        : isLowStock
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-xs font-medium">
                    {isOutOfStock
                      ? 'Sold Out for Today'
                      : isLowStock
                      ? `Only ${product.stock} ${product.unit}s remaining`
                      : `In Stock (${product.stock} ${product.unit}s)`}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pitch 18
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {meta.dietaryTags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-slate-500" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Produce Description */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
            <h4 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Overview</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {product.description ||
                `Top-grade fresh ${product.name} sourced directly for our stall at Pitch 18 Brixton Market.`}
            </p>
          </div>

          {/* Nutrition Facts & Storage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nutrition Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-xs">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nutrition Profile</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Energy</span>
                  <span className="font-semibold text-slate-900">{meta.nutrition.calories}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Vitamin C</span>
                  <span className="font-semibold text-slate-900">{meta.nutrition.vitaminC}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Dietary Fiber</span>
                  <span className="font-semibold text-slate-900">{meta.nutrition.fiber}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Potassium</span>
                  <span className="font-semibold text-slate-900">{meta.nutrition.potassium}</span>
                </div>
              </div>
            </div>

            {/* Storage & Culinary Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-700">
              <div>
                <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-xs mb-0.5">
                  <ThermometerSnowflake className="w-3.5 h-3.5 text-slate-500" />
                  <span>Storage & Freshness</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{meta.storageTip}</p>
              </div>

              <div>
                <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-xs mb-0.5">
                  <Utensils className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cooking Suggestion</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{meta.cookingTips}</p>
              </div>
            </div>
          </div>

          {/* Related Products from same category */}
          {relatedProducts.length > 0 && onSelectProduct && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-semibold text-slate-700">
                More in {product.category}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {relatedProducts.map((rel) => {
                  const relMeta = getProduceMeta(rel.name, rel.category, rel.image);
                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectProduct(rel)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer group text-center"
                    >
                      <div className="w-full h-16 rounded overflow-hidden bg-slate-200 mb-1">
                        <img
                          src={relMeta.imageUrl}
                          alt={rel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h5 className="text-xs font-medium text-slate-900 truncate">
                        {rel.name}
                      </h5>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Reservation / Cart Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
          {/* Quantity Selector */}
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={qty <= 1 || isOutOfStock}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center font-semibold text-xs text-slate-900">{qty}</span>
            <button
              onClick={() => setQty(Math.min(product.stock, qty + 1))}
              disabled={qty >= product.stock || isOutOfStock}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Add to Basket Action Button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : addedAnimation
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Added to Basket</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  {settings.showPricesToCustomers
                    ? `Add ${qty} to Basket • ${formatCurrency(product.sellingPrice * qty)}`
                    : `Add ${qty} ${product.unit || 'unit'}${qty > 1 ? 's' : ''} to Order`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
