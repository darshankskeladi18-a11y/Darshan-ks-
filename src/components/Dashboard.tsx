import React, { useState } from 'react';
import { 
  Subject, 
  Student, 
  TimetableEntry, 
  SpecialScheduleItem, 
  AttendanceRecord,
  AttendanceStatus,
  DayOfWeek 
} from '../types/attendance';
import { calculateBunkMetrics, calculateOverallMetrics, getDayOfWeekFromDate, DAYS_OF_WEEK } from '../utils/bunkCalculator';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Calculator, 
  ChevronRight,
  Flame,
  BookOpen,
  Sparkles,
  Award,
  ShieldCheck,
  Check,
  X,
  MinusCircle,
  Calendar,
  CalendarDays,
  Target
} from 'lucide-react';

interface DashboardProps {
  student: Student;
  subjects: Subject[];
  timetableEntries: TimetableEntry[];
  specialSchedules: SpecialScheduleItem[];
  records: AttendanceRecord[];
  onQuickMark: (payload: {
    subjectId: string;
    date: string;
    status: AttendanceStatus;
    timeSlot?: string;
    timetableEntryId?: string;
  }) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenAddSubject: () => void;
  onSelectSubjectForWhatIf: (subjectId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  student,
  subjects,
  timetableEntries,
  specialSchedules,
  records,
  onQuickMark,
  onNavigateToTab,
  onOpenAddSubject,
  onSelectSubjectForWhatIf,
}) => {
  const [quickMarkSuccess, setQuickMarkSuccess] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentDayOfWeek: DayOfWeek = getDayOfWeekFromDate(todayStr);

  const overall = calculateOverallMetrics(subjects, student.targetPercentage);

  // Safe bunks sum (strictly never negative)
  const totalSafeBunksPool = subjects.reduce((acc, sub) => {
    const m = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, student.targetPercentage);
    return acc + (m.percentage >= student.targetPercentage ? m.safeBunks : 0);
  }, 0);

  // Total classes needed to recover across all shortage subjects
  const totalClassesNeededToRecover = subjects.reduce((acc, sub) => {
    const m = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, student.targetPercentage);
    return acc + (m.percentage < student.targetPercentage ? m.classesNeeded : 0);
  }, 0);

  const shortageSubjects = subjects.filter((s) => {
    const m = calculateBunkMetrics(s.attendedClasses, s.totalClasses, student.targetPercentage);
    return m.alertLevel === 'CRITICAL';
  });

  // Today's classes from Timetable + Extra Classes
  const todayRegular = timetableEntries
    .filter((t) => t.dayOfWeek === currentDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayExtra = specialSchedules.filter(
    (s) => s.date === todayStr && s.type === 'EXTRA_CLASS'
  );

  const isHoliday = specialSchedules.some(
    (s) => s.date === todayStr && s.type === 'HOLIDAY'
  );

  interface TodayClassItem {
    id: string;
    timetableEntryId?: string;
    subjectId: string;
    startTime: string;
    endTime: string;
    room?: string;
    status?: AttendanceStatus;
  }

  const todayClassesList: TodayClassItem[] = [];

  todayRegular.forEach((reg) => {
    const rec = records.find(
      (r) =>
        r.date === todayStr &&
        (r.timetableEntryId === reg.id || r.subjectId === reg.subjectId)
    );
    todayClassesList.push({
      id: reg.id,
      timetableEntryId: reg.id,
      subjectId: reg.subjectId,
      startTime: reg.startTime,
      endTime: reg.endTime,
      room: reg.room,
      status: rec?.status,
    });
  });

  todayExtra.forEach((extra) => {
    if (!extra.subjectId) return;
    const rec = records.find(
      (r) => r.date === todayStr && r.subjectId === extra.subjectId
    );
    todayClassesList.push({
      id: extra.id,
      subjectId: extra.subjectId,
      startTime: extra.startTime || '02:00 PM',
      endTime: extra.endTime || '03:00 PM',
      room: extra.room,
      status: rec?.status,
    });
  });

  const handleQuickAction = (
    subjectId: string,
    status: AttendanceStatus,
    timeSlot: string,
    timetableEntryId?: string
  ) => {
    onQuickMark({
      subjectId,
      date: todayStr,
      status,
      timeSlot,
      timetableEntryId,
    });
    const sub = subjects.find((s) => s.id === subjectId);
    setQuickMarkSuccess(`Marked ${status} for ${sub?.name || 'Class'}`);
    setTimeout(() => setQuickMarkSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {quickMarkSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 transition-all animate-bounce">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            ✓
          </div>
          <span className="text-sm font-medium">{quickMarkSuccess}</span>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Smart College Attendance & Timetable</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hello, {student.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              You are enrolled in <strong className="text-white">{subjects.length} subjects</strong>. Today is{' '}
              <span className="text-cyan-300 font-semibold">
                {DAYS_OF_WEEK.find((d) => d.key === currentDayOfWeek)?.label} ({todayStr})
              </span>
              . College attendance threshold is{' '}
              <strong className="text-amber-300">{student.targetPercentage}%</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab('today')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Today's Classes ({todayClassesList.length})</span>
            </button>
            <button
              onClick={() => onNavigateToTab('bunk-calculator')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Bunk Calculator</span>
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S TIMETABLE QUICK ACTION CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Today's Timetable & Instant Check-In</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {DAYS_OF_WEEK.find((d) => d.key === currentDayOfWeek)?.label}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isHoliday
                  ? 'Holiday declared for today'
                  : `${todayClassesList.length} classes scheduled today. Tap Present or Absent to log attendance.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('today')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Open Full Today View</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isHoliday ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Holiday declared today. No lectures scheduled.</span>
          </div>
        ) : todayClassesList.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-xs text-slate-400">
              No classes scheduled for {DAYS_OF_WEEK.find((d) => d.key === currentDayOfWeek)?.label}. Check your weekly timetable or add lecture slots.
            </p>
            <button
              onClick={() => onNavigateToTab('timetable')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              Configure Timetable →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {todayClassesList.map((slot) => {
              const sub = subjects.find((s) => s.id === slot.subjectId);
              const isPresent = slot.status === 'PRESENT';
              const isAbsent = slot.status === 'ABSENT';
              const isCancelled = slot.status === 'CANCELLED';

              return (
                <div
                  key={slot.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isPresent
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : isAbsent
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isCancelled
                      ? 'bg-slate-800/40 border-slate-750 opacity-60'
                      : 'bg-slate-800/60 border-slate-750'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{slot.startTime}</span>
                      </span>
                      {slot.status ? (
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isPresent
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isAbsent
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {slot.status}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-semibold">
                          Pending
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1.5 truncate">
                      {sub?.name || 'Class'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {sub?.code} {slot.room && `• Room ${slot.room}`}
                    </p>
                  </div>

                  {/* One-tap Present / Absent buttons */}
                  <div className="flex items-center space-x-1.5 pt-2 border-t border-slate-750">
                    <button
                      onClick={() =>
                        handleQuickAction(
                          slot.subjectId,
                          'PRESENT',
                          `${slot.startTime} – ${slot.endTime}`,
                          slot.timetableEntryId
                        )
                      }
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                        isPresent
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isPresent ? 'Present ✓' : 'Present'}</span>
                    </button>

                    <button
                      onClick={() =>
                        handleQuickAction(
                          slot.subjectId,
                          'ABSENT',
                          `${slot.startTime} – ${slot.endTime}`,
                          slot.timetableEntryId
                        )
                      }
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                        isAbsent
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-rose-600/15 hover:bg-rose-600/30 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isAbsent ? 'Absent ✕' : 'Absent'}</span>
                    </button>

                    <button
                      onClick={() =>
                        handleQuickAction(
                          slot.subjectId,
                          'CANCELLED',
                          `${slot.startTime} – ${slot.endTime}`,
                          slot.timetableEntryId
                        )
                      }
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 text-xs transition cursor-pointer"
                      title="Class Cancelled"
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Critical Shortage Warning Banner (if any) */}
      {shortageSubjects.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-slate-900 border-2 border-rose-500/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-rose-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Attendance Shortage in {shortageSubjects.length} {shortageSubjects.length === 1 ? 'Subject' : 'Subjects'}!</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-semibold border border-rose-400/30">
                  Below {student.targetPercentage}%
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-rose-200/90 mt-1">
                You must attend <strong className="text-white">{totalClassesNeededToRecover} consecutive classes</strong> across your shortage courses ({shortageSubjects.map((s) => s.name).join(', ')}) to restore exam clearance.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('bunk-calculator')}
            className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/30 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <span>Recovery Plan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Complete Dashboard Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Overall Percentage */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Overall Attendance
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                overall.percentage >= student.targetPercentage + 5
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : overall.percentage >= student.targetPercentage
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                overall.percentage >= student.targetPercentage + 5
                  ? 'text-emerald-400'
                  : overall.percentage >= student.targetPercentage
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {overall.percentage.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">/ req {student.targetPercentage}%</span>
          </div>

          <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overall.percentage >= student.targetPercentage + 5
                  ? 'bg-emerald-500'
                  : overall.percentage >= student.targetPercentage
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, overall.percentage)}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/70"
              style={{ left: `${student.targetPercentage}%` }}
              title={`Target ${student.targetPercentage}%`}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status:</span>
            <span
              className={`font-semibold ${
                overall.alertLevel === 'SAFE'
                  ? 'text-emerald-400'
                  : overall.alertLevel === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {overall.statusLabel}
            </span>
          </div>
        </div>

        {/* Card 2: Safe Bunks Pool (Guaranteed never negative) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Safe Bunk Cushion
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 tracking-tight">
              {Math.max(0, totalSafeBunksPool)}
            </span>
            <span className="text-xs text-slate-400">classes across subjects</span>
          </div>

          <p className="mt-3 text-xs text-slate-400 leading-relaxed">
            Permissible absences across courses currently at or above {student.targetPercentage}%.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateToTab('bunk-calculator')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Calculate bunk limit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Classes Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Classes Breakdown
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-3">
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {overall.attended}
              </span>
              <span className="text-[11px] text-slate-400 block font-medium">Attended</span>
            </div>
            <div className="text-slate-600 text-2xl font-light">/</div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-400">
                {overall.absent}
              </span>
              <span className="text-[11px] text-slate-400 block font-medium">Absent</span>
            </div>
            <div className="text-slate-600 text-2xl font-light">/</div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-200">
                {overall.total}
              </span>
              <span className="text-[11px] text-slate-400 block font-medium">Total Held</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Enrolled Subjects</span>
            <span className="font-semibold text-slate-300">{subjects.length} subjects</span>
          </div>
        </div>

        {/* Card 4: Shortage Recovery / Clearance Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Exam Clearance Status
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                shortageSubjects.length === 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            {shortageSubjects.length === 0 ? (
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Eligible For Exams
                </span>
                <p className="mt-2 text-xs text-slate-400">
                  All {subjects.length} subjects satisfy the minimum {student.targetPercentage}% college rule.
                </p>
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                  {shortageSubjects.length} In Shortage
                </span>
                <p className="mt-2 text-xs text-rose-300 font-semibold">
                  Need {totalClassesNeededToRecover} consecutive classes to recover!
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateToTab('bunk-calculator')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Recovery Strategy</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Comparison Chart: Subjects vs College Rule */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span>Subject Attendance vs. {student.targetPercentage}% College Rule</span>
            </h2>
            <p className="text-xs text-slate-400">
              Color-coded status bars: Green (Safe), Orange (Warning), Red (Critical Shortage).
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-slate-400">Safe (≥{student.targetPercentage + 5}%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-slate-400">Warning ({student.targetPercentage}-{student.targetPercentage + 4}%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500" />
              <span className="text-slate-400">Critical (&lt;{student.targetPercentage}%)</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {subjects.map((sub) => {
            const metrics = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, student.targetPercentage);
            const isSafe = metrics.alertLevel === 'SAFE';
            const isWarning = metrics.alertLevel === 'WARNING';

            return (
              <div key={sub.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sub.color || '#3b82f6' }}
                    />
                    <span className="font-semibold text-slate-200">{sub.name}</span>
                    <span className="text-slate-500 text-xs font-mono">({sub.code})</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 text-xs">
                      {sub.attendedClasses}/{sub.totalClasses} attended
                    </span>
                    <span
                      className={`font-black ${
                        isSafe
                          ? 'text-emerald-400'
                          : isWarning
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {metrics.percentage.toFixed(1)}%
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        isSafe
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}
                    >
                      {isSafe
                        ? `${metrics.safeBunks} Safe Bunks`
                        : isWarning
                        ? `${metrics.safeBunks} Bunk Left`
                        : `Need ${metrics.classesNeeded} streak`}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSafe ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.percentage)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm z-10"
                    style={{ left: `${student.targetPercentage}%` }}
                    title={`Target: ${student.targetPercentage}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject-Wise Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Subject Attendance Cards</span>
            </h2>
            <p className="text-xs text-slate-400">
              Monitor individual subject health, safe bunks, or simulate what-if scenarios.
            </p>
          </div>

          <button
            onClick={onOpenAddSubject}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => {
            const metrics = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, student.targetPercentage);
            const isSafe = metrics.alertLevel === 'SAFE';
            const isWarning = metrics.alertLevel === 'WARNING';
            const isShortage = metrics.alertLevel === 'CRITICAL';

            return (
              <div
                key={sub.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition relative overflow-hidden group"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: sub.color || '#3b82f6' }}
                />

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                        {sub.code} • {sub.credits} Credits
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5 group-hover:text-cyan-300 transition line-clamp-1">
                        {sub.name}
                      </h3>
                      {sub.facultyName && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {sub.facultyName}
                        </p>
                      )}
                    </div>

                    <div
                      className={`text-right shrink-0 px-2.5 py-1 rounded-xl border ${
                        isSafe
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isWarning
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      <div className="text-lg font-black leading-none">
                        {metrics.percentage.toFixed(1)}%
                      </div>
                      <div className="text-[10px] uppercase font-bold tracking-wider mt-0.5">
                        {metrics.statusLabel}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-slate-800/50 rounded-xl p-3 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Attended: <strong className="text-white">{sub.attendedClasses}</strong></span>
                      <span>Absent: <strong className="text-rose-400">{metrics.absent}</strong></span>
                      <span>Total: <strong className="text-slate-200">{sub.totalClasses}</strong></span>
                    </div>

                    <div className="mt-2 w-full bg-slate-700/60 h-2.5 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
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
                  </div>

                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed flex items-start space-x-2.5 ${
                      isSafe
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                        : isWarning
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                        : 'bg-rose-500/10 border-rose-500/25 text-rose-200'
                    }`}
                  >
                    {isSafe ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      {isSafe && (
                        <span>
                          Safe zone! You can bunk <strong className="text-white font-bold">{metrics.safeBunks}</strong> more {metrics.safeBunks === 1 ? 'class' : 'classes'} and still stay above {student.targetPercentage}%.
                        </span>
                      )}
                      {isWarning && (
                        <span>
                          Borderline! You have only <strong className="text-white font-bold">{metrics.safeBunks}</strong> safe {metrics.safeBunks === 1 ? 'bunk' : 'bunks'} remaining.
                        </span>
                      )}
                      {isShortage && (
                        <span>
                          Critical Shortage! Must attend next <strong className="text-white font-bold">{metrics.classesNeeded}</strong> consecutive {metrics.classesNeeded === 1 ? 'class' : 'classes'} to reach {student.targetPercentage}%.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleQuickAction(sub.id, 'PRESENT', 'Dashboard Check-in')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Present</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction(sub.id, 'ABSENT', 'Dashboard Check-in')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Absent</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      onSelectSubjectForWhatIf(sub.id);
                      onNavigateToTab('what-if');
                    }}
                    className="p-1.5 px-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>What-If</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
