import { apiFetch } from "../api/http";
import type { ApiTimetableEntry } from "../types/api";

export async function getAvailableClassrooms(isAdmin: boolean): Promise<string[]> {

  if (isAdmin) {
    return apiFetch<string[]>(
      "/classroom/allClassrooms",
    );
  } else {
    return apiFetch<string[]>(
      "/classroom/my",
    );
  }
}

export function getTimetable(
  classroomId: number,
): Promise<ApiTimetableEntry[]> {
  return apiFetch<ApiTimetableEntry[]>(
    `/classroom/${classroomId}/timetable`,
  );
}
