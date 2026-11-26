import { apiFetch } from "../api/http";
import type { ApiStudent } from "../types/api";

export async function getMyStudents(): Promise<ApiStudent[]> {
  return apiFetch<ApiStudent[]>(
    "/student/myStudents",
  );
}

export async function getStudentsOfClass(
  classroomName: string,
): Promise<ApiStudent[]> {
  const students = await getMyStudents();

  return students.filter(
    (student) =>
      student.classroom?.classroomName ===
      classroomName,
  );
}
