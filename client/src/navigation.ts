
export type PageId =
  | "dashboard"
  | "attendance"
  | "classes"
  | "students"
  | "rfid"
  | "reports"
  | "settings"
  | "admin";

export const PAGE_TITLES: Record<PageId, string> = {
  dashboard: "Dashboard",
  attendance: "Anwesenheit",
  classes: "Klassen",
  students: "Schüler",
  rfid: "RFID-Scans",
  reports: "Berichte",
  settings: "Einstellungen",
  admin: "Administration",
};

// UI navigation only: the backend remains responsible for authorization.
export function canOpenPage(page: PageId, isAdmin: boolean): boolean {
  return isAdmin || (page !== "admin" && page !== "rfid");
}
