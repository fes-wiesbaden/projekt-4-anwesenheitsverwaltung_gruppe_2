const TOKEN_KEY = "token";

export class ApiError extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token =
    sessionStorage.getItem(TOKEN_KEY);

  const headers =
    new Headers(init.headers);

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  if (
    init.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const response = await fetch(
    `/api${path}`,
    {
      ...init,
      headers,
    },
  );

  if (!response.ok) {
    const message =
      await response.text();

    throw new ApiError(
      response.status,
      message ||
        `Anfrage fehlgeschlagen (${response.status})`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}