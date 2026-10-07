export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT";

export interface AttendanceRow {
  id: number;
  studentId: string;
  studentName: string;
  classroom: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
}