import type { ConnectionStatusResult } from "@/types/application/network/connection-status-result";
import type { ConnectionAction } from "@/types/lib/network/connection-action";

/**
 * O `status` é o mesmo para os dois lados: só `requestedByMe` separa quem pediu de quem recebeu.
 * A comparação com `false` é de propósito: enquanto o front sobe antes do backend o campo vem
 * ausente, e oferecer "aceitar" a quem pediu daria 403.
 */
export function connectionAction(
  connection: Partial<Pick<ConnectionStatusResult, "status" | "requestedByMe">> | undefined,
): ConnectionAction {
  switch (connection?.status) {
    case "ACCEPTED":
      return "disconnect";
    case "PENDING":
      return connection.requestedByMe === false ? "respond" : "cancel";
    default:
      return "connect";
  }
}
