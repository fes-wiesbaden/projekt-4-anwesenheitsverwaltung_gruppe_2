export type ApiAttendanceStatus =
  | "ANWESEND"
  | "ABWESEND"
  | "VERSPAETET";

export interface ApiClassroomRef {
  id: number;
  classroomName: string;
  room?: {
    id: number;
    roomName: string;
    roomNumber: string;
  } | null;
}

export interface ApiTimetableEntry {
  id: number;
  classroomId: number;
  classroomName: string;
  dayOfWeek: string;
  startTime: string;
  checkoutTime: string;
}

export interface ApiStudent {
  id: string;
  displayName: string;
  username: string;
  classroom: ApiClassroomRef | null;
  rfidChip?: {
    id: string;
    chipId: string;
  } | null;
}

export interface ApiAttendanceRecord {
  id: number;
  studentId: string;
  studentName: string;
  sessionId: number | null;
  date: string;
  status: ApiAttendanceStatus | null;
  checkin: string | null;
  checkout: string | null;
  checkoutReason: string | null;
  checkedOutBy: string | null;
  description: string | null;
}

export interface ApiAttendanceUpdate {
  checkin: string | null;
  checkout: string | null;
  status: ApiAttendanceStatus;
  description: string | null;
}

export interface ApiDashboard {
  totalStudents: number;
  totalClasses: number;
  from: string;
  to: string;
  records: number;
  present: number;
  absent: number;
  lateArrivals: number;
  earlyDepartures: number;
  attendancePercentage: number;
}
