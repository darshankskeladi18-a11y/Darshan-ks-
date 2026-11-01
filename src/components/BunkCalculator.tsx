import React, { useState } from 'react';
import { Subject, Student } from '../types/attendance';
import { calculateBunkMetrics, calculateOverallMetrics } from '../utils/bunkCalculator';
import { 
  Calculator, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Sparkles, 
  HelpCircle, 
  Sliders, 
  Calendar,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  Target,
  CheckCircle2,
  RefreshCw,
  Award
} from 'lucide-react';

interface BunkCalculatorProps {
  student: Student;
  subjects: Subject[];
  onUpdateTargetRule: (newTarget: number) => void;
  onNavigateToTab: (tab: string) => void;
  onSelectSubjectForWhatIf: (subjectId: string) => void;
}

export const BunkCalculator: React.FC<BunkCalculatorProps> = ({
  student,
  subjects,
  onUpdateTargetRule,
  onNavigateToTab,
  onSelectSubjectForWhatIf,
}) => {
  const [currentTarget, setCurrentTarget] = useState<number>(student.targetPercentage);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'bunk' | 'recovery' | 'trip'>('bunk');

  // Recovery Interactive Slider for a chosen shortage subject
  const criticalSubjects = subjects.filter((s) => {
    const m = calculateBunkMetrics(s.attendedClasses, s.totalClasses, currentTarget);
    return m.percentage < currentTarget;
  });

  const [selectedRecoverySubId, setSelectedRecoverySubId] = useState<string>(
    criticalSubjects[0]?.id || subjects[0]?.id || ''
  );
  const [interactiveConsecutiveStreak, setInteractiveConsecutiveStreak] = useState<number>(5);

  // Trip / Fest Bunk Planner state
  const [plannedMissClasses, setPlannedMissClasses] = useState<number>(2);

  const overall = calculateOverallMetrics(subjects, currentTarget);

  const handleTargetChange = (val: number) => {
    const clamped = Math.max(1, Math.min(100, val));
    setCurrentTarget(clamped);
    onUpdateTargetRule(clamped);
  };

  const safeSubjects = subjects.filter((s) => {
    const m = calculateBunkMetrics(s.attendedClasses, s.totalClasses, currentTarget);
    return m.percentage >= currentTarget;
  });

  // Selected recovery subject calculation
  const recoveryTargetSub = subjects.find((s) => s.id === selectedRecoverySubId) || subjects[0];
  const recoveryTargetMetrics = recoveryTargetSub
    ? calculateBunkMetrics(recoveryTargetSub.attendedClasses, recoveryTargetSub.totalClasses, currentTarget)
    : null;

  // Recovery projection with interactive slider
  const simulatedNewAttended = (recoveryTargetSub?.attendedClasses || 0) + interactiveConsecutiveStreak;
  const simulatedNewTotal = (recoveryTargetSub?.totalClasses || 0) + interactiveConsecutiveStreak;
  const simulatedNewPercentage = simulatedNewTotal > 0
    ? Number(((simulatedNewAttended / simulatedNewTotal) * 100).toFixed(1))
    : 100;
  const willReachTarget = simulatedNewPercentage >= currentTarget;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Page Title & College Rule Setter */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Intelligent Attendance Math</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bunk Calculator & Attendance Recovery Planner
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Compute your safe bunk allowance or build a personalized recovery roadmap to bring low attendance back above the college required cutoff.
            </p>
          </div>

          {/* Quick Target Percentage Control */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3 w-full lg:w-96">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Required College Rule
              </span>
              <span className="text-lg font-black text-cyan-400">{currentTarget}%</span>
            </div>

            <input
              type="range"
              min={50}
              max={95}
              step={1}
              value={currentTarget}
              onChange={(e) => handleTargetChange(Number(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between gap-1.5">
              {[65, 75, 80, 85].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleTargetChange(preset)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentTarget === preset
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-400 text-center">
              Never displays a negative bunk count.
            </div>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Total Safe Bunks Pool</span>
              <div className="text-2xl font-black text-white">
                {Math.max(
                  0,
                  safeSubjects.reduce((acc, sub) => {
                    const m = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, currentTarget);
                    return acc + m.safeBunks;
                  }, 0)
                )}{' '}
                <span className="text-xs font-normal text-slate-400">classes</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Subjects Above {currentTarget}%</span>
              <div className="text-2xl font-black text-emerald-400">
                {safeSubjects.length}{' '}
                <span className="text-xs font-normal text-slate-400">/ {subjects.length} subjects</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Critical Shortage Alert</span>
              <div className="text-2xl font-black text-rose-400">
                {criticalSubjects.length}{' '}
                <span className="text-xs font-normal text-slate-400">subjects at risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation: Safe Bunks vs Attendance Recovery Planner vs Trip Planner */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('bunk')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'bunk'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Subject Safe Bunks</span>
        </button>

        <button
          onClick={() => setActiveTab('recovery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'recovery'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Attendance Recovery Planner ({criticalSubjects.length} Shortage)</span>
        </button>

        <button
          onClick={() => setActiveTab('trip')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'trip'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Fest & Trip Bunk Simulator</span>
        </button>
      </div>

      {/* Tab 1: Subject Safe Bunks */}
      {activeTab === 'bunk' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Subject-Wise Safe Bunk Allowance</span>
              </h2>
              <p className="text-xs text-slate-400">
                Number of classes you can miss while staying at or above {currentTarget}%.
              </p>
            </div>

            <button
              onClick={() => setShowFormulaModal(!showFormulaModal)}
              className="text-xs text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Calculation Formulas</span>
            </button>
          </div>

          {/* Formula Accordion */}
          {showFormulaModal && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 space-y-3 animate-fadeIn">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>Mathematical Bunk & Catch-up Formulas</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="font-bold text-emerald-400 block mb-1">
                    Safe Bunk Count (when % ≥ Target)
                  </span>
                  <code className="text-[11px] bg-slate-950 px-2 py-1 rounded block text-cyan-300 font-mono mb-2">
                    Safe Bunks = floor((Attended × 100) / Target - Total)
                  </code>
                  <p className="text-slate-400">
                    Never negative. If result &lt; 0, sets to 0.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="font-bold text-rose-400 block mb-1">
                    Consecutive Classes Needed (when % &lt; Target)
                  </span>
                  <code className="text-[11px] bg-slate-950 px-2 py-1 rounded block text-cyan-300 font-mono mb-2">
                    Streak = ceil((Target × Total - 100 × Attended) / (100 - Target))
                  </code>
                  <p className="text-slate-400">
                    Gives minimum consecutive non-missed classes needed to bring attendance back to Target %.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Subject Bunk Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((sub) => {
              const metrics = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, currentTarget);
              const isSafe = metrics.alertLevel === 'SAFE';
              const isWarning = metrics.alertLevel === 'WARNING';
              const isShortage = metrics.alertLevel === 'CRITICAL';

              return (
                <div
                  key={sub.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {sub.code}
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">{sub.name}</h3>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Attended: <strong className="text-white">{sub.attendedClasses}</strong> / {sub.totalClasses} classes
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-lg font-black ${
                            isSafe ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {metrics.percentage.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Rule: {currentTarget}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full ${
                          isSafe ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, metrics.percentage)}%` }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                        style={{ left: `${currentTarget}%` }}
                      />
                    </div>

                    <div className="mt-4 text-center p-4 rounded-xl bg-slate-800/60 border border-slate-750">
                      {isShortage ? (
                        <div>
                          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                            Consecutive Streak Required
                          </span>
                          <div className="text-3xl font-black text-rose-400 mt-1">
                            {metrics.classesNeeded}
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            consecutive classes to hit {metrics.recoveryProjectedPercentage}%
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                            Safe Bunk Limit
                          </span>
                          <div className="text-3xl font-black text-emerald-400 mt-1">
                            {metrics.safeBunks}
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            classes can be safely missed
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-slate-300 text-center leading-relaxed">
                      {metrics.advice}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {metrics.absent} {metrics.absent === 1 ? 'miss' : 'misses'} so far
                    </span>
                    <button
                      onClick={() => {
                        onSelectSubjectForWhatIf(sub.id);
                        onNavigateToTab('what-if');
                      }}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                    >
                      <span>Simulate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: DEDICATED ATTENDANCE RECOVERY PLANNER */}
      {activeTab === 'recovery' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-900 border-2 border-rose-500/40 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-900/40">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">
                    Shortage Recovery Planner
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-200/80">
                    Step-by-step roadmap showing how many consecutive classes you must attend to cross {currentTarget}%.
                  </p>
                </div>
              </div>

              <span className="self-start md:self-auto px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30">
                {criticalSubjects.length} Courses In Danger Zone
              </span>
            </div>

            {criticalSubjects.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">No Attendance Shortages Detected! 🎉</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  All your subjects currently exceed {currentTarget}%. Keep up the good work or test hypothetical recovery scenarios below.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criticalSubjects.map((sub) => {
                  const m = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, currentTarget);
                  return (
                    <div
                      key={sub.id}
                      className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {sub.code}
                            </span>
                            <h4 className="text-base font-bold text-white mt-0.5">{sub.name}</h4>
                            <p className="text-xs text-slate-400">
                              Currently {sub.attendedClasses} attended / {sub.totalClasses} total
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-black text-rose-400">
                              {m.percentage.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Need {currentTarget}%
                            </span>
                          </div>
                        </div>

                        {/* Recovery Plan Card */}
                        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 space-y-2">
                          <div className="font-extrabold text-white flex items-center gap-1.5 text-sm">
                            <Flame className="w-4 h-4 text-rose-400" />
                            <span>Actionable Recovery Target:</span>
                          </div>
                          <p className="leading-relaxed">
                            Attend the next <strong className="text-white font-extrabold text-sm">{m.classesNeeded}</strong> consecutive classes without missing any.
                          </p>
                          <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-xs font-semibold">
                            <span>Predicted % After {m.classesNeeded} Classes:</span>
                            <span className="text-emerald-400 font-bold text-sm">
                              {m.recoveryProjectedPercentage}% (Eligible ✓)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedRecoverySubId(sub.id);
                            setInteractiveConsecutiveStreak(m.classesNeeded);
                          }}
                          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        >
                          Simulate in slider below ↓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Recovery Simulator Slider */}
          {recoveryTargetSub && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <span>Interactive Consecutive Attendance Streak Simulator</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    See how attending consecutive classes progressively boosts your percentage.
                  </p>
                </div>

                {/* Subject Selector */}
                <select
                  value={selectedRecoverySubId}
                  onChange={(e) => setSelectedRecoverySubId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slider & Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-300">
                    Consecutive Classes You Will Attend (0 Misses):
                  </span>
                  <span className="text-xl font-black text-cyan-400">
                    +{interactiveConsecutiveStreak} classes
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={25}
                  value={interactiveConsecutiveStreak}
                  onChange={(e) => setInteractiveConsecutiveStreak(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-750 text-center">
                    <span className="text-[11px] text-slate-400 block font-medium">Starting %</span>
                    <span className="text-2xl font-extrabold text-slate-300 mt-0.5 block">
                      {recoveryTargetMetrics?.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-750 text-center">
                    <span className="text-[11px] text-slate-400 block font-medium">Simulated Attendance</span>
                    <span className="text-2xl font-extrabold text-white mt-0.5 block">
                      {simulatedNewAttended} / {simulatedNewTotal}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border text-center ${
                      willReachTarget
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <span className="text-[11px] font-bold block uppercase tracking-wider">
                      Resulting % ({willReachTarget ? 'Eligible' : 'Shortage'})
                    </span>
                    <span
                      className={`text-2xl font-black mt-0.5 block ${
                        willReachTarget ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {simulatedNewPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Fest & Trip Planner */}
      {activeTab === 'trip' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>Multi-Subject Fest & Vacation Planner</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                "What if I take time off for a college festival or trip?"
              </h3>
              <p className="text-xs text-slate-400">
                Select how many classes you plan to miss across all subjects to test overall survival.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-2xl border border-slate-700">
              <span className="text-xs font-semibold text-slate-300 pl-2">Miss:</span>
              {[1, 2, 3, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setPlannedMissClasses(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    plannedMissClasses === num
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {num} {num === 1 ? 'class' : 'classes'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-xl">Subject</th>
                  <th className="py-2.5 px-3">Current %</th>
                  <th className="py-2.5 px-3">After Missing {plannedMissClasses} Classes</th>
                  <th className="py-2.5 px-3">Predicted Status</th>
                  <th className="py-2.5 px-3 rounded-r-xl">Permissible?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {subjects.map((sub) => {
                  const cur = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, currentTarget);
                  const projectedTotal = sub.totalClasses + plannedMissClasses;
                  const proj = calculateBunkMetrics(sub.attendedClasses, projectedTotal, currentTarget);
                  const diff = (proj.percentage - cur.percentage).toFixed(1);
                  const willSurvive = proj.percentage >= currentTarget;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-white">
                        {sub.name} <span className="text-slate-500 font-normal">({sub.code})</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-200">
                        {cur.percentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 font-bold text-cyan-300">
                        {proj.percentage.toFixed(1)}%{' '}
                        <span className="text-rose-400 text-[11px] font-normal">({diff}%)</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            willSurvive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {willSurvive ? 'Safe' : 'Shortage Threat'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {willSurvive ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Approved (Safe)</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Do NOT Bunk!</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
