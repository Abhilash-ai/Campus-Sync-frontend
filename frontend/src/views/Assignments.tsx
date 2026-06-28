import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Calendar,
  User,
  Hash,
} from 'lucide-react';

interface Assignment {
  assignment_id: string;
  title: string;
  subject: string;
  description: string;
  due_date: string;
  department: string;
  semester: string;
  max_marks: number;
  teacher: string;
  status: 'Active' | 'Closed' | 'Graded';
  created_at: string;
}

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Electronics',
  'Chemical Engineering',
];
const SEMESTERS = ['All', 'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

function getDueStatus(due_date: string): { label: string; color: string; icon: typeof CheckCircle2 } {
  const due = new Date(due_date);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Overdue', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: XCircle };
  if (diffDays === 0) return { label: 'Due Today', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertCircle };
  if (diffDays <= 3) return { label: `${diffDays}d left`, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: AlertCircle };
  return { label: `${diffDays}d left`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 };
}

interface AddForm {
  title: string;
  subject: string;
  description: string;
  due_date: string;
  department: string;
  semester: string;
  max_marks: number;
}

export const Assignments: React.FC = () => {
  const { user } = useAuth();
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [form, setForm] = useState<AddForm>({
    title: '',
    subject: '',
    description: '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    department: 'Computer Science',
    semester: 'All',
    max_marks: 100,
  });

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (deptFilter !== 'All') params.append('department', deptFilter);
      const res = await api.get<{ assignments: Assignment[] }>(`/assignments?${params.toString()}`);
      setAssignments(res.assignments);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  }, [deptFilter]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim() || !form.subject.trim() || !form.due_date) {
      setFormError('Title, Subject and Due Date are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/assignments', form);
      setShowForm(false);
      setForm({
        title: '',
        subject: '',
        description: '',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        department: 'Computer Science',
        semester: 'All',
        max_marks: 100,
      });
      await fetchAssignments();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments((prev) => prev.filter((a) => a.assignment_id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete assignment.');
    }
  };

  const handleToggleStatus = async (a: Assignment) => {
    const newStatus = a.status === 'Active' ? 'Closed' : 'Active';
    try {
      await api.put(`/assignments/${a.assignment_id}`, { status: newStatus });
      setAssignments((prev) => prev.map((item) =>
        item.assignment_id === a.assignment_id ? { ...item, status: newStatus as 'Active' | 'Closed' } : item
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const filtered = assignments.filter((a) => {
    const matchDept = deptFilter === 'All' || a.department === deptFilter;
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchDept && matchStatus;
  });

  const activeCount = assignments.filter((a) => a.status === 'Active').length;
  const overdueCount = assignments.filter((a) => new Date(a.due_date) < new Date() && a.status === 'Active').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-400" />
            Assignments
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeCount} active
            {overdueCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xxs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {overdueCount} overdue
              </span>
            )}
          </p>
        </div>
        {isTeacherOrAdmin && (
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary px-5 py-2.5 text-sm">
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'New Assignment'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', count: assignments.length, color: 'text-slate-300' },
          { label: 'Active', count: activeCount, color: 'text-emerald-400' },
          { label: 'Overdue', count: overdueCount, color: 'text-rose-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.count}</div>
            <div className="text-xxs text-slate-500 mt-0.5 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && isTeacherOrAdmin && (
        <div className="glass-panel p-6 rounded-2xl border border-brand-500/20 animate-slide-up">
          <h3 className="text-sm font-bold mb-4 text-brand-400 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Assignment
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formError && (
              <div className="sm:col-span-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                {formError}
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Title *</label>
              <input type="text" placeholder="e.g. Lab Report: Sorting Algorithms" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Subject *</label>
              <input type="text" placeholder="e.g. Data Structures" value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Due Date *</label>
              <input type="date" value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Department *</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="glass-input w-full">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Max Marks</label>
              <input type="number" min={1} max={1000} value={form.max_marks}
                onChange={(e) => setForm({ ...form, max_marks: parseInt(e.target.value) || 100 })} className="glass-input w-full" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Description</label>
              <textarea placeholder="Optional: instructions, guidelines, links..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="glass-input w-full resize-none" rows={3} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xxs text-slate-500 uppercase tracking-wider">Status:</span>
        {['All', 'Active', 'Closed'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xxs font-semibold border transition-all ${
              statusFilter === s ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-900/40 text-slate-400 border-slate-800/40 hover:border-brand-500/30'
            }`}>
            {s}
          </button>
        ))}
        <span className="mx-1 text-slate-700">|</span>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="glass-input text-xs py-1.5">
          <option value="All">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span className="ml-3 text-slate-400 text-sm">Loading assignments...</span>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-60" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchAssignments} className="mt-4 btn-secondary px-4 py-2 text-sm">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">
            {assignments.length === 0 ? 'No assignments posted yet.' : 'No assignments match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const dueStatus = getDueStatus(a.due_date);
            const DueIcon = dueStatus.icon;
            const isClosed = a.status === 'Closed';
            return (
              <div key={a.assignment_id}
                className={`glass-card p-5 border border-slate-800/40 animate-slide-up ${isClosed ? 'opacity-60' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className={`font-bold tracking-tight ${isClosed ? 'line-through text-slate-500' : ''}`}>
                        {a.title}
                      </h3>
                      {/* Status badge */}
                      <span className={`text-xxs px-2 py-0.5 rounded-full font-semibold border ${
                        isClosed ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {a.status}
                      </span>
                      {/* Due badge */}
                      <span className={`text-xxs px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${dueStatus.color}`}>
                        <DueIcon className="w-3 h-3" /> {dueStatus.label}
                      </span>
                    </div>

                    {a.description && (
                      <p className="text-sm text-slate-400 mb-3 leading-relaxed">{a.description}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {a.subject}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {a.teacher}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {new Date(a.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Max: {a.max_marks} marks</span>
                      <span className="flex items-center gap-1 text-brand-400/70">{a.department}</span>
                    </div>
                  </div>

                  {isTeacherOrAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggleStatus(a)}
                        className={`px-3 py-1.5 rounded-xl text-xxs font-semibold border transition-all ${
                          isClosed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-800/60 text-slate-400 border-slate-700/40 hover:bg-slate-800'
                        }`}
                        title={isClosed ? 'Reopen assignment' : 'Close assignment'}>
                        {isClosed ? 'Reopen' : 'Close'}
                      </button>
                      <button onClick={() => handleDelete(a.assignment_id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        title="Delete assignment">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
