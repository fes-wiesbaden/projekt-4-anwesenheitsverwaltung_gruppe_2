import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "../api/http";
import {
  assignClass,
  checkAdminAccess,
  createTeacher,
  describeAssignError,
  getAdminUsers,
  validateTeacher,
} from "./adminService";

vi.mock("../api/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/http")>();
  return { ...actual, apiFetch: vi.fn() };
});

const request = vi.mocked(apiFetch);

beforeEach(() => { request.mockReset(); });

describe("Admin-Service", () => {
  it("lädt die Benutzer über den richtigen Endpunkt", async () => {
    const users = [{ id: "1", displayName: "Test", username: "test", role: "ADMIN", createdAt: "2026-11-21" }];
    request.mockResolvedValue(users);
    expect(await getAdminUsers()).toEqual(users);
    expect(request).toHaveBeenCalledWith("/auth/admin/users");
  });

  it("erkennt erfolgreichen Zugriff auf die Admin-API", async () => {
    request.mockResolvedValue([]);
    expect(await checkAdminAccess()).toBe("admin");
  });

  it("verweigert die Admin-Anzeige bei 403", async () => {
    request.mockRejectedValue(new ApiError(403, "Forbidden"));
    expect(await checkAdminAccess()).toBe("denied");
  });

  it("behandelt ungültige Anmeldung als nicht prüfbar", async () => {
    request.mockRejectedValue(new ApiError(401, "Unauthorized"));
    expect(await checkAdminAccess()).toBe("unavailable");
  });

  it("gewährt bei einem Netzwerkfehler keine Admin-Anzeige", async () => {
    request.mockRejectedValue(new Error("Network error"));
    expect(await checkAdminAccess()).toBe("unavailable");
  });

  it("gewährt bei unerwarteter Antwort keine Admin-Anzeige", async () => {
    request.mockResolvedValue("<html>Fehler</html>");
    expect(await checkAdminAccess()).toBe("unavailable");
  });
});

describe("Lehrkraft anlegen", () => {
  const input = { displayname: " Demo Lehrkraft ", username: " demo.teacher ", password: "Testpasswort123!" };

  it("sendet die erwarteten Daten mit fester Rolle TEACHER", async () => {
    const user = { id: "2", displayName: "Demo Lehrkraft", username: "demo.teacher", role: "TEACHER", createdAt: "2026-11-22" };
    request.mockResolvedValue(user);
    expect(await createTeacher(input)).toEqual(user);
    expect(request).toHaveBeenCalledWith("/auth/admin/teacher/create", {
      method: "POST",
      body: JSON.stringify({ displayName: "Demo Lehrkraft", username: "demo.teacher", password: input.password, role: "TEACHER" }),
    });
  });
  it("lehnt neun Zeichen vor der API-Anfrage ab", async () => {
    await expect(createTeacher({ ...input, password: "123456789" })).rejects.toThrow("mindestens 10");
    expect(request).not.toHaveBeenCalled();
  });
  it("akzeptiert exakt zehn Zeichen", () => {
    expect(validateTeacher({ ...input, password: "1234567890" })).toBeNull();
  });
  it("prüft leere Namen und Benutzernamen sowie Leerzeichen im Benutzernamen", () => {
    expect(validateTeacher({ ...input, displayname: " " })).not.toBeNull();
    expect(validateTeacher({ ...input, username: " " })).not.toBeNull();
    expect(validateTeacher({ ...input, username: "demo teacher" })).not.toBeNull();
  });
  it("reicht einen Konflikt des Backends weiter", async () => {
    request.mockRejectedValue(new ApiError(409, "Conflict"));
    await expect(createTeacher(input)).rejects.toMatchObject({ status: 409 });
  });
});

describe("Klasse zuweisen", () => {
  it("sendet Benutzername und Klassen-ID", async () => {
    request.mockResolvedValue({});

    await assignClass({
      username: " anna.schneider ",
      classroomId: 2,
    });

    expect(request).toHaveBeenCalledWith(
      "/auth/admin/assign-class",
      {
        method: "POST",
        body: JSON.stringify({
          username: "anna.schneider",
          classroomId: 2,
        }),
      },
    );
  });

  it("lehnt eine ungültige Klassen-ID ab", async () => {
    await expect(
      assignClass({
        username: "anna",
        classroomId: 0,
      }),
    ).rejects.toThrow("Klasse");

    expect(request).not.toHaveBeenCalled();
  });

  it("beschreibt Fehler des Backends", () => {
    expect(
      describeAssignError(new ApiError(400, "x")),
    ).toContain("abgelehnt");

    expect(
      describeAssignError(new ApiError(404, "x")),
    ).toContain("nicht gefunden");

    expect(
      describeAssignError(new Error("x")),
    ).toContain("nicht zugewiesen");
  });
});