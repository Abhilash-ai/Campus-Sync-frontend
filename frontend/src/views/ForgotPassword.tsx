import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, KeyRound, AlertCircle, CheckCircle2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [receivedCode, setReceivedCode] = useState<string | null>(null); // To assist user testing
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.post<{ message: string; reset_code?: string }>('/auth/forgot-password', { email });
      setSuccess('Reset code generated successfully!');
      if (res.reset_code) {
        setReceivedCode(res.reset_code);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Error generating reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      setError('Please fill in both the reset code and your new password.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email,
        reset_code: resetCode,
        new_password: newPassword
      });
      
      setSuccess('Your password has been successfully updated! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden py-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/20">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gradient">CampusSync</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mt-6">Recover Password</h2>
          <p className="text-xs text-slate-400 mt-2 light:text-slate-600">Restore access to your campus sync account</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800/40">
          {error && (
            <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-medium text-rose-400 mb-4 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-medium text-emerald-400 mb-4 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 light:text-slate-700 ml-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="teacher@campussync.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="glass-input pl-11 w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 font-semibold text-sm disabled:opacity-50"
              >
                {loading ? 'Generating Code...' : 'Request Reset Code'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {receivedCode && (
                <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl mb-4 animate-fadeIn text-center">
                  <span className="text-xxs font-bold text-brand-400 uppercase tracking-widest block light:text-brand-700">
                    💡 Simulated Verification Code
                  </span>
                  <span className="text-xl font-mono font-bold tracking-widest text-slate-200 mt-2 block light:text-slate-900">
                    {receivedCode}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Copy and paste the code below to complete reset.
                  </span>
                </div>
              )}

              {/* Code Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 light:text-slate-700 ml-1">
                  Verification Code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Enter reset code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    disabled={loading}
                    className="glass-input pl-11 w-full font-mono text-center tracking-widest"
                  />
                </div>
              </div>

              {/* New Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 light:text-slate-700 ml-1">
                  Choose New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="glass-input pl-11 w-full"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 font-semibold text-sm mt-2 disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
                {!loading && <KeyRound className="w-4 h-4" />}
              </button>
            </form>
          )}

          <div className="text-center mt-6 text-xs text-slate-400 light:text-slate-600">
            Remembered your credentials?{' '}
            <Link 
              to="/login" 
              className="font-bold text-brand-400 hover:text-brand-300 light:text-brand-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
