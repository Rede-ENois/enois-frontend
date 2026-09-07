import { useState } from "react";

export function useNetworkLocalConnectionStatus() {
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});

  return {
    localStatus,
    markRequested: (userId: string) =>
      setLocalStatus((status) => ({ ...status, [userId]: "REQUESTED" })),
    markRemoved: (userId: string) =>
      setLocalStatus((status) => ({ ...status, [userId]: "REMOVED" })),
  };
}
