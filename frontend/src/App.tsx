import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Views
import { Welcome } from './views/Welcome';
import { Login } from './views/Login';
import { Signup } from './views/Signup';
import { ForgotPassword } from './views/ForgotPassword';
import { TeacherDashboard } from './views/TeacherDashboard';
import { StudentDashboard } from './views/StudentDashboard';
import { CameraAttendance } from './views/CameraAttendance';
import { QRAttendance } from './views/QRAttendance';
import { Reports } from './views/Reports';
import { StudentProfile } from './views/StudentProfile';
import { Noticeboard } from './views/Noticeboard';
import { Timetable } from './views/Timetable';
import { Assignments } from './views/Assignments';
import { Leaderboard } from './views/Leaderboard';

// Shared Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Menu, X } from 'lucide-react';

// Protected Route Guard
interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'teacher' | 'student')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Main Layout Wrapper
const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex p-4 md:p-6 gap-6 relative">
        {/* Sidebar Drawer Container */}
        <div className={`
          fixed inset-y-0 left-0 z-50 transform md:relative md:transform-none md:z-auto transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Mobile close overlay button */}
          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-5 right-5 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Mobile Sidebar clickout backdrop overlay */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xxs md:hidden"
          ></div>
        )}

        {/* Console Content viewport */}
        <main className="flex-1 h-[calc(100vh-120px)] overflow-y-auto pr-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Dynamic Dashboard Director (Teacher vs Student Dashboard route selector)
const DashboardDirector: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'student') {
    return <StudentDashboard />;
  }
  return <TeacherDashboard />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Entry Routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Console Views */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* General dashboard endpoint (role directed) */}
                <Route path="/dashboard" element={<DashboardDirector />} />
                
                {/* Profile Card details (Common) */}
                <Route path="/profile" element={<StudentProfile />} />
                
                {/* Student specific history calendars */}
                <Route path="/logs" element={<StudentDashboard />} />

                {/* Shared routes — all authenticated users */}
                <Route path="/notices" element={<Noticeboard />} />
                <Route path="/timetable" element={<Timetable />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/leaderboard" element={<Leaderboard />} />

                {/* Teacher & Administrator Restricted checkpoints */}
                <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
                  <Route path="/camera" element={<CameraAttendance />} />
                  <Route path="/qr-scans" element={<QRAttendance />} />
                  <Route path="/students" element={<TeacherDashboard />} />
                  <Route path="/reports" element={<Reports />} />
                </Route>
              </Route>
            </Route>

            {/* Wildcard Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
