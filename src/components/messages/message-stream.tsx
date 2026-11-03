import { useEffect, useState } from "react";

import { useMessageStream } from "@/lib/message-stream";
import { hasSession } from "@/lib/require-auth";
import { useIsAuthenticated } from "@/lib/use-auth";

/** Keeps the inbox stream open while someone is signed in (same gate as the chat dock). */
export function MessageStream() {
  const authenticated = useIsAuthenticated();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated || !authenticated || !hasSession()) return null;
  return <MessageStreamConnection />;
}

function MessageStreamConnection() {
  useMessageStream();
  return null;
}
