import { apiFetch } from "../api/http";
import type { ApiTimetableEntry } from "../types/api";

export interface ClassroomInfo {
  id: number | null;
  classroomName: string;
  /** z. B. "Klassenraum 101 (R101)", nur wenn das Backend den Raum mitliefert */
  roomLabel?: string;
}

type RawClassroom =
  | string
  | {
      id?: number | null;
      classroomName?: string | null;
      room?: {
        roomName?: string | null;
        roomNumber?: string | null;
      } | null;
    };

// Das Backend liefert je nach Stand Strings oder Classroom-Objekte.
export function normalizeClassroom(
  raw: RawClassroom,
): ClassroomInfo | null {
  if (typeof raw === "string") {
    return raw ? { id: null, classroomName: raw } : null;
  }

  if (
    raw &&
    typeof raw.classroomName === "string" &&
    raw.classroomName
  ) {
    const room = raw.room;

    const roomLabel = room?.roomName
      ? room.roomNumber
        ? `${room.roomName} (${room.roomNumber})`
        : room.roomName
      : undefined;

    return {
      id: raw.id ?? null,
      classroomName: raw.classroomName,
      ...(roomLabel ? { roomLabel } : {}),
    };
  }

  return null;
}

export async function getClassrooms(): Promise<ClassroomInfo[]> {
  const raw = await apiFetch<RawClassroom[]>(
    "/classroom/allClassrooms",
  );

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
