import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { UserPlus, Mail, KeyRound, User, IdCard, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student' | 'admin'>('student');
  const [studentId, setStudentId] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (role === 'student' && !studentId) {
      setError('Student ID is required to create a student account.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.post('/auth/signup', {
        username,
        email,
        password,
        role,
        student_id: role === 'student' ? studentId : null
      });

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden py-12">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gradient">CampusSync</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mt-6">Create Account</h2>
          <p className="text-xs text-slate-400 mt-2 light:text-slate-600">Join the smart campus intelligence network</p>
        </div>

        {/* Signup Glass Panel */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-medium text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-medium text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 light:text-slate-700 ml-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="janesmith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="glass-input pl-11 w-full"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 light:text-slate-700 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="jane@campussync.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="glass-input pl-11 w-full"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 light:text-slate-700 ml-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="glass-input pl-11 w-full"
                />
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 light:text-slate-700 ml-1">
                Institutional Role
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as any);
                  setError(null);
                }}
                disabled={loading}
                className="glass-input w-full appearance-none bg-slate-950/40 text-slate-200"
              >
                <option value="student" className="bg-slate-900">Student</option>
                <option value="teacher" className="bg-slate-900">Teacher</option>
                <option value="admin" className="bg-slate-900">Administrator</option>
              </select>
            </div>

            {/* Conditional Student ID Input */}
            {role === 'student' && (
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <label className="text-xs font-semibold text-slate-400 light:text-slate-700 ml-1">
                  Student ID (e.g. STU1001)
                </label>
                <div className="relative">
                  <IdCard className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="STU1001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={loading}
                    className="glass-input pl-11 w-full"
                  />
                </div>
                <span className="text-xxs text-amber-400 ml-1 leading-normal">
                  ⚠️ Note: Your details must be entered by a teacher in the student directory before registering.
                </span>
              </div>
            )}

            {/* Signup Action Button */}
            <button
              type="submit"
              disabled={loading || !!success}
              className="btn-primary w-full py-3.5 font-semibold text-sm mt-3 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
              {!loading && <UserPlus className="w-4 h-4" />}
            </button>
          </form>

          <div className="text-center mt-6 text-xs text-slate-400 light:text-slate-600">
            Already have an account?{' '}
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
