
import { describe, expect, it } from "vitest";
import { ApiError } from "../api/http";
import { describeActionError, getRowActions } from "./rowActions";

describe("getRowActions", () => {
  it("erlaubt Einchecken ohne Check-in", () => {
    expect(getRowActions({ checkIn: null, checkOut: null }, true)).toEqual({
      canCheckin: true,
      canCheckout: false,
    });
  });

  it("erlaubt Auschecken nach Check-in", () => {
    expect(getRowActions({ checkIn: "09:00", checkOut: null }, true)).toEqual({
      canCheckin: false,
      canCheckout: true,
    });
  });

  it("erlaubt nichts nach Check-out", () => {
    expect(getRowActions({ checkIn: "09:00", checkOut: "10:00" }, true)).toEqual({
      canCheckin: false,
      canCheckout: false,
    });
  });

  it("erlaubt nichts an anderen Tagen", () => {
    expect(getRowActions({ checkIn: null, checkOut: null }, false)).toEqual({
      canCheckin: false,
      canCheckout: false,
    });
  });
});

describe("describeActionError", () => {
  it("erklärt 409", () => {
    expect(describeActionError(new ApiError(409, "x"))).toContain("Unterrichtseinheit");
  });

  it("erklärt 403", () => {
    expect(describeActionError(new ApiError(403, "x"))).toContain("anmelden");
  });

  it("erklärt 404", () => {
    expect(describeActionError(new ApiError(404, "x"))).toContain("nicht gefunden");
  });

  it("hat einen Standardtext", () => {
    expect(describeActionError(new Error("x"))).toBe("Die Aktion ist fehlgeschlagen.");
  });
});
