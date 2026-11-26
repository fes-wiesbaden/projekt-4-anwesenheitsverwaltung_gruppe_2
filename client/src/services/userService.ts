
import { apiFetch } from "../api/http";

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await apiFetch<unknown>(
    "/user/changePasswordOnFirstLogin",
    {
      method: "PATCH",
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    },
  );
}
