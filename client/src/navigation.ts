
export type PageId =
  | "dashboard"
  | "attendance"
  | "classes"
  | "students"
  | "rfid"
  | "reports"
  | "settings";

export const PAGE_TITLES: Record<PageId, string> = {
  dashboard: "Dashboard",
  attendance: "Anwesenheit",
  classes: "Klassen",
  students: "Schüler",
  rfid: "RFID-Scans",
  reports: "Berichte",
  settings: "Einstellungen",
};
