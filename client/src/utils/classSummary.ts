
import type {
  ApiStudent,
  ApiTimetableEntry,
} from "../types/api";

export interface ClassSummary {
  name: string;
  id: number | null;
  roomLabel: string;
  studentCount: number;
}

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABEL: Record<string, string> = {
  MONDAY: "Montag",
  TUESDAY: "Dienstag",
  WEDNESDAY: "Mittwoch",
  THURSDAY: "Donnerstag",
  FRIDAY: "Freitag",
  SATURDAY: "Samstag",
  SUNDAY: "Sonntag",
};

export interface KnownClassData {
  /** Klassen-IDs aus der Klassenliste des Backends (Name -> ID) */
  ids?: Record<string, number>;
  /** Raumbezeichnungen aus der Klassenliste des Backends (Name -> Text) */
  rooms?: Record<string, string>;
}

export function buildClassSummaries(
  names: string[],
  students: ApiStudent[],
  known: KnownClassData = {},
): ClassSummary[] {
  return Array.from(new Set(names))
    .sort((a, b) => a.localeCompare(b, "de"))
    .map((name) => {
      const inClass = students.filter(
        (student) =>
          student.classroom?.classroomName === name,
      );

      const classroom = inClass[0]?.classroom ?? null;
      const room = classroom?.room;

      return {
        name,
        id: known.ids?.[name] ?? classroom?.id ?? null,
        roomLabel:
          known.rooms?.[name] ??
          (room
            ? `${room.roomName} (${room.roomNumber})`
            : "Nicht angegeben"),
        studentCount: inClass.length,
      };
    });
}

export function sortTimetable(
  entries: ApiTimetableEntry[],
): ApiTimetableEntry[] {
  return [...entries].sort(
    (a, b) =>
      DAY_ORDER.indexOf(a.dayOfWeek) -
      DAY_ORDER.indexOf(b.dayOfWeek),
  );
}

export function dayLabel(
  dayOfWeek: string,
): string {
  return DAY_LABEL[dayOfWeek] ?? dayOfWeek;
}

export function formatTimeRange(
  entry: ApiTimetableEntry,
): string {
  const start = entry.startTime.slice(0, 5);
  const end = entry.checkoutTime.slice(0, 5);

  return `${start} – ${end} Uhr`;
}
