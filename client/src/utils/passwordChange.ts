
import { ApiError } from "../api/http";

export const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordChange(
  oldPassword: string,
  newPassword: string,
  confirmation: string,
): string | null {
  if (oldPassword.trim() === "") {
    return "Bitte das aktuelle Passwort eingeben.";
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `Das neue Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`;
  }

  if (newPassword !== confirmation) {
    return "Die beiden neuen Passwörter stimmen nicht überein.";
  }

  if (newPassword === oldPassword) {
    return "Das neue Passwort muss sich vom aktuellen unterscheiden.";
  }

  return null;
}

export function describePasswordError(
  error: unknown,
): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Das aktuelle Passwort ist falsch oder die Anmeldung ist nicht mehr gültig.";
    }

    if (error.status === 403) {
      return "Keine Berechtigung für die Passwortänderung.";
    }

    if (error.status === 400) {
      return "Die Passwortänderung wurde vom Server abgelehnt. Bitte die Eingaben prüfen.";
    }
  }

  return "Das Passwort konnte nicht geändert werden.";
}
