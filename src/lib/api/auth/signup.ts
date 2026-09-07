import type { AuthResponse } from "@/types/application/auth/auth-response";
import type { SignupInput } from "@/types/application/auth/signup-input";

import { apiRequest } from "@/lib/api-request";

export function signup(data: SignupInput) {
  return apiRequest<AuthResponse>("POST", "/auth/signup", data, { idempotent: true });
}
