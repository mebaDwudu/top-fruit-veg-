import React, { useState } from 'react';
import { Product } from '../../types/store';
import { useStore } from '../../context/StoreContext';
import { getProduceMeta } from '../../utils/produceImages';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';

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
  currentBagQuantity = 0,
}) => {
  const { formatCurrency, settings } = useStore();
  const [qty, setQty] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!product) return null;

  const meta = getProduceMeta(product.name, product.category, product.image);
  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToBag(product, qty);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden text-slate-900 border border-slate-200/90 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 bg-white/90 hover:bg-white rounded-full border border-slate-200/80 shadow-xs transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimal Produce Image */}
        <div className="relative w-full h-44 sm:h-48 bg-slate-50 overflow-hidden">
          <img
            src={meta.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
            }}
          />
          <div className="absolute bottom-2.5 left-3">
            <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs">
              {product.category}
            </span>
          </div>
        </div>

        {/* Minimal Details Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h2>
              <span className="text-xs text-slate-500">
                {meta.origin ? `Origin: ${meta.origin} • ` : ''}Sold per {product.unit || 'unit'}
              </span>
            </div>

            {settings.showPricesToCustomers && (
              <div className="text-right shrink-0">
                <span className="text-base sm:text-lg font-bold text-slate-900">
                  {formatCurrency(product.sellingPrice)}
                </span>
                <span className="block text-[11px] text-slate-500">
                  /{product.unit || 'item'}
                </span>
              </div>
            )}
          </div>

          {/* 1-Line Description / Fresh Status */}
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {product.description || `Fresh daily selection from Pitch 18 Brixton Market.`}
          </p>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {isOutOfStock ? 'Sold Out' : 'Fresh in Stock • Pitch 18'}
            </span>
            {currentBagQuantity > 0 && (
              <span className="text-slate-500 text-[11px]">
                {currentBagQuantity} in basket
              </span>
            )}
          </div>

          {/* Minimal Controls: Quantity & Add */}
          <div className="pt-2 flex items-center gap-2.5">
            {/* Quantity Selector */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1 || isOutOfStock}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-semibold text-xs text-slate-900">
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                disabled={qty >= product.stock || isOutOfStock}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Basket Action */}
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : addedAnimation
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Added</span>
                </>
              ) : isOutOfStock ? (
                <span>Out of Stock</span>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    {settings.showPricesToCustomers
                      ? `Add • ${formatCurrency(product.sellingPrice * qty)}`
                      : `Add ${qty} to Basket`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
