import { getCurrentUser } from "./get-current-user";

export function getCurrentUserId() {
  return getCurrentUser()?.id ?? null;
}
