
import type {
  ApiReportRow,
  ApiStudent,
} from "../types/api";

export interface ClassOverview {
  name: string;
  room: string;
  students: number;
  records: number;
  checkedIn: number;
  late: number;
}

export interface DayOverview {
  date: string;
  label: string;
  records: number;
  checkedIn: number;
  percentage: number;
}

export function buildClassOverview(
  names: string[],
  students: ApiStudent[],
  attendance: ApiReportRow[],
  today: string,
): ClassOverview[] {
  const todayRows = attendance.filter(
    (row) => row.date === today,
  );

  return [...new Set(names)]
    .sort((a, b) => a.localeCompare(b, "de"))
    .map((name) => {
      const classStudents = students.filter(
        (student) =>
          student.classroom?.classroomName === name,
      );

      const classRows = todayRows.filter(
        (row) => row.className === name,
      );

      const room = classStudents.find(
        (student) => student.classroom?.room,
      )?.classroom?.room;

      return {
        name,
        room: room
          ? `${room.roomName} (${room.roomNumber})`
          : "Nicht angegeben",
        students: classStudents.length,
        records: classRows.length,
        checkedIn: classRows.filter(
          (row) => row.checkin !== null,
        ).length,
        late: classRows.filter(
          (row) => row.status === "VERSPAETET",
        ).length,
      };
    });
}

function toLocalIso(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildWeeklyOverview(
  attendance: ApiReportRow[],
  today: string,
): DayOverview[] {
  const result: DayOverview[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(`${today}T12:00:00`);

    date.setDate(date.getDate() - offset);

    const iso = toLocalIso(date);

    const rows = attendance.filter(
      (row) => row.date === iso,
    );

    const checkedIn = rows.filter(
      (row) => row.checkin !== null,
    ).length;

    result.push({
      date: iso,
      label: `${String(date.getDate()).padStart(2, "0")}.${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}.`,
      records: rows.length,
      checkedIn,
      percentage:
        rows.length > 0
          ? Math.round(
              (checkedIn / rows.length) * 100,
            )
          : 0,
    });
  }

  return result;
}

export function getRecentCheckins(
  attendance: ApiReportRow[],
  today: string,
  limit = 5,
): ApiReportRow[] {
  return attendance
    .filter(
      (row) =>
        row.date === today &&
        row.checkin !== null,
    )
    .sort((a, b) =>
      (b.checkin ?? "").localeCompare(
        a.checkin ?? "",
      ),
    )
    .slice(0, limit);
}
