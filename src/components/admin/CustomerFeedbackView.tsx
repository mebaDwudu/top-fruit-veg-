import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerFeedback } from '../../types/store';
import {
  Star,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Clock,
  User,
  Phone,
  Mail,
  Tag,
  Sparkles,
  Edit3,
  ThumbsUp,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

export const CustomerFeedbackView: React.FC = () => {
  const { feedbacks, updateFeedbackStatus, deleteFeedback, isDarkMode } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'resolved'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [adminNoteInput, setAdminNoteInput] = useState<{ [id: string]: string }>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) return { avgRating: 5.0, total: 0, newCount: 0, fiveStarCount: 0 };
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const avgRating = (sum / total).toFixed(1);
    const newCount = feedbacks.filter((f) => f.status === 'new').length;
    const fiveStarCount = feedbacks.filter((f) => f.rating === 5).length;
    return { avgRating, total, newCount, fiveStarCount };
  }, [feedbacks]);

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      // Search
      const matchesSearch =
        searchQuery === '' ||
        f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.customerContact && f.customerContact.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.productName && f.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      // Rating filter
      const matchesRating =
        selectedRatingFilter === 'all' || f.rating === selectedRatingFilter;

      // Status filter
      const matchesStatus =
        selectedStatusFilter === 'all' || f.status === selectedStatusFilter;

      // Category filter
      const matchesCategory =
        selectedCategoryFilter === 'all' || f.category === selectedCategoryFilter;

      return matchesSearch && matchesRating && matchesStatus && matchesCategory;
    });
  }, [feedbacks, searchQuery, selectedRatingFilter, selectedStatusFilter, selectedCategoryFilter]);

  const handleSaveNote = (feedbackId: string) => {
    const note = adminNoteInput[feedbackId] ?? '';
    updateFeedbackStatus(feedbackId, 'reviewed', note);
    setEditingNoteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="w-5 h-5 fill-amber-500" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Customer Feedback & Reviews
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real reviews and messages submitted by customers from the Top Fruit and Veg storefront.
          </p>
        </div>

        {/* Quick Badge summary */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <div>
              <div className="text-sm font-black text-amber-900 dark:text-amber-300 leading-none">
                {stats.avgRating} / 5.0
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                Average Rating ({stats.total} total)
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <div>
              <div className="text-sm font-black text-emerald-900 dark:text-emerald-300 leading-none">
                {stats.newCount} New
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                Needs Review
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, comment or product..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Star Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 5, 4, 3, 2, 1] as const).map((r) => (
              <button
                key={String(r)}
                onClick={() => setSelectedRatingFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRatingFilter === r
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {r === 'all' ? 'All Stars' : `${r} ★`}
              </button>
            ))}
          </div>
        </div>

        {/* Categories & Status Filter Chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Category:
            </span>
            {[
              'all',
              'Produce Quality',
              'Customer Service',
              'Stall Experience',
              'Fruit Request',
              'General',
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Topics' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            {(['all', 'new', 'reviewed', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  selectedStatusFilter === st
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedbacks Grid / List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No feedback found matching your criteria
          </h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                fb.status === 'new'
                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Card Header: Customer + Rating */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {fb.customerName || 'Anonymous Customer'}
                    </span>
                    {fb.status === 'new' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[10px] tracking-wide uppercase">
                        New
                      </span>
                    )}
                    {fb.status === 'resolved' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>

                  {fb.customerContact && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      {fb.customerContact.includes('@') ? (
                        <Mail className="w-3 h-3 text-slate-400" />
                      ) : (
                        <Phone className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{fb.customerContact}</span>
                    </div>
                  )}
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-900/40">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= fb.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs font-black text-amber-900 dark:text-amber-300">
                    {fb.rating}.0
                  </span>
                </div>
              </div>

              {/* Tag & Date */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-500" />
                  {fb.category}
                </span>

                {fb.productName && (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-emerald-500" />
                    {fb.productName}
                  </span>
                )}

                <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                  <Clock className="w-3 h-3" />
                  {new Date(fb.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Customer Comment Text */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                "{fb.comment}"
              </div>

              {/* Admin Note / Follow-up Section */}
              {fb.adminNote && editingNoteId !== fb.id && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-300">
                  <span className="font-extrabold text-[11px] block uppercase text-emerald-700 dark:text-emerald-400">
                    Admin Note:
                  </span>
                  <p className="mt-0.5">{fb.adminNote}</p>
                </div>
              )}

              {editingNoteId === fb.id ? (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={adminNoteInput[fb.id] ?? (fb.adminNote || '')}
                    onChange={(e) =>
                      setAdminNoteInput({ ...adminNoteInput, [fb.id]: e.target.value })
                    }
                    placeholder="Add an internal note or action taken..."
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="px-3 py-1 text-xs text-slate-500 font-bold hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveNote(fb.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {fb.status === 'new' && (
                    <button
                      onClick={() => updateFeedbackStatus(fb.id, 'reviewed')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Reviewed
                    </button>
                  )}

                  {fb.status !== 'resolved' && (
                    <button
                      onClick={() => updateFeedbackStatus(fb.id, 'resolved')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Mark Resolved
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingNoteId(fb.id);
                      setAdminNoteInput({ ...adminNoteInput, [fb.id]: fb.adminNote || '' });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {fb.adminNote ? 'Edit Note' : 'Add Note'}
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Delete this feedback review?')) {
                      deleteFeedback(fb.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Delete review"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
