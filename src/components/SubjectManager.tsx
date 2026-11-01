import React, { useState } from 'react';
import { Subject, Student } from '../types/attendance';
import { calculateBunkMetrics } from '../utils/bunkCalculator';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders, 
  Calculator,
  Flame,
  MinusCircle
} from 'lucide-react';

interface SubjectManagerProps {
  student: Student;
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id' | 'studentId' | 'updatedAt'>) => Promise<void>;
  onUpdateSubject: (subjectId: string, updates: Partial<Subject>) => Promise<void>;
  onDeleteSubject: (subjectId: string) => Promise<void>;
  onQuickMark: (subjectId: string, status: 'PRESENT' | 'ABSENT' | 'CANCELLED') => void;
  onSelectSubjectForWhatIf: (subjectId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#ef4444', // Red
  '#6366f1', // Indigo
];

export const SubjectManager: React.FC<SubjectManagerProps> = ({
  student,
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onQuickMark,
  onSelectSubjectForWhatIf,
  onNavigateToTab,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [totalClasses, setTotalClasses] = useState<number>(30);
  const [attendedClasses, setAttendedClasses] = useState<number>(25);
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setCode('');
    setFacultyName('');
    setCredits(3);
    setTotalClasses(30);
    setAttendedClasses(25);
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setNotes('');
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (sub: Subject) => {
    setName(sub.name);
    setCode(sub.code);
    setFacultyName(sub.facultyName || '');
    setCredits(sub.credits || 3);
    setTotalClasses(sub.totalClasses);
    setAttendedClasses(sub.attendedClasses);
    setColor(sub.color || PRESET_COLORS[0]);
    setNotes(sub.notes || '');
    setEditingSubject(sub);
    setFormError(null);
  };

  // Validation
  const isValidAttended = attendedClasses <= totalClasses;
  const isFormValid = name.trim().length > 0 && totalClasses >= 0 && attendedClasses >= 0 && isValidAttended;

  // Live preview metrics while editing/adding
  const previewMetrics = calculateBunkMetrics(
    isValidAttended ? attendedClasses : 0,
    totalClasses,
    student.targetPercentage
  );

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!isValidAttended) {
        setFormError('Attended classes cannot exceed total classes!');
      } else {
        setFormError('Please fill out all required fields properly.');
      }
      return;
    }

