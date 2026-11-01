import { 
  Student, 
  Subject, 
  AttendanceRecord, 
  DatabaseSchema, 
  TimetableEntry, 
  SpecialScheduleItem,
  AttendanceStatus
} from '../types/attendance';

const STORAGE_KEY = 'attendx_offline_data_v2';
const ACTIVE_STUDENT_KEY = 'attendx_active_student_id';

const fallbackStudent: Student = {
  id: 'std_darshan_01',
  name: 'Darshan Keladi',
  email: 'darshan.keladi@college.edu',
  rollNumber: '21CS042',
  collegeName: 'National Institute of Technology & Engineering',
  course: 'B.Tech Computer Science & Engineering',
  semester: '6th Semester',
  targetPercentage: 75,
  warningThreshold: 80,
  academicYear: '2025-2026',
  createdAt: new Date().toISOString(),
};

const fallbackSubjects: Subject[] = [
  {
    id: 'sub_dsa',
    studentId: 'std_darshan_01',
    name: 'Data Structures & Algorithms',
    code: 'CS601',
    facultyName: 'Dr. Ramesh Rao',
    credits: 4,
    totalClasses: 42,
    attendedClasses: 36,
    color: '#10b981',
    updatedAt: new Date().toISOString(),
    notes: 'Mon, Wed, Fri 09:00 AM.',
  },
  {
    id: 'sub_os',
    studentId: 'std_darshan_01',
    name: 'Operating Systems & Concurrency',
    code: 'CS602',
    facultyName: 'Prof. Ananya Sen',
    credits: 4,
    totalClasses: 38,
    attendedClasses: 27,
    color: '#ef4444',
    updatedAt: new Date().toISOString(),
    notes: 'Shortage risk! Must attend upcoming classes.',
  },
  {
    id: 'sub_dbms',
    studentId: 'std_darshan_01',
    name: 'Database Management Systems',
    code: 'CS603',
    facultyName: 'Dr. Vikram Seth',
    credits: 3,
    totalClasses: 36,
    attendedClasses: 28,
    color: '#f59e0b',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sub_cn',
    studentId: 'std_darshan_01',
    name: 'Computer Networks & Security',
    code: 'CS604',
    facultyName: 'Prof. Meera Nair',
    credits: 4,
    totalClasses: 35,
    attendedClasses: 32,
    color: '#06b6d4',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sub_ai',
    studentId: 'std_darshan_01',
    name: 'Artificial Intelligence & Machine Learning',
    code: 'CS605',
    facultyName: 'Dr. Siddharth Joshi',
    credits: 3,
    totalClasses: 30,
    attendedClasses: 22,
    color: '#8b5cf6',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sub_lab',
    studentId: 'std_darshan_01',
    name: 'Cloud & Fullstack Development Lab',
    code: 'CS606L',
    facultyName: 'Prof. Arjun Reddy',
    credits: 2,
    totalClasses: 20,
    attendedClasses: 18,
    color: '#ec4899',
    updatedAt: new Date().toISOString(),
  },
];

