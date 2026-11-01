import React, { useState } from 'react';
import { Student } from '../types/attendance';
import { 
  User, 
  GraduationCap, 
  Sparkles, 
  Check, 
  Sliders, 
  Building2, 
  BookOpen, 
  Hash, 
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudent: Student;
  allStudents: Student[];
  onSelectStudent: (id: string) => void;
  onCreateStudent: (payload: Partial<Student>) => Promise<void>;
  onUpdateSettings: (studentId: string, updates: Partial<Student>) => Promise<void>;
  initialTab?: 'switch' | 'new' | 'settings';
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  activeStudent,
  allStudents,
  onSelectStudent,
  onCreateStudent,
  onUpdateSettings,
  initialTab = 'switch',
}) => {
  const [tab, setTab] = useState<'switch' | 'new' | 'settings'>(initialTab);

  // New Student Form
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [collegeName, setCollegeName] = useState('National Institute of Technology & Engineering');
  const [course, setCourse] = useState('B.Tech Computer Science & Engineering');
  const [semester, setSemester] = useState('6th Semester');
  const [targetPercentage, setTargetPercentage] = useState<number>(75);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings Form (for active student)
  const [editCollegeName, setEditCollegeName] = useState(activeStudent.collegeName);
  const [editSemester, setEditSemester] = useState(activeStudent.semester);
  const [editTargetPercentage, setEditTargetPercentage] = useState<number>(activeStudent.targetPercentage);
  const [editRollNumber, setEditRollNumber] = useState(activeStudent.rollNumber);
  const [editCourse, setEditCourse] = useState(activeStudent.course);

  if (!isOpen) return null;

  const handleRegisterNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNumber.trim()) {
      setError('Please provide student name and roll number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateStudent({
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        collegeName: collegeName.trim() || 'College of Engineering',
        course: course.trim() || 'B.Tech Engineering',
        semester: semester.trim() || '6th Semester',
        targetPercentage: Number(targetPercentage) || 75,
        email: email.trim() || `${rollNumber.trim().toLowerCase()}@college.edu`,
      });
      onClose();
    } catch (err) {
      setError('Failed to create student account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onUpdateSettings(activeStudent.id, {
        collegeName: editCollegeName.trim(),
        semester: editSemester.trim(),
        targetPercentage: Number(editTargetPercentage) || 75,
        rollNumber: editRollNumber.trim(),
        course: editCourse.trim(),
      });
      onClose();
    } catch (err) {
      setError('Failed to update settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Student Account & Settings
              </h3>
              <p className="text-xs text-slate-400">
                Switch profiles, register, or calibrate college attendance rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-800 rounded-2xl mt-4 border border-slate-700">
          <button
            onClick={() => setTab('switch')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'switch'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Switch Student
          </button>
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'new'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Student Profile
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Attendance Rules
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Tab 1: Switch Student */}
        {tab === 'switch' && (
          <div className="mt-5 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Registered Student Profiles ({allStudents.length})
            </span>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {allStudents.map((s) => {
                const isActive = s.id === activeStudent.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectStudent(s.id);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md'
                        : 'bg-slate-800/60 border-slate-750 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 font-black flex items-center justify-center text-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-300">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {s.rollNumber} • {s.course}
                        </div>
                        <div className="text-[11px] text-cyan-400">
                          Rule: {s.targetPercentage}% Minimum
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                onClick={() => setTab('new')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create a new student profile for another semester/branch</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: New Student Registration */}
        {tab === 'new' && (
          <form onSubmit={handleRegisterNew} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Roll / Reg Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 21CS088"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">College / University Name</label>
              <input
                type="text"
                placeholder="e.g. National Institute of Technology"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Degree & Branch</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Semester</label>
                <input
                  type="text"
                  placeholder="e.g. 6th Semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="space-y-1 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-400">
                  Minimum Required Attendance %
                </label>
                <span className="text-base font-extrabold text-white">{targetPercentage}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={targetPercentage}
                onChange={(e) => setTargetPercentage(Number(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="text-[11px] text-slate-400">
                Default for most colleges is 75%.
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                {isSubmitting ? 'Registering...' : 'Register Student'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Attendance Rule Calibration */}
        {tab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="mt-5 space-y-4">
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  College Attendance Benchmark Rule
                </span>
                <span className="text-xl font-black text-cyan-400">{editTargetPercentage}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                value={editTargetPercentage}
                onChange={(e) => setEditTargetPercentage(Number(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex gap-2">
                {[65, 75, 80, 85].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEditTargetPercentage(val)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      editTargetPercentage === val
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Updating this will automatically recalculate safe bunks and catch-up requirements for all your subjects.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">College Name</label>
              <input
                type="text"
                value={editCollegeName}
                onChange={(e) => setEditCollegeName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Semester</label>
                <input
                  type="text"
                  value={editSemester}
                  onChange={(e) => setEditSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Roll Number</label>
                <input
                  type="text"
                  value={editRollNumber}
                  onChange={(e) => setEditRollNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 uppercase"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