    // Check for duplicate subject name or code
    const trimmedName = name.trim().toLowerCase();
    const trimmedCode = code.trim().toLowerCase();
    const isDuplicate = subjects.some(
      (s) =>
        s.name.trim().toLowerCase() === trimmedName ||
        (trimmedCode && s.code.trim().toLowerCase() === trimmedCode)
    );
    if (isDuplicate) {
      setFormError(`A subject with name "${name}" or code "${code}" already exists. Duplicate entries are prevented.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddSubject({
        name: name.trim(),
        code: code.trim() || `CS${Math.floor(100 + Math.random() * 900)}`,
        facultyName: facultyName.trim() || undefined,
        credits: Number(credits) || 3,
        totalClasses: Number(totalClasses) || 0,
        attendedClasses: Number(attendedClasses) || 0,
        color,
        notes: notes.trim() || undefined,
      });
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save subject. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !isFormValid) {
      if (!isValidAttended) {
        setFormError('Attended classes cannot exceed total classes!');
      }
      return;
    }

    // Check for duplicate on edit
    const trimmedName = name.trim().toLowerCase();
    const trimmedCode = code.trim().toLowerCase();
    const isDuplicate = subjects.some(
      (s) =>
        s.id !== editingSubject.id &&
        (s.name.trim().toLowerCase() === trimmedName ||
          (trimmedCode && s.code.trim().toLowerCase() === trimmedCode))
    );
    if (isDuplicate) {
      setFormError(`Another subject with name "${name}" or code "${code}" already exists.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateSubject(editingSubject.id, {
        name: name.trim(),
        code: code.trim(),
        facultyName: facultyName.trim() || undefined,
        credits: Number(credits) || 3,
        totalClasses: Number(totalClasses) || 0,
        attendedClasses: Number(attendedClasses) || 0,
        color,
        notes: notes.trim() || undefined,
      });
      setEditingSubject(null);
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteSubject(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Curriculum & Subjects</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Subject Attendance Management
          </h1>
          <p className="text-sm text-slate-300">
            Configure your enrolled courses, faculty info, credit hours, and adjust class counts.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => {
          const metrics = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, student.targetPercentage);
          const isSafe = metrics.alertLevel === 'SAFE';
          const isWarning = metrics.alertLevel === 'WARNING';
          const isShortage = metrics.alertLevel === 'CRITICAL';

          return (
            <div
              key={sub.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition relative overflow-hidden"
            >
              {/* Top Accent Color Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: sub.color || '#3b82f6' }}
              />

              <div>
                {/* Header with Edit & Delete */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {sub.code}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {sub.credits} Credits
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">{sub.name}</h3>
                    {sub.facultyName && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{sub.facultyName}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(sub)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Edit subject details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(sub.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Delete subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Percentage Big Badge */}
                <div className="mt-4 flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-750">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Attendance Ratio
                    </span>
                    <span className="text-xs text-slate-200">
                      <strong className="text-white font-bold">{sub.attendedClasses}</strong> / {sub.totalClasses} classes
                    </span>
                    <span className="text-[11px] text-rose-400 block">
                      ({metrics.absent} missed)
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-2xl font-black ${
                        isSafe ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {metrics.percentage.toFixed(1)}%
                    </span>
                    <span
                      className={`block text-[10px] font-bold uppercase tracking-wider ${
                        isSafe ? 'text-emerald-300' : isWarning ? 'text-amber-300' : 'text-rose-300'
                      }`}
                    >
                      {metrics.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${
                      isSafe ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.percentage)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                    style={{ left: `${student.targetPercentage}%` }}
                    title={`Target: ${student.targetPercentage}%`}
                  />
                </div>

                {/* Bunk advice badge */}
                <div
                  className={`mt-3 p-2.5 rounded-xl text-xs flex items-center space-x-2 border ${
                    isShortage
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : isWarning
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isShortage ? (
                    <Flame className="w-4 h-4 shrink-0 text-rose-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  )}
                  <span className="line-clamp-1 font-medium">
                    {isShortage
                      ? `Need ${metrics.classesNeeded} classes to recover`
                      : `${metrics.safeBunks} safe bunks remaining`}
                  </span>
                </div>

                {sub.notes && (
                  <p className="mt-2 text-[11px] text-slate-400 italic line-clamp-1">
                    "{sub.notes}"
                  </p>
                )}
              </div>

              {/* Bottom Quick-Mark bar */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onQuickMark(sub.id, 'PRESENT')}
                    className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                    title="Mark 1 Present"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>+1 Present</span>
                  </button>
                  <button
                    onClick={() => onQuickMark(sub.id, 'ABSENT')}
                    className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                    title="Mark 1 Absent"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>+1 Absent</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    onSelectSubjectForWhatIf(sub.id);
                    onNavigateToTab('what-if');
                  }}
                  className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Simulate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Subject Modal */}
      {(showAddModal || editingSubject) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSubject(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={editingSubject ? handleSaveEdit : handleSaveAdd}
              className="mt-4 space-y-4"
            >
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Subject Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Subject Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Systems"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Course Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS607"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 uppercase"
                  />
                </div>
              </div>

              {/* Faculty & Credits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Faculty / Professor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jennifer Smith"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Credits
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Attendance Counts: Total & Attended with Validation */}
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Classes & Attendance Counts
                  </span>
                  <span className="text-[11px] text-cyan-400 font-semibold">
                    Target: {student.targetPercentage}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Total Classes <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={totalClasses}
                      onChange={(e) => setTotalClasses(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-emerald-400">
                      Attended Classes <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={attendedClasses}
                      onChange={(e) => setAttendedClasses(Math.max(0, Number(e.target.value)))}
                      className={`w-full px-3 py-2 rounded-xl bg-slate-900 border text-white font-bold text-sm focus:outline-none ${
                        !isValidAttended
                          ? 'border-rose-500 ring-2 ring-rose-500/30'
                          : 'border-slate-700 focus:border-emerald-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-rose-400">
                      Absent Classes
                    </label>
                    <div className="w-full px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-rose-300 font-bold text-sm">
                      {isValidAttended ? Math.max(0, totalClasses - attendedClasses) : '—'}
                    </div>
                  </div>
                </div>

                {/* Validation error banner if attended > total */}
                {!isValidAttended && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      Error: Attended ({attendedClasses}) cannot exceed total classes ({totalClasses})!
                    </span>
                  </div>
                )}

                {/* Live Preview Box */}
                {isValidAttended && totalClasses > 0 && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-750 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Calculated Percentage:</span>
                      <div className="text-lg font-black text-cyan-400">
                        {previewMetrics.percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          previewMetrics.alertLevel === 'SAFE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : previewMetrics.alertLevel === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {previewMetrics.alertLevel === 'SAFE'
                          ? `${previewMetrics.safeBunks} Safe Bunks`
                          : previewMetrics.alertLevel === 'WARNING'
                          ? `Borderline (${previewMetrics.safeBunks} left)`
                          : `Shortage! Need ${previewMetrics.classesNeeded} classes`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Color Palette */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Subject Color Tag
                </label>
                <div className="flex items-center space-x-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Notes / Timetable Schedule
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mon, Wed, Fri 10 AM, Room 304"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSubject(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 transition cursor-pointer shadow-lg ${
                    isFormValid && !isSubmitting
                      ? 'bg-cyan-400 hover:bg-cyan-300 shadow-cyan-500/20'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Saving...' : editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Delete Subject?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove this subject? All associated attendance logs will also be permanently deleted.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
