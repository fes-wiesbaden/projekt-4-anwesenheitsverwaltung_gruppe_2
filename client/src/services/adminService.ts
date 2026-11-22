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

export interface CreateTeacherInput {
  displayname: string;
  username: string;
  password: string;
}

export function validateTeacher(input: CreateTeacherInput): string | null {
  if (!input.displayname.trim()) return "Bitte einen Namen eingeben.";
  if (!input.username.trim()) return "Bitte einen Benutzernamen eingeben.";
  if (/\s/.test(input.username.trim())) return "Der Benutzername darf keine Leerzeichen enthalten.";
  if (input.password.length < 10) return "Das Passwort muss mindestens 10 Zeichen lang sein.";
  return null;
}

export async function createTeacher(input: CreateTeacherInput): Promise<ApiAdminUser> {
  const error = validateTeacher(input);
  if (error) throw new Error(error);
  return apiFetch<ApiAdminUser>("/auth/admin/createUser", {
    method: "POST",
    body: JSON.stringify({
      displayname: input.displayname.trim(),
      username: input.username.trim(),
      password: input.password,
      role: "TEACHER",
    }),
  });
}
