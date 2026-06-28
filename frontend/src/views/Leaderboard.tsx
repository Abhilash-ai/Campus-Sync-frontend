import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Medal,
  TrendingUp,
  GraduationCap,
  Users,
  Loader2,
  AlertTriangle,
  Star,
  BarChart3,
  Filter,
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  student_id: string;
  name: string;
  department: string;
  roll_number: string;
  semester: string;
  attendance_percentage: number;
  gpa: number;
  internal_marks: number;
  exam_scores: number;
  composite_score: number;
}

const RANK_STYLES: Record<number, { bg: string; icon: string; text: string; badge: string }> = {
  1: { bg: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40', icon: '🥇', text: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30 text-amber-400' },
  2: { bg: 'from-slate-400/15 to-slate-500/5 border-slate-400/30', icon: '🥈', text: 'text-slate-300', badge: 'bg-slate-400/20 border-slate-400/30 text-slate-300' },
  3: { bg: 'from-orange-600/20 to-amber-600/10 border-orange-500/30', icon: '🥉', text: 'text-orange-400', badge: 'bg-orange-500/20 border-orange-500/30 text-orange-400' },
};

function getAttendanceBadge(pct: number): string {
  if (pct >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (pct >= 75) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  if (pct >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
}

function getGpaBadge(gpa: number): string {
  if (gpa >= 3.7) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (gpa >= 3.0) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  if (gpa >= 2.0) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
}

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'composite_score' | 'attendance_percentage' | 'gpa'>('composite_score');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ leaderboard: LeaderboardEntry[] }>('/assignments/leaderboard');
      setLeaderboard(res.leaderboard);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // All departments from dataset
  const departments = ['All', ...Array.from(new Set(leaderboard.map((e) => e.department))).sort()];

  // Filter + sort
  const filtered = [...leaderboard]
    .filter((e) => deptFilter === 'All' || e.department === deptFilter)
    .sort((a, b) => b[sortBy] - a[sortBy])
    .map((item, idx) => ({ ...item, displayRank: idx + 1 }));

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const myEntry = user?.student_id
    ? filtered.find((e) => e.student_id === user.student_id)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Leaderboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 light:text-slate-600">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''} ranked by composite score
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="glass-input text-sm">
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="glass-input text-sm">
            <option value="composite_score">Overall Score</option>
            <option value="attendance_percentage">Attendance</option>
            <option value="gpa">GPA</option>
          </select>
        </div>
      </div>

      {/* My rank banner (for students) */}
      {myEntry && (
        <div className="glass-panel p-4 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 to-indigo-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-lg">
              #{myEntry.displayRank}
            </div>
            <div>
              <span className="text-xxs font-bold text-brand-400 uppercase tracking-wider block">Your Ranking</span>
              <span className="text-sm font-bold">
                {myEntry.displayRank === 1 ? '🥇 ' : myEntry.displayRank === 2 ? '🥈 ' : myEntry.displayRank === 3 ? '🥉 ' : ''}
                Rank #{myEntry.displayRank} of {filtered.length} — {myEntry.composite_score} pts
              </span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span className="ml-3 text-slate-400 text-sm">Computing rankings...</span>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-rose-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-60" />
          <p className="text-sm">{error}</p>
          <button onClick={fetchLeaderboard} className="mt-4 btn-secondary px-4 py-2 text-sm">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No students to rank yet.</p>
        </div>
      ) : (
        <>
          {/* Podium — Top 3 */}
          {topThree.length >= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
              {/* Reorder: 2nd, 1st, 3rd for visual podium effect */}
              {[topThree[1], topThree[0], topThree[2]].map((entry, i) => {
                if (!entry) return <div key={i} />;
                const rankNum = entry.displayRank;
                const style = RANK_STYLES[rankNum] || { bg: 'border-slate-800/40', icon: '🎖️', text: 'text-slate-300', badge: 'bg-slate-700/30 border-slate-700 text-slate-400' };
                return (
                  <div key={entry.student_id}
                    className={`glass-card p-5 border text-center bg-gradient-to-b ${style.bg} ${rankNum === 1 ? 'sm:scale-105 shadow-xl shadow-amber-500/10' : ''} animate-slide-up`}>
                    <div className="text-3xl mb-2">{style.icon}</div>
                    <div className={`text-xxs font-bold uppercase tracking-wider mb-1 ${style.text}`}>
                      Rank #{rankNum}
                    </div>
                    <div className="w-12 h-12 mx-auto rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center font-bold text-lg text-brand-300 mb-2">
                      {entry.name.slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-sm tracking-tight">{entry.name}</h3>
                    <p className="text-xxs text-slate-500 mt-0.5">{entry.roll_number}</p>
                    <p className="text-xxs text-slate-500">{entry.department.split(' ').map(w => w[0]).join('')}</p>

                    <div className={`mt-3 px-3 py-1.5 rounded-xl border text-sm font-extrabold inline-flex items-center gap-1 ${style.badge}`}>
                      <Star className="w-3 h-3" /> {entry.composite_score} pts
                    </div>

                    <div className="flex justify-center gap-3 mt-3">
                      <div className="text-center">
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getAttendanceBadge(entry.attendance_percentage)}`}>
                          {entry.attendance_percentage}%
                        </div>
                        <div className="text-xxs text-slate-600 mt-0.5">Att.</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getGpaBadge(entry.gpa)}`}>
                          {entry.gpa.toFixed(1)}
                        </div>
                        <div className="text-xxs text-slate-600 mt-0.5">GPA</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full ranking table */}
          {filtered.length > 0 && (
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 uppercase tracking-wider w-12">Rank</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Department</th>
                      <th className="px-4 py-3 text-center text-xxs font-bold text-slate-500 uppercase tracking-wider">Att.</th>
                      <th className="px-4 py-3 text-center text-xxs font-bold text-slate-500 uppercase tracking-wider">GPA</th>
                      <th className="px-4 py-3 text-center text-xxs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {filtered.map((entry) => {
                      const isMe = user?.student_id === entry.student_id;
                      const medal = entry.displayRank <= 3 ? ['🥇','🥈','🥉'][entry.displayRank - 1] : null;
                      return (
                        <tr key={entry.student_id}
                          className={`transition-colors hover:bg-slate-800/20 ${isMe ? 'bg-brand-500/5 border-l-2 border-brand-500' : ''}`}>
                          <td className="px-4 py-3">
                            <span className="font-bold text-sm">
                              {medal || `#${entry.displayRank}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300 shrink-0">
                                {entry.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold tracking-tight flex items-center gap-1.5">
                                  {entry.name}
                                  {isMe && <span className="text-xxs px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">You</span>}
                                </div>
                                <div className="text-xxs text-slate-500">{entry.roll_number}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 hidden sm:table-cell">{entry.department}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getAttendanceBadge(entry.attendance_percentage)}`}>
                              {entry.attendance_percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getGpaBadge(entry.gpa)}`}>
                              {entry.gpa.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-extrabold text-brand-300">{entry.composite_score}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scoring explanation */}
          <div className="glass-card p-4 border border-slate-800/30">
            <p className="text-xxs text-slate-500 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>
                <strong className="text-slate-400">Composite Score</strong> = Attendance (60% weight) + GPA normalized to 100 (40% weight). Maximum possible score: 100 pts.
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
};
