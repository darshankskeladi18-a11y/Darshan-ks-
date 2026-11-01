import React, { useState, useRef } from 'react';
import { Subject, AttendanceRecord, Student } from '../types/attendance';
import { calculateBunkMetrics, calculateOverallMetrics } from '../utils/bunkCalculator';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Award, 
  Calendar,
  Building2,
  TrendingUp,
  ShieldCheck,
  Flame,
  BarChart3,
  PieChart,
  CalendarDays
} from 'lucide-react';

interface ReportsProps {
  student: Student;
  subjects: Subject[];
  records: AttendanceRecord[];
}

export const Reports: React.FC<ReportsProps> = ({
  student,
  subjects,
  records,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [activeReportTab, setActiveReportTab] = useState<
    'semester' | 'daily' | 'subject' | 'monthly' | 'analytics'
  >('semester');

  const overall = calculateOverallMetrics(subjects, student.targetPercentage);

  const shortageSubjects = subjects.filter((s) => {
    const m = calculateBunkMetrics(s.attendedClasses, s.totalClasses, student.targetPercentage);
    return m.percentage < student.targetPercentage;
  });

  const totalCredits = subjects.reduce((acc, s) => acc + (s.credits || 3), 0);

  // Group records by Month
  const monthlyMap = new Map<string, { held: number; present: number; absent: number; cancelled: number }>();
  for (const r of records) {
    const monthKey = r.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { held: 0, present: 0, absent: 0, cancelled: 0 });
    }
    const stat = monthlyMap.get(monthKey)!;
    if (r.status === 'PRESENT') {
      stat.held++;
      stat.present++;
    } else if (r.status === 'ABSENT') {
      stat.held++;
      stat.absent++;
    } else if (r.status === 'CANCELLED') {
      stat.cancelled++;
    }
  }

  const monthlyList = Array.from(monthlyMap.entries())
    .map(([monthKey, stat]) => {
      const date = new Date(`${monthKey}-01T00:00:00`);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const pct = stat.held > 0 ? (stat.present / stat.held) * 100 : 100;
      return { monthKey, monthName, ...stat, percentage: pct };
    })
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // Daily records sorted
  const sortedDailyRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = [
      'Subject Code',
      'Subject Name',
      'Faculty',
      'Credits',
      'Total Classes Conducted',
      'Attended Classes',
      'Absent Classes',
      'Attendance Percentage',
      'Required Target %',
      'Safe Bunks Remaining',
      'Consecutive Classes Needed',
      'Exam Eligibility Status',
    ];

    const rows = subjects.map((sub) => {
      const m = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, student.targetPercentage);
      return [
        `"${sub.code}"`,
        `"${sub.name}"`,
        `"${sub.facultyName || 'N/A'}"`,
        sub.credits,
        sub.totalClasses,
        sub.attendedClasses,
        m.absent,
        `${m.percentage.toFixed(1)}%`,
        `${student.targetPercentage}%`,
        m.safeBunks,
        m.classesNeeded,
        `"${m.statusLabel}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Attendance_Report_${student.rollNumber}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Header & Export Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Academic Transcripts & Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Attendance Reports & Analytics
          </h1>
          <p className="text-sm text-slate-300">
            Daily logs, subject-wise audits, monthly summaries, exam eligibility clearance, and visual charts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Section Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveReportTab('semester')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'semester'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Semester Report Card</span>
        </button>

        <button
          onClick={() => setActiveReportTab('subject')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'subject'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Subject-Wise Clearance</span>
        </button>

        <button
          onClick={() => setActiveReportTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'daily'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Daily Attendance Report</span>
        </button>

        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'monthly'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Monthly Summary</span>
        </button>

        <button
          onClick={() => setActiveReportTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'analytics'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Charts & Present vs. Absent Stats</span>
        </button>
      </div>

      {/* Main Report Container (Printable Paper Format) */}
      <div
        ref={reportRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 print:bg-white print:text-black print:p-0 print:border-none"
      >
        {/* Student & College Header */}
        <div className="border-b border-slate-800 pb-6 print:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-cyan-400 print:text-cyan-700 font-bold text-sm">
                <Building2 className="w-4 h-4" />
                <span>{student.collegeName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white print:text-black">
                Official Attendance Clearance Report
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
              </p>
            </div>

            <div className="text-left sm:text-right">
              {shortageSubjects.length === 0 ? (
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ELIGIBLE FOR SEMESTER EXAMS</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>CONDONATION REQUIRED</span>
                </div>
              )}
              <div className="text-[11px] text-slate-400 print:text-slate-500 mt-1">
                College Rule Benchmark: <strong>{student.targetPercentage}%</strong>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-750 print:bg-slate-100 print:border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Student Name
              </span>
              <span className="text-sm font-bold text-white print:text-black">{student.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Roll Number
              </span>
              <span className="text-sm font-bold text-cyan-400 print:text-cyan-700">{student.rollNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Program & Branch
              </span>
              <span className="text-sm font-bold text-slate-200 print:text-slate-800 truncate block">
                {student.course}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Semester & Year
              </span>
              <span className="text-sm font-bold text-slate-200 print:text-slate-800">
                {student.semester} ({student.academicYear})
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Semester Report Card Overview */}
        {activeReportTab === 'semester' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-750 text-center print:border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Weighted Attendance</span>
                <div
                  className={`text-2xl sm:text-3xl font-black mt-1 ${
                    overall.percentage >= student.targetPercentage
                      ? 'text-emerald-400 print:text-emerald-700'
                      : 'text-rose-400 print:text-rose-700'
                  }`}
                >
                  {overall.percentage.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-750 text-center print:border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Classes Attended / Held</span>
                <div className="text-2xl sm:text-3xl font-black text-white print:text-black mt-1">
                  {overall.attended} <span className="text-sm text-slate-400">/ {overall.total}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-750 text-center print:border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Total Missed</span>
                <div className="text-2xl sm:text-3xl font-black text-rose-400 print:text-rose-700 mt-1">
                  {overall.absent} <span className="text-xs text-slate-400">classes</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-750 text-center print:border-slate-200">
                <span className="text-xs text-slate-400 block font-medium">Enrolled Credits</span>
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 print:text-cyan-700 mt-1">
                  {totalCredits} <span className="text-xs text-slate-400">credits</span>
                </div>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 print:border-slate-300">
              <table className="w-full text-xs text-left text-slate-300 print:text-black">
                <thead className="bg-slate-800 text-[11px] uppercase tracking-wider text-slate-400 print:bg-slate-200 print:text-slate-800 font-bold border-b border-slate-700 print:border-slate-300">
                  <tr>
                    <th className="py-3 px-3">Subject & Code</th>
                    <th className="py-3 px-3">Faculty</th>
                    <th className="py-3 px-3 text-center">Credits</th>
                    <th className="py-3 px-3 text-center">Held</th>
                    <th className="py-3 px-3 text-center">Attended</th>
                    <th className="py-3 px-3 text-center">Absent</th>
                    <th className="py-3 px-3 text-center">Attendance %</th>
                    <th className="py-3 px-3 text-center">Bunk Cushion</th>
                    <th className="py-3 px-3 text-center">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {subjects.map((sub) => {
                    const m = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, student.targetPercentage);
                    const isSafe = m.alertLevel === 'SAFE';
                    const isWarning = m.alertLevel === 'WARNING';
                    const isShortage = m.alertLevel === 'CRITICAL';

                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                        <td className="py-3 px-3 font-semibold text-white print:text-black">
                          <div>{sub.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{sub.code}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-400 print:text-slate-700">
                          {sub.facultyName || 'Department Faculty'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">{sub.credits}</td>
                        <td className="py-3 px-3 text-center font-medium">{sub.totalClasses}</td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-400 print:text-emerald-700">
                          {sub.attendedClasses}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-400 print:text-rose-700">
                          {m.absent}
                        </td>
                        <td className="py-3 px-3 text-center font-black">
                          <span
                            className={`${
                              isSafe
                                ? 'text-emerald-400 print:text-emerald-700'
                                : isWarning
                                ? 'text-amber-400 print:text-amber-700'
                                : 'text-rose-400 print:text-rose-700'
                            }`}
                          >
                            {m.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold">
                          {isShortage ? (
                            <span className="text-rose-400 text-[11px] font-bold">
                              Need {m.classesNeeded} streak
                            </span>
                          ) : (
                            <span className="text-emerald-400 text-[11px] font-bold">
                              {m.safeBunks} safe bunks
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isShortage
                                ? 'bg-rose-500/20 text-rose-300 print:bg-rose-100 print:text-rose-800 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-800 border border-emerald-500/30'
                            }`}
                          >
                            {isShortage ? 'Shortage' : 'Cleared'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Subject-Wise Clearance Report */}
        {activeReportTab === 'subject' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white print:text-black">
              Subject-Wise Comprehensive Attendance Audit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((sub) => {
                const m = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, student.targetPercentage);
                const isShortage = m.alertLevel === 'CRITICAL';
                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-slate-750 print:bg-slate-50 print:border-slate-300 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white print:text-black">{sub.name}</h4>
                        <p className="text-xs text-slate-400 print:text-slate-600">
                          Code: {sub.code} • Faculty: {sub.facultyName || 'Department'}
                        </p>
                      </div>
                      <span
                        className={`text-lg font-black ${
                          m.percentage >= student.targetPercentage
                            ? 'text-emerald-400 print:text-emerald-700'
                            : 'text-rose-400 print:text-rose-700'
                        }`}
                      >
                        {m.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-300 print:text-slate-700 pt-2 border-t border-slate-700 print:border-slate-200">
                      <span>Attended: <strong>{sub.attendedClasses}</strong></span>
                      <span>Absent: <strong>{m.absent}</strong></span>
                      <span>Total Held: <strong>{sub.totalClasses}</strong></span>
                    </div>

                    <div className="text-xs pt-1">
                      {isShortage ? (
                        <span className="text-rose-400 print:text-rose-700 font-bold">
                          ⚠️ Shortage: Must attend {m.classesNeeded} consecutive classes to clear exams.
                        </span>
                      ) : (
                        <span className="text-emerald-400 print:text-emerald-700 font-bold">
                          ✓ Safe: {m.safeBunks} safe bunks permissible before hitting {student.targetPercentage}%.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Daily Attendance Report */}
        {activeReportTab === 'daily' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white print:text-black">
              Daily Attendance History Log ({sortedDailyRecords.length} sessions recorded)
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 print:border-slate-300">
              <table className="w-full text-xs text-left text-slate-300 print:text-black">
                <thead className="bg-slate-800 text-[11px] uppercase tracking-wider text-slate-400 print:bg-slate-200 print:text-slate-800 font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Time Slot</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Topic / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {sortedDailyRecords.map((r) => {
                    const sub = subjects.find((s) => s.id === r.subjectId);
                    return (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-semibold text-white print:text-black">
                          {r.date}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 print:text-slate-600">
                          {r.timeSlot || 'Lecture'}
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {sub?.name || 'Class'} ({sub?.code})
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-500/20 text-emerald-300 print:text-emerald-700'
                                : r.status === 'ABSENT'
                                ? 'bg-rose-500/20 text-rose-300 print:text-rose-700'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 print:text-slate-600">
                          {r.topic || r.remark || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Monthly Summary */}
        {activeReportTab === 'monthly' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white print:text-black">
              Monthly Attendance Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {monthlyList.map((m) => (
                <div
                  key={m.monthKey}
                  className="bg-slate-800/40 p-4 rounded-2xl border border-slate-750 print:bg-slate-50 print:border-slate-300 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white print:text-black">{m.monthName}</span>
                    <span
                      className={`text-sm font-black ${
                        m.percentage >= student.targetPercentage
                          ? 'text-emerald-400 print:text-emerald-700'
                          : 'text-rose-400 print:text-rose-700'
                      }`}
                    >
                      {m.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 print:text-slate-700 pt-2 border-t border-slate-700 print:border-slate-200">
                    <span>Present: <strong className="text-emerald-400">{m.present}</strong></span>
                    <span>Absent: <strong className="text-rose-400">{m.absent}</strong></span>
                    <span>Conducted: <strong className="text-white print:text-black">{m.held}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Analytics & Present vs Absent Statistics */}
        {activeReportTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Present vs. Absent Visual Statistics</span>
            </h3>

            {/* Visual Ratio Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-750 print:bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Overall Ratio Breakdown
                </span>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-3xl font-extrabold text-emerald-400 print:text-emerald-700">
                      {overall.attended}
                    </span>
                    <p className="text-xs text-slate-400">Total Present Classes</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-3xl font-extrabold text-rose-400 print:text-rose-700">
                      {overall.absent}
                    </span>
                    <p className="text-xs text-slate-400">Total Absent Classes</p>
                  </div>
                </div>

                {/* Visual Ratio Bar */}
                <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{
                      width: `${overall.total > 0 ? (overall.attended / overall.total) * 100 : 100}%`,
                    }}
                    title={`Present: ${overall.attended}`}
                  />
                  <div
                    className="bg-rose-500 h-full"
                    style={{
                      width: `${overall.total > 0 ? (overall.absent / overall.total) * 100 : 0}%`,
                    }}
                    title={`Absent: ${overall.absent}`}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">
                    {overall.total > 0 ? ((overall.attended / overall.total) * 100).toFixed(1) : 100}% Attended
                  </span>
                  <span className="text-rose-400 font-bold">
                    {overall.total > 0 ? ((overall.absent / overall.total) * 100).toFixed(1) : 0}% Absent
                  </span>
                </div>
              </div>

              {/* Subject Attendance Distribution Bars */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-750 print:bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Course-Wise Attendance Rates
                </span>
                <div className="space-y-2.5">
                  {subjects.map((sub) => {
                    const pct = sub.totalClasses > 0 ? (sub.attendedClasses / sub.totalClasses) * 100 : 100;
                    return (
                      <div key={sub.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-200 print:text-black truncate">
                            {sub.name}
                          </span>
                          <span
                            className={`font-bold ${
                              pct >= student.targetPercentage ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              pct >= student.targetPercentage ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Official Sign-off & Verification */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 print:text-slate-600 gap-4">
          <p className="max-w-md">
            This document serves as the student's official attendance audit. Minimum required attendance ({student.targetPercentage}%) is mandatory for semester examination hall tickets.
          </p>
          <div className="text-left sm:text-right space-y-1">
            <div className="font-semibold text-slate-300 print:text-black">
              Department Dean / Registrar
            </div>
            <div className="text-[10px] text-slate-500">System Verified</div>
          </div>
        </div>
      </div>
    </div>
  );
};
