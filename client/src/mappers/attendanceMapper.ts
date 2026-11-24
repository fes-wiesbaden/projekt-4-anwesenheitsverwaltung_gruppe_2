import type {
  ApiAttendanceRecord,
  ApiStudent,
} from "../types/api";

import type {
  AttendanceRow,
  AttendanceStatus,
} from "../types/attendance";

import {
  formatTime,
} from "../utils/time";

function mapStatus(
  record: ApiAttendanceRecord | undefined,
): AttendanceStatus {
  if (!record) {
    return "NOT_RECORDED";
  }

  switch (record.status) {
    case "ANWESEND":
      return "PRESENT";

    case "VERSPAETET":
      return "LATE";

    case "ABWESEND":
      return "ABSENT";

    default:
      return record.checkin
        ? "PRESENT"
        : "NOT_RECORDED";
  }
}

export function buildAttendanceRows(
  students: ApiStudent[],
  records: ApiAttendanceRecord[],
  classroomName: string,
): AttendanceRow[] {
  const latestRecordByStudent =
    new Map<string, ApiAttendanceRecord>();

  for (const record of records) {
    const current = latestRecordByStudent.get(
      record.studentId,
    );

    if (!current || record.id > current.id) {
      latestRecordByStudent.set(
        record.studentId,
        record,
      );
    }
  }

  return students
    .map((student) => {
      const record = latestRecordByStudent.get(
        student.id,
      );

      return {
        studentId: student.id,
        studentName: student.displayName,
        classroom: classroomName,
        status: mapStatus(record),

        checkIn: formatTime(record?.checkin),
        checkOut: formatTime(record?.checkout),

        attendanceId: record?.id ?? null,
        description: record?.description ?? null,
        checkInRaw: record?.checkin ?? null,
        checkOutRaw: record?.checkout ?? null,
      };
    })
    .sort((a, b) =>
      a.studentName.localeCompare(
        b.studentName,
        "de",
      ),
    )
    .map((row, index) => ({
      ...row,
      id: index + 1,
    }));
}


export interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  notRecorded: number;
}

export function computeStats(
  rows: AttendanceRow[],
): AttendanceStats {
  const count = (
    status: AttendanceStatus,
  ) =>
    rows.filter(
      (row) => row.status === status,
    ).length;
  return {
    total: rows.length,
    present: count("PRESENT"),
    late: count("LATE"),
    absent: count("ABSENT"),
    notRecorded: count("NOT_RECORDED"),
  };
}

export function hasNoAttendanceData(
  rows: AttendanceRow[],
): boolean {
  return (
    rows.length > 0 &&
    rows.every(
    (row) => row.status === "NOT_RECORDED",
   )
  );
}

export function formatPercent(
  value: number,
  total: number,
): string {
  if (total === 0) {
    return "0 %";
  }

  return `${(
    (value / total) *
    100
  ).toFixed(1)} %`;
}

