import { apiFetch } from "../api/http";
import type { ApiTimetableEntry } from "../types/api";

export async function getAvailableClassrooms(): Promise<string[]> {
  return apiFetch<string[]>(
    "/classroom/allClassrooms",
  );
}

export function getTimetable(
  classroomId: number,
): Promise<ApiTimetableEntry[]> {
  return apiFetch<ApiTimetableEntry[]>(
    `/classroom/${classroomId}/timetable`,
  );
}
