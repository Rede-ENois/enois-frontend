import type { ServerEntry } from "@/types/server/server-entry";

let serverEntryPromise: Promise<ServerEntry> | undefined;

export async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (module) => (module.default ?? module) as ServerEntry,
    );
  }

  return serverEntryPromise;
}
