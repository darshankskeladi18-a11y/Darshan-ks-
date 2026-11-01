import React, { useState, useEffect } from 'react';
import { Subject, Student, TimetableEntry } from '../types/attendance';
import { simulateWhatIf, calculateBunkMetrics, calculateOverallMetrics } from '../utils/bunkCalculator';
import { 
  Calculator, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  ShieldCheck, 
  Plus, 
  Minus,
  RefreshCw,
  Calendar,
  Clock
} from 'lucide-react';

interface WhatIfCalculatorProps {
  student: Student;
  subjects: Subject[];
  timetableEntries: TimetableEntry[];
  initialSubjectId?: string;
  onNavigateToTab: (tab: string) => void;
}

export const WhatIfCalculator: React.FC<WhatIfCalculatorProps> = ({
  student,
  subjects,
  timetableEntries,
  initialSubjectId,
  onNavigateToTab,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || (subjects.length > 0 ? subjects[0].id : 'all')
  );

  const [attendUpcoming, setAttendUpcoming] = useState<number>(5);
  const [missUpcoming, setMissUpcoming] = useState<number>(0);

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId]);

  // Current stats based on selection
  let currentAttended = 0;
  let currentTotal = 0;
  let currentTarget = student.targetPercentage;
  let subjectName = 'All Subjects (Semester Aggregate)';

  if (selectedSubjectId === 'all') {
    const overall = calculateOverallMetrics(subjects, student.targetPercentage);
    currentAttended = overall.attended;
    currentTotal = overall.total;
    subjectName = 'Overall Semester Average';
  } else {
    const sub = subjects.find((s) => s.id === selectedSubjectId);
    if (sub) {
      currentAttended = sub.attendedClasses;
      currentTotal = sub.totalClasses;
      currentTarget = sub.targetPercentage || student.targetPercentage;
      subjectName = `${sub.name} (${sub.code})`;
    }
  }

  // Count how many classes this subject has per week from the weekly timetable
  const weeklyClassCount = selectedSubjectId === 'all'
    ? timetableEntries.length
    : timetableEntries.filter((t) => t.subjectId === selectedSubjectId).length || 4;

  const result = simulateWhatIf(
    currentAttended,
    currentTotal,
    attendUpcoming,
    missUpcoming,
    currentTarget
  );

  const applyPreset = (attend: number, miss: number) => {
    setAttendUpcoming(attend);
    setMissUpcoming(miss);
  };

  const isProjectedSafe = result.projectedPercentage >= currentTarget;
  const isPositiveDelta = result.delta >= 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart What-If Attendance Prediction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Attendance Scenario Simulator
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Model upcoming attendance situations before classes occur. What if you attend next 5 classes? Or miss next 2? Predict your future percentage against the college minimum requirement.
          </p>
        </div>

        {/* Target Subject Chooser */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Choose Course:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubjectId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedSubjectId === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              All Subjects (Semester Aggregate)
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  selectedSubjectId === sub.id
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {sub.code} • {sub.name.slice(0, 16)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Inputs & Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Upcoming Classes Scenario</span>
              <button
                onClick={() => applyPreset(0, 0)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Reset simulation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </h3>

            {/* Input 1: Upcoming Classes to Attend */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-750 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Upcoming Classes To Attend
                </span>
                <span className="text-xl font-extrabold text-white">+{attendUpcoming}</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setAttendUpcoming((prev) => Math.max(0, prev - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={attendUpcoming}
                  onChange={(e) => setAttendUpcoming(Number(e.target.value))}
                  className="flex-1 accent-emerald-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setAttendUpcoming((prev) => prev + 1)}
                  className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center transition cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Input 2: Upcoming Classes to Miss / Bunk */}
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-750 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Upcoming Classes You May Miss
                </span>
                <span className="text-xl font-extrabold text-rose-400">+{missUpcoming}</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setMissUpcoming((prev) => Math.max(0, prev - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={missUpcoming}
                  onChange={(e) => setMissUpcoming(Number(e.target.value))}
                  className="flex-1 accent-rose-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => setMissUpcoming((prev) => prev + 1)}
                  className="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center transition cursor-pointer shadow-md shadow-rose-600/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prompt Requested Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Simulate Key Situations:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => applyPreset(5, 0)}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left text-xs transition cursor-pointer"
                >
                  <div className="font-bold text-emerald-300">Attend Next 5 Classes</div>
                  <div className="text-[11px] text-slate-400">+5 attend, 0 missed</div>
                </button>

                <button
                  onClick={() => applyPreset(0, 2)}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left text-xs transition cursor-pointer"
                >
                  <div className="font-bold text-rose-300">Miss Next 2 Classes</div>
                  <div className="text-[11px] text-slate-400">+0 attend, 2 missed</div>
                </button>

                <button
                  onClick={() => applyPreset(weeklyClassCount, 0)}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left text-xs transition cursor-pointer"
                >
                  <div className="font-bold text-cyan-300">Attend All Next Week</div>
                  <div className="text-[11px] text-slate-400">+{weeklyClassCount} scheduled classes</div>
                </button>

                <button
                  onClick={() => applyPreset(0, 1)}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left text-xs transition cursor-pointer"
                >
                  <div className="font-bold text-amber-300">Bunk Tomorrow</div>
                  <div className="text-[11px] text-slate-400">+0 attend, 1 missed</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Forecast Results (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Target Course
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
                  {subjectName}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Target Benchmark:</span>
                <span className="text-sm font-extrabold text-cyan-400 ml-1">
                  {currentTarget}%
                </span>
              </div>
            </div>

            {/* Before vs Predicted Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/40 border border-slate-750 rounded-2xl p-4 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Current Attendance
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                  {result.currentPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {result.currentAttended} attended / {result.currentTotal} held
                </div>
              </div>

              <div
                className={`border rounded-2xl p-4 text-center relative overflow-hidden ${
                  isProjectedSafe
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Predicted Attendance
                </span>
                <div
                  className={`text-3xl sm:text-4xl font-black mt-1 ${
                    isProjectedSafe ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {result.projectedPercentage.toFixed(1)}%
                </div>
                <div className="text-xs font-semibold mt-1 flex items-center justify-center gap-1">
                  {isPositiveDelta ? (
                    <span className="text-emerald-400 flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                      +{result.delta}%
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center">
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                      {result.delta}%
                    </span>
                  )}
                  <span className="text-slate-400">net change</span>
                </div>
              </div>
            </div>

            {/* Visual Progress Comparison Bars */}
            <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Current: {result.currentPercentage.toFixed(1)}%</span>
                  <span>Target: {currentTarget}%</span>
                </div>
                <div className="w-full bg-slate-700/60 h-2.5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(100, result.currentPercentage)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                    style={{ left: `${currentTarget}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">
                    Predicted: {result.projectedPercentage.toFixed(1)}%
                  </span>
                  <span className={isProjectedSafe ? 'text-emerald-400' : 'text-rose-400'}>
                    {isProjectedSafe ? 'Safe Zone (≥ 75%)' : 'Shortage Alert (< 75%)'}
                  </span>
                </div>
                <div className="w-full bg-slate-700/60 h-3 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isProjectedSafe ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, result.projectedPercentage)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                    style={{ left: `${currentTarget}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Smart Advice Box */}
            <div
              className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                isProjectedSafe
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              {isProjectedSafe ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">
                  {isProjectedSafe ? 'Permissible Scenario' : 'Risk of Detention!'}
                </h4>
                <p className="text-xs leading-relaxed">{result.advice}</p>
                {isProjectedSafe ? (
                  <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                    ✓ You will retain {result.projectedSafeBunks} safe bunks in reserve.
                  </p>
                ) : (
                  <p className="text-[11px] text-rose-300 font-semibold mt-1">
                    ⚠️ You would need {result.projectedClassesNeeded} consecutive uninterrupted classes to recover!
                  </p>
                )}
              </div>
            </div>

            {/* Before vs After Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="py-2 px-3 rounded-l-lg">Metric</th>
                    <th className="py-2 px-3">Before Simulation</th>
                    <th className="py-2 px-3">After Simulation</th>
                    <th className="py-2 px-3 rounded-r-lg">Net Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Attended Classes</td>
                    <td className="py-2.5 px-3">{result.currentAttended}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{result.projectedAttended}</td>
                    <td className="py-2.5 px-3 text-emerald-400">+{attendUpcoming}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Missed Classes</td>
                    <td className="py-2.5 px-3">{result.currentTotal - result.currentAttended}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-300">{result.projectedAbsent}</td>
                    <td className="py-2.5 px-3 text-rose-400">+{missUpcoming}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Total Classes Conducted</td>
                    <td className="py-2.5 px-3">{result.currentTotal}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{result.projectedTotal}</td>
                    <td className="py-2.5 px-3 text-slate-400">+{attendUpcoming + missUpcoming}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Safe Bunk Cushion</td>
                    <td className="py-2.5 px-3">
                      {Math.max(0, calculateBunkMetrics(result.currentAttended, result.currentTotal, currentTarget).safeBunks)} bunks
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-300">
                      {Math.max(0, result.projectedSafeBunks)} bunks
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {result.projectedSafeBunks - calculateBunkMetrics(result.currentAttended, result.currentTotal, currentTarget).safeBunks}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
