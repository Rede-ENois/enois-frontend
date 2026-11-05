/**
 * E2E por conversa: cifra antes de enviar, decifra ao receber.
 *
 * Fluxo de envio:
 * 1. Busca chave simétrica da conversa (cache local ou backend)
 * 2. Se não existe, gera e distribui pra todos os participantes
 * 3. Se existe, redistribui em background pra quem ainda não tem
 * 4. Cifra a mensagem com AES-256-GCM
 * 5. Envia ciphertext + iv pro backend
 *
 * Fluxo de recebimento:
 * 1. Mensagem chega com e2e=true
 * 2. Busca chave simétrica da conversa
 * 3. Decifra com AES-256-GCM
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
import { getLocalPrivateKey, getLocalPublicKey, restoreFromBackup } from "./key-manager";

/** Cache em memória das chaves simétricas já importadas (por conversa). */
const conversationKeyCache = new Map<string, CryptoKey>();
/** Lock pra evitar race condition: dois envios simultâneos gerando chaves diferentes. */
const pendingKeyCreation = new Map<string, Promise<CryptoKey>>();
/** Conversas que já redistribuíram nesta sessão (evita repetir a cada mensagem). */
const redistributedThisSession = new Set<string>();

/**
 * Distribui a chave simétrica da conversa para todos os participantes que têm public key.
 * Idempotente: quem já tem recebe upsert no backend, sem efeito.
 */
async function distributeToAll(
  conversationId: string,
  symmetricKeyBase64: string,
  participantIds: string[],
): Promise<void> {
  const pubKeys = await Promise.all(
    participantIds.map(async (userId) => ({ userId, view: await e2eApi.userPublicKey(userId) })),
  );
  const distributions: Array<{ userId: string; encryptedKey: string }> = [];
  for (const { userId, view } of pubKeys) {
    if (!view.publicKey) continue;
    const recipientPubKey = await importPublicKey(view.publicKey);
    const encrypted = await encryptForRecipient(symmetricKeyBase64, recipientPubKey);
    distributions.push({ userId, encryptedKey: encrypted });
  }
  if (distributions.length > 0) {
    await e2eApi.distributeConversationKey(conversationId, distributions);
  }
}

/** Obtém (ou cria) a chave simétrica da conversa. */
async function getOrCreateConversationKey(
  conversationId: string,
  participantIds: string[],
): Promise<CryptoKey> {
  const cached = conversationKeyCache.get(conversationId);
  if (cached) return cached;

  // Evita race: se outra chamada já está criando a chave, espera por ela.
  const pending = pendingKeyCreation.get(conversationId);
  if (pending) return pending;

  const promise = createOrFetchKey(conversationId, participantIds);
  pendingKeyCreation.set(conversationId, promise);
  try {
    return await promise;
  } finally {
    pendingKeyCreation.delete(conversationId);
  }
}

async function createOrFetchKey(
  conversationId: string,
  participantIds: string[],
): Promise<CryptoKey> {
  // Tenta buscar do backend (já foi distribuída antes).
  const existing = await e2eApi.myConversationKey(conversationId);
  if (existing.encryptedKey) {
    const privateKeyBase64 = await getLocalPrivateKey();
    if (privateKeyBase64) {
      try {
        const privateKey = await importPrivateKey(privateKeyBase64);
        const symmetricKeyBase64 = await decryptWithPrivateKey(existing.encryptedKey, privateKey);
        const key = await importSymmetricKey(symmetricKeyBase64);
        conversationKeyCache.set(conversationId, key);

        // Redistribui em background pra participantes que possam ter entrado no E2E depois.
        // Roda uma vez por conversa por sessão (o set evita repetir). Se falhar, tenta de
        // novo no próximo envio (não marca como redistribuída).
        if (!redistributedThisSession.has(conversationId)) {
          distributeToAll(conversationId, symmetricKeyBase64, participantIds)
            .then(() => redistributedThisSession.add(conversationId))
            .catch((err) => console.warn("[e2e] redistribuicao falhou, tentara de novo:", err));
        }

        return key;
      } catch {
        // Keypair diferente (outro device gerou): tenta sincronizar com o servidor antes de
        // desistir e gerar uma chave nova (que tornaria as mensagens antigas indecifráveis).
        const synced = await trySyncKeypairAndRetry(existing.encryptedKey, conversationId);
        if (synced) return synced;
      }
    }
  }

  // Não existe ou não conseguiu decifrar: gera e distribui.
  const newKey = await generateConversationKey();
  const symmetricKeyBase64 = await exportSymmetricKey(newKey);

  await distributeToAll(conversationId, symmetricKeyBase64, participantIds);
  conversationKeyCache.set(conversationId, newKey);
  redistributedThisSession.add(conversationId);
  return newKey;
}

