import React, { useState } from 'react';
import { Subject, AttendanceRecord, AttendanceStatus, Student } from '../types/attendance';
import { 
  History, 
  Plus, 
  Calendar, 
  Clock, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Search,
  BookOpen,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface AttendanceHistoryProps {
  student: Student;
  subjects: Subject[];
  records: AttendanceRecord[];
  onAddRecord: (payload: {
    subjectId: string;
    date: string;
    status: AttendanceStatus;
    timeSlot?: string;
    topic?: string;
    remark?: string;
  }) => Promise<void>;
  onUpdateRecord: (
    recordId: string,
    payload: Partial<AttendanceRecord>
  ) => Promise<void>;
  onDeleteRecord: (recordId: string) => Promise<void>;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  student,
  subjects,
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}) => {
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || '');
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formStatus, setFormStatus] = useState<AttendanceStatus>('PRESENT');
  const [formTimeSlot, setFormTimeSlot] = useState<string>('10:00 AM - 11:00 AM');
  const [formTopic, setFormTopic] = useState<string>('');
  const [formRemark, setFormRemark] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Derive unique months present in records
  const uniqueMonths = Array.from(
    new Set(records.map((r) => r.date.slice(0, 7))) // YYYY-MM
  ).sort().reverse();

  const openAddModal = () => {
    setFormSubjectId(subjects[0]?.id || '');
    setFormDate(todayStr);
    setFormStatus('PRESENT');
    setFormTimeSlot('10:00 AM - 11:00 AM');
    setFormTopic('');
    setFormRemark('');
    setShowAddModal(true);
  };

  const openEditModal = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setFormSubjectId(rec.subjectId);
    setFormDate(rec.date);
    setFormStatus(rec.status);
    setFormTimeSlot(rec.timeSlot || '');
    setFormTopic(rec.topic || '');
    setFormRemark(rec.remark || '');
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectId || !formDate) return;

    try {
      setIsSubmitting(true);
      await onAddRecord({
        subjectId: formSubjectId,
        date: formDate,
        status: formStatus,
        timeSlot: formTimeSlot.trim() || undefined,
        topic: formTopic.trim() || undefined,
        remark: formRemark.trim() || undefined,
      });
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      setIsSubmitting(true);
      await onUpdateRecord(editingRecord.id, {
        subjectId: formSubjectId,
        date: formDate,
        status: formStatus,
        timeSlot: formTimeSlot.trim() || undefined,
        topic: formTopic.trim() || undefined,
        remark: formRemark.trim() || undefined,
      });
      setEditingRecord(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteRecord(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter records
  const filteredRecords = records.filter((rec) => {
    if (filterSubjectId !== 'all' && rec.subjectId !== filterSubjectId) return false;
    if (filterStatus !== 'all' && rec.status !== filterStatus) return false;
    if (filterMonth !== 'all' && !rec.date.startsWith(filterMonth)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sub = subjects.find((s) => s.id === rec.subjectId);
      const matchesTopic = rec.topic?.toLowerCase().includes(q);
      const matchesRemark = rec.remark?.toLowerCase().includes(q);
      const matchesDate = rec.date.includes(q);
      const matchesSubject = sub?.name.toLowerCase().includes(q) || sub?.code.toLowerCase().includes(q);
      if (!matchesTopic && !matchesRemark && !matchesDate && !matchesSubject) return false;
    }
    return true;
  });

  const presentCount = filteredRecords.filter((r) => r.status === 'PRESENT').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'ABSENT').length;
  const cancelledCount = filteredRecords.filter((r) => r.status === 'CANCELLED').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Attendance Logbook</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Session History & Attendance Audit
          </h1>
          <p className="text-sm text-slate-300">
            Chronological records of all conducted classes. Edits or corrections automatically synchronize subject balances.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Past Class</span>
        </button>
      </div>

      {/* Summary Counts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            {filteredRecords.length}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Filtered Records
            </span>
            <span className="text-sm font-bold text-white">Sessions</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
            {presentCount}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Present
            </span>
            <span className="text-sm font-bold text-emerald-400">Classes</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
            {absentCount}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Absent / Missed
            </span>
            <span className="text-sm font-bold text-rose-400">Classes</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-700/50 text-slate-300 flex items-center justify-center font-bold text-sm">
            {cancelledCount}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Cancelled
            </span>
            <span className="text-sm font-bold text-slate-300">By College</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Filter Bar (Subject, Month, Semester, Status, Search) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id} className="bg-slate-800">
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800">All Statuses</option>
              <option value="PRESENT" className="bg-slate-800">Present</option>
              <option value="ABSENT" className="bg-slate-800">Absent</option>
              <option value="CANCELLED" className="bg-slate-800">Cancelled</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800">All Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m} className="bg-slate-800">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Semester:</span>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800">{student.semester} (Current)</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topic, note, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-300">No attendance entries found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching records for the selected filters. Use "Today's Classes" to record scheduled attendance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-750">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Topic / Curriculum</th>
                  <th className="py-3 px-4">Remarks / Note</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRecords.map((rec) => {
                  const sub = subjects.find((s) => s.id === rec.subjectId);
                  const isPresent = rec.status === 'PRESENT';
                  const isAbsent = rec.status === 'ABSENT';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{rec.date}</span>
                        </div>
                        {rec.timeSlot && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{rec.timeSlot}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sub ? (
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: sub.color || '#3b82f6' }}
                              />
                              <span className="font-bold text-slate-200">{sub.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block ml-3.5">
                              {sub.code} • {sub.credits}cr
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unknown Subject</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isPresent
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : isAbsent
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-slate-700/50 text-slate-300 border-slate-600'
                          }`}
                        >
                          {isPresent ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : isAbsent ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{rec.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {rec.topic ? (
                          <span className="font-medium text-slate-200 line-clamp-1">
                            {rec.topic}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">No topic logged</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {rec.remark ? (
                          <span className="text-slate-400 text-xs line-clamp-1 italic">
                            "{rec.remark}"
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openEditModal(rec)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Edit this record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(rec.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Delete this record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Attendance Record Modal */}
      {(showAddModal || editingRecord) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <span>{editingRecord ? 'Correct Attendance Entry' : 'Log Attendance Session'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRecord(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={editingRecord ? handleSaveEdit : handleSaveAdd}
              className="mt-4 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Subject</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Time Slot</label>
                  <input
                    type="text"
                    placeholder="10:00 - 11:00 AM"
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Attendance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('PRESENT')}
                    className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      formStatus === 'PRESENT'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('ABSENT')}
                    className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      formStatus === 'ABSENT'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Absent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('CANCELLED')}
                    className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      formStatus === 'CANCELLED'
                        ? 'bg-slate-700 text-white border-slate-600 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>Cancelled</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Topic Covered</label>
                <input
                  type="text"
                  placeholder="e.g. Graph Traversal - BFS and DFS"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Remarks / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Attended lecture, lab submission done, or reason for absence"
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingRecord ? 'Update Record' : 'Record Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Before Deleting Attendance Record */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Delete Attendance Record?</h3>
              <p className="text-xs text-slate-400">
                Removing this entry will automatically decrement this class from the subject's total count.
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