const fallbackTimetable: TimetableEntry[] = [
  {
    id: 'tt_mon_1',
    studentId: 'std_darshan_01',
    subjectId: 'sub_dsa',
    dayOfWeek: 'MONDAY',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    room: 'LH-302',
    faculty: 'Dr. Ramesh Rao',
  },
  {
    id: 'tt_mon_2',
    studentId: 'std_darshan_01',
    subjectId: 'sub_os',
    dayOfWeek: 'MONDAY',
    startTime: '10:15 AM',
    endTime: '11:15 AM',
    room: 'LH-302',
    faculty: 'Prof. Ananya Sen',
  },
  {
    id: 'tt_mon_3',
    studentId: 'std_darshan_01',
    subjectId: 'sub_dbms',
    dayOfWeek: 'MONDAY',
    startTime: '11:30 AM',
    endTime: '12:30 PM',
    room: 'LH-204',
    faculty: 'Dr. Vikram Seth',
  },
  {
    id: 'tt_mon_4',
    studentId: 'std_darshan_01',
    subjectId: 'sub_cn',
    dayOfWeek: 'MONDAY',
    startTime: '02:00 PM',
    endTime: '03:00 PM',
    room: 'LH-101',
    faculty: 'Prof. Meera Nair',
  },
  {
    id: 'tt_tue_1',
    studentId: 'std_darshan_01',
    subjectId: 'sub_ai',
    dayOfWeek: 'TUESDAY',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    room: 'LH-302',
    faculty: 'Dr. Siddharth Joshi',
  },
  {
    id: 'tt_tue_2',
    studentId: 'std_darshan_01',
    subjectId: 'sub_os',
    dayOfWeek: 'TUESDAY',
    startTime: '10:15 AM',
    endTime: '11:15 AM',
    room: 'LH-302',
    faculty: 'Prof. Ananya Sen',
  },
  {
    id: 'tt_tue_3',
    studentId: 'std_darshan_01',
    subjectId: 'sub_lab',
    dayOfWeek: 'TUESDAY',
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    room: 'Cloud Lab 2',
    faculty: 'Prof. Arjun Reddy',
  },
];

function getLocalData(): DatabaseSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read from local storage', e);
  }
  return {
    students: [fallbackStudent],
    subjects: fallbackSubjects,
    attendanceRecords: [],
    timetableEntries: fallbackTimetable,
    specialSchedules: [],
  };
}

function saveLocalData(data: DatabaseSchema): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not write to local storage', e);
  }
}

export function getStoredActiveStudentId(): string {
  try {
    return localStorage.getItem(ACTIVE_STUDENT_KEY) || 'std_darshan_01';
  } catch {
    return 'std_darshan_01';
  }
}

export function setStoredActiveStudentId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_STUDENT_KEY, id);
  } catch (e) {
    console.warn(e);
  }
}

export async function fetchStudents(): Promise<Student[]> {
  try {
    const res = await fetch('/api/students');
    if (res.ok) {
      const data = await res.json();
      const local = getLocalData();
      local.students = data;
      saveLocalData(local);
      return data;
    }
  } catch (err) {
    console.warn('Using local fallback for fetchStudents:', err);
  }
  return getLocalData().students;
}

export async function fetchStudentData(
  studentId: string
): Promise<{ 
  student: Student; 
  subjects: Subject[]; 
  records: AttendanceRecord[];
  timetableEntries: TimetableEntry[];
  specialSchedules: SpecialScheduleItem[];
}> {
  try {
    const res = await fetch(`/api/students/${studentId}/data`);
    if (res.ok) {
      const data = await res.json();
      const local = getLocalData();
      local.subjects = local.subjects.filter((s) => s.studentId !== studentId).concat(data.subjects);
      local.attendanceRecords = (local.attendanceRecords || [])
        .filter((r) => r.studentId !== studentId)
        .concat(data.records);
      local.timetableEntries = (local.timetableEntries || [])
        .filter((t) => t.studentId !== studentId)
        .concat(data.timetableEntries || []);
      local.specialSchedules = (local.specialSchedules || [])
        .filter((s) => s.studentId !== studentId)
        .concat(data.specialSchedules || []);
      
      const sIdx = local.students.findIndex((s) => s.id === studentId);
      if (sIdx !== -1) local.students[sIdx] = data.student;
      else local.students.push(data.student);
      saveLocalData(local);
      return data;
    }
  } catch (err) {
    console.warn('API error, falling back to local cache for student data:', err);
  }

  const local = getLocalData();
  const student = local.students.find((s) => s.id === studentId) || fallbackStudent;
  const subjects = local.subjects.filter((s) => s.studentId === studentId);
  const records = (local.attendanceRecords || []).filter((r) => r.studentId === studentId);
  const timetableEntries = (local.timetableEntries || []).filter((t) => t.studentId === studentId);
  const specialSchedules = (local.specialSchedules || []).filter((s) => s.studentId === studentId);
  return { student, subjects, records, timetableEntries, specialSchedules };
}

