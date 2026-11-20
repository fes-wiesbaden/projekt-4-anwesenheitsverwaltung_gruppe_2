
import type { ApiStudent } from "../types/api";

export function filterStudents(
  students: ApiStudent[],
  search: string,
  className: string,
): ApiStudent[] {
  const term = search.trim().toLowerCase();

  return students
    .filter(
      (student) =>
        className === "ALL" ||
        student.classroom?.classroomName === className,
    )
    .filter(
      (student) =>
        term === "" ||
        student.displayName.toLowerCase().includes(term) ||
        student.username.toLowerCase().includes(term),
    )
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "de"),
    );
}
