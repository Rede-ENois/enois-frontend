import type { ConnectionRequest } from "@/types/application/network/connection-request";
import type { NetworkRequestOutcome } from "@/types/lib/network/network-request-outcome";
import type { NetworkRequest } from "@rede-enois/design-system/domain";

import { dataSemAno } from "@/lib/date/format";

/**
 * Pending requests as the invitations panel draws them, with the outcome of each answered row on
 * top. A row the server already dropped (accepted, declined) stays with its outcome, in the place
 * it had when it was answered, until the page is left: the list never jumps under the cursor.
 *
 * A request without `peer` comes from a backend older than the one that resolves the other person;
 * it is skipped instead of breaking the page during the deploy window.
 */
export function networkRequests(
  items: ConnectionRequest[],
  outcomes: Record<string, NetworkRequestOutcome>,
): NetworkRequest[] {
  const pending = items
    .filter((request) => request.status === "PENDING" && request.peer)
    .map((request): NetworkRequest => ({
      userId: request.peer.id,
      direction: request.direction,
      name: request.peer.name,
      username: request.peer.username,
      headline: request.peer.headline,
      avatar: request.peer.avatar,
      avatarFrame: request.peer.avatarFrame,
      nameStyle: request.peer.nameStyle,
      profileHref: `/perfil/${request.peer.username}`,
      dateLabel: dataSemAno(request.createdAt),
      status: "pending",
    }));
  const pendingIds = new Set(pending.map((request) => request.userId));
  const rows = pending.map((request) => outcomes[request.userId]?.row ?? request);
  Object.values(outcomes)
    .filter((outcome) => !pendingIds.has(outcome.row.userId))
    .sort((a, b) => a.index - b.index)
    .forEach((outcome) => rows.splice(outcome.index, 0, outcome.row));
  return rows;
}
