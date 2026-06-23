import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  QrCode, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  KeyRound,
  ShieldCheck,
  Calendar,
  Fingerprint
} from 'lucide-react';

interface Student {
  student_id: string;
  name: string;
  qr_identity: string;
  department: string;
}

interface ScanResult {
  success: boolean;
  message?: string;
  student_id?: string;
  name?: string;
  action?: 'Check-In' | 'Check-Out' | string;
  log?: {
    date: string;
    status: string;
    in_time: string;
    out_time: string | null;
    total_duration: number | null;
    late_entry: boolean;
  };
}

export const QRAttendance: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [qrCodeString, setQrCodeString] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch list of students to assist the sandbox simulator
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.get<Student[]>('/students');
        setStudents(data);
      } catch (err: any) {
        console.error("Failed to load students list for sandbox:", err);
      }
    };
    fetchStudents();
  }, []);

  const handleScanSubmit = async (code: string) => {
    if (!code.trim() || loading) return;
    
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await api.post<ScanResult>('/attendance/qr-checkin', {
        qr_identity: code.trim()
      });
      setResult(res);
      setQrCodeString('');
    } catch (err: any) {
      setError(err.message || 'QR code verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fadeIn">
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
          <h2 className="text-xl font-bold tracking-tight">QR Verification Checkpoint</h2>
          <span className="text-xxs text-brand-400 font-bold uppercase tracking-wider">QR Attendance Backup System</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Scan Console & Input */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Main Manual Input Scanner */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-brand-400" />
              <h3 className="text-md font-bold tracking-tight">Scan Barcode Card</h3>
            </div>
            
            <p className="text-xs text-slate-450 leading-relaxed mb-6 light:text-slate-655">
              To log attendance, position the student's QR ID card before the scanner or type their unique identity code key below.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xxs font-bold text-slate-400 light:text-slate-700 pl-1 uppercase tracking-wider">
                  Passport QR Identity Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. QR_STU1001_CS"
                    value={qrCodeString}
                    onChange={(e) => setQrCodeString(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScanSubmit(qrCodeString)}
                    disabled={loading}
                    className="glass-input flex-1 font-mono text-center text-sm tracking-widest uppercase"
                  />
                  <button
                    onClick={() => handleScanSubmit(qrCodeString)}
                    disabled={loading || !qrCodeString}
                    className="btn-primary px-6 text-sm"
                  >
                    Scan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sandbox Scanner Tool */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/40">
            <span className="text-xxs font-bold text-brand-400 uppercase tracking-widest pl-1 block mb-3.5 light:text-brand-600">
              ⚡ Classroom Scanner Simulation (Sandbox Mode)
            </span>
            <p className="text-xxs text-slate-450 mb-4 light:text-slate-655 leading-relaxed">
              Click a student profile below to mock-scan their digital QR card. This triggers a simulated barcode swipe at the campus entrance terminal.
            </p>
            
            {students.length === 0 ? (
              <span className="text-xxs text-slate-500 block">No students found to simulate.</span>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-2">
                {students.map((student) => (
                  <button
                    key={student.student_id}
                    onClick={() => handleScanSubmit(student.qr_identity)}
                    disabled={loading}
                    className="p-3 bg-slate-950/40 hover:bg-slate-900 border border-slate-900 rounded-2xl text-left text-xxs transition-all duration-150 flex flex-col justify-between hover:border-brand-500/30 light:bg-white light:border-slate-200"
                  >
                    <span className="font-bold text-slate-250 block light:text-slate-850">{student.name}</span>
                    <span className="font-mono text-slate-500 mt-1.5 block tracking-tight uppercase">{student.qr_identity}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Scan Results Summary Card */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800/40 min-h-[300px] flex flex-col justify-center">
            {/* 1. Default Awaiting State */}
            {!result && !error && !loading && (
              <div className="text-center text-slate-500 py-12">
                <QrCode className="w-12 h-12 stroke-1 text-slate-700 mx-auto mb-3" />
                <p className="text-xs">Awaiting scan submission...</p>
              </div>
            )}

            {/* 2. Loading State */}
            {loading && (
              <div className="text-center text-brand-400 py-12 flex flex-col items-center gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
                <span className="text-xxs font-bold uppercase tracking-wider">Verifying barcode checksum...</span>
              </div>
            )}

            {/* 3. Error Card */}
            {error && (
              <div className="flex flex-col items-center text-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 gap-2 animate-fadeIn">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
                <h4 className="font-bold text-xs">Scan Verification Failed</h4>
                <p className="text-[10px] leading-relaxed">{error}</p>
              </div>
            )}

            {/* 4. Success Result Card */}
            {result && result.success && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider">{result.action} Success</h4>
                    <span className="text-[10px] text-slate-400 block light:text-slate-600">Verified via barcode decryption</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs border-t border-slate-800/40 pt-4 light:border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student ID</span>
                    <span className="font-mono text-slate-350 light:text-slate-700">{result.student_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="font-bold">{result.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scan Stamp</span>
                    <span className="font-mono">{result.log?.in_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Arrival Status</span>
                    <span className={result.log?.status === 'Present' ? 'badge-present' : 'badge-late'}>
                      {result.log?.status}
                    </span>
                  </div>
                  {result.log?.out_time && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check-out Stamp</span>
                        <span className="font-mono">{result.log.out_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Log Duration</span>
                        <span className="font-semibold text-brand-400">{result.log.total_duration} mins</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
