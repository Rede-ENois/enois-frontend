import { useSyncExternalStore } from "react";

import { isAuthenticated } from "@/lib/is-authenticated";
import { subscribeAuthSessionChange } from "@/lib/auth-session/subscribe-auth-session-change";

const getServerSnapshot = () => false;

export function useIsAuthenticated() {
  return useSyncExternalStore(subscribeAuthSessionChange, isAuthenticated, getServerSnapshot);
}
