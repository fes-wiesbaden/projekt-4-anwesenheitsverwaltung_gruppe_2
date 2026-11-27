import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.hoisted(() => vi.fn());

vi.mock("../api/http", async () => {
  const actual =
    await vi.importActual<typeof import("../api/http")>("../api/http");

  return { ...actual, apiFetch };
});

import { ApiError } from "../api/http";
import { getAvailableClassrooms, getClassrooms } from "./classroomService";

describe("Klassen je nach Rolle laden", () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it("Administrator: lädt alle Klassen", async () => {
    apiFetch.mockResolvedValue([
      { id: 1, classroomName: "12BE13" },
    ]);

    const result = await getClassrooms(true);

    expect(apiFetch).toHaveBeenCalledWith("/classroom/allClassrooms");
    expect(result).toEqual([{ id: 1, classroomName: "12BE13" }]);
  });

  it("Lehrkraft: lädt nur die eigenen Klassen (Strings)", async () => {
    apiFetch.mockResolvedValue(["12BE13"]);

    const result = await getAvailableClassrooms(false);

    expect(apiFetch).toHaveBeenCalledWith("/classroom/my");
    expect(result).toEqual(["12BE13"]);
  });

  it("Lehrkraft: versteht auch Klassen-Objekte", async () => {
    apiFetch.mockResolvedValue([{ id: 2, classroomName: "12BE14" }]);

    const result = await getClassrooms(false);

    expect(result).toEqual([{ id: 2, classroomName: "12BE14" }]);
  });

  it("Rolle unbekannt: nimmt alle Klassen, wenn erlaubt", async () => {
    apiFetch.mockResolvedValue(["12BE13"]);

    await getAvailableClassrooms();

    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith("/classroom/allClassrooms");
  });

  it("Rolle unbekannt: weicht bei 403 auf die eigenen Klassen aus", async () => {
    apiFetch
      .mockRejectedValueOnce(new ApiError(403, "Forbidden"))
      .mockResolvedValueOnce(["12BE13"]);

    const result = await getAvailableClassrooms();

    expect(apiFetch).toHaveBeenNthCalledWith(2, "/classroom/my");
    expect(result).toEqual(["12BE13"]);
  });

  it("Rolle unbekannt: andere Fehler werden nicht verschluckt", async () => {
    apiFetch.mockRejectedValue(new ApiError(500, "Fehler"));

    await expect(getAvailableClassrooms()).rejects.toBeInstanceOf(ApiError);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
