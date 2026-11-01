import React, { useState } from 'react';
import { 
  Subject, 
  Student, 
  TimetableEntry, 
  SpecialScheduleItem, 
  DayOfWeek 
} from '../types/attendance';
import { DAYS_OF_WEEK } from '../utils/bunkCalculator';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Sparkles, 
  MapPin, 
  User, 
  CalendarDays, 
  AlertTriangle,
  CheckCircle2,
  CalendarX,
  Shuffle
} from 'lucide-react';

interface TimetableManagerProps {
  student: Student;
  subjects: Subject[];
  timetableEntries: TimetableEntry[];
  specialSchedules: SpecialScheduleItem[];
  onAddTimetableEntry: (entry: Omit<TimetableEntry, 'id' | 'studentId'>) => Promise<void>;
  onUpdateTimetableEntry: (id: string, updates: Partial<TimetableEntry>) => Promise<void>;
  onDeleteTimetableEntry: (id: string) => Promise<void>;
  onAddSpecialSchedule: (item: Omit<SpecialScheduleItem, 'id' | 'studentId' | 'createdAt'>) => Promise<void>;
  onDeleteSpecialSchedule: (id: string) => Promise<void>;
}

export const TimetableManager: React.FC<TimetableManagerProps> = ({
  student,
  subjects,
  timetableEntries,
  specialSchedules,
  onAddTimetableEntry,
  onUpdateTimetableEntry,
  onDeleteTimetableEntry,
  onAddSpecialSchedule,
  onDeleteSpecialSchedule,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [activeSubTab, setActiveSubTab] = useState<'weekly' | 'exceptions'>('weekly');

  // Timetable Add/Edit Modal
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for Timetable Entry
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || '');
  const [formDayOfWeek, setFormDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [formStartTime, setFormStartTime] = useState<string>('09:00 AM');
  const [formEndTime, setFormEndTime] = useState<string>('10:00 AM');
  const [formRoom, setFormRoom] = useState<string>('LH-302');
  const [formFaculty, setFormFaculty] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Special Schedule (Holiday / Extra Class / Reschedule) Modal
  const [showSpecialModal, setShowSpecialModal] = useState<boolean>(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [specialDate, setSpecialDate] = useState<string>(todayStr);
  const [specialType, setSpecialType] = useState<'EXTRA_CLASS' | 'HOLIDAY' | 'RESCHEDULED'>('EXTRA_CLASS');
  const [specialSubjectId, setSpecialSubjectId] = useState<string>(subjects[0]?.id || '');
  const [specialStartTime, setSpecialStartTime] = useState<string>('02:00 PM');
  const [specialEndTime, setSpecialEndTime] = useState<string>('03:30 PM');
  const [specialRoom, setSpecialRoom] = useState<string>('Seminar Hall');
  const [specialReason, setSpecialReason] = useState<string>('');

  const openAddModal = (day: DayOfWeek = selectedDay) => {
    setEditingEntry(null);
    setFormDayOfWeek(day);
    setFormSubjectId(subjects[0]?.id || '');
    setFormStartTime('09:00 AM');
    setFormEndTime('10:00 AM');
    setFormRoom('LH-302');
    setFormFaculty(subjects[0]?.facultyName || '');
    setFormError(null);
    setShowEntryModal(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormDayOfWeek(entry.dayOfWeek);
    setFormSubjectId(entry.subjectId);
    setFormStartTime(entry.startTime);
    setFormEndTime(entry.endTime);
    setFormRoom(entry.room || '');
    setFormFaculty(entry.faculty || '');
    setFormError(null);
    setShowEntryModal(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectId || !formDayOfWeek || !formStartTime || !formEndTime) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingEntry) {
        await onUpdateTimetableEntry(editingEntry.id, {
          subjectId: formSubjectId,
          dayOfWeek: formDayOfWeek,
          startTime: formStartTime.trim(),
          endTime: formEndTime.trim(),
          room: formRoom.trim() || undefined,
          faculty: formFaculty.trim() || undefined,
        });
      } else {
        await onAddTimetableEntry({
          subjectId: formSubjectId,
          dayOfWeek: formDayOfWeek,
          startTime: formStartTime.trim(),
          endTime: formEndTime.trim(),
          room: formRoom.trim() || undefined,
          faculty: formFaculty.trim() || undefined,
        });
      }
      setShowEntryModal(false);
      setEditingEntry(null);
    } catch (err) {
      setFormError('Failed to save timetable entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await onDeleteTimetableEntry(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialDate) return;

    try {
      setIsSubmitting(true);
      await onAddSpecialSchedule({
        date: specialDate,
        type: specialType,
        subjectId: specialType !== 'HOLIDAY' ? specialSubjectId : undefined,
        startTime: specialType !== 'HOLIDAY' ? specialStartTime : undefined,
        endTime: specialType !== 'HOLIDAY' ? specialEndTime : undefined,
        room: specialType !== 'HOLIDAY' ? specialRoom : undefined,
        reason: specialReason.trim() || undefined,
      });
      setShowSpecialModal(false);
      setSpecialReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter entries for the selected day
  const dayEntries = timetableEntries
    .filter((t) => t.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Count classes per day for badges
  const dayCounts: Record<DayOfWeek, number> = {
    MONDAY: 0,
    TUESDAY: 0,
    WEDNESDAY: 0,
    THURSDAY: 0,
    FRIDAY: 0,
    SATURDAY: 0,
  };
  timetableEntries.forEach((t) => {
    if (dayCounts[t.dayOfWeek] !== undefined) {
      dayCounts[t.dayOfWeek]++;
    }
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Weekly College Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Timetable Management System
          </h1>
          <p className="text-sm text-slate-300">
            Configure your regular weekly lecture slots from Monday to Saturday, add extra classes, or schedule holidays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSpecialModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Add Extra Class / Holiday</span>
          </button>
          <button
            onClick={() => openAddModal(selectedDay)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Regular Class</span>
          </button>
        </div>
      </div>

      {/* Important Architecture Note Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-400">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">Data Isolation Guarantee:</strong> Your regular weekly timetable is stored independently from actual recorded attendance history. Modifying or deleting timetable entries will <em>never</em> alter or delete your previous attendance records.
        </p>
      </div>

      {/* Sub tabs: Weekly Schedule vs Special Exceptions */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('weekly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'weekly'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Weekly Timetable (Mon - Sat)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('exceptions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
            activeSubTab === 'exceptions'
              ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Special Schedules & Holidays ({specialSchedules.length})</span>
        </button>
      </div>

      {activeSubTab === 'weekly' ? (
        <div className="space-y-6">
          {/* Day of Week Navigation Pill Tabs (Mon to Sat) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {DAYS_OF_WEEK.map((d) => {
              const isSelected = selectedDay === d.key;
              const count = dayCounts[d.key] || 0;
              return (
                <button
                  key={d.key}
                  onClick={() => setSelectedDay(d.key)}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 scale-102'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-extrabold text-sm">{d.label}</div>
                  <div
                    className={`text-[11px] font-semibold mt-1 ${
                      isSelected ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {count} {count === 1 ? 'class' : 'classes'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Classes for Selected Day */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-bold text-white">
                  {DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.label} Classes
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {dayEntries.length} scheduled
                </span>
              </div>

              <button
                onClick={() => openAddModal(selectedDay)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class to {DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.label}</span>
              </button>
            </div>

            {dayEntries.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-300">No classes scheduled for {DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.label}</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Free day or no regular lectures recorded yet. Tap "Add Class" to insert periods into this day.
                </p>
                <button
                  onClick={() => openAddModal(selectedDay)}
                  className="px-4 py-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-600/50 transition cursor-pointer"
                >
                  Schedule First Class
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dayEntries.map((entry, idx) => {
                  const sub = subjects.find((s) => s.id === entry.subjectId);

                  return (
                    <div
                      key={entry.id}
                      className="bg-slate-800/60 hover:bg-slate-800 border border-slate-750 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-start sm:items-center space-x-3.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md"
                          style={{ backgroundColor: sub?.color || '#3b82f6' }}
                        >
                          P{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm sm:text-base font-bold text-white">
                              {sub?.name || 'Unknown Subject'}
                            </h4>
                            {sub?.code && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 uppercase">
                                {sub.code}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                            <span className="flex items-center space-x-1 text-cyan-300 font-medium">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{entry.startTime} – {entry.endTime}</span>
                            </span>

                            {entry.room && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                <span>{entry.room}</span>
                              </span>
                            )}

                            {entry.faculty && (
                              <span className="flex items-center space-x-1">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>{entry.faculty}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-750">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-700/60 transition cursor-pointer"
                          title="Edit class"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(entry.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition cursor-pointer"
                          title="Delete class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Special Schedules Tab */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Date-Specific Timetable Overrides</h3>
              <p className="text-xs text-slate-400">
                Extra classes, rescheduled lectures, or holidays scheduled for specific calendar dates.
              </p>
            </div>
            <button
              onClick={() => setShowSpecialModal(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 transition cursor-pointer"
            >
              + Add Exception
            </button>
          </div>

          {specialSchedules.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CalendarDays className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-300">No special schedules logged</h4>
              <p className="text-xs text-slate-500">
                Need to add a Saturday makeup class or declare a sports day holiday? Tap "+ Add Exception".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {specialSchedules.map((item) => {
                const sub = subjects.find((s) => s.id === item.subjectId);
                const isHoliday = item.type === 'HOLIDAY';
                const isExtra = item.type === 'EXTRA_CLASS';

                return (
                  <div
                    key={item.id}
                    className="bg-slate-800/60 border border-slate-750 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isHoliday
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {item.type.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {item.date}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        {isHoliday ? (
                          <span className="italic">Holiday: {item.reason || 'No lectures today'}</span>
                        ) : (
                          <span>
                            {sub?.name || 'Class'}{' '}
                            {item.startTime && `(${item.startTime} – ${item.endTime})`}
                            {item.room && ` • Room ${item.room}`}
                          </span>
                        )}
                      </div>

                      {item.reason && !isHoliday && (
                        <p className="text-[11px] text-slate-400 italic">"{item.reason}"</p>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteSpecialSchedule(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-xl transition cursor-pointer"
                      title="Remove this schedule exception"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Timetable Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span>{editingEntry ? 'Edit Timetable Entry' : 'Add Weekly Lecture Slot'}</span>
              </h3>
              <button
                onClick={() => setShowEntryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Day of Week */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Day of the Week</label>
                <select
                  value={formDayOfWeek}
                  onChange={(e) => setFormDayOfWeek(e.target.value as DayOfWeek)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Subject</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => {
                    setFormSubjectId(e.target.value);
                    const s = subjects.find((sub) => sub.id === e.target.value);
                    if (s?.facultyName) setFormFaculty(s.facultyName);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:00 AM"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Room & Faculty */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Room / Hall</label>
                  <input
                    type="text"
                    placeholder="e.g. LH-302"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Faculty Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ramesh Rao"
                    value={formFaculty}
                    onChange={(e) => setFormFaculty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingEntry ? 'Save Changes' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Special Schedule (Holiday / Extra Class) Modal */}
      {showSpecialModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Date-Specific Schedule / Holiday</span>
              </h3>
              <button
                onClick={() => setShowSpecialModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSpecial} className="mt-4 space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSpecialType('EXTRA_CLASS')}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    specialType === 'EXTRA_CLASS'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Extra Class
                </button>
                <button
                  type="button"
                  onClick={() => setSpecialType('HOLIDAY')}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    specialType === 'HOLIDAY'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Holiday
                </button>
                <button
                  type="button"
                  onClick={() => setSpecialType('RESCHEDULED')}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    specialType === 'RESCHEDULED'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Rescheduled
                </button>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Date</label>
                <input
                  type="date"
                  required
                  value={specialDate}
                  onChange={(e) => setSpecialDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {specialType !== 'HOLIDAY' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Subject</label>
                    <select
                      value={specialSubjectId}
                      onChange={(e) => setSpecialSubjectId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Start Time</label>
                      <input
                        type="text"
                        value={specialStartTime}
                        onChange={(e) => setSpecialStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">End Time</label>
                      <input
                        type="text"
                        value={specialEndTime}
                        onChange={(e) => setSpecialEndTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Room (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Auditorium / Lab"
                      value={specialRoom}
                      onChange={(e) => setSpecialRoom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </>
              )}

              {/* Reason / Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  {specialType === 'HOLIDAY' ? 'Holiday Description' : 'Reason / Note'}
                </label>
                <input
                  type="text"
                  placeholder={
                    specialType === 'HOLIDAY'
                      ? 'e.g. Diwali Holiday, College Fest Day 1'
                      : 'e.g. Remedial lecture for exam prep'
                  }
                  value={specialReason}
                  onChange={(e) => setSpecialReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSpecialModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 font-bold text-xs text-slate-950 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Exception'}
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
              <h3 className="text-lg font-bold text-white">Delete Class Slot?</h3>
              <p className="text-xs text-slate-400">
                This will remove the lecture from your regular weekly schedule. Past attendance history will remain untouched.
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
                onClick={() => handleDeleteEntry(deleteConfirmId)}
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
