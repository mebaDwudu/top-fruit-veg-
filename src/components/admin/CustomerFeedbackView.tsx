import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Star,
  MessageSquare,
  Search,
  CheckCircle2,
  Trash2,
  Clock,
  Phone,
  Mail,
  Tag,
  Edit3,
  ThumbsUp,
  ShoppingBag,
} from 'lucide-react';

export const CustomerFeedbackView: React.FC = () => {
  const { feedbacks, updateFeedbackStatus, deleteFeedback } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'resolved'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [adminNoteInput, setAdminNoteInput] = useState<{ [id: string]: string }>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = feedbacks.length;
    if (total === 0) return { avgRating: '5.0', total: 0, newCount: 0, fiveStarCount: 0 };
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const avgRating = (sum / total).toFixed(1);
    const newCount = feedbacks.filter((f) => f.status === 'new').length;
    const fiveStarCount = feedbacks.filter((f) => f.rating === 5).length;
    return { avgRating, total, newCount, fiveStarCount };
  }, [feedbacks]);

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchesSearch =
        searchQuery === '' ||
        f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.customerContact && f.customerContact.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.productName && f.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRating =
        selectedRatingFilter === 'all' || f.rating === selectedRatingFilter;

      const matchesStatus =
        selectedStatusFilter === 'all' || f.status === selectedStatusFilter;

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
    <div className="space-y-4">
      {/* Header Banner - Matching Emerald/Slate Aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Feedback
            </h2>
            <p className="text-xs text-slate-500">
              Customer reviews and notes from Brixton Market storefront.
            </p>
          </div>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-1.5 text-xs font-bold">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{stats.avgRating} / 5.0</span>
            <span className="text-slate-400">({stats.total})</span>
          </div>

          {stats.newCount > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
              {stats.newCount} New
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
            />
          </div>

          {/* Star Filter - Minimal single word pills */}
          <div className="flex items-center gap-1">
            {(['all', 5, 4, 3, 2, 1] as const).map((r) => (
              <button
                key={String(r)}
                onClick={() => setSelectedRatingFilter(r)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedRatingFilter === r
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {r === 'all' ? 'All' : `${r}★`}
              </button>
            ))}
          </div>
        </div>

        {/* Categories & Status */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Topic:
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {(['all', 'new', 'reviewed', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                  selectedStatusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedbacks Grid */}
      {filteredFeedbacks.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-700">
            No feedback found
          </h3>
          <p className="text-xs text-slate-400">
            Try adjusting search or filter options.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                fb.status === 'new'
                  ? 'bg-emerald-50/30 border-emerald-200 shadow-2xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Card Header: Customer + Rating */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {fb.customerName || 'Anonymous Customer'}
                    </span>
                    {fb.status === 'new' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] uppercase">
                        New
                      </span>
                    )}
                    {fb.status === 'resolved' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>

                  {fb.customerContact && (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      {fb.customerContact.includes('@') ? (
                        <Mail className="w-3 h-3 text-slate-400" />
                      ) : (
                        <Phone className="w-3 h-3 text-slate-400" />
                      )}
                      <span className="truncate">{fb.customerContact}</span>
                    </div>
                  )}
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= fb.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs font-bold text-slate-700">
                    {fb.rating}.0
                  </span>
                </div>
              </div>

              {/* Tag & Date */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-emerald-600" />
                  {fb.category}
                </span>

                {fb.productName && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <ShoppingBag className="w-2.5 h-2.5 text-emerald-600" />
                    {fb.productName}
                  </span>
                )}

                <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-auto">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(fb.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {/* Customer Comment */}
              <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-800 leading-relaxed font-medium border border-slate-100">
                "{fb.comment}"
              </div>

              {/* Admin Note Section */}
              {fb.adminNote && editingNoteId !== fb.id && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <span className="font-bold text-[10px] uppercase block text-emerald-700">
                    Note:
                  </span>
                  <p className="mt-0.5">{fb.adminNote}</p>
                </div>
              )}

              {editingNoteId === fb.id ? (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={adminNoteInput[fb.id] ?? (fb.adminNote || '')}
                    onChange={(e) =>
                      setAdminNoteInput({ ...adminNoteInput, [fb.id]: e.target.value })
                    }
                    placeholder="Internal note..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="px-2.5 py-1 text-xs text-slate-500 font-bold hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveNote(fb.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Single Word Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  {fb.status === 'new' && (
                    <button
                      onClick={() => updateFeedbackStatus(fb.id, 'reviewed')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Reviewed</span>
                    </button>
                  )}

                  {fb.status !== 'resolved' && (
                    <button
                      onClick={() => updateFeedbackStatus(fb.id, 'resolved')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Resolve</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingNoteId(fb.id);
                      setAdminNoteInput({ ...adminNoteInput, [fb.id]: fb.adminNote || '' });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Note</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Delete this feedback?')) {
                      deleteFeedback(fb.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete"
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
