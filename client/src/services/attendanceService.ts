import { apiFetch } from "../api/http";

import type {
  ApiAttendanceRecord,
} from "../types/api";

export function getAttendanceForDay(
  classroomName: string,
  date: string,
): Promise<ApiAttendanceRecord[]> {
  const params = new URLSearchParams({
    classname: classroomName,
    date,
  });

  return apiFetch<ApiAttendanceRecord[]>(
    `/classroom/AttendanceDay?${params.toString()}`,
  );
}

export function checkinStudent(
  studentId: string,
): Promise<string> {
  return apiFetch<string>(
    `/attendance/checkin/${studentId}`,
    {
      method: "POST",
    },
  );
}

export function checkoutStudent(
  studentId: string,
  date: string,
  reason?: string,
): Promise<string> {
  const params = new URLSearchParams({
    date,
  });

  if (reason) {
    params.set("reason", reason);
  }

  return apiFetch<string>(
    `/attendance/student/${studentId}/checkout?${params.toString()}`,
    {
      method: "POST",
    },
  );
}