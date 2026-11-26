import {
  describe,
  expect,
  it,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import StatusChip from "./StatusChip";

describe("StatusChip", () => {
  it("zeigt Anwesend", () => {
    render(
      <StatusChip status="PRESENT" />,
    );

    expect(
      screen.getByText("Anwesend"),
    ).toBeTruthy();
  });

  it("zeigt Verspätet", () => {
    render(
      <StatusChip status="LATE" />,
    );

    expect(
      screen.getByText("Verspätet"),
    ).toBeTruthy();
  });

  it("zeigt Abwesend", () => {
    render(
      <StatusChip status="ABSENT" />,
    );

    expect(
      screen.getByText("Abwesend"),
    ).toBeTruthy();
  });

  it("zeigt Nicht erfasst", () => {
    render(
      <StatusChip
        status="NOT_RECORDED"
      />,
    );

    expect(
      screen.getByText(
        "Nicht erfasst",
      ),
    ).toBeTruthy();
  });
});
