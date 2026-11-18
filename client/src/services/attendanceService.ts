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
