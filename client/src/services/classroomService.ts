import { apiFetch } from "../api/http";

export async function getAvailableClassrooms(): Promise<string[]> {
  return apiFetch<string[]>(
    "/classroom/allClassrooms",
  );
}