import { clearSanctionAccess, markSanctionAccess } from "@/stores/sanction-access.store";
import type { AuthResponse } from "@/types/application/auth/auth-response";

import { clearSession } from "../api-client";
import { storeSession } from "../session";

/** Só chamado após o servidor concluir a confirmação de identidade e dos fatores. */
export function acceptAuthSession(response: AuthResponse): "FULL" | "SANCTIONS_ONLY" {
  clearSession();
  if (response.accessScope === "SANCTIONS_ONLY") {
    markSanctionAccess();
    return "SANCTIONS_ONLY";
  }
  clearSanctionAccess();
  storeSession(response);
  return "FULL";
}
