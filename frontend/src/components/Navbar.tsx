import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Bell, AlertTriangle, Info, Navigation, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onMenuToggle?: () => void;
}

interface Notice {
  _id: string;
  title: string;
  content: string;
  priority: 'Urgent' | 'Important' | 'Normal';
  category: string;
  created_at: string;
  author_name: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api.get<Notice[]>('/notices')
        .then(data => {
          // Keep only the latest 4 notices for the dropdown
          setNotices(data.slice(0, 4));
        })
        .catch(err => console.error("Failed to fetch notices for navbar", err));
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/50 text-slate-400 hover:text-white transition-all duration-200 light:bg-white/50 light:border-slate-200"
          >
            <Bell className="w-4 h-4" />
            {notices.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl border border-slate-800/60 shadow-2xl overflow-hidden animate-fadeIn light:border-slate-200 light:bg-white z-50">
              <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-900/50 flex items-center justify-between light:bg-slate-50 light:border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 light:text-slate-700">Notifications</span>
                <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-bold">
                  {notices.length} New
                </span>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notices.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/30 light:divide-slate-100">
                    {notices.map((notice) => (
                      <Link 
                        key={notice._id}
                        to="/notices"
                        onClick={() => setShowNotifications(false)}
                        className="block p-4 hover:bg-slate-800/30 transition-colors light:hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                            notice.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-400' :
                            notice.priority === 'Important' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-brand-500/10 text-brand-400'
                          }`}>
                            {notice.priority === 'Urgent' ? <AlertTriangle className="w-3.5 h-3.5" /> : 
                             notice.priority === 'Important' ? <Info className="w-3.5 h-3.5" /> : 
                             <Navigation className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-200 mb-1 light:text-slate-800 line-clamp-2">
                              {notice.title}
                            </p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                              <span className="text-brand-400">{notice.category}</span>
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t border-slate-800/50 bg-slate-900/30 p-2 light:bg-slate-50 light:border-slate-200">
                <Link 
                  to="/notices"
                  onClick={() => setShowNotifications(false)}
                  className="flex items-center justify-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 py-1.5 transition-colors"
                >
                  View All Notices
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

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
