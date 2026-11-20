
import { describe, expect, it } from "vitest";
import type { ApiDashboard } from "../types/api";

import {
  buildDashboardCards,
  formatQuote,
  hasNoRecords,
} from "./dashboardCards";

const data: ApiDashboard = {
  totalStudents: 10,
  totalClasses: 1,
  from: "2026-11-20",
  to: "2026-11-20",
  records: 10,
  present: 3,
  absent: 7,
  lateArrivals: 3,
  earlyDepartures: 0,
  attendancePercentage: 30,
};

describe("dashboardCards", () => {
  it("erstellt vier Karten mit Backend-Werten", () => {
    const cards = buildDashboardCards(data);

    expect(cards.map((card) => card.value)).toEqual([
      10,
      3,
      3,
      7,
    ]);

    expect(cards[1].subtitle).toBe("Quote 30.0 %");

    expect(cards[3].subtitle).toBe(
      "von 10 Datensätzen",
    );
  });

  it("formatiert Prozentzahlen korrekt", () => {
    expect(formatQuote(92.456)).toBe("92.5 %");
  });

  it("erkennt einen Zeitraum ohne Datensätze", () => {
    expect(
      hasNoRecords({ ...data, records: 0 }),
    ).toBe(true);

    expect(hasNoRecords(data)).toBe(false);
  });
});
