import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(identity, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo account shortcuts for testing convenience
  const fillDemo = (id: string, pass: string) => {
    setIdentity(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden py-12">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none"></div>

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
          <h2 className="text-3xl font-extrabold tracking-tight mt-6">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-2 light:text-slate-600">Enter your credentials to access the intelligence console</p>
        </div>

        {/* Login Glass Panel */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-medium text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Identity Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 light:text-slate-700 ml-1">
                Username or Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter email or username"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  disabled={loading}
                  className="glass-input pl-11 w-full"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-slate-400 light:text-slate-700">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xxs font-bold text-brand-400 hover:text-brand-300 light:text-brand-600"
                >
                  Forgot Password?
                </Link>
              </div>
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

            {/* Signin Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 font-semibold text-sm mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="text-center mt-6 text-xs text-slate-400 light:text-slate-600">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-bold text-brand-400 hover:text-brand-300 light:text-brand-600"
            >
              Sign Up
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
