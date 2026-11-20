
import { apiFetch } from "../api/http";
import type { ApiDashboard } from "../types/api";

export function getDashboard(): Promise<ApiDashboard> {
  return apiFetch<ApiDashboard>(
    "/reports/dashboard",
  );
}
