import { redirect } from "@tanstack/react-router";

import { getSessionToken } from "./auth/session/get-session-token";

export function requireAuth() {
  if (typeof window === "undefined") return;
  if (!getSessionToken()) {
    throw redirect({ to: "/entrar", search: { tab: "login" } });
  }
}