/**
 * Quando a chave privada local não decifra a chave de conversa (keypair mismatch), verifica se
 * o servidor tem uma chave pública diferente da local. Se tiver, o dispositivo está desatualizado
 * e precisa da senha do usuário pra restaurar — não podemos fazer isso automaticamente aqui, mas
 * pelo menos não geramos uma chave nova que iria tornar mensagens antigas permanentemente perdidas.
 *
 * Retorna a chave importada se conseguiu sincronizar, ou null se não foi possível.
 */
async function trySyncKeypairAndRetry(
  encryptedConversationKey: string,
  conversationId: string,
): Promise<CryptoKey | null> {
  try {
    const serverPub = await e2eApi.myKeypair();
    const localPub = await getLocalPublicKey();
    if (serverPub.publicKey === localPub) return null; // Mesmo keypair, o erro é outro.

    // Keypair diferente no servidor — precisaria da senha pra restaurar. Sem senha disponível
    // aqui, logamos o problema pra o usuário saber que precisa reconfigurar.
    console.warn(
      "[e2e] keypair local difere do servidor. Relogin com senha necessario para sincronizar.",
    );
    return null;
  } catch {
    return null;
  }
}

/** Cifra uma mensagem pra envio E2E. */
export async function encryptForSend(
  conversationId: string,
  plaintext: string,
  participantIds: string[],
): Promise<{ ciphertext: string; iv: string }> {
  const key = await getOrCreateConversationKey(conversationId, participantIds);
  return encryptMessage(plaintext, key);
}

/** Decifra uma mensagem recebida com e2e=true. Retorna o texto em claro. */
export async function decryptReceived(message: Message): Promise<string> {
  if (!message.e2e || !message.iv) return message.text;

  const cached = conversationKeyCache.get(message.conversationId);
  if (cached) {
    try {
      return await decryptMessage(message.text, message.iv, cached);
    } catch {
      return "[Não foi possível decifrar esta mensagem]";
    }
  }

  // Busca a chave da conversa.
  const existing = await e2eApi.myConversationKey(message.conversationId);
  if (!existing.encryptedKey) return "[Mensagem cifrada — chave não disponível]";

  const privateKeyBase64 = await getLocalPrivateKey();
  if (!privateKeyBase64) return "[Mensagem cifrada — configure o E2E]";

  try {
    const privateKey = await importPrivateKey(privateKeyBase64);
    const symmetricKeyBase64 = await decryptWithPrivateKey(existing.encryptedKey, privateKey);
    const key = await importSymmetricKey(symmetricKeyBase64);
    conversationKeyCache.set(message.conversationId, key);
    return await decryptMessage(message.text, message.iv, key);
  } catch {
    // Keypair mismatch: não gera chave nova (isso é leitura, não envio). Avisa que precisa sync.
    const localPub = await getLocalPublicKey();
    try {
      const serverKp = await e2eApi.myKeypair();
      if (serverKp.publicKey !== localPub) {
        return "[Mensagem cifrada — entre com a senha para sincronizar suas chaves]";
      }
    } catch {
      /* servidor indisponível */
    }
    return "[Mensagem cifrada — chave não disponível]";
  }
}

/** Limpa o cache (logout, troca de chave). */
export function clearConversationKeyCache(): void {
  conversationKeyCache.clear();
  redistributedThisSession.clear();
}
