import { ApiError } from "@/lib/api-client";

export async function parseApiResponse<T>(response: Response, path: string): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      errorBody?.code,
      errorBody?.message ?? response.statusText,
      path,
    );
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const data = await response.json();
  return data?.body !== undefined ? (data.body as T) : (data as T);
}
