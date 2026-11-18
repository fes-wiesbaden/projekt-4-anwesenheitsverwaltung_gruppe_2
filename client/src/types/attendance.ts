export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "NOT_RECORDED";

export interface AttendanceRow {
  id: number;
  studentId: string;
  studentName: string;
  classroom: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;

  // Zusätzliche Daten für das Bearbeiten
  attendanceId: number | null;
  description: string | null;
  checkInRaw: string | null;
  checkOutRaw: string | null;
}
