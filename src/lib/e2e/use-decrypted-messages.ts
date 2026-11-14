import { useEffect, useRef, useState } from "react";

import type { Message } from "@/types/application/message/message";
import type { DecryptedResult } from "@/types/lib/decrypted-result";

import { decryptReceived } from "./conversation";
import { hasLocalKeys } from "./key-manager";

/** Tempo minimo de loading pra evitar flash de texto cifrado no primeiro load. */
const MIN_DECRYPT_MS = 800;

/**
 * Texto em claro por id de mensagem. A thread recebe um array novo a cada pagina que chega (uma
 * mensagem nova, a pagina anterior, uma reacao); sem cache, cada chegada refazia o RSA-OAEP de
 * TODO o historico por causa de uma linha que entrou.
 *
 * A entrada guarda o ciphertext junto: id igual com conteudo diferente nao reaproveita o texto.
 */
const plaintextCache = new Map<string, { cipher: string; text: string }>();

/** Esvazia o cache (testes; e depois de trocar de conta). */
export function clearDecryptedMessageCache(): void {
  plaintextCache.clear();
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
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function decrypt() {
      const start = Date.now();
      const isFirstRun = !firstDecryptDone.current;

      const hasE2e = messages.some((msg) => msg.e2e);
      if (!hasE2e || !currentUserId) {
        if (isFirstRun) firstDecryptDone.current = true;
        if (!cancelled) {
          setDecrypted(messages);
          setDecrypting(false);
        }
        return;
      }

      const hasKeys = await hasLocalKeys();
      if (!hasKeys) {
        if (isFirstRun) firstDecryptDone.current = true;
        if (!cancelled) {
          setDecrypted(
            messages.map((msg) => (msg.e2e ? { ...msg, text: "🔒 Mensagem cifrada" } : msg)),
          );
          setDecrypting(false);
        }
        return;
      }

      // Só o que ainda não foi decifrado passa pelo RSA: o histórico já lido vem do cache.
      const results = await Promise.all(
        messages.map(async (msg) => {
          if (!msg.e2e) return msg;
          const cached = plaintextCache.get(msg.id);
          if (cached && cached.cipher === msg.text) return { ...msg, text: cached.text };
          const plaintext = await decryptReceived(msg, currentUserId);
          plaintextCache.set(msg.id, { cipher: msg.text, text: plaintext });
          return { ...msg, text: plaintext };
        }),
      );

      const apply = () => {
        if (isFirstRun) firstDecryptDone.current = true;
        if (!cancelled) {
          setDecrypted(results);
          setDecrypting(false);
        }
      };

      // No primeiro load, garante um tempo minimo pra evitar flash.
      if (isFirstRun) {
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
