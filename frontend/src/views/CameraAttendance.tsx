import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, ArrowLeft, Info, HelpCircle } from 'lucide-react';

interface ScanResult {
  success: boolean;
  message?: string;
  student_id?: string;
  name?: string;
  action?: 'Check-In' | 'Check-Out' | string;
  confidence?: string;
  log?: {
    date: string;
    status: string;
    in_time: string;
    out_time: string | null;
    total_duration: number | null;
    late_entry: boolean;
  };
}

export const CameraAttendance: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registerId = searchParams.get('register_id'); // If present, we are enrolling a face
  const registerName = searchParams.get('name');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize camera stream
  const startCamera = async () => {
    setError(null);
    setResult(null);
    setSuccessMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStreamActive(true);
      }
    } catch (err: any) {
      setError("Webcam access denied. Please grant camera permissions in your browser.");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStreamActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || loading) return;

    setError(null);
    setResult(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Draw video frame to hidden canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Extract base64 jpeg
        const base64Image = canvas.toDataURL('image/jpeg', 0.85);

        if (registerId) {
          // MODE B: Enroll student face
          const res = await api.post<{ message: string; mode: string }>(`/students/${registerId}/face`, {
            image: base64Image
          });
          setSuccessMsg(`${res.message} (${res.mode.toUpperCase()} MODE)`);
        } else {
          // MODE A: Attendance identification
          const res = await api.post<ScanResult>('/attendance/face-checkin', {
            image: base64Image
          });
          setResult(res);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Face analysis failed. Please retry.');
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
          <h2 className="text-xl font-bold tracking-tight">
            {registerId ? 'Enroll Face Signature' : 'AI Face Attendance Scanner'}
          </h2>
          <span className="text-xxs text-brand-400 font-bold uppercase tracking-wider">
            {registerId ? `Student Mapping: ${registerId}` : 'Classroom Attendance Console'}
          </span>
        </div>
      </div>

      {/* Main scanning cockpit grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Camera feed panel */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-3xl border border-slate-800/40 relative flex items-center justify-center bg-black/40 min-h-[300px]">
            
            {/* Live video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full max-w-md rounded-2xl aspect-[4/3] object-cover scale-x-[-1] border border-slate-800 ${
                !streamActive ? 'hidden' : 'block'
              }`}
            />

            {/* Hidden capture canvas */}
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />

            {/* Scanning Overlay graphic */}
            {streamActive && !loading && !result && !successMsg && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Crosshair corners */}
                <div className="w-60 h-60 border-2 border-dashed border-brand-500/40 rounded-3xl flex items-center justify-center relative">
                  {/* Laser line animation */}
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent top-0 animate-[float_2s_infinite]"></div>
                  <span className="text-xxs font-bold text-brand-500/50 uppercase tracking-widest">
                    Position Face
                  </span>
                </div>
              </div>
            )}

            {/* Loading Spinner */}
            {loading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-brand-400 rounded-3xl">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-wider">Analyzing face landmarks...</span>
              </div>
            )}

            {/* Camera Offline Warning */}
            {!streamActive && !loading && (
              <div className="text-center p-6 text-slate-500 flex flex-col items-center gap-3">
                <Camera className="w-12 h-12 stroke-1 text-slate-700" />
                <p className="text-xs">Camera stream inactive.</p>
                <button onClick={startCamera} className="btn-primary py-2 px-4 text-xs mt-2">
                  Activate webcam
                </button>
              </div>
            )}
          </div>

          {/* Capture Trigger Console */}
          {streamActive && (
            <div className="flex justify-center gap-3">
              <button 
                onClick={handleCapture}
                disabled={loading}
                className="btn-primary py-3 px-8 text-sm font-semibold rounded-2xl"
              >
                <Camera className="w-4 h-4" />
                {registerId ? 'Register Face Signature' : 'Mark Face Attendance'}
              </button>
              
              <button 
                onClick={startCamera}
                className="btn-secondary p-3 rounded-2xl"
                title="Refresh camera stream"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Scan Results Panel */}
        <div className="flex flex-col gap-6">
          {/* Instructions Widget */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800/40 text-xs">
            <h4 className="font-bold text-slate-300 block mb-2 flex items-center gap-1.5 light:text-slate-800">
              <Info className="w-4 h-4 text-indigo-400" />
              Operating Guidelines
            </h4>
            {registerId ? (
              <div className="text-slate-450 leading-relaxed space-y-2 light:text-slate-650">
                <p>1. You are enrolling face credentials for student <strong>{registerName || registerId}</strong>.</p>
                <p>2. Ensure their face is centered, evenly lit, and they are looking directly at the webcam.</p>
                <p>3. Click <strong>Register Face</strong> to save embeddings.</p>
              </div>
            ) : (
              <div className="text-slate-450 leading-relaxed space-y-2 light:text-slate-655">
                <p>1. Students must look at the camera checkpoint.</p>
                <p>2. Click <strong>Mark Face Attendance</strong>.</p>
                <p>3. If matched, the system records check-in/out stamps and calculates attendance duration.</p>
                <p>4. Failed checks can fallback to <strong>QR Codes</strong>.</p>
              </div>
            )}
          </div>

          {/* Results Box */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800/40 flex-1 flex flex-col justify-center min-h-[220px]">
            {/* 1. Default State */}
            {!result && !successMsg && !error && (
              <div className="text-center text-slate-500 py-6">
                <HelpCircle className="w-10 h-10 stroke-1 text-slate-700 mx-auto mb-2" />
                <p className="text-xs">Awaiting capture snapshot...</p>
              </div>
            )}

            {/* 2. Error Card */}
            {error && (
              <div className="flex flex-col items-center text-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 gap-2 animate-fadeIn">
                <AlertTriangle className="w-8 h-8" />
                <h4 className="font-bold text-sm">Operation Failed</h4>
                <p className="text-xxs leading-relaxed">{error}</p>
              </div>
            )}

            {/* 3. Enroll Success Card */}
            {successMsg && (
              <div className="flex flex-col items-center text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 gap-2 animate-fadeIn">
                <CheckCircle2 className="w-8 h-8" />
                <h4 className="font-bold text-sm">Face Enrolled!</h4>
                <p className="text-xxs leading-relaxed">{successMsg}</p>
                <button 
                  onClick={() => navigate('/students')}
                  className="btn-secondary py-1.5 px-3 text-xxs mt-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                >
                  Return to Directory
                </button>
              </div>
            )}

            {/* 4. Attendance Identification Success Card */}
            {result && result.success && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider">{result.action} Success</h4>
                    <span className="text-[10px] text-slate-400 block light:text-slate-600">Matched with {result.confidence} confidence</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs border-t border-slate-800/40 pt-4 light:border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student ID</span>
                    <span className="font-semibold text-slate-350 light:text-slate-700">{result.student_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="font-bold">{result.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Log Date</span>
                    <span className="font-mono">{result.log?.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-in Status</span>
                    <span className={result.log?.status === 'Present' ? 'badge-present' : 'badge-late'}>
                      {result.log?.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-in Time</span>
                    <span className="font-mono">{result.log?.in_time}</span>
                  </div>
                  {result.log?.out_time && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check-out Time</span>
                        <span className="font-mono">{result.log.out_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Session Duration</span>
                        <span className="font-semibold text-brand-400">{result.log.total_duration} mins</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 5. Attendance Identification Failed Card */}
            {result && !result.success && (
              <div className="flex flex-col items-center text-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-450 gap-2 animate-fadeIn">
                <AlertTriangle className="w-8 h-8 text-rose-450" />
                <h4 className="font-bold text-sm">Face Unrecognized</h4>
                <p className="text-xxs leading-relaxed">{result.message}</p>
                <button 
                  onClick={() => navigate('/qr-scans')}
                  className="btn-secondary py-1.5 px-3 text-xxs mt-2 text-rose-400 border-rose-550/20"
                >
                  Use QR Code Backup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
