import { useSyncExternalStore } from "react";

import { subscribeAuthSessionChange } from "@/lib/auth-session/subscribe-auth-session-change";
import { isAuthenticated } from "@/lib/is-authenticated";

const getServerSnapshot = () => false;

export function useIsAuthenticated() {
  return useSyncExternalStore(subscribeAuthSessionChange, isAuthenticated, getServerSnapshot);
}
