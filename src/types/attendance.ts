export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'CANCELLED';

export type AlertLevel = 'SAFE' | 'WARNING' | 'CRITICAL';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

export interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  collegeName: string;
  course: string;
  semester: string;
  targetPercentage: number; // e.g. 75
  warningThreshold?: number; // e.g. 80
  academicYear: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  studentId: string;
  name: string;
  code: string;
  facultyName?: string;
  credits: number;
  totalClasses: number;
  attendedClasses: number;
  color: string;
  targetPercentage?: number; // Subject specific target override if any
  notes?: string;
  updatedAt: string;
}

export interface TimetableEntry {
  id: string;
  studentId: string;
  subjectId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00 AM" or "09:00"
  endTime: string;   // "10:00 AM" or "10:00"
  room?: string;
  faculty?: string;
}

export interface SpecialScheduleItem {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  type: 'EXTRA_CLASS' | 'RESCHEDULED' | 'CANCELLED_CLASS' | 'HOLIDAY';
  subjectId?: string;
  originalTimetableId?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  reason?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  timeSlot?: string;
  timetableEntryId?: string; // Link to scheduled timetable slot
  topic?: string;
  remark?: string;
  createdAt: string;
}

export interface ScheduledClassInstance {
  id: string; // timetableEntryId or specialScheduleId
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  color: string;
  startTime: string;
  endTime: string;
  room?: string;
  faculty?: string;
  dayOfWeek: DayOfWeek;
  date: string; // YYYY-MM-DD
  isExtra?: boolean;
  isRescheduled?: boolean;
  isHoliday?: boolean;
  holidayReason?: string;
  status?: AttendanceStatus; // PRESENT | ABSENT | CANCELLED | undefined (not marked yet)
  attendanceRecordId?: string;
}

export interface BunkCalculationResult {
  total: number;
  attended: number;
  absent: number;
  percentage: number;
  target: number;
  safeBunks: number;
  classesNeeded: number;
  alertLevel: AlertLevel;
  statusLabel: string;
  advice: string;
  isEligible: boolean;
  recoveryProjectedPercentage?: number;
}

export interface WhatIfScenario {
  subjectId: string | 'all';
  attendUpcoming: number;
  missUpcoming: number;
}

export interface WhatIfResult {
  currentPercentage: number;
  projectedPercentage: number;
  delta: number;
  currentAttended: number;
  currentTotal: number;
  projectedAttended: number;
  projectedTotal: number;
  projectedAbsent: number;
  projectedAlertLevel: AlertLevel;
  projectedSafeBunks: number;
  projectedClassesNeeded: number;
  advice: string;
}

export interface MonthlyStats {
  monthKey: string; // YYYY-MM
  monthName: string;
  totalHeld: number;
  attended: number;
  absent: number;
  cancelled: number;
  percentage: number;
}

export interface DatabaseSchema {
  students: Student[];
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  timetableEntries: TimetableEntry[];
  specialSchedules: SpecialScheduleItem[];
}
