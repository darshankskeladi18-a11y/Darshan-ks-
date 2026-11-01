import React, { useState } from 'react';
import { Student } from '../types/attendance';
import { 
  GraduationCap, 
  User, 
  Settings, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  student: Student;
  allStudents: Student[];
  onSelectStudent: (id: string) => void;
  onOpenNewStudentModal: () => void;
  onOpenSettingsModal: () => void;
  onResetDemo: () => void;
  overallPercentage: number;
  shortageCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  student,
  allStudents,
  onSelectStudent,
  onOpenNewStudentModal,
  onOpenSettingsModal,
  onResetDemo,
  overallPercentage,
  shortageCount,
}) => {
  const [showStudentMenu, setShowStudentMenu] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md backdrop-blur-md bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & College Info */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/30">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                  Attend<span className="text-cyan-400">X</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  College Bunk & Tracker
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {student.collegeName} • {student.semester}
              </p>
            </div>
          </div>

          {/* Center: Live Target & Rule Badge */}
          <div className="hidden md:flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Target Rule:</span>
            <button
              onClick={onOpenSettingsModal}
              className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all cursor-pointer"
              title="Click to change required attendance percentage"
            >
              <span>{student.targetPercentage}% Required</span>
              <Sliders className="w-3 h-3 text-cyan-400" />
            </button>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400">Overall:</span>
              <span
                className={`font-bold ${
                  overallPercentage >= student.targetPercentage
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {overallPercentage.toFixed(1)}%
              </span>
              {shortageCount > 0 ? (
                <span className="flex items-center text-rose-400 text-[11px] font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 ml-1">
                  <AlertTriangle className="w-3 h-3 mr-0.5" />
                  {shortageCount} Shortage
                </span>
              ) : (
                <span className="flex items-center text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 ml-1">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                  Eligible
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Student Profile & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Target Rule on mobile */}
            <button
              onClick={onOpenSettingsModal}
              className="md:hidden flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-medium"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{student.targetPercentage}%</span>
            </button>

            {/* Profile Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStudentMenu(!showStudentMenu)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-700 transition cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600/40 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/40">
                  {student.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {student.name}
                  </div>
                  <div className="text-[10px] text-slate-400">{student.rollNumber}</div>
                </div>
                <User className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Student Dropdown Menu */}
              {showStudentMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowStudentMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-slate-200">
                    <div className="px-4 py-2 border-b border-slate-700">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Active Student
                      </div>
                      <div className="font-bold text-white text-sm mt-0.5 truncate">{student.name}</div>
                      <div className="text-xs text-indigo-300">{student.course}</div>
                      <div className="text-xs text-slate-400">{student.rollNumber}</div>
                    </div>

                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Student Profile
                    </div>

                    <div className="max-h-40 overflow-y-auto px-1 space-y-1">
                      {allStudents.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onSelectStudent(s.id);
                            setShowStudentMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                            s.id === student.id
                              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                              : 'hover:bg-slate-700/60 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-medium truncate">{s.name}</div>
                            <div className="text-[10px] text-slate-400">{s.rollNumber} • {s.semester}</div>
                          </div>
                          {s.id === student.id && (
                            <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-700 px-2 space-y-1">
                      <button
                        onClick={() => {
                          setShowStudentMenu(false);
                          onOpenNewStudentModal();
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 flex items-center space-x-2 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Add / Switch Student Account</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowStudentMenu(false);
                          onOpenSettingsModal();
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-700/60 flex items-center space-x-2 transition cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Attendance Rules & Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowStudentMenu(false);
                          onResetDemo();
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset To Demo Data</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
