
import { describe, expect, it } from "vitest";
import type { ApiStudent } from "../types/api";
import { filterStudents } from "./studentFilter";

const createStudent = (
  id: string,
  name: string,
  classroom: string,
): ApiStudent => ({
  id,
  displayName: name,
  username: name.toLowerCase().replace(" ", "."),
  classroom: {
    id: 1,
    classroomName: classroom,
  },
});

const students: ApiStudent[] = [
  createStudent("1", "Ben Koch", "10A"),
  createStudent("2", "Anna Weber", "10B"),
  createStudent("3", "Cem Aydin", "10A"),
];

describe("filterStudents", () => {
  it("sortiert Schüler alphabetisch nach Namen", () => {
    const result = filterStudents(
      students,
      "",
      "ALL",
    );

    expect(
      result.map((student) => student.displayName),
    ).toEqual([
      "Anna Weber",
      "Ben Koch",
      "Cem Aydin",
    ]);
  });

  it("filtert Schüler nach ihrer Klasse", () => {
    const result = filterStudents(
      students,
      "",
      "10A",
    );

    expect(result).toHaveLength(2);

    expect(
      result.map((student) => student.displayName),
    ).toEqual([
      "Ben Koch",
      "Cem Aydin",
    ]);
  });

  it("sucht nach Namen und Benutzernamen", () => {
    expect(
      filterStudents(students, "weber", "ALL"),
    ).toHaveLength(1);

    expect(
      filterStudents(students, "cem.", "ALL"),
    ).toHaveLength(1);
  });
});
