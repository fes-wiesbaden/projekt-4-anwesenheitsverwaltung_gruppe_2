import { ApiError, apiFetch } from "../api/http";
import type { ApiAdminUser } from "../types/api";

export type AdminAccess = "checking" | "admin" | "denied" | "unavailable";

export async function getAdminUsers(): Promise<ApiAdminUser[]> {
  const data = await apiFetch<ApiAdminUser[]>("/auth/admin/users");

  // Only a successful response with the expected JSON shape counts.
  if (!Array.isArray(data)) {
    throw new Error("Unerwartete Antwort der Benutzer-API.");
  }

  return data;
}

export async function checkAdminAccess(): Promise<AdminAccess> {
  try {
    await getAdminUsers();
    return "admin";
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      // Access denied does not by itself prove a TEACHER role.
      return "denied";
    }

    return "unavailable";
  }
}
