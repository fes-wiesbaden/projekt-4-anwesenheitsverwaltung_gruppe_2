import { describe, expect, it } from "vitest";

import type { ApiStudent } from "../types/api";
import { buildClassSummaries } from "./classSummary";

const student: ApiStudent = {
  id: "s1",
  displayName: "Max",
  username: "max",
  classroom: {
    id: 1,
    classroomName: "10A",
    room: { id: 1, roomName: "Klassenraum 101", roomNumber: "R101" },
  },
};

describe("buildClassSummaries mit Daten aus der Klassenliste", () => {
  it("kennt auch Klassen ohne Schüler", () => {
    const list = buildClassSummaries(["10A", "11A"], [student], {
      ids: { "10A": 1, "11A": 7 },
      rooms: { "11A": "Labor (L2)" },
    });

    expect(list).toEqual([
      { name: "10A", id: 1, roomLabel: "Klassenraum 101 (R101)", studentCount: 1 },
      { name: "11A", id: 7, roomLabel: "Labor (L2)", studentCount: 0 },
    ]);
  });

  it("funktioniert weiter ohne Zusatzdaten (alter Backend-Stand)", () => {
    const list = buildClassSummaries(["10A", "11A"], [student]);

    expect(list[0].id).toBe(1);
    expect(list[1]).toEqual({
      name: "11A",
      id: null,
      roomLabel: "Nicht angegeben",
      studentCount: 0,
    });
  });
});
