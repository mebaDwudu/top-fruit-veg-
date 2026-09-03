import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerFeedback } from '../../types/store';
import { sanitizeText, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';
import {
  X,
  Star,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Send,
  Heart,
  Store,
  Leaf,
  ShoppingBag,
} from 'lucide-react';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string;
}

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  onClose,
  preselectedProductId,
}) => {
  const { addFeedback, products, settings } = useStore();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<CustomerFeedback['category']>('Produce Quality');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [selectedProdId, setSelectedProdId] = useState<string>(preselectedProductId || '');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5:
        return '5/5 - Outstanding Quality & Service';
      case 4:
        return '4/5 - Very Good Quality';
      case 3:
        return '3/5 - Good & Fresh';
      case 2:
        return '2/5 - Fair Quality';
      case 1:
        return '1/5 - Needs Improvement';
      default:
        return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please enter your feedback comments.');
      return;
    }

    const cleanName = sanitizeText(customerName, 80) || 'Anonymous Customer';
    const cleanContact = customerContact.trim()
      ? customerContact.includes('@')
        ? sanitizeEmail(customerContact)
        : sanitizePhone(customerContact)
      : undefined;
    const cleanComment = sanitizeText(comment, 600);

    const selectedProduct = products.find((p) => p.id === selectedProdId);

    addFeedback({
      customerName: cleanName,
      customerContact: cleanContact,
      rating,
      category,
      productId: selectedProduct?.id,
      productName: selectedProduct?.name,
      comment: cleanComment,
    });

    setIsSubmitted(true);
    setErrorMsg(null);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setRating(5);
    setCategory('Produce Quality');
    setCustomerName('');
    setCustomerContact('');
    setSelectedProdId('');
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden text-slate-900 border border-emerald-100 flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                <span>Customer Feedback & Review</span>
              </h3>
              <p className="text-xs text-emerald-400">
                {settings.storeName || 'Top Fruit and Veg'} • Pitch 18 Brixton Market
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xl font-black text-slate-900">Thank You For Your Feedback!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your review has been sent directly to the stall admin and management team. We appreciate your support for Pitch 18 Brixton Market!
              </p>
            </div>

            <div className="pt-3 flex justify-center gap-3">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Back to Storefront
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold">
                {errorMsg}
              </div>
            )}

            {/* Interactive Star Rating */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-center space-y-2">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                How Was Your Experience / Produce?
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const activeVal = hoverRating || rating;
                  const isFilled = starVal <= activeVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(starVal)}
                      className="p-1.5 rounded-xl transition-transform hover:scale-125 focus:outline-hidden cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-extrabold text-emerald-800">
                {getRatingLabel(hoverRating || rating)}
              </p>
            </div>

            {/* Category Select */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Feedback Topic *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-hidden focus:border-emerald-500 focus:bg-white"
              >
                <option value="Produce Quality">Produce Freshness & Quality</option>
                <option value="Customer Service">Customer Service & Friendliness</option>
                <option value="Stall Experience">Stall Location & Collection</option>
                <option value="Fruit Request">Request a New Fruit / Vegetable</option>
                <option value="General">General Comment / Suggestion</option>
              </select>
            </div>

            {/* Specific Product (Optional) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Specific Product (Optional)
              </label>
              <select
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
              >
                <option value="">-- General Stall Feedback --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onBlur={() => {
                    window.scrollTo({ top: window.scrollY, behavior: 'instant' });
                  }}
                  placeholder="e.g. David Ade"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Phone / Email (Optional)
                </label>
                <input
                  type="text"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  onBlur={() => {
                    window.scrollTo({ top: window.scrollY, behavior: 'instant' });
                  }}
                  placeholder="For follow-up"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Comment Message */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Your Review & Comments *
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onBlur={() => {
                  window.scrollTo({ top: window.scrollY, behavior: 'instant' });
                }}
                placeholder="Tell us what you liked about our yams, plantains, mangoes, or how we can serve you better..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback to Admin</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
