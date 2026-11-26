import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "../api/http";
import {
  assignStudentToClass,
  createStudent,
  deleteStudent,
  describeStudentError,
  validateStudent,
} from "./adminService";

vi.mock("../api/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/http")>();
  return { ...actual, apiFetch: vi.fn() };
});

const request = vi.mocked(apiFetch);

beforeEach(() => {
  request.mockReset();
});

describe("Schüler validieren", () => {
  const valid = { displayName: "Max Muster", username: "max.muster", classroomId: null };

  it("akzeptiert gültige Eingaben", () => {
    expect(validateStudent(valid)).toBeNull();
  });

  it("verlangt Name und Benutzername ohne Leerzeichen", () => {
    expect(validateStudent({ ...valid, displayName: "  " })).toBe("Bitte einen Namen eingeben.");
    expect(validateStudent({ ...valid, username: "" })).toBe("Bitte einen Benutzernamen eingeben.");
    expect(validateStudent({ ...valid, username: "max muster" })).toBe(
      "Der Benutzername darf keine Leerzeichen enthalten.",
    );
  });
});

describe("Schüler anlegen", () => {
  it("sendet bereinigte Daten und weist danach die Klasse zu", async () => {
    request.mockResolvedValueOnce({ id: "abc-123", username: "max.muster" });
    request.mockResolvedValueOnce("Saved");

    const result = await createStudent({
      displayName: " Max Muster ",
      username: " max.muster ",
      classroomId: 7,
    });

    expect(request).toHaveBeenNthCalledWith(1, "/auth/admin/student/create", {
      method: "POST",
      body: JSON.stringify({ username: "max.muster", displayName: "Max Muster" }),
    });
    expect(request).toHaveBeenNthCalledWith(2, "/classroom/abc-123/7", { method: "POST" });
    expect(result).toEqual({ id: "abc-123", username: "max.muster", classAssignFailed: false });
  });

  it("legt den Schüler auch ohne Klasse an und ruft die Zuweisung nicht auf", async () => {
    request.mockResolvedValueOnce({ id: "abc-123", username: "max.muster" });

    const result = await createStudent({ displayName: "Max", username: "max", classroomId: null });

    expect(request).toHaveBeenCalledTimes(1);
    expect(result.classAssignFailed).toBe(false);
  });

  it("meldet, wenn nur die Klassenzuweisung fehlschlägt", async () => {
    request.mockResolvedValueOnce({ id: "abc-123", username: "max.muster" });
    request.mockRejectedValueOnce(new ApiError(403, ""));

    const result = await createStudent({ displayName: "Max", username: "max", classroomId: 7 });

    expect(result).toEqual({ id: "abc-123", username: "max.muster", classAssignFailed: true });
  });

  it("sendet bei ungültigen Eingaben keine Anfrage", async () => {
    await expect(
      createStudent({ displayName: "", username: "max", classroomId: null }),
    ).rejects.toThrow("Bitte einen Namen eingeben.");
    expect(request).not.toHaveBeenCalled();
  });

  it("gibt Backend-Fehler beim Anlegen weiter", async () => {
    request.mockRejectedValueOnce(new ApiError(409, ""));
    await expect(
      createStudent({ displayName: "Max", username: "max", classroomId: null }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("Klassenzuweisung und Löschen", () => {
  it("ruft den Zuweisen-Endpunkt mit Schüler- und Klassen-ID auf", async () => {
    request.mockResolvedValue("Saved");
    await assignStudentToClass("abc-123", 4);
    expect(request).toHaveBeenCalledWith("/classroom/abc-123/4", { method: "POST" });
  });

  it("löscht über den Admin-Endpunkt", async () => {
    request.mockResolvedValue(undefined);
    await deleteStudent("abc-123");
    expect(request).toHaveBeenCalledWith("/auth/admin/student/abc-123", { method: "DELETE" });
  });
});

describe("Fehlertexte", () => {
  it("erklärt 409 je nach Aktion", () => {
    expect(describeStudentError(new ApiError(409, ""), "create")).toBe(
      "Dieser Benutzername ist bereits vergeben.",
    );
    expect(describeStudentError(new ApiError(409, ""), "delete")).toBe(
      "Der Schüler hat Anwesenheitseinträge und kann nicht gelöscht werden.",
    );
  });

  it("erklärt Fehler bei der Klassenzuweisung", () => {
    expect(describeStudentError(new ApiError(400, ""), "assign")).toBe("Schüler oder Klasse wurde nicht gefunden.");
    expect(describeStudentError(new ApiError(403, ""), "assign")).toBe("Keine Berechtigung, die Klasse zu ändern.");
    expect(describeStudentError(new ApiError(500, ""), "assign")).toBe("Die Klasse konnte nicht zugewiesen werden.");
  });

  it("kennt 403, 404 und unbekannte Fehler", () => {
    expect(describeStudentError(new ApiError(403, ""), "delete")).toContain("Keine Berechtigung");
    expect(describeStudentError(new ApiError(404, ""), "delete")).toContain("nicht gefunden");
    expect(describeStudentError(new Error("x"), "create")).toBe("Der Schüler konnte nicht angelegt werden.");
    expect(describeStudentError(new ApiError(500, ""), "delete")).toBe("Der Schüler konnte nicht gelöscht werden.");
  });
});
