import type { ConversationKeyView } from "@/types/application/e2e/conversation-key-view";
import type { KeypairView } from "@/types/application/e2e/keypair-view";
import type { PublicKeyView } from "@/types/application/e2e/public-key-view";

import { api } from "../api-client";

export const e2eApi = {
  uploadKeypair: (publicKey: string, encryptedPrivateKey: string, algorithm: string) =>
    api.post<{ id: string; status: string }>("/e2e/keypair", {
      publicKey,
      encryptedPrivateKey,
      algorithm,
    }),

  myKeypair: () => api.get<KeypairView>("/e2e/keypair"),

  userPublicKey: (userId: string) =>
    api.get<PublicKeyView>(`/e2e/keypair/${encodeURIComponent(userId)}`),

  /** Retorna a public key ativa de cada usuario. Quem nao tem keypair nao aparece no mapa. */
  batchPublicKeys: (userIds: string[]) =>
    api.post<Record<string, string>>("/e2e/keypairs/batch", userIds),

  distributeConversationKey: (
    conversationId: string,
    participants: Array<{ userId: string; encryptedKey: string }>,
  ) => api.post<{ status: string }>(`/e2e/conversations/${conversationId}/keys`, participants),

  myConversationKey: (conversationId: string) =>
    api.get<ConversationKeyView>(`/e2e/conversations/${conversationId}/key`),
};
