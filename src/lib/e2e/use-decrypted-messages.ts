import { useEffect, useRef, useState } from "react";

import type { Message } from "@/types/application/message/message";
import type { DecryptedResult } from "@/types/lib/decrypted-result";

import { decryptReceived } from "./conversation";
import { hasLocalKeys } from "./key-manager";

/** Tempo minimo de loading pra evitar flash de texto cifrado no primeiro load. */
const MIN_DECRYPT_MS = 800;

/**
 * Hook que decifra mensagens E2E em batch. Mensagens sem e2e passam direto.
 * Retorna as mensagens com o texto em claro + flag de decrypting pro primeiro load.
 */
export function useDecryptedMessages(messages: Message[]): DecryptedResult {
  const [decrypted, setDecrypted] = useState<Message[]>([]);
  const [decrypting, setDecrypting] = useState(true);
  const firstDecryptDone = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function decrypt() {
      const start = Date.now();
      const isFirstRun = !firstDecryptDone.current;

      const hasE2e = messages.some((msg) => msg.e2e);
      if (!hasE2e) {
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

      const results = await Promise.all(
        messages.map(async (msg) => {
          if (!msg.e2e) return msg;
          const plaintext = await decryptReceived(msg);
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
  }, [messages]);

  return { messages: decrypted, decrypting };
}
