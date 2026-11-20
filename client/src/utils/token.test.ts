
import { describe, expect, it } from "vitest";

import {
  getUsernameFromToken,
  isTokenExpired,
} from "./token";

const makeToken = (payload: object) =>
  `h.${btoa(JSON.stringify(payload))}.s`;

describe("token", () => {
  it("liest den Benutzernamen", () => {
    const token = makeToken({
      sub: "admin",
      exp: 2000000000,
    });

    expect(getUsernameFromToken(token)).toBe("admin");
  });

  it("behandelt fehlende und ungültige Tokens", () => {
    expect(getUsernameFromToken(null)).toBeNull();

    expect(
      getUsernameFromToken("kaputt"),
    ).toBeNull();
  });

  it("erkennt einen abgelaufenen Token", () => {
    const token = makeToken({
      sub: "admin",
      exp: 1000,
    });

    expect(
      isTokenExpired(token, 2_000_000),
    ).toBe(true);
  });

  it("erkennt einen noch gültigen Token", () => {
    const token = makeToken({
      sub: "admin",
      exp: 2000000000,
    });

    expect(
      isTokenExpired(token, 1_000_000),
    ).toBe(false);
  });

  it("behandelt einen Token ohne Ablaufzeit als ungültig", () => {
    const token = makeToken({
      sub: "admin",
    });

    expect(isTokenExpired(token)).toBe(true);
  });
});
