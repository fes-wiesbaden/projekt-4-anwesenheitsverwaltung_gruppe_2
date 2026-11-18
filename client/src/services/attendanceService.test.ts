
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/http";
import { checkinStudent, checkoutStudent } from "./attendanceService";

function mockFetch(status: number, body: string) {
  const fn = vi.fn().mockImplementation(
    async () =>
      new Response(body, {
        status,
        headers: { "Content-Type": "text/plain" },
      }),
  );

  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("attendanceService", () => {
  it("sendet den Check-in als POST", async () => {
    const fn = mockFetch(200, "Student checked in.");

    const result = await checkinStudent("abc");

    expect(result).toBe("Student checked in.");
    expect(fn.mock.calls[0][0]).toBe(
      "/api/attendance/checkin/abc",
    );
    expect(fn.mock.calls[0][1].method).toBe("POST");
  });

  it("hängt Datum und Grund beim Checkout an", async () => {
    const fn = mockFetch(200, "ok");

    await checkoutStudent(
      "abc",
      "2026-11-18",
      "Arzt Termin",
    );

    expect(fn.mock.calls[0][0]).toBe(
      "/api/attendance/student/abc/checkout?date=2026-11-18&reason=Arzt+Termin",
    );
  });

  it("wirft bei 409 einen ApiError", async () => {
    mockFetch(
      409,
      "No active timetable session for this class.",
    );

    await expect(
      checkinStudent("abc"),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      checkinStudent("abc"),
    ).rejects.toMatchObject({ status: 409 });
  });
});
