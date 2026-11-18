import { useEffect, useRef, useState } from "react";

import type { Message } from "@/types/application/message/message";
import type { DecryptedResult } from "@/types/lib/decrypted-result";

import { decryptReceived } from "./conversation";
import { decryptMessageBatch } from "./decrypt-message-batch";
import { hasLocalKeys } from "./key-manager";

/** Tempo minimo de loading pra evitar flash de texto cifrado no primeiro load. */
const MIN_DECRYPT_MS = 800;

/**
 * Teto de espera pela decifragem. Se uma mensagem nao resolve dentro dele, ela aparece como
 * placeholder e o loading da thread acaba: sem teto, uma decifragem presa (IndexedDB lento,
 * promessa que rejeita e foi engolida) deixava a conversa no "decifrando..." para sempre.
 */
export const DECRYPT_TIMEOUT_MS = 5_000;

/** Texto do placeholder quando a decifragem estoura o teto (nao acusa cifra quebrada). */
export const TIMEOUT_PLACEHOLDER = "[Mensagem protegida]";

/**
 * Texto em claro por id de mensagem. A thread recebe um array novo a cada pagina que chega (uma
 * mensagem nova, a pagina anterior, uma reacao); sem cache, cada chegada refazia o RSA-OAEP de
 * TODO o historico por causa de uma linha que entrou.
 *
 * A entrada guarda o ciphertext junto: id igual com conteudo diferente nao reaproveita o texto.
 * Teto de entradas: a conversa é memória de sessão, não um arquivo que cresce sem limite; quem
 * sai do teto volta a passar pelo RSA na próxima leitura. `Map` preserva a ordem de inserção,
 * então o mais antigo sai primeiro.
 */
const PLAINTEXT_CACHE_LIMIT = 500;
const plaintextCache = new Map<string, { cipher: string; text: string }>();
let cacheGeneration = 0;

/** Esvazia o cache (testes; e depois de trocar de conta). */
export function clearDecryptedMessageCache(): void {
  plaintextCache.clear();
  cacheGeneration++;
}

function cachePlaintext(id: string, entry: { cipher: string; text: string }): void {
  plaintextCache.set(id, entry);
  while (plaintextCache.size > PLAINTEXT_CACHE_LIMIT) {
    const oldest = plaintextCache.keys().next().value;
    if (oldest === undefined) break;
    plaintextCache.delete(oldest);
  }
}

/**
 * Hook que decifra mensagens E2E em batch. Mensagens sem e2e passam direto.
 * Retorna as mensagens com o texto em claro + flag de decrypting pro primeiro load.
 */
export function useDecryptedMessages(
  messages: Message[],
  currentUserId: string | null,
): DecryptedResult {
  const [decrypted, setDecrypted] = useState<Message[]>([]);
  const [decrypting, setDecrypting] = useState(true);
  const firstDecryptDone = useRef(false);
  const cachedFor = useRef<string | null>(null);

  useEffect(() => {
    // Trocar de conta no mesmo aparelho não pode reaproveitar texto decifrado pela conta anterior.
    if (cachedFor.current !== currentUserId) {
      clearDecryptedMessageCache();
      cachedFor.current = currentUserId;
    }
  }, [currentUserId]);

  useEffect(() => {
    const generation = cacheGeneration;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function decrypt() {
      const start = Date.now();
      const isFirstRun = !firstDecryptDone.current;

      const hasE2e = messages.some((msg) => msg.e2e || msg.replyTo?.e2e);
      const hasKeys = hasE2e && currentUserId ? await hasLocalKeys().catch(() => false) : false;

      // Histórico e citações compartilham cache, teto e isolamento de falha por item da QA.
      const withTimeout = async (msg: Message, userId: string): Promise<string> => {
        const cacheKey = JSON.stringify([userId, msg.conversationId, msg.id]);
        const cached = plaintextCache.get(cacheKey);
        if (cached && cached.cipher === msg.text) return cached.text;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const plaintext = await Promise.race([
            decryptReceived(msg, userId).catch(() => TIMEOUT_PLACEHOLDER),
            new Promise<string>((resolve) => {
              timeout = setTimeout(() => resolve(TIMEOUT_PLACEHOLDER), DECRYPT_TIMEOUT_MS);
            }),
          ]);
          // Uma operação iniciada antes da troca de conta não repopula o cache limpo.
          if (generation === cacheGeneration) {
            cachePlaintext(cacheKey, { cipher: msg.text, text: plaintext });
          }
          return plaintext;
        } finally {
          clearTimeout(timeout);
        }
      };

      const results = await decryptMessageBatch(messages, currentUserId, hasKeys, withTimeout);

      const apply = () => {
        if (isFirstRun) firstDecryptDone.current = true;
        if (!cancelled) {
          setDecrypted(results);
          setDecrypting(false);
        }
      };

      // No primeiro load, garante um tempo minimo pra evitar flash.
      if (isFirstRun && hasE2e && hasKeys) {
        const elapsed = Date.now() - start;
        if (elapsed < MIN_DECRYPT_MS) {
          timer = setTimeout(apply, MIN_DECRYPT_MS - elapsed);
          return;
        }
      }

      apply();
    }

    decrypt();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [messages, currentUserId]);

  return { messages: decrypted, decrypting };
}
