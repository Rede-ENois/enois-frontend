import { useQuery } from "@tanstack/react-query";

import { getSessionToken } from "./session/get-session-token";
import { currentUserQueryOptions } from "./current-user-query-options";

export function useCurrentUser() {
  const token = getSessionToken();

  return useQuery({
    ...currentUserQueryOptions(),
    enabled: !!token,
  });
}
