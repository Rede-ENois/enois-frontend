import { useSyncExternalStore } from "react";

import { isAuthenticated } from "@/lib/is-authenticated";

const subscribe = () => () => {};
const getServerSnapshot = () => false;

export function useIsAuthenticated() {
  return useSyncExternalStore(subscribe, isAuthenticated, getServerSnapshot);
}
