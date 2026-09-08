import type { AuthResponse } from "@/types/auth/auth-response";
import type { SignupInput } from "@/types/auth/signup-input";

import { apiRequest } from "@/lib/api-request";

export function signup(data: SignupInput) {
  return apiRequest<AuthResponse>("POST", "/auth/signup", data, { idempotent: true });
}
