
import {
  describe,
  expect,
  it,
} from "vitest";

import { ApiError } from "../api/http";

import {
  describePasswordError,
  validatePasswordChange,
} from "./passwordChange";

describe("validatePasswordChange", () => {
  it("verlangt das aktuelle Passwort", () => {
    expect(
      validatePasswordChange(
        "",
        "neuesPasswort1",
        "neuesPasswort1",
      ),
    ).toContain("aktuelle");
  });

  it("lehnt zu kurze Passwörter ab", () => {
    expect(
      validatePasswordChange(
        "alt",
        "kurz",
        "kurz",
      ),
    ).toContain("mindestens 8");
  });

  it("verlangt eine passende Bestätigung", () => {
    expect(
      validatePasswordChange(
        "alt",
        "neuesPasswort1",
        "anderes123",
      ),
    ).toContain("stimmen nicht");
  });

  it("lehnt ein unverändertes Passwort ab", () => {
    expect(
      validatePasswordChange(
        "gleichesPw1",
        "gleichesPw1",
        "gleichesPw1",
      ),
    ).toContain("unterscheiden");
  });

  it("akzeptiert gültige Eingaben", () => {
    expect(
      validatePasswordChange(
        "alt",
        "neuesPasswort1",
        "neuesPasswort1",
      ),
    ).toBeNull();
  });
});

describe("describePasswordError", () => {
  it("erklärt einen Fehler 401", () => {
    expect(
      describePasswordError(
        new ApiError(401, "Fehler"),
      ),
    ).toContain("falsch");
  });

  it("liefert eine allgemeine Fehlermeldung", () => {
    expect(
      describePasswordError(
        new Error("Fehler"),
      ),
    ).toContain("nicht geändert");
  });
});
