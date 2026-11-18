import { ApiError } from "../api/http";

import type {
  AttendanceRow,
} from "../types/attendance";

export interface RowActions {
  canCheckin: boolean;
  canCheckout: boolean;
}

export function getRowActions(
  row: Pick<
    AttendanceRow,
    "checkIn" | "checkOut"
  >,
  isToday: boolean,
): RowActions {
  if (!isToday) {
    return {
      canCheckin: false,
      canCheckout: false,
    };
  }

  const hasIn = row.checkIn !== null;
  const hasOut = row.checkOut !== null;

  return {
    canCheckin: !hasIn && !hasOut,
    canCheckout: hasIn && !hasOut,
  };
}

export function describeActionError(
  error: unknown,
): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 409:
        return "Aktion nicht möglich: Es gibt keine aktive Unterrichtseinheit oder der Schüler ist bereits erfasst.";

      case 401:
      case 403:
        return "Keine Berechtigung oder Sitzung abgelaufen. Bitte neu anmelden.";

      case 404:
        return "Schüler oder Klasse wurde nicht gefunden.";
    }
  }

  return "Die Aktion ist fehlgeschlagen.";
}