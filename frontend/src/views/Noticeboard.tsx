import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Megaphone,
  X,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';

interface Notice {
  notice_id: string;
  title: string;
  content: string;
  category: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  author: string;
  target_role: string;
  created_at: string;
  expires_at: string | null;
}

const PRIORITY_CONFIG = {
  Normal: {
    icon: Info,
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    border: 'border-slate-800/40',
    glow: '',
  },
  Important: {
    icon: AlertTriangle,
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/5',
  },
  Urgent: {
    icon: Megaphone,
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/10',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  General: 'bg-slate-500/10 text-slate-400',
  Academic: 'bg-blue-500/10 text-blue-400',
  Exam: 'bg-rose-500/10 text-rose-400',
  Event: 'bg-emerald-500/10 text-emerald-400',
  Holiday: 'bg-amber-500/10 text-amber-400',
  Sports: 'bg-orange-500/10 text-orange-400',
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface PostFormData {
  title: string;
  content: string;
  category: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  target_role: string;
}

export const Noticeboard: React.FC = () => {
  const { user } = useAuth();
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState<PostFormData>({
    title: '',
    content: '',
    category: 'General',
    priority: 'Normal',
    target_role: 'all',
  });

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ notices: Notice[] }>('/notices');
      setNotices(res.notices);
    } catch (err: any) {
      setError(err.message || 'Failed to load notices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and content are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/notices', form);
      setForm({ title: '', content: '', category: 'General', priority: 'Normal', target_role: 'all' });
      setShowForm(false);
      await fetchNotices();
    } catch (err: any) {
      setFormError(err.message || 'Failed to post notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (notice_id: string) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${notice_id}`);
      setNotices((prev) => prev.filter((n) => n.notice_id !== notice_id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete notice.');
    }
  };

  const filteredNotices = notices.filter((n) => {
    const matchPriority = filterPriority === 'All' || n.priority === filterPriority;
    const matchCategory = filterCategory === 'All' || n.category === filterCategory;
    return matchPriority && matchCategory;
  });

  const urgentCount = notices.filter((n) => n.priority === 'Urgent').length;
  const importantCount = notices.filter((n) => n.priority === 'Important').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-400" />
            Notice Board
          </h1>
          <p className="text-sm text-slate-400 mt-1 light:text-slate-600">
            {notices.length} notice{notices.length !== 1 ? 's' : ''} posted
            {urgentCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xxs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {urgentCount} Urgent
              </span>
            )}
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            id="post-notice-btn"
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Post Notice'}
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', count: notices.length, color: 'text-slate-300' },
          { label: 'Important', count: importantCount, color: 'text-amber-400' },
          { label: 'Urgent', count: urgentCount, color: 'text-rose-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.count}</div>
            <div className="text-xxs text-slate-500 mt-0.5 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Post Form */}
      {showForm && isTeacherOrAdmin && (
        <div className="glass-panel p-6 rounded-2xl border border-brand-500/20 animate-slide-up">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-brand-400">
            <Plus className="w-4 h-4" /> New Notice
          </h3>
          <form onSubmit={handlePost} className="space-y-4">
            {formError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Title *</label>
                <input
                  type="text"
                  placeholder="Notice title..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="glass-input w-full"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="glass-input w-full"
                >
                  {Object.keys(CATEGORY_COLORS).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as PostFormData['priority'] })}
                  className="glass-input w-full"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Content *</label>
                <textarea
                  placeholder="Notice content..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="glass-input w-full min-h-[100px] resize-none"
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-xxs text-slate-600 mt-1 text-right">{form.content.length}/1000</div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(null); }}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                {submitting ? 'Posting...' : 'Post Notice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xxs text-slate-500 uppercase tracking-wider">Filter:</span>
        {['All', 'Normal', 'Important', 'Urgent'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-3 py-1.5 rounded-xl text-xxs font-semibold border transition-all duration-150 ${
              filterPriority === p
                ? 'bg-brand-600 text-white border-brand-500'
                : 'bg-slate-900/40 text-slate-400 border-slate-800/40 hover:border-brand-500/30'
            }`}
          >
            {p}
          </button>
        ))}
        <span className="mx-1 text-slate-700">|</span>
        {['All', ...Object.keys(CATEGORY_COLORS)].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-xl text-xxs font-semibold border transition-all duration-150 ${
              filterCategory === c
                ? 'bg-brand-600 text-white border-brand-500'
                : 'bg-slate-900/40 text-slate-400 border-slate-800/40 hover:border-brand-500/30'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span className="ml-3 text-slate-400 text-sm">Loading notices...</span>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-rose-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-60" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchNotices} className="mt-4 btn-secondary px-4 py-2 text-sm">Retry</button>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bell className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">
            {notices.length === 0 ? 'No notices posted yet.' : 'No notices match the selected filters.'}
          </p>
          {isTeacherOrAdmin && notices.length === 0 && (
            <button onClick={() => setShowForm(true)} className="mt-4 btn-primary px-5 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Post First Notice
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotices.map((notice) => {
            const config = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.Normal;
            const PriorityIcon = config.icon;
            return (
              <div
                key={notice.notice_id}
                className={`glass-card p-5 border ${config.border} ${config.glow} shadow-lg animate-slide-up`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 p-2 rounded-xl border ${config.badge}`}>
                      <PriorityIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm tracking-tight leading-snug">{notice.title}</h3>
                        <span className={`text-xxs px-2 py-0.5 rounded-full font-semibold ${config.badge} border`}>
                          {notice.priority}
                        </span>
                        <span className={`text-xxs px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[notice.category] || 'bg-slate-500/10 text-slate-400'}`}>
                          {notice.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed light:text-slate-700 whitespace-pre-line">
                        {notice.content}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-xxs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {notice.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatRelativeTime(notice.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => handleDelete(notice.notice_id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 shrink-0"
                      title="Delete notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
