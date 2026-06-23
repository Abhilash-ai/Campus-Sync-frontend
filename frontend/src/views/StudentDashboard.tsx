import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  FileText, 
  GraduationCap, 
  AlertTriangle,
  Lightbulb,
  Download,
  Fingerprint
} from 'lucide-react';

interface AttendanceLog {
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  in_time: string | null;
  out_time: string | null;
  total_duration_minutes: number | null;
  check_in_by: string;
  remarks: string;
}

interface StudentStats {
  total_days: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_percentage: number;
}

interface StudentProfileData {
  student_id: string;
  name: string;
  roll_number: string;
  department: string;
  semester: string;
  email: string;
  phone: string;
  qr_identity: string;
  performance: {
    internal_marks: number;
    assignment_scores: number;
    exam_scores: number;
    gpa: number;
  };
}

interface Insights {
  attendance_percentage: number;
  gpa: number;
  academic_risk_level: string;
  recommendations: string[];
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.student_id) return;
      try {
        setLoading(true);
        setError(null);
        
        const [logsData, statsData, profileData, insightsData] = await Promise.all([
          api.get<AttendanceLog[]>(`/attendance/logs?student_id=${user.student_id}`),
          api.get<StudentStats>(`/attendance/stats?student_id=${user.student_id}`),
          api.get<StudentProfileData>(`/students/${user.student_id}`),
          api.get<Insights>(`/analytics/insights/${user.student_id}`)
        ]);

        setLogs(logsData);
        setStats(statsData);
        setProfile(profileData);
        setInsights(insightsData);
      } catch (err: any) {
        setError(err.message || 'Error compiling student records.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <span className="text-xs font-medium">Compiling your student dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 glass-panel rounded-3xl border border-rose-500/20 text-rose-400 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  // Construct QR API URL
  const qrCodeUrl = profile?.qr_identity 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${profile.qr_identity}&color=4f46e5&bgcolor=ffffff`
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Col 1 & 2: Stats, History & Grades */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Row 1: Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Attendance Pct */}
          <div className="glass-card p-5">
            <span className="text-xxs font-bold text-slate-400 light:text-slate-650 uppercase tracking-wider block">Attendance Rate</span>
            <span className={`text-2xl font-extrabold mt-1 block ${
              (stats?.attendance_percentage ?? 0) >= 75 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stats?.attendance_percentage ?? 0}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {(stats?.attendance_percentage ?? 0) >= 75 ? 'Eligible for Exams' : 'Attendance Warning'}
            </span>
          </div>

          {/* Present Days */}
          <div className="glass-card p-5">
            <span className="text-xxs font-bold text-slate-400 light:text-slate-655 uppercase tracking-wider block">Days Present</span>
            <span className="text-2xl font-extrabold text-slate-100 mt-1 block light:text-slate-900">
              {stats?.present_count ?? 0}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Out of {stats?.total_days ?? 0} school days
            </span>
          </div>

          {/* Late Entries */}
          <div className="glass-card p-5">
            <span className="text-xxs font-bold text-slate-400 light:text-slate-655 uppercase tracking-wider block">Late Entries</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
              {stats?.late_count ?? 0}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Check-in after 09:15 AM
            </span>
          </div>

          {/* Cumulative GPA */}
          <div className="glass-card p-5">
            <span className="text-xxs font-bold text-slate-400 light:text-slate-655 uppercase tracking-wider block">Cumulative GPA</span>
            <span className="text-2xl font-extrabold text-brand-400 mt-1 block light:text-brand-600">
              {profile?.performance?.gpa ?? '0.00'}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Top 15% of class
            </span>
          </div>
        </div>

        {/* Row 2: Intelligence & Recommendations */}
        {insights && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
            <h4 className="text-sm font-bold tracking-tight text-brand-400 uppercase tracking-widest pl-1 block mb-3.5 light:text-brand-600 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              AI Campus Intelligence Insights
            </h4>
            <div className="space-y-2.5">
              {insights.recommendations.map((rec, i) => (
                <div 
                  key={i}
                  className={`flex items-start gap-3 p-3.5 border rounded-2xl text-xs leading-relaxed ${
                    rec.includes("warning") || rec.includes("below the university threshold")
                      ? 'bg-rose-500/5 border-rose-500/20 text-rose-350 light:bg-rose-50 light:text-rose-700'
                      : rec.includes("GPA")
                      ? 'bg-amber-500/5 border-amber-500/20 text-amber-350 light:bg-amber-50 light:text-amber-700'
                      : 'bg-brand-500/5 border-brand-500/20 text-brand-300 light:bg-brand-50 light:text-brand-700'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-amber-400">
                    💡
                  </div>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row 3: Daily Logs Table */}
        <div className="glass-panel rounded-3xl border border-slate-800/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-brand-400" />
            <h3 className="text-lg font-bold tracking-tight">Recent Attendance Logs</h3>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No attendance logs found in database.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/50 text-slate-450 text-xxs font-bold uppercase tracking-wider light:border-slate-200">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">In Time</th>
                    <th className="pb-2">Out Time</th>
                    <th className="pb-2">Duration</th>
                    <th className="pb-2 pr-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/20 text-xs light:divide-slate-200">
                  {logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/10 light:hover:bg-slate-50/50">
                      <td className="py-3 font-medium">{log.date}</td>
                      <td className="py-3">
                        <span className={
                          log.status === 'Present' ? 'badge-present' :
                          log.status === 'Late' ? 'badge-late' : 'badge-absent'
                        }>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-300 light:text-slate-700">{log.in_time || '--:--:--'}</td>
                      <td className="py-3 font-mono text-slate-300 light:text-slate-700">{log.out_time || '--:--:--'}</td>
                      <td className="py-3 text-slate-400 light:text-slate-600">
                        {log.total_duration_minutes !== null ? `${log.total_duration_minutes} min` : '--'}
                      </td>
                      <td className="py-3 pr-4 text-right text-[10px] text-slate-450 font-bold uppercase tracking-wider light:text-slate-600">
                        {log.check_in_by} Check
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Col 3: Student digital QR Identity Card */}
      <div className="flex flex-col gap-6">
        {/* QR ID card wrapper */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 relative overflow-hidden flex flex-col items-center">
          {/* Card Accent Banner */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-600"></div>
          
          <div className="w-full flex justify-between items-center mb-6 mt-1">
            <span className="text-xxs font-extrabold text-brand-400 uppercase tracking-widest light:text-brand-600">Digital Passport</span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">CampusSync Identity</span>
          </div>

          {/* Student Profile photo mock */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-650 to-indigo-650 flex items-center justify-center text-white border border-brand-500/30 text-3xl font-bold uppercase tracking-wider shadow-lg shadow-brand-500/10 mb-4">
            {profile?.name.substring(0, 2)}
          </div>

          <h3 className="text-lg font-bold tracking-tight text-center">{profile?.name}</h3>
          <span className="text-xs text-brand-400 font-bold tracking-tight text-center mt-0.5 light:text-brand-600">
            {profile?.roll_number}
          </span>

          <div className="w-full grid grid-cols-2 gap-4 border-y border-slate-800/40 py-4 my-5 text-center text-xs light:border-slate-200">
            <div>
              <span className="text-xxs text-slate-500 block uppercase tracking-wider">Department</span>
              <span className="font-semibold text-slate-300 light:text-slate-800 block mt-0.5">{profile?.department}</span>
            </div>
            <div>
              <span className="text-xxs text-slate-500 block uppercase tracking-wider">Semester</span>
              <span className="font-semibold text-slate-300 light:text-slate-800 block mt-0.5">{profile?.semester}</span>
            </div>
          </div>

          {/* QR code block */}
          {qrCodeUrl ? (
            <div className="p-3 bg-white rounded-2xl border border-slate-250 shadow-inner flex flex-col items-center">
              <img 
                src={qrCodeUrl} 
                alt="Student QR Identity Code" 
                className="w-44 h-44 object-contain"
              />
              <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest mt-2 block uppercase select-all">
                {profile?.qr_identity}
              </span>
            </div>
          ) : (
            <div className="w-44 h-44 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xxs">
              Loading barcode...
            </div>
          )}

          <div className="w-full flex flex-col gap-2.5 mt-6">
            <a 
              href={qrCodeUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Badge QR
            </a>
            
            <div className="flex items-center justify-center gap-1.5 text-xxs text-slate-500 text-center mt-1 light:text-slate-600">
              <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scanning at checkpoints marks daily check-ins.</span>
            </div>
          </div>
        </div>

        {/* Academic Marks Detailed Module */}
        {profile && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4.5 h-4.5 text-brand-400" />
              <h4 className="text-sm font-bold tracking-tight">Academic Performance</h4>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 light:text-slate-650">Internal Marks Average</span>
                <span className="font-semibold">{profile.performance.internal_marks}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full light:bg-slate-200">
                <div className="bg-brand-500 h-1 rounded-full" style={{ width: `${profile.performance.internal_marks}%` }}></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 light:text-slate-655">Assignment Submissions</span>
                <span className="font-semibold">{profile.performance.assignment_scores}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full light:bg-slate-200">
                <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${profile.performance.assignment_scores}%` }}></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 light:text-slate-655">Term Exam Average</span>
                <span className="font-semibold">{profile.performance.exam_scores}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full light:bg-slate-200">
                <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${profile.performance.exam_scores}%` }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