export async function createStudent(payload: Partial<Student>): Promise<Student> {
  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const student = await res.json();
      const local = getLocalData();
      local.students.push(student);
      saveLocalData(local);
      return student;
    }
  } catch (err) {
    console.warn('Error creating student on server, creating locally:', err);
  }

  const newStudent: Student = {
    id: `std_${Date.now()}`,
    name: payload.name || 'New Student',
    email: payload.email || 'student@college.edu',
    rollNumber: payload.rollNumber || '21CS000',
    collegeName: payload.collegeName || 'Engineering College',
    course: payload.course || 'B.Tech',
    semester: payload.semester || '6th Semester',
    targetPercentage: payload.targetPercentage || 75,
    warningThreshold: 80,
    academicYear: '2025-2026',
    createdAt: new Date().toISOString(),
  };
  const local = getLocalData();
  local.students.push(newStudent);
  saveLocalData(local);
  return newStudent;
}

export async function updateStudentSettings(
  studentId: string,
  updates: Partial<Student>
): Promise<Student> {
  try {
    const res = await fetch(`/api/students/${studentId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const student = await res.json();
      const local = getLocalData();
      const idx = local.students.findIndex((s) => s.id === studentId);
      if (idx !== -1) local.students[idx] = student;
      saveLocalData(local);
      return student;
    }
  } catch (err) {
    console.warn('Offline update for settings:', err);
  }

  const local = getLocalData();
  const idx = local.students.findIndex((s) => s.id === studentId);
  if (idx !== -1) {
    local.students[idx] = { ...local.students[idx], ...updates };
    saveLocalData(local);
    return local.students[idx];
  }
  return { ...fallbackStudent, ...updates };
}

export async function addSubject(
  studentId: string,
  payload: Omit<Subject, 'id' | 'studentId' | 'updatedAt'>
): Promise<Subject> {
  const res = await fetch(`/api/students/${studentId}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Failed to add subject' }));
    throw new Error(errData.error || 'Failed to add subject');
  }

  const created = await res.json();
  const local = getLocalData();
  local.subjects.push(created);
  saveLocalData(local);
  return created;
}

export async function updateSubject(
  studentId: string,
  subjectId: string,
  payload: Partial<Subject>
): Promise<Subject> {
  const res = await fetch(`/api/students/${studentId}/subjects/${subjectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Failed to update subject' }));
    throw new Error(errData.error || 'Failed to update subject');
  }

  const updated = await res.json();
  const local = getLocalData();
  const idx = local.subjects.findIndex((s) => s.id === subjectId);
  if (idx !== -1) local.subjects[idx] = updated;
  saveLocalData(local);
  return updated;
}

export async function deleteSubject(studentId: string, subjectId: string): Promise<void> {
  try {
    await fetch(`/api/students/${studentId}/subjects/${subjectId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Offline delete subject:', err);
  }
  const local = getLocalData();
  local.subjects = local.subjects.filter((s) => s.id !== subjectId);
  local.attendanceRecords = (local.attendanceRecords || []).filter((r) => r.subjectId !== subjectId);
  local.timetableEntries = (local.timetableEntries || []).filter((t) => t.subjectId !== subjectId);
  saveLocalData(local);
}

// Timetable Operations
export async function addTimetableEntry(
  studentId: string,
  payload: Omit<TimetableEntry, 'id' | 'studentId'>
): Promise<TimetableEntry> {
  try {
    const res = await fetch(`/api/students/${studentId}/timetable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const local = getLocalData();
      if (!local.timetableEntries) local.timetableEntries = [];
      local.timetableEntries.push(data);
      saveLocalData(local);
      return data;
    }
  } catch (err) {
    console.warn('Offline add timetable entry:', err);
  }

  const newEntry: TimetableEntry = {
    id: `tt_${Date.now()}`,
    studentId,
    ...payload,
  };
  const local = getLocalData();
  if (!local.timetableEntries) local.timetableEntries = [];
  local.timetableEntries.push(newEntry);
  saveLocalData(local);
  return newEntry;
}

export async function updateTimetableEntry(
  studentId: string,
  entryId: string,
  payload: Partial<TimetableEntry>
): Promise<TimetableEntry> {
  try {
    const res = await fetch(`/api/students/${studentId}/timetable/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const local = getLocalData();
      const idx = (local.timetableEntries || []).findIndex((t) => t.id === entryId);
      if (idx !== -1) local.timetableEntries[idx] = data;
      saveLocalData(local);
      return data;
    }
  } catch (err) {
    console.warn('Offline update timetable entry:', err);
  }

  const local = getLocalData();
  const idx = (local.timetableEntries || []).findIndex((t) => t.id === entryId);
  if (idx !== -1) {
    local.timetableEntries[idx] = { ...local.timetableEntries[idx], ...payload };
    saveLocalData(local);
    return local.timetableEntries[idx];
  }
  throw new Error('Timetable entry not found');
}

export async function deleteTimetableEntry(
  studentId: string,
  entryId: string
): Promise<void> {
  try {
    await fetch(`/api/students/${studentId}/timetable/${entryId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Offline delete timetable entry:', err);
  }
  const local = getLocalData();
  local.timetableEntries = (local.timetableEntries || []).filter((t) => t.id !== entryId);
  saveLocalData(local);
}

// Special Schedules Operations (Holidays, Extra Classes, Reschedules)
export async function addSpecialSchedule(
  studentId: string,
  payload: Omit<SpecialScheduleItem, 'id' | 'studentId' | 'createdAt'>
): Promise<SpecialScheduleItem> {
  try {
    const res = await fetch(`/api/students/${studentId}/special-schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const local = getLocalData();
      if (!local.specialSchedules) local.specialSchedules = [];
      local.specialSchedules.push(data);
      saveLocalData(local);
      return data;
    }
  } catch (err) {
    console.warn('Offline add special schedule:', err);
  }

  const newItem: SpecialScheduleItem = {
    id: `spec_${Date.now()}`,
    studentId,
    ...payload,
    createdAt: new Date().toISOString(),
  };
  const local = getLocalData();
  if (!local.specialSchedules) local.specialSchedules = [];
  local.specialSchedules.push(newItem);
  saveLocalData(local);
  return newItem;
}

export async function deleteSpecialSchedule(
  studentId: string,
  specialId: string
): Promise<void> {
  try {
    await fetch(`/api/students/${studentId}/special-schedules/${specialId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Offline delete special schedule:', err);
  }
  const local = getLocalData();
  local.specialSchedules = (local.specialSchedules || []).filter((s) => s.id !== specialId);
  saveLocalData(local);
}

// Attendance Records Operations
export async function addAttendanceRecord(
  studentId: string,
  payload: { 
    subjectId: string; 
    date: string; 
    status: AttendanceStatus; 
    timeSlot?: string; 
    timetableEntryId?: string;
    topic?: string; 
    remark?: string;
  }
): Promise<{ record: AttendanceRecord; subject?: Subject; updatedExisting?: boolean }> {
  try {
    const res = await fetch(`/api/students/${studentId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const local = getLocalData();
      const existingIdx = (local.attendanceRecords || []).findIndex(
        (r) =>
          r.studentId === studentId &&
          r.date === payload.date &&
          r.subjectId === payload.subjectId &&
          (payload.timetableEntryId ? r.timetableEntryId === payload.timetableEntryId : true)
      );
      if (existingIdx !== -1) {
        local.attendanceRecords[existingIdx] = data.record;
      } else {
        if (!local.attendanceRecords) local.attendanceRecords = [];
        local.attendanceRecords.unshift(data.record);
      }
      if (data.subject) {
        const sIdx = local.subjects.findIndex((s) => s.id === data.subject.id);
        if (sIdx !== -1) local.subjects[sIdx] = data.subject;
      }
      saveLocalData(local);
      return data;
    }
  } catch (err) {
    console.warn('Offline add attendance record:', err);
  }

  const local = getLocalData();
  if (!local.attendanceRecords) local.attendanceRecords = [];

  const existingIdx = local.attendanceRecords.findIndex(
    (r) =>
      r.studentId === studentId &&
      r.date === payload.date &&
      r.subjectId === payload.subjectId &&
      (payload.timetableEntryId ? r.timetableEntryId === payload.timetableEntryId : true)
  );

  let record: AttendanceRecord;
  let updatedExisting = false;

  if (existingIdx !== -1) {
    const old = local.attendanceRecords[existingIdx];
    record = { ...old, ...payload };
    local.attendanceRecords[existingIdx] = record;
    updatedExisting = true;
  } else {
    record = {
      id: `rec_${Date.now()}`,
      studentId,
      subjectId: payload.subjectId,
      date: payload.date,
      status: payload.status,
      timeSlot: payload.timeSlot,
      timetableEntryId: payload.timetableEntryId,
      topic: payload.topic,
      remark: payload.remark,
      createdAt: new Date().toISOString(),
    };
    local.attendanceRecords.unshift(record);
  }

  const sub = local.subjects.find((s) => s.id === payload.subjectId);
  if (sub && !updatedExisting) {
    if (payload.status === 'PRESENT') {
      sub.totalClasses += 1;
      sub.attendedClasses += 1;
    } else if (payload.status === 'ABSENT') {
      sub.totalClasses += 1;
    }
    sub.updatedAt = new Date().toISOString();
  }
  saveLocalData(local);
  return { record, subject: sub, updatedExisting };
}

export async function updateAttendanceRecord(
  studentId: string,
  recordId: string,
  payload: Partial<AttendanceRecord>
): Promise<{ record: AttendanceRecord; subject?: Subject }> {
  try {
    const res = await fetch(`/api/students/${studentId}/attendance/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const local = getLocalData();
      const idx = local.attendanceRecords.findIndex((r) => r.id === recordId);
      if (idx !== -1) local.attendanceRecords[idx] = data.record;
      if (data.subject) {
        const sIdx = local.subjects.findIndex((s) => s.id === data.subject.id);
        if (sIdx !== -1) local.subjects[sIdx] = data.subject;
      }
      saveLocalData(local);
      return data;
    }
  } catch (err) {
    console.warn('Offline update attendance record:', err);
  }

  const local = getLocalData();
  const idx = local.attendanceRecords.findIndex((r) => r.id === recordId);
  if (idx !== -1) {
    local.attendanceRecords[idx] = { ...local.attendanceRecords[idx], ...payload };
    saveLocalData(local);
    const sub = local.subjects.find((s) => s.id === local.attendanceRecords[idx].subjectId);
    return { record: local.attendanceRecords[idx], subject: sub };
  }
  throw new Error('Record not found');
}

export async function deleteAttendanceRecord(
  studentId: string,
  recordId: string
): Promise<{ subject?: Subject }> {
  try {
    const res = await fetch(`/api/students/${studentId}/attendance/${recordId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      const local = getLocalData();
      local.attendanceRecords = local.attendanceRecords.filter((r) => r.id !== recordId);
      if (data.subject) {
        const sIdx = local.subjects.findIndex((s) => s.id === data.subject.id);
        if (sIdx !== -1) local.subjects[sIdx] = data.subject;
      }
      saveLocalData(local);
      return data;
    }
  } catch (err) {
    console.warn('Offline delete attendance record:', err);
  }

  const local = getLocalData();
  const rec = local.attendanceRecords.find((r) => r.id === recordId);
  const sub = rec ? local.subjects.find((s) => s.id === rec.subjectId) : undefined;
  if (sub && rec) {
    if (rec.status === 'PRESENT') {
      sub.totalClasses = Math.max(0, sub.totalClasses - 1);
      sub.attendedClasses = Math.max(0, sub.attendedClasses - 1);
    } else if (rec.status === 'ABSENT') {
      sub.totalClasses = Math.max(0, sub.totalClasses - 1);
    }
  }
  local.attendanceRecords = local.attendanceRecords.filter((r) => r.id !== recordId);
  saveLocalData(local);
  return { subject: sub };
}

export async function resetDatabaseDemo(): Promise<void> {
  try {
    await fetch('/api/reset-demo', { method: 'POST' });
  } catch (err) {
    console.warn('Server reset failed, resetting local storage:', err);
  }
  localStorage.removeItem(STORAGE_KEY);
}
