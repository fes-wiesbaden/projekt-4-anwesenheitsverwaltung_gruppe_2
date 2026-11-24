
import type { ApiDashboard } from "../types/api";

export type CardVariant =
  | "total"
  | "present"
  | "late"
  | "absent";

export interface DashboardCard {
  key: string;
  title: string;
  value: number;
  subtitle: string;
  variant: CardVariant;
}

export function formatQuote(value: number): string {
  return `${value.toFixed(1)} %`;
}

export function buildDashboardCards(
  data: ApiDashboard,
): DashboardCard[] {
  return [
    {
      key: "students",
      title: "Schüler gesamt",
      value: data.totalStudents,
      subtitle: `in ${data.totalClasses} Klasse(n)`,
      variant: "total",
    },
    {
      key: "present",
      title: "Eingecheckt",
      value: data.present,
      subtitle: `Quote ${formatQuote(data.attendancePercentage)}`,
      variant: "present",
    },
    {
      key: "late",
      title: "Verspätet",
      value: data.lateArrivals,
      subtitle: "laut Datensatz",
      variant: "late",
    },
    {
      key: "absent",
      title: "Abwesend (laut Datensatz)",
      value: data.absent,
      subtitle: `von ${data.records} Datensätzen`,
      variant: "absent",
    },
  ];
}

export function hasNoRecords(
  data: ApiDashboard,
): boolean {
  return data.records === 0;
}
