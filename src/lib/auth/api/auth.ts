import type { AuthResponse } from "@/types/auth/auth-response";
import type { LoginInput } from "@/types/auth/login-input";

import { apiRequest } from "@/lib/api-request";

export function login(data: LoginInput) {
  return apiRequest<AuthResponse>("POST", "/auth/login", data, { idempotent: true });
}
