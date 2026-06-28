import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  Plus,
  Trash2,
  Clock,
  MapPin,
  BookOpen,
  User,
  Loader2,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface TimetableEntry {
  entry_id: string;
  subject: string;
  day: string;
  start_time: string;
  end_time: string;
  department: string;
  semester: string;
  room: string;
  teacher: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_COLORS: Record<string, string> = {
  Monday: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400',
  Tuesday: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 text-violet-400',
  Wednesday: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  Thursday: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400',
  Friday: 'from-rose-500/10 to-rose-600/5 border-rose-500/20 text-rose-400',
  Saturday: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400',
};

const TODAY = DAYS[new Date().getDay() - 1] || 'Monday';

interface AddForm {
  subject: string;
  day: string;
  start_time: string;
  end_time: string;
  department: string;
  semester: string;
  room: string;
  teacher: string;
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

const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'All'];

export const Timetable: React.FC = () => {
  const { user } = useAuth();
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<string>(TODAY);
  const [deptFilter, setDeptFilter] = useState<string>('All');

  const [form, setForm] = useState<AddForm>({
    subject: '',
    day: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    department: 'Computer Science',
    semester: 'Semester 4',
    room: '',
    teacher: '',
  });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = deptFilter !== 'All' ? `?department=${encodeURIComponent(deptFilter)}` : '';
      const res = await api.get<{ timetable: TimetableEntry[] }>(`/timetable${params}`);
      setEntries(res.timetable);
    } catch (err: any) {
      setError(err.message || 'Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  }, [deptFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.subject.trim() || !form.room.trim()) {
      setFormError('Subject and Room are required.');
      return;
    }
    if (form.start_time >= form.end_time) {
      setFormError('End time must be after start time.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/timetable', form);
      setShowForm(false);
      setForm({ subject: '', day: 'Monday', start_time: '09:00', end_time: '10:00', department: 'Computer Science', semester: 'Semester 4', room: '', teacher: '' });
      await fetchEntries();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry_id: string) => {
    if (!window.confirm('Remove this timetable slot?')) return;
    try {
      await api.delete(`/timetable/${entry_id}`);
      setEntries((prev) => prev.filter((e) => e.entry_id !== entry_id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete slot.');
    }
  };

  const dayEntries = entries.filter((e) => e.day === activeDay);
  const todayCount = entries.filter((e) => e.day === TODAY).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand-400" />
            Class Timetable
          </h1>
          <p className="text-sm text-slate-400 mt-1 light:text-slate-600">
            {entries.length} total slots &middot; {todayCount} classes today
          </p>
        </div>
        <div className="flex gap-2">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="glass-input text-sm"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {isTeacherOrAdmin && (
            <button onClick={() => setShowForm((v) => !v)} className="btn-primary px-4 py-2.5 text-sm">
              <Plus className="w-4 h-4" />
              {showForm ? 'Cancel' : 'Add Slot'}
            </button>
          )}
        </div>
      </div>

      {/* Add Slot Form */}
      {showForm && isTeacherOrAdmin && (
        <div className="glass-panel p-6 rounded-2xl border border-brand-500/20 animate-slide-up">
          <h3 className="text-sm font-bold mb-4 text-brand-400 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Schedule Slot
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {formError && (
              <div className="sm:col-span-2 lg:col-span-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                {formError}
              </div>
            )}
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Subject *</label>
              <input type="text" placeholder="e.g. Data Structures" value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Day *</label>
              <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="glass-input w-full">
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Start Time *</label>
              <input type="time" value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">End Time *</label>
              <input type="time" value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Department *</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="glass-input w-full">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Semester</label>
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="glass-input w-full">
                {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Room / Lab *</label>
              <input type="text" placeholder="e.g. Room 204 / CS Lab" value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })} className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xxs font-semibold text-slate-400 ml-1 block mb-1.5">Teacher Name</label>
              <input type="text" placeholder="e.g. Prof. Smith" value={form.teacher}
                onChange={(e) => setForm({ ...form, teacher: e.target.value })} className="glass-input w-full" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? 'Adding...' : 'Add Slot'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map((day) => {
          const count = entries.filter((e) => e.day === day).length;
          const isToday = day === TODAY;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex flex-col items-center px-4 py-3 rounded-2xl border text-sm font-semibold min-w-[80px] transition-all duration-200 whitespace-nowrap ${
                activeDay === day
                  ? 'bg-gradient-to-b from-brand-600 to-indigo-600 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                  : 'bg-slate-900/40 text-slate-400 border-slate-800/40 hover:border-brand-500/30 hover:text-white'
              }`}
            >
              <span className="text-xs font-bold">{day.slice(0, 3)}</span>
              <span className={`text-xxs mt-1 px-1.5 py-0.5 rounded-full ${activeDay === day ? 'bg-white/20' : 'bg-slate-800/60'}`}>
                {count} class{count !== 1 ? 'es' : ''}
              </span>
              {isToday && <span className="text-xxs mt-0.5 font-bold text-emerald-400">Today</span>}
            </button>
          );
        })}
      </div>

      {/* Schedule for active day */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span className="ml-3 text-slate-400 text-sm">Loading schedule...</span>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-rose-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-60" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchEntries} className="mt-4 btn-secondary px-4 py-2 text-sm">Retry</button>
        </div>
      ) : dayEntries.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No classes scheduled for {activeDay}.</p>
          {isTeacherOrAdmin && (
            <button onClick={() => { setForm((f) => ({ ...f, day: activeDay })); setShowForm(true); }}
              className="mt-4 btn-primary px-5 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Add Class
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {dayEntries.map((entry) => {
            const colorClass = DAY_COLORS[entry.day] || DAY_COLORS.Monday;
            return (
              <div key={entry.entry_id}
                className={`glass-card p-5 border bg-gradient-to-r ${colorClass} animate-slide-up`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    {/* Time Block */}
                    <div className="glass-panel px-3 py-2 rounded-xl text-center min-w-[80px] border border-slate-800/40">
                      <div className="text-xs font-bold">{entry.start_time}</div>
                      <div className="text-xxs text-slate-500 my-0.5">to</div>
                      <div className="text-xs font-bold">{entry.end_time}</div>
                    </div>

                    <div>
                      <h3 className="font-bold tracking-tight">{entry.subject}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" /> {entry.room}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <User className="w-3 h-3" /> {entry.teacher || 'Staff'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <BookOpen className="w-3 h-3" /> {entry.department}
                        </span>
                        {entry.semester && entry.semester !== 'All' && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" /> {entry.semester}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isTeacherOrAdmin && (
                    <button onClick={() => handleDelete(entry.entry_id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shrink-0"
                      title="Remove slot">
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
