// Base URL for the API server. In local dev, point this at the
// api-server (e.g. http://localhost:5000/api) via a .env file in
// artifacts/gold-shop; in production, serve both behind the same
// origin/proxy and this can stay as the default "/api".
const API_BASE_URL: string =
  (import.meta as unknown as { env?: Record<string, string> }).env?.[
    "VITE_API_BASE_URL"
  ] ?? "/api";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    let body: unknown;
    try {
      body = await res.json();
      if (body && typeof body === "object" && "error" in body && typeof (body as any).error === "string") {
        message = (body as any).error;
      }
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new ApiError(message, res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function buildQuery(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}