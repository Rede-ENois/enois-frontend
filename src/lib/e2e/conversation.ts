/**
 * E2E per-message: cada mensagem gera sua propria AES key descartavel.
 *
 * Envio:
 * 1. Gera AES-256-GCM key
 * 2. Cifra o texto
 * 3. Busca a public key RSA de cada participante (batch)
 * 4. Cifra a AES key com cada public key
 * 5. Envia ciphertext + iv + {userId: encryptedAesKey}
 *
 * Recebimento:
 * 1. Mensagem chega com e2e=true e encryptedKeys
 * 2. Pega minha copia da AES key cifrada
 * 3. Decifra com minha RSA privada
 * 4. Decifra o texto
 */
import type { Message } from "@/types/application/message/message";

import { e2eApi } from "@/lib/api/e2e";

import {
  decryptMessage,
  decryptWithPrivateKey,
  encryptForRecipient,
  encryptMessage,
  exportSymmetricKey,
  generateConversationKey,
  importPrivateKey,
  importPublicKey,
  importSymmetricKey,
} from "./crypto";
import { getLocalPrivateKey } from "./key-manager";

/** Cache da conversation key importada (fallback pra mensagens antigas). */
const legacyConvKeyCache = new Map<string, CryptoKey>();

/**
 * Cifra uma mensagem pra envio. Retorna ciphertext, iv e as chaves cifradas por participante.
 * Lanca erro se algum participante nao tem keypair E2E (nao envia plaintext).
 */
export async function encryptForSend(
  conversationId: string,
  plaintext: string,
  participantIds: string[],
): Promise<{ ciphertext: string; iv: string; encryptedKeys: Record<string, string> }> {
  const pubKeysMap = await e2eApi.batchPublicKeys(participantIds);
  const missing = participantIds.filter((id) => !pubKeysMap[id]);
  if (missing.length > 0) {
    throw new Error(
      `E2E indisponivel: ${missing.length} participante(s) sem criptografia configurada.`,
    );
  }

  const aesKey = await generateConversationKey();
  const { ciphertext, iv } = await encryptMessage(plaintext, aesKey);
  const aesKeyBase64 = await exportSymmetricKey(aesKey);

  const encryptedKeys: Record<string, string> = {};
  for (const [userId, publicKeyBase64] of Object.entries(pubKeysMap)) {
    const pubKey = await importPublicKey(publicKeyBase64);
    encryptedKeys[userId] = await encryptForRecipient(aesKeyBase64, pubKey);
  }

  return { ciphertext, iv, encryptedKeys };
}

/**
 * Decifra uma mensagem recebida com e2e=true.
 * Suporta formato novo (encryptedKeys) e antigo (conversation key) pra compatibilidade.
 */
export async function decryptReceived(message: Message, currentUserId: string): Promise<string> {
  if (!message.e2e || !message.iv) return message.text;

  const privateKeyBase64 = await getLocalPrivateKey();
  if (!privateKeyBase64) return "[Mensagem cifrada — configure o E2E]";

  // Formato novo: per-message encrypted keys.
  if (message.encryptedKeys && message.encryptedKeys[currentUserId]) {
    try {
      const privateKey = await importPrivateKey(privateKeyBase64);
      const aesKeyBase64 = await decryptWithPrivateKey(
        message.encryptedKeys[currentUserId],
        privateKey,
      );
      const aesKey = await importSymmetricKey(aesKeyBase64);
      return await decryptMessage(message.text, message.iv, aesKey);
    } catch {
      return "[Nao foi possivel decifrar esta mensagem]";
    }
  }

  // Formato antigo: conversation key (mensagens anteriores a migracao).
  try {
    return await decryptWithConversationKey(message, privateKeyBase64);
  } catch {
    return "[Mensagem cifrada — chave nao disponivel]";
  }
}

/** Fallback pra mensagens antigas que usam conversation key. Cache por conversa. */
async function decryptWithConversationKey(
  message: Message,
  privateKeyBase64: string,
): Promise<string> {
  let key = legacyConvKeyCache.get(message.conversationId);
  if (!key) {
    const existing = await e2eApi.myConversationKey(message.conversationId);
    if (!existing.encryptedKey) throw new Error("sem chave de conversa");
    const privateKey = await importPrivateKey(privateKeyBase64);
    const symmetricKeyBase64 = await decryptWithPrivateKey(existing.encryptedKey, privateKey);
    key = await importSymmetricKey(symmetricKeyBase64);
    legacyConvKeyCache.set(message.conversationId, key);
  }
  return await decryptMessage(message.text, message.iv!, key);
}
