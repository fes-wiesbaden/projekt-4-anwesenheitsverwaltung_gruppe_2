import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "../api/http";
import { checkAdminAccess, getAdminUsers } from "./adminService";

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
