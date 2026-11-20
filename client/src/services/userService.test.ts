
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { changePassword } from "./userService";

function mockFetch(
  status: number,
  body: string,
) {
  const fn = vi.fn().mockImplementation(
    async () =>
      new Response(body, {
        status,
        headers: {
          "Content-Type": "text/plain",
        },
      }),
  );

  vi.stubGlobal("fetch", fn);

  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("userService", () => {
  it("sendet PATCH mit den Passwortfeldern", async () => {
    const fn = mockFetch(
      200,
      "Passwort erfolgreich geändert.",
    );

    await expect(
      changePassword(
        "alt",
        "neuesPasswort1",
      ),
    ).resolves.toBeUndefined();

    expect(fn.mock.calls[0][0]).toBe(
      "/api/user/changePasswordOnFirstLogin",
    );

    expect(
      fn.mock.calls[0][1].method,
    ).toBe("PATCH");

    expect(
      JSON.parse(
        fn.mock.calls[0][1].body,
      ),
    ).toEqual({
      oldPassword: "alt",
      newPassword: "neuesPasswort1",
    });
  });

  it("meldet HTTP 401 als API-Fehler", async () => {
    mockFetch(
      401,
      "Aktuelles Passwort inkorrekt.",
    );

    await expect(
      changePassword(
        "falsch",
        "neuesPasswort1",
      ),
    ).rejects.toMatchObject({
      status: 401,
    });
  });
});
