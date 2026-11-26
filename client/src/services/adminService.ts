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
  return apiFetch<ApiAdminUser>("/auth/admin/teacher/create", {
    method: "POST",
    body: JSON.stringify({
      displayName: input.displayname.trim(),
      username: input.username.trim(),
      password: input.password,
      role: "TEACHER",
    }),
  });
}

export interface AssignClassInput {
  username: string;
  classroomId: number;
}

export async function assignClass(
  input: AssignClassInput,
): Promise<unknown> {
  if (!input.username.trim()) {
    throw new Error("Bitte eine Lehrkraft wählen.");
  }

  if (
    !Number.isInteger(input.classroomId) ||
    input.classroomId <= 0
  ) {
    throw new Error("Bitte eine Klasse wählen.");
  }

  return apiFetch<unknown>("/auth/admin/assign-class", {
    method: "POST",
    body: JSON.stringify({
      username: input.username.trim(),
      classroomId: input.classroomId,
    }),
  });
}

export function describeAssignError(
  error: unknown,
): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "Klassenzuweisung wurde abgelehnt.";
      case 404:
        return "Lehrkraft oder Klasse wurde nicht gefunden.";
      case 401:
        return "Bitte erneut anmelden.";
      case 403:
        return "Keine Berechtigung für die Klassenzuweisung.";
    }
  }

  return "Die Klasse konnte nicht zugewiesen werden.";
}

/* ---------- Schüler verwalten (nur Administratoren) ---------- */

export interface ClassOption {
  id: number;
  classroomName: string;
}

export interface CreateStudentInput {
  displayName: string;
  username: string;
  classroomId: number | null;
}

export interface CreatedStudent {
  id: string;
  username: string;
  /** true, wenn der Schüler angelegt wurde, die Klassenzuweisung aber fehlschlug */
  classAssignFailed: boolean;
}

export function validateStudent(
  input: CreateStudentInput,
): string | null {
  if (!input.displayName.trim()) {
    return "Bitte einen Namen eingeben.";
  }

  if (!input.username.trim()) {
    return "Bitte einen Benutzernamen eingeben.";
  }

  if (/\s/.test(input.username.trim())) {
    return "Der Benutzername darf keine Leerzeichen enthalten.";
  }

  return null;
}

export async function assignStudentToClass(
  studentId: string,
  classroomId: number,
): Promise<void> {
  await apiFetch<unknown>(
    `/classroom/${encodeURIComponent(studentId)}/${classroomId}`,
    { method: "POST" },
  );
}

export async function createStudent(
  input: CreateStudentInput,
): Promise<CreatedStudent> {
  const message = validateStudent(input);
  if (message) throw new Error(message);

  const created = await apiFetch<{
    id: string;
    username: string;
  }>("/auth/admin/student/create", {
    method: "POST",
    body: JSON.stringify({
      username: input.username.trim(),
      displayName: input.displayName.trim(),
    }),
  });

  // Das Backend legt den Schüler ohne Klasse an.
  // Die Klasse wird danach in einem zweiten Aufruf gesetzt.
  let classAssignFailed = false;

  if (input.classroomId !== null) {
    try {
      await assignStudentToClass(
        created.id,
        input.classroomId,
      );
    } catch {
      classAssignFailed = true;
    }
  }

  return {
    id: created.id,
    username: created.username,
    classAssignFailed,
  };
}

export async function deleteStudent(
  studentId: string,
): Promise<void> {
  await apiFetch<void>(
    `/auth/admin/student/${encodeURIComponent(studentId)}`,
    { method: "DELETE" },
  );
}

export function describeStudentError(
  error: unknown,
  action: "create" | "delete" | "assign",
): string {
  if (error instanceof ApiError) {
    if (action === "assign") {
      switch (error.status) {
        case 400:
        case 404:
          return "Schüler oder Klasse wurde nicht gefunden.";
        case 401:
          return "Bitte erneut anmelden.";
        case 403:
          return "Keine Berechtigung, die Klasse zu ändern.";
      }
    }

    switch (error.status) {
      case 400:
        return "Das Backend hat die Eingaben abgelehnt. Bitte überprüfen.";
      case 401:
        return "Bitte erneut anmelden.";
      case 403:
        return "Keine Berechtigung. Nur Administratoren dürfen Schüler verwalten.";
      case 404:
        return "Der Schüler wurde nicht gefunden. Bitte die Liste neu laden.";
      case 409:
        return action === "create"
          ? "Dieser Benutzername ist bereits vergeben."
          : "Der Schüler hat Anwesenheitseinträge und kann nicht gelöscht werden.";
    }
  }

  if (action === "assign") {
    return "Die Klasse konnte nicht zugewiesen werden.";
  }

  return action === "create"
    ? "Der Schüler konnte nicht angelegt werden."
    : "Der Schüler konnte nicht gelöscht werden.";
}
