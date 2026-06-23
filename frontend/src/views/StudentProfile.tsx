import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar, 
  Camera, 
  QrCode, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Lightbulb
} from 'lucide-react';

interface AttendanceLog {
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  in_time: string | null;
  out_time: string | null;
  check_in_by: string;
}

interface StudentStats {
  total_days: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_percentage: number;
}

interface StudentData {
  student_id: string;
  name: string;
  roll_number: string;
  department: string;
  semester: string;
  email: string;
  phone: string;
  face_registered: boolean;
  qr_identity: string;
  performance: {
    internal_marks: number;
    assignment_scores: number;
    exam_scores: number;
    gpa: number;
  };
}

interface Recommendation {
  attendance_percentage: number;
  gpa: number;
  academic_risk_level: string;
  recommendations: string[];
}

export const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // If query param 'id' exists, view that student, else view the current logged in student
  const studentId = searchParams.get('id') || user?.student_id;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [insights, setInsights] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!studentId) {
        setError('No Student ID provided.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        
        const [studentData, statsData, logsData, insightsData] = await Promise.all([
          api.get<StudentData>(`/students/${studentId}`),
          api.get<StudentStats>(`/attendance/stats?student_id=${studentId}`),
          api.get<AttendanceLog[]>(`/attendance/logs?student_id=${studentId}`),
          api.get<Recommendation>(`/analytics/insights/${studentId}`)
        ]);

        setStudent(studentData);
        setStats(statsData);
        setLogs(logsData);
        setInsights(insightsData);
      } catch (err: any) {
        setError(err.message || 'Error pulling student details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        <span className="text-xs font-medium">Retrieving student records...</span>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 glass-panel rounded-3xl border border-rose-500/20 text-rose-455 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5" />
        <span>{error || 'Student not found in registry.'}</span>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${student.qr_identity}&color=4f46e5&bgcolor=ffffff`;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="btn-secondary px-4 py-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-right">
          <h2 className="text-xl font-bold tracking-tight">Student Profile Card</h2>
          <span className="text-xxs text-brand-400 font-bold uppercase tracking-wider">
            {student.name} • {student.student_id}
          </span>
        </div>
      </div>

      {/* Profile Overview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Card Passport + Face enroll trigger */}
        <div className="flex flex-col gap-6">
          {/* Identity card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600"></div>

            <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 text-3xl font-bold uppercase mb-4 mt-2">
              {student.name.substring(0, 2)}
            </div>

            <h3 className="text-lg font-bold tracking-tight">{student.name}</h3>
            <span className="text-xs text-slate-450 font-semibold font-mono uppercase mt-0.5">{student.roll_number}</span>
            <span className="text-xxs text-brand-400 font-bold uppercase tracking-wider mt-2 px-2 py-0.5 rounded-md bg-brand-500/5 border border-brand-500/10">
              {student.department}
            </span>

            {/* QR Card */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-inner mt-6 flex flex-col items-center">
              <img src={qrCodeUrl} alt="QR Code Badge" className="w-40 h-40 object-contain" />
              <span className="text-[10px] font-mono font-bold text-slate-500 mt-2 block tracking-widest select-all">{student.qr_identity}</span>
            </div>

            {/* Teacher capture trigger options */}
            {user?.role !== 'student' && (
              <div className="w-full mt-6">
                <button
                  onClick={() => navigate(`/camera?register_id=${student.student_id}&name=${encodeURIComponent(student.name)}`)}
                  className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  {student.face_registered ? 'Re-enroll Face Signature' : 'Enroll Face Signature'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Col 2: Profile stats & Grades */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Card A: Personal details */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
            <h4 className="text-sm font-bold tracking-tight text-slate-400 block mb-4 uppercase tracking-wider pl-1">Personal Details</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-900 rounded-xl light:bg-white light:border-slate-200">
                <User className="w-4.5 h-4.5 text-brand-400" />
                <div>
                  <span className="text-xxs text-slate-500 block uppercase">Semester / Phase</span>
                  <span className="font-semibold">{student.semester}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-900 rounded-xl light:bg-white light:border-slate-200">
                <GraduationCap className="w-4.5 h-4.5 text-indigo-400" />
                <div>
                  <span className="text-xxs text-slate-500 block uppercase">Major Department</span>
                  <span className="font-semibold">{student.department}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-900 rounded-xl light:bg-white light:border-slate-200">
                <Mail className="w-4.5 h-4.5 text-purple-400" />
                <div>
                  <span className="text-xxs text-slate-500 block uppercase">Official Email</span>
                  <span className="font-semibold truncate max-w-[180px] block">{student.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-900 rounded-xl light:bg-white light:border-slate-200">
                <Phone className="w-4.5 h-4.5 text-emerald-400" />
                <div>
                  <span className="text-xxs text-slate-500 block uppercase">Phone Contact</span>
                  <span className="font-semibold">{student.phone || 'Not configured'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Stats & Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Attendance details */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
              <h4 className="text-sm font-bold tracking-tight text-slate-400 block mb-4 uppercase tracking-wider pl-1">Attendance Record</h4>
              
              <div className="flex justify-between items-center text-xs mb-3">
                <span className="text-slate-500">Attendance Percentage</span>
                <span className={`font-mono font-extrabold ${
                  (stats?.attendance_percentage ?? 0) >= 75 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {stats?.attendance_percentage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mb-5 light:bg-slate-200">
                <div 
                  className={`h-1.5 rounded-full ${
                    (stats?.attendance_percentage ?? 0) >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${stats?.attendance_percentage ?? 0}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xxs border-t border-slate-800/40 pt-4 light:border-slate-200">
                <div>
                  <span className="text-slate-500 uppercase">Days Present</span>
                  <span className="font-semibold block text-slate-200 text-sm mt-0.5 light:text-slate-850">{stats?.present_count ?? 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase">Days Absent</span>
                  <span className="font-semibold block text-slate-200 text-sm mt-0.5 light:text-slate-850">{stats?.absent_count ?? 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase">Late Checkins</span>
                  <span className="font-semibold block text-slate-250 text-sm mt-0.5 light:text-slate-850">{stats?.late_count ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Performance metrics */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
              <h4 className="text-sm font-bold tracking-tight text-slate-400 block mb-4 uppercase tracking-wider pl-1">Academic Scores</h4>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-550">Semester GPA</span>
                  <span className="font-extrabold text-brand-400 light:text-brand-600">{student.performance.gpa}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-550">Internal Marks</span>
                  <span className="font-semibold">{student.performance.internal_marks}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-550">Assignment Submissions</span>
                  <span className="font-semibold">{student.performance.assignment_scores}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-550">Term Exams</span>
                  <span className="font-semibold">{student.performance.exam_scores}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Recommendation insights */}
          {insights && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
              <h4 className="text-sm font-bold tracking-tight text-slate-400 block mb-3.5 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
                Counselor Recommendations
              </h4>
              <div className="space-y-2 text-xs">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2.5 p-3 bg-brand-500/5 border border-brand-500/10 rounded-xl leading-relaxed text-slate-300 light:bg-slate-50 light:text-slate-700">
                    <span className="text-brand-400">⚡</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent student logs summary */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
            <h4 className="text-sm font-bold tracking-tight text-slate-450 block mb-4 uppercase tracking-wider pl-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Recent Logs
            </h4>
            {logs.length === 0 ? (
              <span className="text-xxs text-slate-500 block text-center py-4">No recent attendance records found.</span>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-950/40 border border-slate-900/60 p-3 rounded-2xl text-xs light:bg-white light:border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <span className={
                        log.status === 'Present' ? 'badge-present' :
                        log.status === 'Late' ? 'badge-late' : 'badge-absent'
                      }>
                        {log.status}
                      </span>
                      <span className="font-medium">{log.date}</span>
                    </div>
                    <span className="font-mono text-slate-500 text-xxs uppercase tracking-wider">
                      {log.in_time || '--'} Check-in via {log.check_in_by}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
