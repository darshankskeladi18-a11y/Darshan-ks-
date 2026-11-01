import React, { useState, useEffect } from 'react';
import { 
  Student, 
  Subject, 
  AttendanceRecord, 
  AttendanceStatus,
  TimetableEntry,
  SpecialScheduleItem
} from './types/attendance';
import {
  fetchStudents,
  fetchStudentData,
  createStudent,
  updateStudentSettings,
  addSubject,
  updateSubject,
  deleteSubject,
  addTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  addSpecialSchedule,
  deleteSpecialSchedule,
  addAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  resetDatabaseDemo,
  getStoredActiveStudentId,
  setStoredActiveStudentId,
} from './services/api';
import { calculateOverallMetrics } from './utils/bunkCalculator';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TodayClasses } from './components/TodayClasses';
import { TimetableManager } from './components/TimetableManager';
import { BunkCalculator } from './components/BunkCalculator';
import { WhatIfCalculator } from './components/WhatIfCalculator';
import { SubjectManager } from './components/SubjectManager';
import { AttendanceHistory } from './components/AttendanceHistory';
import { Reports } from './components/Reports';
import { StudentAuthModal } from './components/StudentAuthModal';
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarDays, 
  BookOpen, 
  CheckSquare, 
  Calculator, 
  Sparkles, 
  History, 
  FileText, 
  Settings,
  Loader2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [specialSchedules, setSpecialSchedules] = useState<SpecialScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'switch' | 'new' | 'settings'>('switch');
  const [whatIfPreselectedSubId, setWhatIfPreselectedSubId] = useState<string>('');

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const allStudents = await fetchStudents();
        setStudents(allStudents);

        const savedId = getStoredActiveStudentId();
        const found = allStudents.find((s) => s.id === savedId) || allStudents[0];

        if (found) {
          setActiveStudent(found);
          const bundle = await fetchStudentData(found.id);
          setSubjects(bundle.subjects);
          setRecords(bundle.records);
          setTimetableEntries(bundle.timetableEntries || []);
          setSpecialSchedules(bundle.specialSchedules || []);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // When active student changes
  const handleSelectStudent = async (studentId: string) => {
    try {
      setLoading(true);
      setStoredActiveStudentId(studentId);
      const bundle = await fetchStudentData(studentId);
      setActiveStudent(bundle.student);
      setSubjects(bundle.subjects);
      setRecords(bundle.records);
      setTimetableEntries(bundle.timetableEntries || []);
      setSpecialSchedules(bundle.specialSchedules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (payload: Partial<Student>) => {
    const created = await createStudent(payload);
    setStudents((prev) => [...prev, created]);
    handleSelectStudent(created.id);
  };

  const handleUpdateSettings = async (studentId: string, updates: Partial<Student>) => {
    const updated = await updateStudentSettings(studentId, updates);
    setActiveStudent(updated);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
  };

  const handleUpdateTargetRule = async (newTarget: number) => {
    if (!activeStudent) return;
    await handleUpdateSettings(activeStudent.id, { targetPercentage: newTarget });
  };

  // Quick attendance marking (connected to subjects & timetable)
  const handleMarkAttendance = async (payload: {
    subjectId: string;
    date: string;
    status: AttendanceStatus;
    timeSlot?: string;
    timetableEntryId?: string;
    topic?: string;
    remark?: string;
  }) => {
    if (!activeStudent) return;
    const res = await addAttendanceRecord(activeStudent.id, payload);

    if (res.updatedExisting) {
      setRecords((prev) =>
        prev.map((r) => (r.id === res.record.id ? res.record : r))
      );
    } else {
      setRecords((prev) => [res.record, ...prev]);
    }

    if (res.subject) {
      setSubjects((prev) =>
        prev.map((s) => (s.id === res.subject!.id ? res.subject! : s))
      );
    }
  };

  // Timetable Operations
  const handleAddTimetableEntry = async (
    entry: Omit<TimetableEntry, 'id' | 'studentId'>
  ) => {
    if (!activeStudent) return;
    const created = await addTimetableEntry(activeStudent.id, entry);
    setTimetableEntries((prev) => [...prev, created]);
  };

  const handleUpdateTimetableEntry = async (
    id: string,
    updates: Partial<TimetableEntry>
  ) => {
    if (!activeStudent) return;
    const updated = await updateTimetableEntry(activeStudent.id, id, updates);
    setTimetableEntries((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleDeleteTimetableEntry = async (id: string) => {
    if (!activeStudent) return;
    await deleteTimetableEntry(activeStudent.id, id);
    setTimetableEntries((prev) => prev.filter((t) => t.id !== id));
  };

  // Special Schedules (Holidays, Extra Classes)
  const handleAddSpecialSchedule = async (
    item: Omit<SpecialScheduleItem, 'id' | 'studentId' | 'createdAt'>
  ) => {
    if (!activeStudent) return;
    const created = await addSpecialSchedule(activeStudent.id, item);
    setSpecialSchedules((prev) => [...prev, created]);
  };

  const handleDeleteSpecialSchedule = async (id: string) => {
    if (!activeStudent) return;
    await deleteSpecialSchedule(activeStudent.id, id);
    setSpecialSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Subject operations
  const handleAddSubject = async (
    payload: Omit<Subject, 'id' | 'studentId' | 'updatedAt'>
  ) => {
    if (!activeStudent) return;
    const created = await addSubject(activeStudent.id, payload);
    setSubjects((prev) => [...prev, created]);
  };

  const handleUpdateSubject = async (
    subjectId: string,
    payload: Partial<Subject>
  ) => {
    if (!activeStudent) return;
    const updated = await updateSubject(activeStudent.id, subjectId, payload);
    setSubjects((prev) => prev.map((s) => (s.id === subjectId ? updated : s)));
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!activeStudent) return;
    await deleteSubject(activeStudent.id, subjectId);
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    setRecords((prev) => prev.filter((r) => r.subjectId !== subjectId));
    setTimetableEntries((prev) => prev.filter((t) => t.subjectId !== subjectId));
  };

  // Attendance History operations
  const handleAddAttendanceRecord = async (payload: {
    subjectId: string;
    date: string;
    status: AttendanceStatus;
    timeSlot?: string;
    topic?: string;
    remark?: string;
  }) => {
    if (!activeStudent) return;
    const res = await addAttendanceRecord(activeStudent.id, payload);
    setRecords((prev) => [res.record, ...prev]);
    if (res.subject) {
      setSubjects((prev) =>
        prev.map((s) => (s.id === res.subject!.id ? res.subject! : s))
      );
    }
  };

  const handleUpdateAttendanceRecord = async (
    recordId: string,
    payload: Partial<AttendanceRecord>
  ) => {
    if (!activeStudent) return;
    const res = await updateAttendanceRecord(activeStudent.id, recordId, payload);
    setRecords((prev) => prev.map((r) => (r.id === recordId ? res.record : r)));
    if (res.subject) {
      setSubjects((prev) =>
        prev.map((s) => (s.id === res.subject!.id ? res.subject! : s))
      );
    }
  };

  const handleDeleteAttendanceRecord = async (recordId: string) => {
    if (!activeStudent) return;
    const res = await deleteAttendanceRecord(activeStudent.id, recordId);
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    if (res.subject) {
      setSubjects((prev) =>
        prev.map((s) => (s.id === res.subject!.id ? res.subject! : s))
      );
    }
  };

  // Reset to default demo data
  const handleResetDemo = async () => {
    if (window.confirm('Reset database to clean initial demo data?')) {
      setLoading(true);
      await resetDatabaseDemo();
      const allStudents = await fetchStudents();
      setStudents(allStudents);
      const defaultStudent = allStudents[0];
      if (defaultStudent) {
        setActiveStudent(defaultStudent);
        setStoredActiveStudentId(defaultStudent.id);
        const bundle = await fetchStudentData(defaultStudent.id);
        setSubjects(bundle.subjects);
        setRecords(bundle.records);
        setTimetableEntries(bundle.timetableEntries || []);
        setSpecialSchedules(bundle.specialSchedules || []);
      }
      setLoading(false);
    }
  };

  // Nav helper
  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectSubjectForWhatIf = (subjectId: string) => {
    setWhatIfPreselectedSubId(subjectId);
    setActiveTab('what-if');
  };

  if (loading && !activeStudent) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Loading Smart Attendance Tracker...</p>
      </div>
    );
  }

  if (!activeStudent) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <h2 className="text-xl font-bold mb-4">No Student Profile Loaded</h2>
        <button
          onClick={handleResetDemo}
          className="px-4 py-2 bg-indigo-600 rounded-xl font-semibold cursor-pointer"
        >
          Initialize Default Student Profile
        </button>
      </div>
    );
  }

  const overall = calculateOverallMetrics(subjects, activeStudent.targetPercentage);

  // All 10 user-requested navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'today', label: "Today's Classes", icon: Calendar },
    { id: 'timetable', label: 'My Timetable', icon: CalendarDays },
    { id: 'subjects', label: 'My Subjects', icon: BookOpen },
    { id: 'mark-attendance', label: 'Mark Attendance', icon: CheckSquare },
    { id: 'bunk-calculator', label: 'Bunk Calculator', icon: Calculator },
    { id: 'what-if', label: 'Attendance Prediction', icon: Sparkles },
    { id: 'history', label: 'Attendance History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 pb-20 md:pb-12">
      {/* Top Navigation Header */}
      <Header
        student={activeStudent}
        allStudents={students}
        onSelectStudent={handleSelectStudent}
        onOpenNewStudentModal={() => {
          setAuthModalTab('new');
          setIsAuthModalOpen(true);
        }}
        onOpenSettingsModal={() => {
          setAuthModalTab('settings');
          setIsAuthModalOpen(true);
        }}
        onResetDemo={handleResetDemo}
        overallPercentage={overall.percentage}
        shortageCount={overall.shortageCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        {/* Desktop Tab Bar Navigation */}
        <div className="hidden lg:flex items-center space-x-1 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'bunk-calculator' && overall.shortageCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
          <button
            onClick={() => {
              setAuthModalTab('settings');
              setIsAuthModalOpen(true);
            }}
            className="py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer whitespace-nowrap ml-auto"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Medium Screen Tab Bar */}
        <div className="hidden md:flex lg:hidden overflow-x-auto pb-2 space-x-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center space-x-1.5 whitespace-nowrap transition cursor-pointer ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Rendering */}
        {activeTab === 'dashboard' && (
          <Dashboard
            student={activeStudent}
            subjects={subjects}
            timetableEntries={timetableEntries}
            specialSchedules={specialSchedules}
            records={records}
            onQuickMark={handleMarkAttendance}
            onNavigateToTab={navigateToTab}
            onOpenAddSubject={() => setActiveTab('subjects')}
            onSelectSubjectForWhatIf={selectSubjectForWhatIf}
          />
        )}

        {(activeTab === 'today' || activeTab === 'mark-attendance') && (
          <TodayClasses
            student={activeStudent}
            subjects={subjects}
            timetableEntries={timetableEntries}
            specialSchedules={specialSchedules}
            records={records}
            onMarkAttendance={handleMarkAttendance}
            onNavigateToTab={navigateToTab}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableManager
            student={activeStudent}
            subjects={subjects}
            timetableEntries={timetableEntries}
            specialSchedules={specialSchedules}
            onAddTimetableEntry={handleAddTimetableEntry}
            onUpdateTimetableEntry={handleUpdateTimetableEntry}
            onDeleteTimetableEntry={handleDeleteTimetableEntry}
            onAddSpecialSchedule={handleAddSpecialSchedule}
            onDeleteSpecialSchedule={handleDeleteSpecialSchedule}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectManager
            student={activeStudent}
            subjects={subjects}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onQuickMark={(subId, status) => {
              const today = new Date().toISOString().split('T')[0];
              handleMarkAttendance({
                subjectId: subId,
                date: today,
                status,
                remark: 'Marked via Subject Manager',
              });
            }}
            onSelectSubjectForWhatIf={selectSubjectForWhatIf}
            onNavigateToTab={navigateToTab}
          />
        )}

        {activeTab === 'bunk-calculator' && (
          <BunkCalculator
            student={activeStudent}
            subjects={subjects}
            onUpdateTargetRule={handleUpdateTargetRule}
            onNavigateToTab={navigateToTab}
            onSelectSubjectForWhatIf={selectSubjectForWhatIf}
          />
        )}

        {activeTab === 'what-if' && (
          <WhatIfCalculator
            student={activeStudent}
            subjects={subjects}
            timetableEntries={timetableEntries}
            initialSubjectId={whatIfPreselectedSubId}
            onNavigateToTab={navigateToTab}
          />
        )}

        {activeTab === 'history' && (
          <AttendanceHistory
            student={activeStudent}
            subjects={subjects}
            records={records}
            onAddRecord={handleAddAttendanceRecord}
            onUpdateRecord={handleUpdateAttendanceRecord}
            onDeleteRecord={handleDeleteAttendanceRecord}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            student={activeStudent}
            subjects={subjects}
            records={records}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-1 py-1.5 flex items-center justify-around shadow-2xl">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'today', label: 'Today', icon: Calendar },
          { id: 'timetable', label: 'Timetable', icon: CalendarDays },
          { id: 'bunk-calculator', label: 'Bunk', icon: Calculator },
          { id: 'reports', label: 'Reports', icon: FileText },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] truncate max-w-[56px]">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Student Profile / Register / Settings Modal */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        activeStudent={activeStudent}
        allStudents={students}
        onSelectStudent={handleSelectStudent}
        onCreateStudent={handleCreateStudent}
        onUpdateSettings={handleUpdateSettings}
        initialTab={authModalTab}
      />
    </div>
  );
}
