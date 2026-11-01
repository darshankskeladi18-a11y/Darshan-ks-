import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { 
  DatabaseSchema, 
  Student, 
  Subject, 
  AttendanceRecord, 
  TimetableEntry, 
  SpecialScheduleItem,
  DayOfWeek
} from './src/types/attendance';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data with realistic college courses & weekly timetable
function getInitialSeedData(): DatabaseSchema {
  const defaultStudentId = 'std_darshan_01';
  
  const student: Student = {
    id: defaultStudentId,
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

  const student2: Student = {
    id: 'std_priya_02',
    name: 'Priya Sharma',
    email: 'priya.sharma@college.edu',
    rollNumber: '21EC019',
    collegeName: 'National Institute of Technology & Engineering',
    course: 'B.Tech Electronics & Communication',
    semester: '6th Semester',
    targetPercentage: 75,
    warningThreshold: 80,
    academicYear: '2025-2026',
    createdAt: new Date().toISOString(),
  };

  const subjects: Subject[] = [
    {
      id: 'sub_dsa',
      studentId: defaultStudentId,
      name: 'Data Structures & Algorithms',
      code: 'CS601',
      facultyName: 'Dr. Ramesh Rao',
      credits: 4,
      totalClasses: 42,
      attendedClasses: 36,
      color: '#10b981', // Emerald
      updatedAt: new Date().toISOString(),
      notes: 'Mon, Wed, Fri 09:00 AM. Key focus on Trees & Graphs.',
    },
    {
      id: 'sub_os',
      studentId: defaultStudentId,
      name: 'Operating Systems & Concurrency',
      code: 'CS602',
      facultyName: 'Prof. Ananya Sen',
      credits: 4,
      totalClasses: 38,
      attendedClasses: 27, // 71.1% -> Shortage! (Needs 2 consecutive classes)
      color: '#ef4444', // Red
      updatedAt: new Date().toISOString(),
      notes: 'Strict professor. Requires at least 75% for mid-term exam clearance.',
    },
    {
      id: 'sub_dbms',
      studentId: defaultStudentId,
      name: 'Database Management Systems',
      code: 'CS603',
      facultyName: 'Dr. Vikram Seth',
      credits: 3,
      totalClasses: 36,
      attendedClasses: 28, // 77.8% -> Warning / Borderline
      color: '#f59e0b', // Amber
      updatedAt: new Date().toISOString(),
      notes: 'Tue, Thu 11:30 AM. Query optimization assignments due soon.',
    },
    {
      id: 'sub_cn',
      studentId: defaultStudentId,
      name: 'Computer Networks & Security',
      code: 'CS604',
      facultyName: 'Prof. Meera Nair',
      credits: 4,
      totalClasses: 35,
      attendedClasses: 32, // 91.4% -> Very Safe (7 safe bunks)
      color: '#06b6d4', // Cyan
      updatedAt: new Date().toISOString(),
      notes: 'Excellent attendance buffer. High credit course.',
    },
    {
      id: 'sub_ai',
      studentId: defaultStudentId,
      name: 'Artificial Intelligence & Machine Learning',
      code: 'CS605',
      facultyName: 'Dr. Siddharth Joshi',
      credits: 3,
      totalClasses: 30,
      attendedClasses: 22, // 73.3% -> Shortage! (Needs 2 classes)
      color: '#8b5cf6', // Violet
      updatedAt: new Date().toISOString(),
      notes: 'Needs catch-up. Missed classes during hackathon.',
    },
    {
      id: 'sub_lab',
      studentId: defaultStudentId,
      name: 'Cloud & Fullstack Development Lab',
      code: 'CS606L',
      facultyName: 'Prof. Arjun Reddy',
      credits: 2,
      totalClasses: 20,
      attendedClasses: 18, // 90.0% -> Safe
      color: '#ec4899', // Pink
      updatedAt: new Date().toISOString(),
      notes: 'Practical lab sessions every Tuesday afternoon.',
    },
  ];

  // Subjects for Priya (Student 2)
  const subjectsPriya: Subject[] = [
    {
      id: 'sub_vlsi',
      studentId: 'std_priya_02',
      name: 'VLSI Design & Architecture',
      code: 'EC601',
      facultyName: 'Dr. K. Swaminathan',
      credits: 4,
      totalClasses: 34,
      attendedClasses: 29,
      color: '#3b82f6',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub_dsp',
      studentId: 'std_priya_02',
      name: 'Digital Signal Processing',
      code: 'EC602',
      facultyName: 'Prof. Geetha V.',
      credits: 4,
      totalClasses: 32,
      attendedClasses: 23,
      color: '#ef4444',
      updatedAt: new Date().toISOString(),
    },
  ];

  // Full weekly timetable for Darshan (Monday to Saturday)
  const timetableEntries: TimetableEntry[] = [
    // Monday
    {
      id: 'tt_mon_1',
      studentId: defaultStudentId,
      subjectId: 'sub_dsa',
      dayOfWeek: 'MONDAY',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      room: 'LH-302',
      faculty: 'Dr. Ramesh Rao',
    },
    {
      id: 'tt_mon_2',
      studentId: defaultStudentId,
      subjectId: 'sub_os',
      dayOfWeek: 'MONDAY',
      startTime: '10:15 AM',
      endTime: '11:15 AM',
      room: 'LH-302',
      faculty: 'Prof. Ananya Sen',
    },
    {
      id: 'tt_mon_3',
      studentId: defaultStudentId,
      subjectId: 'sub_dbms',
      dayOfWeek: 'MONDAY',
      startTime: '11:30 AM',
      endTime: '12:30 PM',
      room: 'LH-204',
      faculty: 'Dr. Vikram Seth',
    },
    {
      id: 'tt_mon_4',
      studentId: defaultStudentId,
      subjectId: 'sub_cn',
      dayOfWeek: 'MONDAY',
      startTime: '02:00 PM',
      endTime: '03:00 PM',
      room: 'LH-101',
      faculty: 'Prof. Meera Nair',
    },

    // Tuesday
    {
      id: 'tt_tue_1',
      studentId: defaultStudentId,
      subjectId: 'sub_ai',
      dayOfWeek: 'TUESDAY',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      room: 'LH-302',
      faculty: 'Dr. Siddharth Joshi',
    },
    {
      id: 'tt_tue_2',
      studentId: defaultStudentId,
      subjectId: 'sub_os',
      dayOfWeek: 'TUESDAY',
      startTime: '10:15 AM',
      endTime: '11:15 AM',
      room: 'LH-302',
      faculty: 'Prof. Ananya Sen',
    },
    {
      id: 'tt_tue_3',
      studentId: defaultStudentId,
      subjectId: 'sub_lab',
      dayOfWeek: 'TUESDAY',
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      room: 'Cloud Lab 2',
      faculty: 'Prof. Arjun Reddy',
    },

    // Wednesday
    {
      id: 'tt_wed_1',
      studentId: defaultStudentId,
      subjectId: 'sub_dbms',
      dayOfWeek: 'WEDNESDAY',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      room: 'LH-204',
      faculty: 'Dr. Vikram Seth',
    },
    {
      id: 'tt_wed_2',
      studentId: defaultStudentId,
      subjectId: 'sub_cn',
      dayOfWeek: 'WEDNESDAY',
      startTime: '10:15 AM',
      endTime: '11:15 AM',
      room: 'LH-101',
      faculty: 'Prof. Meera Nair',
    },
    {
      id: 'tt_wed_3',
      studentId: defaultStudentId,
      subjectId: 'sub_dsa',
      dayOfWeek: 'WEDNESDAY',
      startTime: '11:30 AM',
      endTime: '12:30 PM',
      room: 'LH-302',
      faculty: 'Dr. Ramesh Rao',
    },

    // Thursday
    {
      id: 'tt_thu_1',
      studentId: defaultStudentId,
      subjectId: 'sub_os',
      dayOfWeek: 'THURSDAY',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      room: 'LH-302',
      faculty: 'Prof. Ananya Sen',
    },
    {
      id: 'tt_thu_2',
      studentId: defaultStudentId,
      subjectId: 'sub_dsa',
      dayOfWeek: 'THURSDAY',
      startTime: '10:15 AM',
      endTime: '11:15 AM',
      room: 'LH-302',
      faculty: 'Dr. Ramesh Rao',
    },
    {
      id: 'tt_thu_3',
      studentId: defaultStudentId,
      subjectId: 'sub_dbms',
      dayOfWeek: 'THURSDAY',
      startTime: '11:30 AM',
      endTime: '12:30 PM',
      room: 'LH-204',
      faculty: 'Dr. Vikram Seth',
    },

    // Friday
    {
      id: 'tt_fri_1',
      studentId: defaultStudentId,
      subjectId: 'sub_cn',
      dayOfWeek: 'FRIDAY',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      room: 'LH-101',
      faculty: 'Prof. Meera Nair',
    },
    {
      id: 'tt_fri_2',
      studentId: defaultStudentId,
      subjectId: 'sub_ai',
      dayOfWeek: 'FRIDAY',
      startTime: '10:15 AM',
      endTime: '11:15 AM',
      room: 'LH-302',
      faculty: 'Dr. Siddharth Joshi',
    },
    {
      id: 'tt_fri_3',
      studentId: defaultStudentId,
      subjectId: 'sub_os',
      dayOfWeek: 'FRIDAY',
      startTime: '11:30 AM',
      endTime: '12:30 PM',
      room: 'LH-302',
      faculty: 'Prof. Ananya Sen',
    },

    // Saturday
    {
      id: 'tt_sat_1',
      studentId: defaultStudentId,
      subjectId: 'sub_ai',
      dayOfWeek: 'SATURDAY',
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      room: 'Seminar Hall B',
      faculty: 'Dr. Siddharth Joshi',
    },
  ];

  // Special schedule exceptions (e.g. extra classes or holidays)
  const specialSchedules: SpecialScheduleItem[] = [
    {
      id: 'spec_01',
      studentId: defaultStudentId,
      date: '2026-11-05',
      type: 'EXTRA_CLASS',
      subjectId: 'sub_os',
      startTime: '03:00 PM',
      endTime: '04:30 PM',
      room: 'LH-302',
      reason: 'Extra remedial session for Concurrency & Deadlocks',
      createdAt: new Date().toISOString(),
    },
  ];

  // Realistic sample history logs for Darshan
  const records: AttendanceRecord[] = [
    {
      id: 'rec_01',
      studentId: defaultStudentId,
      subjectId: 'sub_dsa',
      timetableEntryId: 'tt_mon_1',
      date: '2026-10-31',
      status: 'PRESENT',
      timeSlot: '10:00 AM - 11:00 AM',
      topic: 'Dynamic Programming - Bellman Ford',
      remark: 'Interactive session',
      createdAt: '2026-10-31T10:05:00.000Z',
    },
    {
      id: 'rec_02',
      studentId: defaultStudentId,
      subjectId: 'sub_os',
      timetableEntryId: 'tt_mon_2',
      date: '2026-10-31',
      status: 'ABSENT',
      timeSlot: '11:15 AM - 12:15 PM',
      topic: 'Virtual Memory & Page Replacement',
      remark: 'Doctor appointment',
      createdAt: '2026-10-31T11:20:00.000Z',
    },
    {
      id: 'rec_03',
      studentId: defaultStudentId,
      subjectId: 'sub_dbms',
      date: '2026-10-30',
      status: 'PRESENT',
      timeSlot: '02:00 PM - 03:00 PM',
      topic: 'B+ Tree Indexing implementation',
      remark: 'Attended on time',
      createdAt: '2026-10-30T14:02:00.000Z',
    },
    {
      id: 'rec_04',
      studentId: defaultStudentId,
      subjectId: 'sub_cn',
      date: '2026-10-30',
      status: 'PRESENT',
      timeSlot: '03:15 PM - 04:15 PM',
      topic: 'TCP Congestion Control - Tahoe & Reno',
      remark: 'Full class present',
      createdAt: '2026-10-30T15:18:00.000Z',
    },
    {
      id: 'rec_05',
      studentId: defaultStudentId,
      subjectId: 'sub_ai',
      date: '2026-10-29',
      status: 'ABSENT',
      timeSlot: '09:00 AM - 10:00 AM',
      topic: 'Convolutional Neural Networks',
      remark: 'College cultural fest prep',
      createdAt: '2026-10-29T09:10:00.000Z',
    },
    {
      id: 'rec_06',
      studentId: defaultStudentId,
      subjectId: 'sub_lab',
      date: '2026-10-29',
      status: 'PRESENT',
      timeSlot: '02:00 PM - 05:00 PM',
      topic: 'REST API & Vite Deployment Lab',
      remark: 'Completed practical assignment',
      createdAt: '2026-10-29T14:15:00.000Z',
    },
    {
      id: 'rec_07',
      studentId: defaultStudentId,
      subjectId: 'sub_os',
      date: '2026-10-28',
      status: 'CANCELLED',
      timeSlot: '11:15 AM - 12:15 PM',
      topic: 'Deadlock detection',
      remark: 'Faculty attended international conference',
      createdAt: '2026-10-28T11:00:00.000Z',
    },
    {
      id: 'rec_08',
      studentId: defaultStudentId,
      subjectId: 'sub_dsa',
      date: '2026-10-27',
      status: 'PRESENT',
      timeSlot: '10:00 AM - 11:00 AM',
      topic: 'Graph Algorithms - Dijkstra and Prim',
      remark: 'Good concept clarity',
      createdAt: '2026-10-27T10:05:00.000Z',
    },
  ];

  return {
    students: [student, student2],
    subjects: [...subjects, ...subjectsPriya],
    attendanceRecords: records,
    timetableEntries,
    specialSchedules,
  };
}

// Database helper
class FileDatabase {
  public data: DatabaseSchema;

  constructor() {
    this.data = this.readDb();
  }

  private readDb(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content) as DatabaseSchema;
        // Backwards compatibility migration
        if (!parsed.timetableEntries || parsed.timetableEntries.length === 0) {
          const seed = getInitialSeedData();
          parsed.timetableEntries = seed.timetableEntries;
        }
        if (!parsed.specialSchedules) {
          parsed.specialSchedules = [];
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error reading database file, resetting to initial seed:', err);
    }
    const seed = getInitialSeedData();
    this.saveDb(seed);
    return seed;
  }

  public saveDb(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.data = data;
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public resetToDefault(): DatabaseSchema {
    const seed = getInitialSeedData();
    this.saveDb(seed);
    return seed;
  }

  // Student methods
  public getStudents(): Student[] {
    return this.data.students || [];
  }

  public getStudent(id: string): Student | undefined {
    return this.data.students.find((s) => s.id === id);
  }

  public addStudent(student: Student): Student {
    this.data.students.push(student);
    this.saveDb(this.data);
    return student;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | null {
    const idx = this.data.students.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data.students[idx] = { ...this.data.students[idx], ...updates };
    this.saveDb(this.data);
    return this.data.students[idx];
  }

  // Subject methods
  public getSubjects(studentId: string): Subject[] {
    return (this.data.subjects || []).filter((s) => s.studentId === studentId);
  }

  public addSubject(subject: Subject): Subject {
    this.data.subjects.push(subject);
    this.saveDb(this.data);
    return subject;
  }

  public updateSubject(id: string, updates: Partial<Subject>): Subject | null {
    const idx = this.data.subjects.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data.subjects[idx] = {
      ...this.data.subjects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveDb(this.data);
    return this.data.subjects[idx];
  }

  public deleteSubject(id: string): boolean {
    const initialLen = this.data.subjects.length;
    this.data.subjects = this.data.subjects.filter((s) => s.id !== id);
    // Also delete associated attendance records & timetable entries
    this.data.attendanceRecords = (this.data.attendanceRecords || []).filter((r) => r.subjectId !== id);
    this.data.timetableEntries = (this.data.timetableEntries || []).filter((t) => t.subjectId !== id);
    this.saveDb(this.data);
    return this.data.subjects.length < initialLen;
  }

  // Attendance Records
  public getAttendanceRecords(studentId: string): AttendanceRecord[] {
    return (this.data.attendanceRecords || [])
      .filter((r) => r.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public addAttendanceRecord(record: AttendanceRecord, updateSubjectCounters = true): AttendanceRecord {
    if (!this.data.attendanceRecords) this.data.attendanceRecords = [];
    this.data.attendanceRecords.unshift(record);
    if (updateSubjectCounters) {
      const subject = this.data.subjects.find((s) => s.id === record.subjectId);
      if (subject) {
        if (record.status === 'PRESENT') {
          subject.totalClasses += 1;
          subject.attendedClasses += 1;
        } else if (record.status === 'ABSENT') {
          subject.totalClasses += 1;
        }
        // CANCELLED does not increment total held classes
        subject.updatedAt = new Date().toISOString();
      }
    }
    this.saveDb(this.data);
    return record;
  }

  public updateAttendanceRecord(
    id: string,
    updates: Partial<AttendanceRecord>
  ): AttendanceRecord | null {
    const idx = this.data.attendanceRecords.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const oldRecord = this.data.attendanceRecords[idx];
    const newRecord = { ...oldRecord, ...updates };

    // Adjust subject counters if status or subject changed
    if (oldRecord.status !== newRecord.status || oldRecord.subjectId !== newRecord.subjectId) {
      // Revert old
      const oldSub = this.data.subjects.find((s) => s.id === oldRecord.subjectId);
      if (oldSub) {
        if (oldRecord.status === 'PRESENT') {
          oldSub.totalClasses = Math.max(0, oldSub.totalClasses - 1);
          oldSub.attendedClasses = Math.max(0, oldSub.attendedClasses - 1);
        } else if (oldRecord.status === 'ABSENT') {
          oldSub.totalClasses = Math.max(0, oldSub.totalClasses - 1);
        }
      }
      // Apply new
      const newSub = this.data.subjects.find((s) => s.id === newRecord.subjectId);
      if (newSub) {
        if (newRecord.status === 'PRESENT') {
          newSub.totalClasses += 1;
          newSub.attendedClasses += 1;
        } else if (newRecord.status === 'ABSENT') {
          newSub.totalClasses += 1;
        }
        // CANCELLED does not count towards total classes
      }
    }

    this.data.attendanceRecords[idx] = newRecord;
    this.saveDb(this.data);
    return newRecord;
  }

  public deleteAttendanceRecord(id: string): boolean {
    const record = this.data.attendanceRecords.find((r) => r.id === id);
    if (!record) return false;

    // Deduct from subject counters
    const subject = this.data.subjects.find((s) => s.id === record.subjectId);
    if (subject) {
      if (record.status === 'PRESENT') {
        subject.totalClasses = Math.max(0, subject.totalClasses - 1);
        subject.attendedClasses = Math.max(0, subject.attendedClasses - 1);
      } else if (record.status === 'ABSENT') {
        subject.totalClasses = Math.max(0, subject.totalClasses - 1);
      }
      subject.updatedAt = new Date().toISOString();
    }

    this.data.attendanceRecords = this.data.attendanceRecords.filter((r) => r.id !== id);
    this.saveDb(this.data);
    return true;
  }

  // Timetable Entries
  public getTimetable(studentId: string): TimetableEntry[] {
    return (this.data.timetableEntries || []).filter((t) => t.studentId === studentId);
  }

  public addTimetableEntry(entry: TimetableEntry): TimetableEntry {
    if (!this.data.timetableEntries) this.data.timetableEntries = [];
    this.data.timetableEntries.push(entry);
    this.saveDb(this.data);
    return entry;
  }

  public updateTimetableEntry(id: string, updates: Partial<TimetableEntry>): TimetableEntry | null {
    if (!this.data.timetableEntries) this.data.timetableEntries = [];
    const idx = this.data.timetableEntries.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.data.timetableEntries[idx] = { ...this.data.timetableEntries[idx], ...updates };
    this.saveDb(this.data);
    return this.data.timetableEntries[idx];
  }

  public deleteTimetableEntry(id: string): boolean {
    if (!this.data.timetableEntries) return false;
    const initialLen = this.data.timetableEntries.length;
    // Important: Changing or deleting timetable entries does NOT delete or modify historical attendance!
    this.data.timetableEntries = this.data.timetableEntries.filter((t) => t.id !== id);
    this.saveDb(this.data);
    return this.data.timetableEntries.length < initialLen;
  }

  // Special Schedules (Holidays, Extra classes, etc.)
  public getSpecialSchedules(studentId: string): SpecialScheduleItem[] {
    return (this.data.specialSchedules || []).filter((s) => s.studentId === studentId);
  }

  public addSpecialSchedule(item: SpecialScheduleItem): SpecialScheduleItem {
    if (!this.data.specialSchedules) this.data.specialSchedules = [];
    this.data.specialSchedules.push(item);
    this.saveDb(this.data);
    return item;
  }

  public deleteSpecialSchedule(id: string): boolean {
    if (!this.data.specialSchedules) return false;
    const initialLen = this.data.specialSchedules.length;
    this.data.specialSchedules = this.data.specialSchedules.filter((s) => s.id !== id);
    this.saveDb(this.data);
    return this.data.specialSchedules.length < initialLen;
  }
}

const db = new FileDatabase();

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all students
  app.get('/api/students', (_req: Request, res: Response) => {
    res.json(db.getStudents());
  });

  // Create student
  app.post('/api/students', (req: Request, res: Response) => {
    const { name, rollNumber, collegeName, course, semester, targetPercentage } = req.body;
    if (!name || !rollNumber) {
      res.status(400).json({ error: 'Name and Roll Number are required' });
      return;
    }
    const newStudent: Student = {
      id: `std_${Date.now()}`,
      name,
      email: req.body.email || `${name.toLowerCase().replace(/\s+/g, '.')}@college.edu`,
      rollNumber,
      collegeName: collegeName || 'College of Engineering & Technology',
      course: course || 'B.Tech Engineering',
      semester: semester || '6th Semester',
      targetPercentage: Number(targetPercentage) || 75,
      warningThreshold: 80,
      academicYear: '2025-2026',
      createdAt: new Date().toISOString(),
    };
    db.addStudent(newStudent);
    res.status(201).json(newStudent);
  });

  // Get full data bundle for active student
  app.get('/api/students/:id/data', (req: Request, res: Response) => {
    const { id } = req.params;
    const student = db.getStudent(id);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    const subjects = db.getSubjects(id);
    const records = db.getAttendanceRecords(id);
    const timetableEntries = db.getTimetable(id);
    const specialSchedules = db.getSpecialSchedules(id);
    res.json({
      student,
      subjects,
      records,
      timetableEntries,
      specialSchedules,
    });
  });

  // Update student settings (target % etc.)
  app.put('/api/students/:id/settings', (req: Request, res: Response) => {
    const { id } = req.params;
    const student = db.updateStudent(id, req.body);
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    res.json(student);
  });

  // Subject routes
  app.post('/api/students/:id/subjects', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, code, credits, totalClasses, attendedClasses, facultyName, color, notes } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Subject name is required' });
      return;
    }

    // Prevent duplicate subjects for this student
    const trimmedName = name.trim().toLowerCase();
    const trimmedCode = code ? code.trim().toLowerCase() : '';
    const existing = db.getSubjects(id).find(
      (s) =>
        s.name.trim().toLowerCase() === trimmedName ||
        (trimmedCode && s.code && s.code.trim().toLowerCase() === trimmedCode)
    );
    if (existing) {
      res.status(400).json({
        error: `A subject with name "${existing.name}" or code "${existing.code}" already exists for this student.`,
      });
      return;
    }

    const total = Math.max(0, Number(totalClasses) || 0);
    const attended = Math.max(0, Number(attendedClasses) || 0);

    if (attended > total) {
      res.status(400).json({ error: 'Attended classes cannot exceed total classes' });
      return;
    }

    const newSubject: Subject = {
      id: `sub_${Date.now()}`,
      studentId: id,
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : `SUB${Math.floor(100 + Math.random() * 900)}`,
      facultyName: facultyName?.trim() || 'Faculty',
      credits: Number(credits) || 3,
      totalClasses: total,
      attendedClasses: attended,
      color: color || '#3b82f6',
      notes: notes?.trim() || '',
      updatedAt: new Date().toISOString(),
    };

    const created = db.addSubject(newSubject);
    res.status(201).json(created);
  });

  app.put('/api/students/:id/subjects/:subId', (req: Request, res: Response) => {
    const { id, subId } = req.params;
    const { name, code, totalClasses, attendedClasses } = req.body;

    if (name) {
      const trimmedName = name.trim().toLowerCase();
      const trimmedCode = code ? code.trim().toLowerCase() : '';
      const duplicate = db.getSubjects(id).find(
        (s) =>
          s.id !== subId &&
          (s.name.trim().toLowerCase() === trimmedName ||
            (trimmedCode && s.code && s.code.trim().toLowerCase() === trimmedCode))
      );
      if (duplicate) {
        res.status(400).json({
          error: `Another subject with name "${duplicate.name}" or code "${duplicate.code}" already exists.`,
        });
        return;
      }
    }

    if (totalClasses !== undefined && attendedClasses !== undefined) {
      if (Number(attendedClasses) > Number(totalClasses)) {
        res.status(400).json({ error: 'Attended classes cannot exceed total classes' });
        return;
      }
    }

    const updated = db.updateSubject(subId, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/students/:id/subjects/:subId', (req: Request, res: Response) => {
    const { subId } = req.params;
    const success = db.deleteSubject(subId);
    if (!success) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }
    res.json({ message: 'Subject deleted successfully' });
  });

  // Timetable Routes
  app.get('/api/students/:id/timetable', (req: Request, res: Response) => {
    const { id } = req.params;
    res.json(db.getTimetable(id));
  });

  app.post('/api/students/:id/timetable', (req: Request, res: Response) => {
    const { id } = req.params;
    const { subjectId, dayOfWeek, startTime, endTime, room, faculty } = req.body;

    if (!subjectId || !dayOfWeek || !startTime || !endTime) {
      res.status(400).json({ error: 'subjectId, dayOfWeek, startTime, and endTime are required' });
      return;
    }

    const newEntry: TimetableEntry = {
      id: `tt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      studentId: id,
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room: room || '',
      faculty: faculty || '',
    };

    const saved = db.addTimetableEntry(newEntry);
    res.status(201).json(saved);
  });

  app.put('/api/students/:id/timetable/:entryId', (req: Request, res: Response) => {
    const { entryId } = req.params;
    const updated = db.updateTimetableEntry(entryId, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Timetable entry not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/students/:id/timetable/:entryId', (req: Request, res: Response) => {
    const { entryId } = req.params;
    const success = db.deleteTimetableEntry(entryId);
    if (!success) {
      res.status(404).json({ error: 'Timetable entry not found' });
      return;
    }
    res.json({ message: 'Timetable entry deleted successfully' });
  });

  // Special Schedules Routes (Holidays, Extra classes, etc.)
  app.get('/api/students/:id/special-schedules', (req: Request, res: Response) => {
    const { id } = req.params;
    res.json(db.getSpecialSchedules(id));
  });

  app.post('/api/students/:id/special-schedules', (req: Request, res: Response) => {
    const { id } = req.params;
    const { date, type, subjectId, startTime, endTime, room, reason, originalTimetableId } = req.body;

    if (!date || !type) {
      res.status(400).json({ error: 'date and type are required' });
      return;
    }

    const newItem: SpecialScheduleItem = {
      id: `spec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      studentId: id,
      date,
      type,
      subjectId: subjectId || undefined,
      originalTimetableId: originalTimetableId || undefined,
      startTime: startTime || '',
      endTime: endTime || '',
      room: room || '',
      reason: reason || '',
      createdAt: new Date().toISOString(),
    };

    const saved = db.addSpecialSchedule(newItem);
    res.status(201).json(saved);
  });

  app.delete('/api/students/:id/special-schedules/:specialId', (req: Request, res: Response) => {
    const { specialId } = req.params;
    const success = db.deleteSpecialSchedule(specialId);
    if (!success) {
      res.status(404).json({ error: 'Special schedule item not found' });
      return;
    }
    res.json({ message: 'Special schedule item deleted' });
  });

  // Attendance history routes (with duplicate prevention for scheduled classes)
  app.post('/api/students/:id/attendance', (req: Request, res: Response) => {
    const { id } = req.params;
    const { subjectId, date, status, timeSlot, topic, remark, timetableEntryId } = req.body;

    if (!subjectId || !date || !status) {
      res.status(400).json({ error: 'subjectId, date, and status are required' });
      return;
    }

    // Check for existing attendance record for the same scheduled class on this date to prevent duplicates
    const existing = db.data.attendanceRecords.find(
      (r) =>
        r.studentId === id &&
        r.date === date &&
        r.subjectId === subjectId &&
        (timetableEntryId ? r.timetableEntryId === timetableEntryId : true)
    );

    if (existing) {
      // Update existing record rather than creating a duplicate!
      const updated = db.updateAttendanceRecord(existing.id, {
        status,
        timeSlot: timeSlot || existing.timeSlot,
        topic: topic !== undefined ? topic : existing.topic,
        remark: remark !== undefined ? remark : existing.remark,
      });
      const updatedSubject = db.data.subjects.find((s) => s.id === subjectId);
      res.json({ record: updated, subject: updatedSubject, updatedExisting: true });
      return;
    }

    const newRecord: AttendanceRecord = {
      id: `rec_${Date.now()}`,
      studentId: id,
      subjectId,
      date,
      status,
      timeSlot: timeSlot || '',
      timetableEntryId: timetableEntryId || undefined,
      topic: topic || '',
      remark: remark || '',
      createdAt: new Date().toISOString(),
    };

    const saved = db.addAttendanceRecord(newRecord);
    const updatedSubject = db.data.subjects.find((s) => s.id === subjectId);
    res.status(201).json({ record: saved, subject: updatedSubject });
  });

  app.put('/api/students/:id/attendance/:recId', (req: Request, res: Response) => {
    const { recId } = req.params;
    const updated = db.updateAttendanceRecord(recId, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }
    const updatedSubject = db.data.subjects.find((s) => s.id === updated.subjectId);
    res.json({ record: updated, subject: updatedSubject });
  });

  app.delete('/api/students/:id/attendance/:recId', (req: Request, res: Response) => {
    const { recId } = req.params;
    const record = db.data.attendanceRecords.find((r) => r.id === recId);
    const subjectId = record?.subjectId;
    const success = db.deleteAttendanceRecord(recId);
    if (!success) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }
    const updatedSubject = subjectId ? db.data.subjects.find((s) => s.id === subjectId) : null;
    res.json({ message: 'Attendance record deleted', subject: updatedSubject });
  });

  // Reset to demo data
  app.post('/api/reset-demo', (_req: Request, res: Response) => {
    const data = db.resetToDefault();
    res.json({ message: 'Database reset to demo state', data });
  });

  // Dev server with Vite middleware or static dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Attendance Tracker running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
