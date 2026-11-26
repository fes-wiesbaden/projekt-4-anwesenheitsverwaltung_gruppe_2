import { describe, expect, it } from "vitest";
import { canOpenPage, type PageId } from "./navigation";

describe("rollenabhängige Navigation", () => {
  it("erlaubt Administratoren die geschützten Seiten", () => {
    expect(canOpenPage("admin", true)).toBe(true);
    expect(canOpenPage("rfid", true)).toBe(true);
  });

  it("blendet geschützte Seiten ohne bestätigte Admin-Berechtigung aus", () => {
    expect(canOpenPage("admin", false)).toBe(false);
    expect(canOpenPage("rfid", false)).toBe(false);
  });

  it("lässt die bisherigen normalen Seiten zugänglich", () => {
    const pages: PageId[] = ["dashboard", "attendance", "classes", "students", "reports", "settings"];
    expect(pages.every((page) => canOpenPage(page, false))).toBe(true);
  });
});
