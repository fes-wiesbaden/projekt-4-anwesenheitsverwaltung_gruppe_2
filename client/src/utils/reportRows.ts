
import type {
  ApiAttendanceStatus,
  ApiReportRow,
} from "../types/api";

import type {
  AttendanceStatus,
} from "../types/attendance";

import { formatTime } from "./time";

export type ReportPreset =
  | "today"
  | "week"
  | "month"
  | "custom";

export interface ReportRow {
  id: number;
  date: string;
  dateLabel: string;
  studentName: string;
  className: string;
  status: AttendanceStatus;
  statusLabel: string;
  checkIn: string | null;
  checkOut: string | null;
  reason: string | null;
}

const STATUS_MAP: Record<
  ApiAttendanceStatus,
  AttendanceStatus
> = {
  ANWESEND: "PRESENT",
  VERSPAETET: "LATE",
  ABWESEND: "ABSENT",
};

const STATUS_LABEL: Record<
  AttendanceStatus,
  string
> = {
  PRESENT: "Anwesend",
  LATE: "Verspätet",
  ABSENT: "Abwesend",
  NOT_RECORDED: "Nicht erfasst",
};

const REASON_LABEL: Record<string, string> = {
  EARLY_RELEASE: "Früh entlassen",
  CLASS_EARLY_RELEASE: "Klasse früh entlassen",
  TIMETABLE_END: "Unterrichtsende",
};

export function toRowStatus(
  status: ApiAttendanceStatus | null,
): AttendanceStatus {
  return status
    ? (STATUS_MAP[status] ?? "NOT_RECORDED")
    : "NOT_RECORDED";
}

export function reasonLabel(
  reason: string | null,
): string | null {
  if (!reason) return null;

  return REASON_LABEL[reason] ?? reason;
}

export function formatDateDe(
  iso: string,
): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  return match
    ? `${match[3]}.${match[2]}.${match[1]}`
    : iso;
}

export function toIsoDate(
  date: Date,
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = parseIsoDate(value);

  return toIsoDate(date) === value;
}

export function getPresetRange(
  preset: Exclude<ReportPreset, "custom">,
  today: string,
): { from: string; to: string } {
  if (preset === "today") {
    return {
      from: today,
      to: today,
    };
  }

  const end = parseIsoDate(today);

  if (preset === "week") {
    const start = new Date(end);

    start.setDate(start.getDate() - 6);

    return {
      from: toIsoDate(start),
      to: today,
    };
  }

  return {
    from: toIsoDate(
      new Date(
        end.getFullYear(),
        end.getMonth(),
        1,
      ),
    ),
    to: today,
  };
}

export function validateRange(
  from: string,
  to: string,
): string | null {
  if (!from || !to) {
    return "Bitte Von- und Bis-Datum angeben.";
  }

  if (
    !isValidIsoDate(from) ||
    !isValidIsoDate(to)
  ) {
    return "Bitte gültige Datumswerte angeben.";
  }

  if (from > to) {
    return "Das Von-Datum darf nicht nach dem Bis-Datum liegen.";
  }

  return null;
}

export function buildReportRows(
  rows: ApiReportRow[],
): ReportRow[] {
  return rows
    .map((row): ReportRow => {
      const status = toRowStatus(row.status);

      return {
        id: row.attendanceId,
        date: row.date,
        dateLabel: formatDateDe(row.date),
        studentName: row.studentName,
        className: row.className,
        status,
        statusLabel: STATUS_LABEL[status],
        checkIn: formatTime(row.checkin),
        checkOut: formatTime(row.checkout),
        reason: reasonLabel(
          row.checkoutReason,
        ),
      };
    })
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        a.className.localeCompare(
          b.className,
          "de",
        ) ||
        a.studentName.localeCompare(
          b.studentName,
          "de",
        ),
    );
}

function csvCell(value: string): string {
  // Verhindert, dass Tabellenprogramme fremde
  // Texte als Formeln interpretieren.
  const safe = /^[\s]*[=+\-@]/.test(value)
    ? `'${value}`
    : value;

  const escaped = safe.replace(
    /"/g,
    '""',
  );

  return /[";\r\n]/.test(safe)
    ? `"${escaped}"`
    : escaped;
}

export function buildReportCsv(
  rows: ReportRow[],
): string {
  const header = [
    "Datum",
    "Schüler",
    "Klasse",
    "Status",
    "Check-in",
    "Check-out",
    "Grund",
  ];

  const lines = rows.map((row) =>
    [
      row.dateLabel,
      row.studentName,
      row.className,
      row.statusLabel,
      row.checkIn ?? "",
      row.checkOut ?? "",
      row.reason ?? "",
    ]
      .map(csvCell)
      .join(";"),
  );

  return [
    header.join(";"),
    ...lines,
  ].join("\r\n");
}
