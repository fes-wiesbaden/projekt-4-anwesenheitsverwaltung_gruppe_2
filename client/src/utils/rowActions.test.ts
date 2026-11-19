
import { describe, expect, it } from "vitest";
import { ApiError } from "../api/http";
import {
  describeActionError,
  getRowActions,
} from "./rowActions";

// Tests für die Aktionen im ⋮-Menü
describe("getRowActions", () => {
  it("erlaubt Einchecken ohne Check-in", () => {
    expect(
      getRowActions(
        { checkIn: null, checkOut: null },
        true,
      ),
    ).toEqual({
      canCheckin: true,
      canCheckout: false,
      canEdit: false,
    });
  });

  it("erlaubt Auschecken nach Check-in", () => {
    expect(
      getRowActions(
        { checkIn: "09:00", checkOut: null },
        true,
      ),
    ).toEqual({
      canCheckin: false,
      canCheckout: true,
      canEdit: false,
    });
  });

  it("verbietet erneutes Check-in und Check-out", () => {
    const actions = getRowActions(
      {
        checkIn: "09:00",
        checkOut: "10:00",
      },
      true,
    );

    expect(actions.canCheckin).toBe(false);
    expect(actions.canCheckout).toBe(false);
  });

  it("verbietet Check-in und Check-out an anderen Tagen", () => {
    const actions = getRowActions(
      {
        checkIn: null,
        checkOut: null,
      },
      false,
    );

    expect(actions.canCheckin).toBe(false);
    expect(actions.canCheckout).toBe(false);
  });

  it("erlaubt Bearbeiten nur mit Attendance-ID", () => {
    const withRecord = getRowActions(
      {
        checkIn: "09:00",
        checkOut: "10:00",
        attendanceId: 54,
      },
      false,
    );

    const withoutRecord = getRowActions(
      {
        checkIn: null,
        checkOut: null,
        attendanceId: null,
      },
      true,
    );

    expect(withRecord.canEdit).toBe(true);
    expect(withRecord.canCheckin).toBe(false);
    expect(withRecord.canCheckout).toBe(false);
    expect(withoutRecord.canEdit).toBe(false);
  });
});

// Tests für die Fehlermeldungen
describe("describeActionError", () => {
  it("erklärt Fehler 409", () => {
    expect(
      describeActionError(new ApiError(409, "x")),
    ).toContain("Unterrichtseinheit");
  });

  it("erklärt Fehler 403", () => {
    expect(
      describeActionError(new ApiError(403, "x")),
    ).toContain("anmelden");
  });

  it("erklärt Fehler 404", () => {
    expect(
      describeActionError(new ApiError(404, "x")),
    ).toContain("nicht gefunden");
  });

  it("hat einen Standardtext", () => {
    expect(
      describeActionError(new Error("x")),
    ).toBe("Die Aktion ist fehlgeschlagen.");
  });
});
