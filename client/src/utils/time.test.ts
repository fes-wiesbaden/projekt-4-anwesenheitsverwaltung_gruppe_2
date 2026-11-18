import {
  describe,
  expect,
  it,
} from "vitest";

import {
  formatTime,
} from "./time";

describe("formatTime", () => {
  it("formatiert LocalDateTime als HH:mm", () => {
    expect(
      formatTime(
        "2026-11-18T09:06:14.539444",
      ),
    ).toBe("09:06");
  });

  it("liefert null ohne Zeit", () => {
    expect(formatTime(null)).toBeNull();
  });

  it("liefert null bei falschem Format", () => {
    expect(
      formatTime("ungueltig"),
    ).toBeNull();
  });
});
