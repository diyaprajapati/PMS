export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiClient<TResponse>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    // Global 401 handling (client-side): redirect to login and stop further usage.
    if (response.status === 401 && typeof window !== "undefined") {
      // Use hard navigation so history/back stack doesn't expose protected pages.
      window.location.replace("/login");
    }

    const message =
      (payload as { error?: string; message?: string } | null)?.error ??
      (payload as { error?: string; message?: string } | null)?.message ??
      "Request failed";

    throw new ApiError(message, response.status);
  }

  return payload as TResponse;
}
