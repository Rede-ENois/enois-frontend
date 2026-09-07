import { ApiError } from "@/lib/api-client";

export function createApiNetworkError(path: string) {
  return new ApiError(
    0,
    "NETWORK_ERROR",
    "Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está no ar.",
    path,
  );
}
