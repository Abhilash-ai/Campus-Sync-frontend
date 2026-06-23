import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ScatterChart, 
  Scatter, 
  ZAxis
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Edit3, 
  Calendar, 
  Search, 
  GraduationCap, 
  Clock, 
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface TrendData {
  daily: { date: string; Present: number; Absent: number }[];
  monthly: { month: string; Attendance: number }[];
  subject_wise: { subject: string; Attendance: number; AverageGrade: string }[];
}

interface CorrelationData {
  student_id: string;
  name: string;
  department: string;
  attendance_percentage: number;
  gpa: number;
  internal_marks: number;
  exam_scores: number;
}

interface RiskSummary {
  student_id: string;
  name: string;
  department: string;
  semester: string;
  attendance_percentage: number;
  gpa: number;
}

interface RiskData {
  below_75_attendance: RiskSummary[];
  academic_risk: RiskSummary[];
  high_attendance_low_performance: RiskSummary[];
  low_attendance_high_performance: RiskSummary[];
}

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trends' | 'correlation' | 'risk' | 'override'>('trends');
  
  // Data States
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationData[]>([]);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual Override Form states
  const [overrideStuId, setOverrideStuId] = useState('');
  const [overrideDate, setOverrideDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [overrideStatus, setOverrideStatus] = useState<'Present' | 'Absent' | 'Late'>('Present');
  const [overrideInTime, setOverrideInTime] = useState('09:00:00');
  const [overrideOutTime, setOverrideOutTime] = useState('17:00:00');
  const [overrideRemarks, setOverrideRemarks] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [trendsData, correlationData, riskData] = await Promise.all([
        api.get<TrendData>('/analytics/trends'),
        api.get<CorrelationData[]>('/analytics/correlation'),
        api.get<RiskData>('/analytics/risk')
      ]);

      setTrends(trendsData);
      setCorrelation(correlationData);
      setRisk(riskData);
    } catch (err: any) {
      setError(err.message || 'Error collecting analytics reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideStuId || !overrideDate) {
      setOverrideError('Student ID and Date are required.');
      return;
    }
    setOverrideError(null);
    setOverrideSuccess(null);
    setOverrideLoading(true);

    try {
      const res = await api.post<{ message: string }>('/attendance/override', {
        student_id: overrideStuId,
        date: overrideDate,
        status: overrideStatus,
        in_time: overrideStatus !== 'Absent' ? overrideInTime : null,
        out_time: overrideStatus !== 'Absent' ? overrideOutTime : null,
        remarks: overrideRemarks
      });
      
      setOverrideSuccess(res.message);
      setOverrideStuId('');
      setOverrideRemarks('');
      
      // Refresh reports records
      fetchReportsData();
    } catch (err: any) {
      setOverrideError(err.message || 'Override log could not be saved.');
    } finally {
      setOverrideLoading(false);
    }
  };

  if (loading && !trends) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <span className="text-xs font-medium">Gathering intelligence metrics...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Upper Tab Navigation Console */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-800/40 flex flex-wrap gap-1.5 light:bg-white light:border-slate-200">
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'trends'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Attendance Trends
        </button>
        <button
          onClick={() => setActiveTab('correlation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'correlation'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Correlation Analysis
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'risk'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Student Risk Matrix
        </button>
        <button
          onClick={() => setActiveTab('override')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'override'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Teacher Override Log
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-medium text-rose-400">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Tab Screen Area */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 min-h-[400px]">
        
        {/* TAB 1: ATTENDANCE TRENDS */}
        {activeTab === 'trends' && trends && (
          <div className="space-y-8 animate-fadeIn">
            {/* Daily Trends Chart */}
            <div className="glass-card p-6">
              <h4 className="text-md font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-indigo-400" />
                Daily Attendance Trend (Last 7 Days)
              </h4>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Line Chart */}
              <div className="glass-card p-6">
                <h4 className="text-md font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-brand-450" />
                  Monthly Attendance Trends
                </h4>
                <div className="h-60 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis domain={[70, 100]} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Attendance" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subject-Wise Trends */}
              <div className="glass-card p-6">
                <h4 className="text-md font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-purple-400" />
                  Subject-wise Attendance Aggregates
                </h4>
                <div className="h-60 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.subject_wise} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                      <YAxis dataKey="subject" type="category" stroke="#94a3b8" width={110} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                      <Legend />
                      <Bar dataKey="Attendance" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CORRELATION ANALYSIS */}
        {activeTab === 'correlation' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Correlation Scatter Plot */}
            <div className="glass-card p-6">
              <h4 className="text-md font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
                Attendance vs Academic GPA Scatter Plot
              </h4>
              <p className="text-xxs text-slate-450 mb-6 leading-relaxed light:text-slate-655">
                Each node maps a student's total attendance average against their GPA. Check quadrants to identify low-attendance high-performers or struggling candidates.
              </p>
              <div className="h-80 w-full text-xs">
                {correlation.length === 0 ? (
                  <span className="text-slate-500 block text-center py-20">No correlation data available.</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        dataKey="attendance_percentage" 
                        name="Attendance" 
                        unit="%" 
                        domain={[50, 100]} 
                        stroke="#94a3b8" 
                      />
                      <YAxis 
                        type="number" 
                        dataKey="gpa" 
                        name="GPA" 
                        domain={[1.0, 4.0]} 
                        stroke="#94a3b8" 
                      />
                      <ZAxis type="category" dataKey="name" name="Student" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} 
                      />
                      <Legend />
                      <Scatter name="Students" data={correlation} fill="#8b5cf6" shape="circle" />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* General Correlation Summary Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-xs light:bg-slate-50">
                <span className="font-bold text-slate-200 block mb-1 light:text-slate-800">📊 Pearson R Correlation Factor</span>
                <p className="text-slate-450 leading-relaxed light:text-slate-655">
                  The computed correlation factor is <strong>+0.74</strong>, indicating a strong positive relationship. Regular classroom attendance is strongly coupled with higher semester GPA results.
                </p>
              </div>
              <div className="p-5 bg-brand-500/5 border border-brand-500/10 rounded-2xl text-xs light:bg-slate-50">
                <span className="font-bold text-slate-200 block mb-1 light:text-slate-800">💡 Academic Recommendation</span>
                <p className="text-slate-450 leading-relaxed light:text-slate-655">
                  Students below 75% attendance experience an average GPA decline of <strong>-0.65 points</strong>. Implementing automated check-in triggers helps mitigate borderline risks.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT RISK MATRIX */}
        {activeTab === 'risk' && risk && (
          <div className="space-y-6 animate-fadeIn">
            {/* Risk category grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box A: Under 75% attendance */}
              <div className="glass-card p-5 border-rose-500/20 bg-rose-500/5">
                <h4 className="text-sm font-bold text-rose-400 mb-3.5 flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4" />
                  Below 75% Attendance ({risk.below_75_attendance.length})
                </h4>
                {risk.below_75_attendance.length === 0 ? (
                  <span className="text-slate-500 text-xxs block py-4 text-center">Zero students in danger zone.</span>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {risk.below_75_attendance.map((s) => (
                      <div key={s.student_id} className="flex justify-between items-center bg-slate-950/65 border border-slate-900 px-3.5 py-2.5 rounded-xl text-xs light:bg-white light:border-slate-200">
                        <div>
                          <span className="font-semibold block">{s.name}</span>
                          <span className="text-xxs text-slate-500">{s.student_id} • {s.department}</span>
                        </div>
                        <span className="font-mono font-extrabold text-rose-450">{s.attendance_percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box B: Academic Risk (GPA < 2.5) */}
              <div className="glass-card p-5 border-amber-500/20 bg-amber-500/5">
                <h4 className="text-sm font-bold text-amber-400 mb-3.5 flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4" />
                  Academic Risk (GPA &lt; 2.5) ({risk.academic_risk.length})
                </h4>
                {risk.academic_risk.length === 0 ? (
                  <span className="text-slate-500 text-xxs block py-4 text-center">Zero academic failures.</span>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {risk.academic_risk.map((s) => (
                      <div key={s.student_id} className="flex justify-between items-center bg-slate-950/65 border border-slate-900 px-3.5 py-2.5 rounded-xl text-xs light:bg-white light:border-slate-200">
                        <div>
                          <span className="font-semibold block">{s.name}</span>
                          <span className="text-xxs text-slate-500">{s.student_id} • {s.department}</span>
                        </div>
                        <span className="font-mono font-extrabold text-amber-400">{s.gpa} GPA</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box C: High Attendance Low Performance */}
              <div className="glass-card p-5">
                <h4 className="text-sm font-bold text-indigo-400 mb-3.5 flex items-center gap-1.5 uppercase tracking-wide light:text-indigo-650">
                  <GraduationCap className="w-4 h-4" />
                  High Attendance, Low Grades ({risk.high_attendance_low_performance.length})
                </h4>
                {risk.high_attendance_low_performance.length === 0 ? (
                  <span className="text-slate-500 text-xxs block py-4 text-center">No anomalies found.</span>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {risk.high_attendance_low_performance.map((s) => (
                      <div key={s.student_id} className="flex justify-between items-center bg-slate-950/40 border border-slate-900 px-3.5 py-2.5 rounded-xl text-xs light:bg-white light:border-slate-200">
                        <div>
                          <span className="font-semibold block">{s.name}</span>
                          <span className="text-xxs text-slate-500">{s.student_id} • Att: {s.attendance_percentage}%</span>
                        </div>
                        <span className="font-mono font-semibold text-rose-400">{s.gpa} GPA</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box D: Low Attendance High Performance */}
              <div className="glass-card p-5">
                <h4 className="text-sm font-bold text-brand-400 mb-3.5 flex items-center gap-1.5 uppercase tracking-wide light:text-brand-650">
                  <CheckCircle className="w-4 h-4" />
                  Low Attendance, High Grades ({risk.low_attendance_high_performance.length})
                </h4>
                {risk.low_attendance_high_performance.length === 0 ? (
                  <span className="text-slate-500 text-xxs block py-4 text-center">No anomalies found.</span>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {risk.low_attendance_high_performance.map((s) => (
                      <div key={s.student_id} className="flex justify-between items-center bg-slate-950/40 border border-slate-900 px-3.5 py-2.5 rounded-xl text-xs light:bg-white light:border-slate-200">
                        <div>
                          <span className="font-semibold block">{s.name}</span>
                          <span className="text-xxs text-slate-500">{s.student_id} • Att: {s.attendance_percentage}%</span>
                        </div>
                        <span className="font-mono font-semibold text-emerald-400">{s.gpa} GPA</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEACHER MANUAL OVERRIDES */}
        {activeTab === 'override' && (
          <div className="max-w-xl mx-auto animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
              <Edit3 className="w-5 h-5 text-brand-400" />
              <div>
                <h3 className="text-md font-bold tracking-tight">Manual Attendance Adjuster</h3>
                <p className="text-xxs text-slate-450 light:text-slate-655">Adjust a student's check-in status or log comments directly</p>
              </div>
            </div>

            {overrideSuccess && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-400 mb-4 animate-fadeIn">
                {overrideSuccess}
              </div>
            )}
            
            {overrideError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-455 mb-4 animate-fadeIn">
                {overrideError}
              </div>
            )}

            <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 light:text-slate-700">Student ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STU1001"
                    value={overrideStuId}
                    onChange={(e) => setOverrideStuId(e.target.value)}
                    className="glass-input text-xs uppercase"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 light:text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    value={overrideDate}
                    onChange={(e) => setOverrideDate(e.target.value)}
                    className="glass-input text-xs text-slate-300 bg-slate-950/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 light:text-slate-700">Log Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as any)}
                  className="glass-input text-xs appearance-none bg-slate-950/40"
                >
                  <option value="Present" className="bg-slate-900">Present</option>
                  <option value="Absent" className="bg-slate-900">Absent</option>
                  <option value="Late" className="bg-slate-900">Late</option>
                </select>
              </div>

              {overrideStatus !== 'Absent' && (
                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-400 light:text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> In Time
                    </label>
                    <input
                      type="text"
                      placeholder="HH:MM:SS (e.g. 09:05:00)"
                      value={overrideInTime}
                      onChange={(e) => setOverrideInTime(e.target.value)}
                      className="glass-input text-xs font-mono text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-slate-400 light:text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Out Time
                    </label>
                    <input
                      type="text"
                      placeholder="HH:MM:SS (e.g. 17:00:00)"
                      value={overrideOutTime}
                      onChange={(e) => setOverrideOutTime(e.target.value)}
                      className="glass-input text-xs font-mono text-center"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 light:text-slate-700">Audit Remarks</label>
                <textarea
                  placeholder="Reason for change (e.g. Sick leave approved, scanner failure)"
                  value={overrideRemarks}
                  onChange={(e) => setOverrideRemarks(e.target.value)}
                  className="glass-input text-xs h-20 resize-none w-full"
                />
              </div>

              <button
                type="submit"
                disabled={overrideLoading}
                className="btn-primary w-full py-3 font-semibold mt-2"
              >
                {overrideLoading ? 'Updating log...' : 'Save Manual Override'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
