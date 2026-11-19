
import type {
  ApiAttendanceStatus,
  ApiAttendanceUpdate,
} from "../types/api";

import type {
  AttendanceRow,
  AttendanceStatus,
} from "../types/attendance";

export interface EditFormValues {
  status: Exclude<AttendanceStatus, "NOT_RECORDED">;
  checkIn: string;
  checkOut: string;
  description: string;
}

const STATUS_TO_API: Record<
  EditFormValues["status"],
  ApiAttendanceStatus
> = {
  PRESENT: "ANWESEND",
  LATE: "VERSPAETET",
  ABSENT: "ABWESEND",
};

// Liest HH:mm aus einem ursprünglichen Zeitstempel.
function getTime(
  raw: string | null,
  display: string | null,
): string {
  return (
    raw?.match(/T(\d{2}:\d{2})/)?.[1] ??
    display ??
    ""
  );
}

// Übernimmt vorhandene Werte in das Bearbeitungsformular.
export function toFormValues(
  row: AttendanceRow,
): EditFormValues {
  return {
    status:
      row.status === "NOT_RECORDED"
        ? "ABSENT"
        : row.status,
    checkIn: getTime(row.checkInRaw, row.checkIn),
    checkOut: getTime(row.checkOutRaw, row.checkOut),
    description: row.description ?? "",
  };
}

// Prüft das Uhrzeitformat.
function isValidTime(time: string): boolean {
  const value = time.trim();

  if (value === "") return true;

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// Prüft die Eingaben vor dem Speichern.
export function validateEdit(
  values: EditFormValues,
): string | null {
  const checkIn = values.checkIn.trim();
  const checkOut = values.checkOut.trim();

  if (
    !isValidTime(checkIn) ||
    !isValidTime(checkOut)
  ) {
    return "Bitte Uhrzeiten im Format HH:mm eingeben.";
  }

  if (checkOut !== "" && checkIn === "") {
    return "Für einen Check-out wird ein Check-in benötigt.";
  }

  if (
    checkIn !== "" &&
    checkOut !== "" &&
    checkOut < checkIn
  ) {
    return "Check-out darf nicht vor dem Check-in liegen.";
  }

  return null;
}

// Behält unveränderte Sekunden und Mikrosekunden.
function timeForBackend(
  date: string,
  time: string,
  original: string | null,
): string | null {
  const value = time.trim();

  if (value === "") return null;

  const originalMinute =
    original?.match(/T(\d{2}:\d{2})/)?.[1];

  if (original && originalMinute === value) {
    return original;
  }

  return `${date}T${value}:00`;
}

// Erstellt den vollständigen Request-Body.
export function buildUpdateBody(
  row: AttendanceRow,
  date: string,
  values: EditFormValues,
): ApiAttendanceUpdate {
  if (row.attendanceId === null) {
    throw new Error(
      "Kein Anwesenheitsdatensatz vorhanden.",
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Ungültiges Datum.");
  }

  const error = validateEdit(values);

  if (error) {
    throw new Error(error);
  }

  const description = values.description.trim();

  return {
    checkin: timeForBackend(
      date,
      values.checkIn,
      row.checkInRaw,
    ),
    checkout: timeForBackend(
      date,
      values.checkOut,
      row.checkOutRaw,
    ),
    status: STATUS_TO_API[values.status],
    description:
      description === "" ? null : description,
  };
}
