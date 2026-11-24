import { apiFetch } from "../api/http";
import type {
  ApiDashboard,
  ApiPeriodReport,
} from "../types/api";

export function getDashboard(): Promise<ApiDashboard> {
  return apiFetch<ApiDashboard>(
    "/reports/dashboard",
  );
}

export function getPeriodReport(
  from: string,
  to: string,
): Promise<ApiPeriodReport> {
  const params = new URLSearchParams({
    from,
    to,
  });

  return apiFetch<ApiPeriodReport>(
    `/reports/attendance/weekly?${params.toString()}`,
  );
}

