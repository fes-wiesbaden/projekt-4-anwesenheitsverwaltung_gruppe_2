import { apiFetch } from "../api/http";
import type { ApiTimetableEntry } from "../types/api";

export interface ClassroomInfo {
  id: number | null;
  classroomName: string;
}

type RawClassroom =
  | string
  | { id?: number | null; classroomName?: string | null };

// Das Backend liefert je nach Stand Strings oder Classroom-Objekte.
export function normalizeClassroom(raw: RawClassroom): ClassroomInfo | null {
  if (typeof raw === "string") {
    return raw ? { id: null, classroomName: raw } : null;
  }
  if (raw && typeof raw.classroomName === "string" && raw.classroomName) {
    return { id: raw.id ?? null, classroomName: raw.classroomName };
  }
  return null;
}

export async function getClassrooms(): Promise<ClassroomInfo[]> {
  const raw = await apiFetch<RawClassroom[]>("/classroom/allClassrooms");
  return raw
    .map(normalizeClassroom)
    .filter((c): c is ClassroomInfo => c !== null);
}

export async function getAvailableClassrooms(): Promise<string[]> {
  const classes = await getClassrooms();
  return classes.map((c) => c.classroomName);
}

export function getTimetable(
  classroomId: number,
): Promise<ApiTimetableEntry[]> {
  return apiFetch<ApiTimetableEntry[]>(
    `/classroom/${classroomId}/timetable`,
  );
}