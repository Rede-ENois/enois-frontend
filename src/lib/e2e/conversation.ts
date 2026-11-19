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
 * 3. Decifra com minha RSA privada (tentando também as privadas antigas do histórico local)
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
import { getAllPrivateKeys } from "./key-manager";

/** Cache da conversation key importada (fallback pra mensagens antigas). */
const legacyConvKeyCache = new Map<string, CryptoKey>();
/** Conversas que ja falharam na decifra — nao tenta de novo nesta sessao. */
const legacyConvKeyFailed = new Set<string>();
/** Wrapped key → AES key já aberta: mensagens do mesmo lote não refazem o RSA. */
const unwrappedAesKeys = new Map<string, CryptoKey>();
/** Wrapped keys que nenhuma privada local abriu — nao tenta de novo nesta sessao. */
const unwrapFailed = new Set<string>();

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
 * Abre a copia da AES key cifrada pra mim, tentando TODAS as privadas locais: a principal e
 * as antigas do histórico. Mensagem recebida na época de um keypair anterior foi cifrada para
 * a pública DAQUELE par — parar na primeira tentativa fazia texto legível virar "não foi
 * possível decifrar" pra quem tinha chave antiga guardada.
 */
async function unwrapForMe(
  wrappedKey: string,
  privateKeysBase64: string[],
): Promise<CryptoKey | null> {
  const cached = unwrappedAesKeys.get(wrappedKey);
  if (cached) return cached;
  if (unwrapFailed.has(wrappedKey)) return null;
  for (const privateKeyBase64 of privateKeysBase64) {
    try {
      const privateKey = await importPrivateKey(privateKeyBase64);
      const aesKeyBase64 = await decryptWithPrivateKey(wrappedKey, privateKey);
      const aesKey = await importSymmetricKey(aesKeyBase64);
      unwrappedAesKeys.set(wrappedKey, aesKey);
      return aesKey;
    } catch {
      // Não é a privada que abriu esta mensagem — tenta a próxima do histórico local.
    }
  }
  unwrapFailed.add(wrappedKey);
  return null;
}

/**
 * Decifra uma mensagem recebida com e2e=true.
 * Suporta formato novo (encryptedKeys) e antigo (conversation key) pra compatibilidade.
 */
export async function decryptReceived(message: Message, currentUserId: string): Promise<string> {
  if (!message.e2e || !message.iv) return message.text;

  const privateKeysBase64 = await getAllPrivateKeys();
  if (privateKeysBase64.length === 0) return "[Mensagem cifrada — configure o E2E]";

  // Formato novo: per-message encrypted keys.
  // O backend devolve encrypted_keys como string JSON (coluna TEXT); parseia aqui.
  const keys: Record<string, string> | null =
    message.encryptedKeys && typeof message.encryptedKeys === "string"
      ? JSON.parse(message.encryptedKeys)
      : (message.encryptedKeys ?? null);

  if (keys && keys[currentUserId]) {
    const aesKey = await unwrapForMe(keys[currentUserId], privateKeysBase64);
    if (!aesKey) return "[Nao foi possivel decifrar esta mensagem]";
    return await decryptMessage(message.text, message.iv, aesKey);
  }

  // Formato antigo: conversation key (mensagens anteriores a migracao).
  // Se ja falhou nesta sessao, nao tenta de novo (evita centenas de requests).
  if (legacyConvKeyFailed.has(message.conversationId)) {
    return "[Mensagem cifrada — chave nao disponivel]";
  }
  try {
    return await decryptWithConversationKey(message, privateKeysBase64[0]);
  } catch {
    legacyConvKeyFailed.add(message.conversationId);
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
