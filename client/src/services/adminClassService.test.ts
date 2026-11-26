import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "../api/http";
import {
  createClassroom,
  deleteClassroom,
  deleteTeacher,
  describeClassError,
  describeTeacherDeleteError,
  getRooms,
  validateClassroom,
} from "./adminService";

vi.mock("../api/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/http")>();
  return { ...actual, apiFetch: vi.fn() };
});

const request = vi.mocked(apiFetch);

beforeEach(() => {
  request.mockReset();
});

describe("Klasse anlegen", () => {
  it("validiert Name und Raum", () => {
    expect(validateClassroom({ classroomName: "10C", roomId: 2 })).toBeNull();
    expect(validateClassroom({ classroomName: "  ", roomId: 2 })).toBe("Bitte einen Klassennamen eingeben.");
    expect(validateClassroom({ classroomName: "10C", roomId: null })).toBe("Bitte einen Raum wählen.");
    expect(validateClassroom({ classroomName: "10C", roomId: 0 })).toBe("Bitte einen Raum wählen.");
  });

  it("sendet bereinigten Namen und Raum-ID", async () => {
    request.mockResolvedValue("Classroom Created!");

    await createClassroom({ classroomName: " 10C ", roomId: 2 });

    expect(request).toHaveBeenCalledWith("/classroom", {
      method: "POST",
      body: JSON.stringify({ classroomName: "10C", roomId: 2 }),
    });
  });

  it("sendet bei ungültigen Eingaben keine Anfrage", async () => {
    await expect(createClassroom({ classroomName: "", roomId: 2 })).rejects.toThrow(
      "Bitte einen Klassennamen eingeben.",
    );
    expect(request).not.toHaveBeenCalled();
  });

  it("lädt die Räume und prüft die Antwort", async () => {
    request.mockResolvedValueOnce([{ id: 1, roomName: "Klassenraum 101", roomNumber: "R101" }]);
    expect(await getRooms()).toHaveLength(1);
    expect(request).toHaveBeenCalledWith("/room/getall");

    request.mockResolvedValueOnce("<html>");
    await expect(getRooms()).rejects.toThrow("Unerwartete Antwort");
  });
});

describe("Löschen", () => {
  it("löscht eine Klasse über den Admin-Endpunkt", async () => {
    request.mockResolvedValue("Classroom deleted successfully.");
    await deleteClassroom(4);
    expect(request).toHaveBeenCalledWith("/auth/admin/classroom/4", { method: "DELETE" });
  });

  it("löscht eine Lehrkraft über den Admin-Endpunkt", async () => {
    request.mockResolvedValue(undefined);
    await deleteTeacher("t-1");
    expect(request).toHaveBeenCalledWith("/auth/admin/teacher/t-1", { method: "DELETE" });
  });
});

describe("Fehlertexte", () => {
  it("erklärt Fehler beim Anlegen einer Klasse", () => {
    expect(describeClassError(new ApiError(409, ""), "create")).toBe("Eine Klasse mit diesem Namen gibt es bereits.");
    expect(describeClassError(new ApiError(404, ""), "create")).toBe("Der gewählte Raum wurde nicht gefunden.");
    expect(describeClassError(new ApiError(403, ""), "create")).toContain("Keine Berechtigung");
    expect(describeClassError(new Error("x"), "create")).toBe("Die Klasse konnte nicht angelegt werden.");
  });

  it("erklärt Fehler beim Löschen einer Klasse", () => {
    expect(describeClassError(new ApiError(500, ""), "delete")).toContain("Schüler oder ein Stundenplan");
    expect(describeClassError(new ApiError(404, ""), "delete")).toContain("nicht gefunden");
    expect(describeClassError(new Error("x"), "delete")).toBe("Die Klasse konnte nicht gelöscht werden.");
  });

  it("erklärt Fehler beim Löschen einer Lehrkraft", () => {
    expect(describeTeacherDeleteError(new ApiError(500, ""))).toContain("Klassen zugeordnet");
    expect(describeTeacherDeleteError(new ApiError(403, ""))).toContain("Keine Berechtigung");
    expect(describeTeacherDeleteError(new ApiError(404, ""))).toContain("nicht gefunden");
    expect(describeTeacherDeleteError(new Error("x"))).toBe("Die Lehrkraft konnte nicht gelöscht werden.");
  });
});
