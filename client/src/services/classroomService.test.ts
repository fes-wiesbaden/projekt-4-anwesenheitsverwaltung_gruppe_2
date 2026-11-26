import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../api/http", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "../api/http";
import {
  getAvailableClassrooms,
  getClassrooms,
  normalizeClassroom,
} from "./classroomService";

const mockedFetch = vi.mocked(apiFetch);

describe("classroomService", () => {
  beforeEach(() => mockedFetch.mockReset());

  it("liest alte String-Antworten", async () => {
    mockedFetch.mockResolvedValue(["10A", "10B"]);
    expect(await getAvailableClassrooms()).toEqual(["10A", "10B"]);
  });

  it("liest neue Classroom-Objekte mit id", async () => {
    mockedFetch.mockResolvedValue([
      { id: 1, classroomName: "10A", room: { id: 3 } },
      { id: 2, classroomName: "10B" },
    ]);
    expect(await getClassrooms()).toEqual([
      { id: 1, classroomName: "10A" },
      { id: 2, classroomName: "10B" },
    ]);
    expect(await getAvailableClassrooms()).toEqual(["10A", "10B"]);
  });

  it("ignoriert ungültige Einträge", () => {
    expect(normalizeClassroom("")).toBeNull();
    expect(normalizeClassroom({ id: 5 })).toBeNull();
  });

  it("liest den Raum, wenn das Backend ihn mitliefert", () => {
    expect(
      normalizeClassroom({
        id: 1,
        classroomName: "10A",
        room: { roomName: "Klassenraum 101", roomNumber: "R101" },
      }),
    ).toEqual({
      id: 1,
      classroomName: "10A",
      roomLabel: "Klassenraum 101 (R101)",
    });

    expect(
      normalizeClassroom({
        id: 2,
        classroomName: "10B",
        room: { roomName: "Labor", roomNumber: null },
      })?.roomLabel,
    ).toBe("Labor");
  });
});
