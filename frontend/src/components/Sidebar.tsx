import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Video,
  QrCode,
  BarChart3,
  Users,
  Calendar,
  User,
  BookOpen,
  ChevronRight,
  Bell,
  CalendarDays,
  ClipboardList,
  Trophy,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{ className?: string }>;
}

// Tabs for Teachers & Admins
const teacherTabs: NavItem[] = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Face Feed', path: '/camera', icon: Video },
  { name: 'QR Attendance', path: '/qr-scans', icon: QrCode },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Intelligence Reports', path: '/reports', icon: BarChart3 },
];

// Shared tabs for all roles
const sharedTabs: NavItem[] = [
  { name: 'Notice Board', path: '/notices', icon: Bell },
  { name: 'Timetable', path: '/timetable', icon: CalendarDays },
  { name: 'Assignments', path: '/assignments', icon: ClipboardList },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
];

// Tabs exclusive to students
const studentTabs: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Attendance Logs', path: '/logs', icon: Calendar },
  { name: 'My Profile & QR', path: '/profile', icon: User },
];

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const primaryTabs = user.role === 'student' ? studentTabs : teacherTabs;

  const renderNavLink = (tab: NavItem) => {
    const Icon = tab.icon;
    return (
      <NavLink
        key={tab.name}
        to={tab.path}
        onClick={onClose}
        end={tab.path === '/dashboard'}
        className={({ isActive }) =>
          `flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 group ${
            isActive
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30 border border-transparent hover:border-slate-900/50 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
          }`
        }
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>{tab.name}</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </NavLink>
    );
  };

  return (
    <aside className="glass-panel w-64 h-[calc(100vh-80px)] rounded-3xl p-5 flex flex-col justify-between border border-slate-800/40 overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Primary Nav Group */}
        <div>
          <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest pl-3 block mb-3">
            {user.role === 'student' ? 'Student Portal' : 'Teacher Console'}
          </span>
          <nav className="flex flex-col gap-1">
            {primaryTabs.map(renderNavLink)}
          </nav>
        </div>

        {/* Shared Features Group */}
        <div>
          <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest pl-3 block mb-3">
            Campus Hub
          </span>
          <nav className="flex flex-col gap-1">
            {sharedTabs.map(renderNavLink)}
          </nav>
        </div>
      </div>

      {/* Role Banner at bottom */}
      <div className="bg-gradient-to-br from-brand-950/40 to-slate-950/40 border border-slate-800/60 p-4 rounded-2xl mt-4 light:from-brand-50 light:to-slate-100 light:border-slate-200">
        <span className="text-xxs font-bold text-brand-400 light:text-brand-600 block uppercase tracking-wide">
          Authorized Role
        </span>
        <span className="text-xs font-semibold capitalize block text-slate-300 mt-1 light:text-slate-800">
          {user.role} Portal
        </span>
        <div className="flex items-center gap-1.5 mt-3 text-xxs text-slate-500 light:text-slate-400">
          <BookOpen className="w-3 h-3 text-brand-500" />
          <span>CampusSync v2.0.0</span>
        </div>
      </div>
    </aside>
  );
};
