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
  Sparkles,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden text-slate-900 border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-700 hover:text-slate-950 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6">
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
            <span className="font-bold text-emerald-800 truncate">{product.name}</span>
          </nav>

          {/* Top Hero Section (Image + Main Info) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Produce Photo */}
            <div className="sm:col-span-6 relative rounded-2xl overflow-hidden bg-emerald-50/50 flex items-center justify-center border border-slate-100 shadow-inner h-60 sm:h-72">
              <img
                src={meta.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {meta.origin}
                </span>
                {meta.isOrganic && (
                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg shadow-xs flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Organic
                  </span>
                )}
              </div>

              {/* Fresh Daily Badge */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-100 flex items-center gap-1 text-[11px] font-bold text-slate-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Brixton Pitch 18 Fresh</span>
              </div>
            </div>

            {/* Main Info */}
            <div className="sm:col-span-6 space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                    {product.category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">SKU: {product.sku}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {product.name}
                </h2>
              </div>

              {/* Price Display */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Price</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                    {formatCurrency(product.sellingPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">per {product.unit}</span>
                  <span className="text-[11px] text-slate-500">{meta.estimatedWeight}</span>
                </div>
              </div>

              {/* Live Market Stall Availability */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isOutOfStock
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : isLowStock
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOutOfStock
                        ? 'bg-rose-500'
                        : isLowStock
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span className="text-xs font-bold">
                    {isOutOfStock
                      ? '❌ Sold Out for Today'
                      : isLowStock
                      ? `⚠️ Only ${product.stock} ${product.unit}s remaining today`
                      : `✅ In Stock (${product.stock} ${product.unit}s available at stall)`}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                  Pitch 18
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {meta.dietaryTags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3 text-emerald-600" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Produce Description */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Produce Overview & Quality Notes</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {product.description ||
                `Top-grade fresh ${product.name} sourced directly for our stall at Pitch 18 Brixton Market. Hand-picked daily at peak ripeness to provide authentic taste, nutrition, and rich culinary quality for traditional home cooking.`}
            </p>
          </div>

          {/* Nutrition Facts & Storage Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nutrition Box */}
            <div className="p-4 bg-emerald-950/5 border border-emerald-500/20 rounded-2xl space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>Nutrition & Health Profile</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Energy</span>
                  <span className="font-bold text-emerald-900">{meta.nutrition.calories}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Vitamin C</span>
                  <span className="font-bold text-emerald-900">{meta.nutrition.vitaminC}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Dietary Fiber</span>
                  <span className="font-bold text-emerald-900">{meta.nutrition.fiber}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Potassium</span>
                  <span className="font-bold text-emerald-900">{meta.nutrition.potassium}</span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-tight">
                {meta.nutrition.keyBenefit}
              </p>
            </div>

            {/* Storage & Culinary Box */}
            <div className="p-4 bg-amber-950/5 border border-amber-500/20 rounded-2xl space-y-2.5 text-xs text-slate-700">
              <div>
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs mb-1">
                  <ThermometerSnowflake className="w-4 h-4 text-amber-600" />
                  <span>Storage & Freshness Tips</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{meta.storageTip}</p>
              </div>

              <div>
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs mb-1">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>Recipe & Cooking Suggestions</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{meta.cookingTips}</p>
              </div>
            </div>
          </div>

          {/* Related Products from same category */}
          {relatedProducts.length > 0 && onSelectProduct && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                You May Also Like in {product.category}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {relatedProducts.map((rel) => {
                  const relMeta = getProduceMeta(rel.name, rel.category, rel.image);
                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectProduct(rel)}
                      className="p-2.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer group text-center"
                    >
                      <div className="w-full h-20 rounded-lg overflow-hidden bg-slate-200 mb-1.5">
                        <img
                          src={relMeta.imageUrl}
                          alt={rel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                        {rel.name}
                      </h5>
                      <span className="text-xs font-black text-emerald-700">
                        {formatCurrency(rel.sellingPrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Reservation / Cart Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center space-x-2 bg-white border border-slate-300 rounded-2xl p-1 shadow-xs">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              disabled={qty <= 1 || isOutOfStock}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-slate-900">{qty}</span>
            <button
              onClick={() => setQty(Math.min(product.stock, qty + 1))}
              disabled={qty >= product.stock || isOutOfStock}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Basket Action Button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : addedAnimation
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Added to Basket!</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>
                  Add {qty} to Basket • {formatCurrency(product.sellingPrice * qty)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
