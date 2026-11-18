export type ApiAttendanceStatus =
  | "ANWESEND"
  | "ABWESEND"
  | "VERSPAETET";

export interface ApiClassroomRef {
  id: number;
  classroomName: string;
}

export interface ApiStudent {
  id: string;
  displayName: string;
  username: string;
  classroom: ApiClassroomRef | null;
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
