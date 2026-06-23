import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Percent, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Camera, 
  QrCode, 
  BarChart3, 
  UserPlus, 
  Phone, 
  Mail, 
  GraduationCap, 
  BookOpen,
  Calendar,
  Settings,
  AlertTriangle
} from 'lucide-react';

interface Student {
  student_id: string;
  name: string;
  roll_number: string;
  department: string;
  semester: string;
  email: string;
  phone: string;
  face_registered: boolean;
}

interface Stats {
  total_students: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  attendance_percentage: number;
  date: string;
}

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add / Edit Modal Drawer State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Modal Form states
  const [stuId, setStuId] = useState('');
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [dept, setDept] = useState('Computer Science');
  const [sem, setSem] = useState('Semester 4');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentData, statsData] = await Promise.all([
        api.get<Student[]>('/students'),
        api.get<Stats>('/attendance/stats')
      ]);
      setStudents(studentData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/students', {
        student_id: stuId,
        name,
        roll_number: roll,
        department: dept,
        semester: sem,
        email,
        phone
      });
      
      // Reset state and close modal
      setStuId('');
      setName('');
      setRoll('');
      setEmail('');
      setPhone('');
      setShowAddModal(false);
      
      // Reload lists
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to add student. Please review inputs.');
    }
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudentId(student.student_id);
    setName(student.name);
    setRoll(student.roll_number);
    setDept(student.department);
    setSem(student.semester);
    setEmail(student.email);
    setPhone(student.phone);
    setShowEditModal(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    setError(null);
    
    try {
      await api.put(`/students/${editingStudentId}`, {
        name,
        roll_number: roll,
        department: dept,
        semester: sem,
        email,
        phone
      });
      
      setShowEditModal(false);
      setEditingStudentId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update student details.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm(`Are you sure you want to delete student ${studentId}? All attendance histories will be permanently removed.`)) {
      return;
    }
    try {
      await api.delete(`/students/${studentId}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student.');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Upper Grid: Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students Card */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider block">
              Total Students
            </span>
            <span className="text-3xl font-extrabold mt-1 block">
              {stats?.total_students ?? 0}
            </span>
            <span className="text-xxs text-brand-400 font-bold block mt-1 light:text-brand-600">
              Registered in Directory
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 light:bg-indigo-50 light:text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Present Today Card */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider block">
              Present Today
            </span>
            <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">
              {stats?.present_today ?? 0}
            </span>
            <span className="text-xxs text-slate-500 font-medium block mt-1 light:text-slate-500">
              Includes {stats?.late_today ?? 0} late entries
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 light:bg-emerald-50 light:text-emerald-700">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Absent Today Card */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider block">
              Absent Today
            </span>
            <span className="text-3xl font-extrabold text-rose-400 mt-1 block">
              {stats?.absent_today ?? 0}
            </span>
            <span className="text-xxs text-slate-500 font-medium block mt-1 light:text-slate-500">
              Requires verification
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 light:bg-rose-50 light:text-rose-700">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Attendance Percentage Card */}
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider block">
              Attendance Rate
            </span>
            <span className="text-3xl font-extrabold text-brand-400 mt-1 block light:text-brand-600">
              {stats?.attendance_percentage ?? 0}%
            </span>
            <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-2 light:bg-slate-200">
              <div 
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${stats?.attendance_percentage ?? 0}%` }}
              ></div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 light:bg-brand-50 light:text-brand-600">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Launch Console */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800/40">
        <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest pl-1 block mb-3.5">
          Quick Launch Consoles
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            onClick={() => navigate('/camera')}
            className="btn-primary py-3.5"
          >
            <Camera className="w-4 h-4" />
            AI Face Recognition
          </button>
          
          <button 
            onClick={() => navigate('/qr-scans')}
            className="btn-secondary py-3.5"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            QR Attendance Backup
          </button>
          
          <button 
            onClick={() => navigate('/reports')}
            className="btn-secondary py-3.5"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Analytics Reports
          </button>
        </div>
      </div>

      {/* Main Student Directory */}
      <div className="glass-panel rounded-3xl border border-slate-800/40 p-6">
        {/* Table Operations Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Student Directory</h3>
            <p className="text-xs text-slate-400 light:text-slate-650">Add, edit, enroll face captures, or delete student profiles</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search name, ID, roll..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-10 py-2 w-full text-sm"
              />
            </div>

            {/* Add Student Button */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary py-2 px-4 text-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-medium text-rose-400 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Directory Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
            <span className="text-xs font-medium">Fetching directory index...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-700" />
            <p className="text-sm">No students found matching search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/50 text-slate-400 text-xxs font-bold uppercase tracking-wider light:border-slate-200 light:text-slate-500">
                  <th className="pb-3 pl-4">ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Semester</th>
                  <th className="pb-3 text-center">Face Registered</th>
                  <th className="pb-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30 text-sm light:divide-slate-200/50">
                {filteredStudents.map((student) => (
                  <tr key={student.student_id} className="hover:bg-slate-900/10 light:hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pl-4 font-mono text-xs font-bold text-slate-400 light:text-slate-600">{student.student_id}</td>
                    <td className="py-4 font-semibold">{student.name}</td>
                    <td className="py-4 text-slate-300 light:text-slate-700">{student.roll_number}</td>
                    <td className="py-4 text-slate-350 light:text-slate-600">{student.department}</td>
                    <td className="py-4 text-slate-400 light:text-slate-600">{student.semester}</td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => navigate(`/profile?id=${student.student_id}`)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xxs font-bold border transition-colors ${
                          student.face_registered 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 light:bg-emerald-50 light:text-emerald-700' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400 light:bg-amber-50 light:text-amber-700'
                        }`}
                        title={student.face_registered ? "Re-register Face" : "Enroll Face"}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {student.face_registered ? 'Registered' : 'Not Registered'}
                      </button>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* View profile */}
                        <button
                          onClick={() => navigate(`/profile?id=${student.student_id}`)}
                          className="p-2 rounded-lg bg-slate-900/30 border border-slate-850 hover:border-brand-500 text-slate-400 hover:text-white transition-all duration-150 light:bg-white light:border-slate-200 light:hover:border-brand-500"
                          title="View Profile Card"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-2 rounded-lg bg-slate-900/30 border border-slate-850 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 transition-all duration-150 light:bg-white light:border-slate-200"
                          title="Edit Student Info"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteStudent(student.student_id)}
                          className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/15 text-rose-450 hover:text-rose-400 transition-all duration-150"
                          title="Remove Student Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD STUDENT MODAL DRAWER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-800/40 p-8 shadow-2xl relative animate-scaleUp">
            <h4 className="text-xl font-bold tracking-tight flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-brand-500" />
              Add Student
            </h4>
            <p className="text-xs text-slate-400 light:text-slate-650 mb-6">Create a new profile in the student directory</p>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Student ID (Unique)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STU1011"
                    value={stuId}
                    onChange={(e) => setStuId(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Michael Scott"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-2023-011"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 019-3382"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="glass-input text-sm appearance-none bg-slate-950/40 text-slate-200"
                  >
                    <option value="Computer Science" className="bg-slate-900">Computer Science</option>
                    <option value="Electrical Engineering" className="bg-slate-900">Electrical Engineering</option>
                    <option value="Mechanical Engineering" className="bg-slate-900">Mechanical Engineering</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Semester</label>
                  <select
                    value={sem}
                    onChange={(e) => setSem(e.target.value)}
                    className="glass-input text-sm appearance-none bg-slate-950/40 text-slate-200"
                  >
                    <option value="Semester 2" className="bg-slate-900">Semester 2</option>
                    <option value="Semester 4" className="bg-slate-900">Semester 4</option>
                    <option value="Semester 6" className="bg-slate-900">Semester 6</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. michael@campussync.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input text-sm w-full"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL DRAWER */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-800/40 p-8 shadow-2xl relative animate-scaleUp">
            <h4 className="text-xl font-bold tracking-tight flex items-center gap-2 mb-2">
              <Edit className="w-5 h-5 text-indigo-400" />
              Edit Student Details
            </h4>
            <p className="text-xs text-slate-400 light:text-slate-655 mb-6">Modify records for student: {editingStudentId}</p>

            <form onSubmit={handleEditStudent} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={roll}
                    onChange={(e) => setRoll(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="glass-input text-sm appearance-none bg-slate-950/40 text-slate-200"
                  >
                    <option value="Computer Science" className="bg-slate-900">Computer Science</option>
                    <option value="Electrical Engineering" className="bg-slate-900">Electrical Engineering</option>
                    <option value="Mechanical Engineering" className="bg-slate-900">Mechanical Engineering</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Semester</label>
                  <select
                    value={sem}
                    onChange={(e) => setSem(e.target.value)}
                    className="glass-input text-sm appearance-none bg-slate-950/40 text-slate-200"
                  >
                    <option value="Semester 2" className="bg-slate-900">Semester 2</option>
                    <option value="Semester 4" className="bg-slate-900">Semester 4</option>
                    <option value="Semester 6" className="bg-slate-900">Semester 6</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xxs font-bold text-slate-450 uppercase tracking-wider pl-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input text-sm w-full"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStudentId(null);
                  }}
                  className="btn-secondary px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
