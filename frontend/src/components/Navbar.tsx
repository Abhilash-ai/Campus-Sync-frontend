import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, User, Bell } from 'lucide-react';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass-panel sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/40 rounded-b-3xl">
      {/* Brand Label / Mob Toggle */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button 
            onClick={onMenuToggle}
            className="p-2 mr-2 rounded-lg bg-slate-900/50 border border-slate-800/80 text-slate-400 hover:text-white md:hidden focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/25">
            C
          </div>
          <span className="font-extrabold text-xl tracking-tight text-gradient">CampusSync</span>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Mock */}
        <button className="relative p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/50 text-slate-400 hover:text-white transition-all duration-200 light:bg-white/50 light:border-slate-200">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500"></span>
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/50 text-slate-400 hover:text-white transition-all duration-200 light:bg-white/50 light:border-slate-200"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-850 light:border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold tracking-tight">{user.username}</span>
              <span className="text-xxs text-brand-400 font-bold uppercase tracking-wider light:text-brand-600">{user.role}</span>
            </div>
            
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold uppercase light:bg-brand-50 light:text-brand-600 light:border-brand-200">
              {user.username.substring(0, 2)}
            </div>

            <button 
              onClick={logout}
              className="p-2.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 text-rose-400 hover:text-rose-300 transition-all duration-200"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
