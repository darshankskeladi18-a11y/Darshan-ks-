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
import { getDayOfWeekFromDate, DAYS_OF_WEEK } from '../utils/bunkCalculator';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  MinusCircle, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  CalendarDays,
  Plus,
  RefreshCw
} from 'lucide-react';

interface TodayClassesProps {
  student: Student;
  subjects: Subject[];
  timetableEntries: TimetableEntry[];
  specialSchedules: SpecialScheduleItem[];
  records: AttendanceRecord[];
  onMarkAttendance: (payload: {
    subjectId: string;
    date: string;
    status: AttendanceStatus;
    timeSlot?: string;
    timetableEntryId?: string;
    topic?: string;
    remark?: string;
  }) => Promise<void>;
  onNavigateToTab: (tab: string) => void;
}

export const TodayClasses: React.FC<TodayClassesProps> = ({
  student,
  subjects,
  timetableEntries,
  specialSchedules,
  records,
  onMarkAttendance,
  onNavigateToTab,
}) => {
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [markingSlotId, setMarkingSlotId] = useState<string | null>(null);

  // Modal to log ad-hoc class attendance for this date
  const [showAdHocModal, setShowAdHocModal] = useState<boolean>(false);
  const [adHocSubjectId, setAdHocSubjectId] = useState<string>(subjects[0]?.id || '');
  const [adHocStatus, setAdHocStatus] = useState<AttendanceStatus>('PRESENT');
  const [adHocTimeSlot, setAdHocTimeSlot] = useState<string>('02:00 PM - 03:00 PM');
  const [adHocTopic, setAdHocTopic] = useState<string>('');

  const currentDayOfWeek: DayOfWeek = getDayOfWeekFromDate(selectedDate);
  const isToday = selectedDate === todayDateStr;

  // Check if date is a declared Holiday
  const holidayItem = specialSchedules.find(
    (s) => s.date === selectedDate && s.type === 'HOLIDAY'
  );

  // Gather regular timetable entries for this day
  const regularClasses = timetableEntries
    .filter((t) => t.dayOfWeek === currentDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Gather date-specific extra classes for this date
  const extraClasses = specialSchedules.filter(
    (s) => s.date === selectedDate && s.type === 'EXTRA_CLASS'
  );

  // Build scheduled instances list
  interface ScheduledInstance {
    key: string;
    timetableEntryId?: string;
    subjectId: string;
    startTime: string;
    endTime: string;
    room?: string;
    faculty?: string;
    isExtra?: boolean;
    status?: AttendanceStatus;
    recordId?: string;
  }

  const scheduledInstances: ScheduledInstance[] = [];

  // Add regular classes
  regularClasses.forEach((reg) => {
    // Check if recorded in attendanceRecords for this date & timetableEntryId
    const rec = records.find(
      (r) =>
        r.date === selectedDate &&
        (r.timetableEntryId === reg.id || r.subjectId === reg.subjectId)
    );

    scheduledInstances.push({
      key: `reg_${reg.id}`,
      timetableEntryId: reg.id,
      subjectId: reg.subjectId,
      startTime: reg.startTime,
      endTime: reg.endTime,
      room: reg.room,
      faculty: reg.faculty,
      isExtra: false,
      status: rec?.status,
      recordId: rec?.id,
    });
  });

  // Add extra classes
  extraClasses.forEach((extra) => {
    if (!extra.subjectId) return;
    const rec = records.find(
      (r) => r.date === selectedDate && r.subjectId === extra.subjectId
    );

    scheduledInstances.push({
      key: `extra_${extra.id}`,
      subjectId: extra.subjectId,
      startTime: extra.startTime || '02:00 PM',
      endTime: extra.endTime || '03:00 PM',
      room: extra.room,
      isExtra: true,
      status: rec?.status,
      recordId: rec?.id,
    });
  });

  // Also include any ad-hoc attendance records for this date not in regular list
  records
    .filter((r) => r.date === selectedDate && !scheduledInstances.some((i) => i.recordId === r.id))
    .forEach((r) => {
      scheduledInstances.push({
        key: `adhoc_${r.id}`,
        subjectId: r.subjectId,
        startTime: r.timeSlot || 'Class',
        endTime: '',
        isExtra: true,
        status: r.status,
        recordId: r.id,
      });
    });

  const handleMark = async (
    subjectId: string,
    status: AttendanceStatus,
    timeSlot: string,
    timetableEntryId?: string
  ) => {
    const slotKey = timetableEntryId || subjectId;
    setMarkingSlotId(slotKey);
    try {
      await onMarkAttendance({
        subjectId,
        date: selectedDate,
        status,
        timeSlot,
        timetableEntryId,
        remark: isToday ? 'Marked via Today\'s Classes' : `Marked for ${selectedDate}`,
      });

      const sub = subjects.find((s) => s.id === subjectId);
      setSuccessToast(`Marked ${status} for ${sub?.name || 'Class'}`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingSlotId(null);
    }
  };

  const handleSaveAdHoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adHocSubjectId) return;

    try {
      await onMarkAttendance({
        subjectId: adHocSubjectId,
        date: selectedDate,
        status: adHocStatus,
        timeSlot: adHocTimeSlot.trim() || undefined,
        topic: adHocTopic.trim() || undefined,
        remark: 'Ad-hoc session attendance',
      });
      setShowAdHocModal(false);
      setAdHocTopic('');
      setSuccessToast(`Logged attendance for ${selectedDate}`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const markedCount = scheduledInstances.filter((i) => i.status !== undefined).length;
  const presentCount = scheduledInstances.filter((i) => i.status === 'PRESENT').length;
  const absentCount = scheduledInstances.filter((i) => i.status === 'ABSENT').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 transition-all animate-bounce">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            ✓
          </div>
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Top Banner with Date Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automatic Timetable Attendance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {isToday ? "Today's Scheduled Classes" : `Classes for ${selectedDate}`}
          </h1>
          <p className="text-sm text-slate-300">
            One-tap daily attendance marking connected directly to your subjects and live calculations.
          </p>
        </div>

        {/* Date Selector & Jump to Today */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <Calendar className="w-4 h-4 text-cyan-400 ml-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-semibold text-xs focus:outline-none pr-2 cursor-pointer"
            />
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayDateStr)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 text-xs font-bold transition cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Back to Today</span>
            </button>
          )}

          <button
            onClick={() => setShowAdHocModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ad-Hoc Lecture</span>
          </button>
        </div>
      </div>

      {/* Holiday Announcement Banner if declared */}
      {holidayItem && (
        <div className="bg-gradient-to-r from-amber-950/70 via-amber-900/50 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 shadow-xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              College Holiday Declared
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {holidayItem.reason || 'No regular lectures scheduled for today'}
            </h3>
            <p className="text-xs text-amber-200/90 mt-0.5">
              No attendance is expected for this date. Regular weekly timetable classes are suspended.
            </p>
          </div>
        </div>
      )}

      {/* Day Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Day of Week
          </span>
          <div className="text-base sm:text-lg font-bold text-white mt-0.5">
            {DAYS_OF_WEEK.find((d) => d.key === currentDayOfWeek)?.label}
          </div>
          <span className="text-[10px] text-cyan-400">
            {scheduledInstances.length} classes scheduled
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Attendance Marked
          </span>
          <div className="text-base sm:text-lg font-bold text-indigo-300 mt-0.5">
            {markedCount} / {scheduledInstances.length}
          </div>
          <span className="text-[10px] text-slate-400">
            {scheduledInstances.length - markedCount === 0 ? 'All completed ✓' : `${scheduledInstances.length - markedCount} pending`}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Classes Attended
          </span>
          <div className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
            {presentCount}
          </div>
          <span className="text-[10px] text-emerald-300/80">Present today</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Classes Missed
          </span>
          <div className="text-base sm:text-lg font-bold text-rose-400 mt-0.5">
            {absentCount}
          </div>
          <span className="text-[10px] text-rose-300/80">Absent today</span>
        </div>
      </div>

      {/* Scheduled Classes Interactive List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Scheduled Lectures for {DAYS_OF_WEEK.find((d) => d.key === currentDayOfWeek)?.label} ({selectedDate})</span>
          </h2>
          <button
            onClick={() => onNavigateToTab('timetable')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
          >
            Manage Timetable →
          </button>
        </div>

        {scheduledInstances.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <CalendarDays className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-300">
              No classes scheduled for {DAYS_OF_WEEK.find((d) => d.key === currentDayOfWeek)?.label}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Either this is your free day or weekly timetable has no slots configured for this day. You can add regular classes in "My Timetable" or log an ad-hoc class.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => onNavigateToTab('timetable')}
                className="px-4 py-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-600/50 transition cursor-pointer"
              >
                Open Timetable Manager
              </button>
              <button
                onClick={() => setShowAdHocModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-750 transition cursor-pointer"
              >
                Log Ad-Hoc Lecture
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {scheduledInstances.map((slot) => {
              const sub = subjects.find((s) => s.id === slot.subjectId);
              const isPresent = slot.status === 'PRESENT';
              const isAbsent = slot.status === 'ABSENT';
              const isCancelled = slot.status === 'CANCELLED';
              const isMarked = slot.status !== undefined;
              const isPendingThis = markingSlotId === (slot.timetableEntryId || slot.subjectId);

              return (
                <div
                  key={slot.key}
                  className={`border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isPresent
                      ? 'bg-emerald-950/15 border-emerald-500/30'
                      : isAbsent
                      ? 'bg-rose-950/15 border-rose-500/30'
                      : isCancelled
                      ? 'bg-slate-850/60 border-slate-750 opacity-70'
                      : 'bg-slate-800/40 border-slate-750 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Class details */}
                  <div className="flex items-start sm:items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-white shrink-0 shadow-lg"
                      style={{ backgroundColor: sub?.color || '#3b82f6' }}
                    >
                      <span className="text-xs">
                        {sub?.code ? sub.code.slice(0, 4) : 'LEC'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {sub?.name || 'Class Subject'}
                        </h3>
                        {slot.isExtra && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Extra Class
                          </span>
                        )}
                        {/* Attendance status badge */}
                        {isMarked ? (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                              isPresent
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isAbsent
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-slate-700 text-slate-300 border-slate-600'
                            }`}
                          >
                            {slot.status}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Not Marked Yet
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center space-x-1 text-cyan-300 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            {slot.startTime} {slot.endTime && `– ${slot.endTime}`}
                          </span>
                        </span>

                        {slot.room && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>Room: {slot.room}</span>
                          </span>
                        )}

                        {sub?.credits && (
                          <span className="text-slate-500 font-medium">
                            {sub.credits} Credits
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: One-tap Attendance Buttons */}
                  <div className="flex items-center justify-end space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-750">
                    {/* Present Button */}
                    <button
                      onClick={() =>
                        handleMark(
                          slot.subjectId,
                          'PRESENT',
                          `${slot.startTime} – ${slot.endTime}`,
                          slot.timetableEntryId
                        )
                      }
                      disabled={isPendingThis}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border ${
                        isPresent
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                          : 'bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                      }`}
                      title="Mark Present for this lecture"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isPresent ? 'Present ✓' : 'Present'}</span>
                    </button>

                    {/* Absent Button */}
                    <button
                      onClick={() =>
                        handleMark(
                          slot.subjectId,
                          'ABSENT',
                          `${slot.startTime} – ${slot.endTime}`,
                          slot.timetableEntryId
                        )
                      }
                      disabled={isPendingThis}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border ${
                        isAbsent
                          ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/50'
                          : 'bg-rose-600/15 hover:bg-rose-600/30 text-rose-300 border-rose-500/30'
                      }`}
                      title="Mark Absent / Bunked for this lecture"
                    >
                      <X className="w-4 h-4" />
                      <span>{isAbsent ? 'Absent ✕' : 'Absent'}</span>
                    </button>

                    {/* Cancelled Button */}
                    <button
                      onClick={() =>
                        handleMark(
                          slot.subjectId,
                          'CANCELLED',
                          `${slot.startTime} – ${slot.endTime}`,
                          slot.timetableEntryId
                        )
                      }
                      disabled={isPendingThis}
                      className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        isCancelled
                          ? 'bg-slate-700 text-white border-slate-600 ring-2 ring-slate-400'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border-slate-700'
                      }`}
                      title="Faculty was absent or class cancelled (not counted towards total held)"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Ad-Hoc Lecture Modal */}
      {showAdHocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Log Ad-Hoc / Special Lecture</span>
              </h3>
              <button
                onClick={() => setShowAdHocModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdHoc} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Date</label>
                <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs">
                  {selectedDate}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Subject</label>
                <select
                  value={adHocSubjectId}
                  onChange={(e) => setAdHocSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Attendance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdHocStatus('PRESENT')}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      adHocStatus === 'PRESENT'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdHocStatus('ABSENT')}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      adHocStatus === 'ABSENT'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdHocStatus('CANCELLED')}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      adHocStatus === 'CANCELLED'
                        ? 'bg-slate-700 text-white border-slate-600'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Time Slot</label>
                <input
                  type="text"
                  value={adHocTimeSlot}
                  onChange={(e) => setAdHocTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Topic Covered (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Special guest lecture on Cloud Architecture"
                  value={adHocTopic}
                  onChange={(e) => setAdHocTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAdHocModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Record Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
