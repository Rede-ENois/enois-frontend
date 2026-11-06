# E2E Per-Message: Simplificacao da Criptografia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o sistema de chave simetrica por conversa por cifragem per-message, eliminando conversation keys, redistribuicao, caches e race conditions.

**Architecture:** Cada mensagem gera uma AES-256-GCM key descartavel, cifra o texto, e envia N copias da AES key (uma por participante, cifrada com o RSA publico de cada um). Decifrar = achar minha copia da AES key, decifrar com minha RSA privada, decifrar o texto. Sem estado compartilhado, sem cache de conversa, sem redistribuicao.

**Tech Stack:** WebCrypto (RSA-OAEP 2048, AES-256-GCM), Spring Boot 4, MariaDB 11.4, Flyway, Vitest

**Repos:** enois-backend + enois-frontend (PRs coordenados pra qa)

---

## Contexto: O que muda

| Antes (per-conversation)                                            | Depois (per-message)                       |
| ------------------------------------------------------------------- | ------------------------------------------ |
| Tabela `conversation_e2e_keys` com chave simetrica por conversa     | Coluna `encrypted_keys` na mensagem (JSON) |
| `distributeToAll`, `redistributedThisSession`, `pendingKeyCreation` | Deletados                                  |
| `conversationKeyCache` em memoria                                   | Deletado                                   |
| Race condition multi-tab gerando chaves diferentes                  | Impossivel (sem estado compartilhado)      |
| Participante sem keypair pulado silenciosamente                     | Erro explicito no envio                    |
| Falha de cifragem envia plaintext                                   | Bloqueia o envio com erro                  |

## Compatibilidade

Mensagens antigas com `e2e=true` e `iv` (formato antigo) continuam no banco. O frontend precisa detectar:

- Mensagem antiga: `e2e=true`, `iv` preenchido, `encrypted_keys` null → fallback pro decryptor antigo (tenta conversation key)
- Mensagem nova: `e2e=true`, `iv` preenchido, `encrypted_keys` preenchido → per-message decrypt

O backend para de usar `conversation_e2e_keys` pra mensagens novas mas nao apaga a tabela (mensagens antigas dependem dela).

---

## Task 1: Backend — Migration e campo encrypted_keys na mensagem

**Files:**

- Create: `enois-backend/src/main/resources/db/migration/V243__message_encrypted_keys.sql`
- Modify: `enois-backend/src/main/java/com/socialcoisa/rede/messaging/domain/Message.java`
- Modify: `enois-backend/src/main/java/com/socialcoisa/rede/messaging/adapters/out/persistence/MessageJpaEntity.java`

- [ ] **Step 1: Criar a migration**

```sql
-- V243__message_encrypted_keys.sql
-- Per-message E2E: cada mensagem carrega as copias cifradas da AES key,
-- uma por participante. JSON: {"userId":"encryptedAesKeyBase64", ...}
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_keys TEXT NULL;
```

- [ ] **Step 2: Adicionar campo no domain Message.java**

No record/classe `Message`, adicionar campo `encryptedKeys` (String, nullable). Nos factory methods:

Em `createE2e`: adicionar overload que recebe `encryptedKeys`:

```java
public static Message createE2e(String id, String conversationId, String senderId, String ciphertext,
    String iv, String encryptedKeys, List<String> mediaIds, boolean mediaSpoiler, String replyToId) {
    Message msg = new Message(id, conversationId, senderId, ciphertext, mediaIds, mediaSpoiler, true, iv,
        replyToId, Instant.now());
    msg.encryptedKeys = encryptedKeys;
    return msg;
}
```

Em `restoreE2e`: adicionar overload com `encryptedKeys`.

- [ ] **Step 3: Adicionar campo no MessageJpaEntity**

```java
@Column(name = "encrypted_keys", columnDefinition = "TEXT")
private String encryptedKeys;
```

Adicionar no `toDomain()` e `fromDomain()`.

- [ ] **Step 4: Commit**

```bash
git add src/main/resources/db/migration/V243__message_encrypted_keys.sql \
  src/main/java/com/socialcoisa/rede/messaging/domain/Message.java \
  src/main/java/com/socialcoisa/rede/messaging/adapters/out/persistence/MessageJpaEntity.java
git commit -m "feat(e2e): campo encrypted_keys na mensagem pra cifragem per-message"
```

---

## Task 2: Backend — Endpoint aceita encrypted_keys no envio e devolve na leitura

**Files:**

- Modify: `enois-backend/src/main/java/com/socialcoisa/rede/messaging/adapters/in/web/MessagingContractController.java`
- Modify: `enois-backend/src/main/java/com/socialcoisa/rede/messaging/application/MessagingService.java`

- [ ] **Step 1: Atualizar SendMessageRequest**

```java
record SendMessageRequest(String text, List<String> mediaIds, Boolean mediaSpoiler,
    Boolean e2e, String iv, String encryptedKeys, String replyToId) {
}
```

- [ ] **Step 2: Atualizar MessageView**

```java
record MessageView(String id, String conversationId, String from, String text, List<String> mediaIds,
    String time, java.util.Map<String, Integer> reactions, String myReaction, boolean mediaSpoiler,
    boolean e2e, String iv, String encryptedKeys, String replyToId, ReplyView replyTo) {
}
```

- [ ] **Step 3: Passar encrypted_keys no controller**

No metodo `send()`, na chamada a `sendE2eMessage`:

```java
if (Boolean.TRUE.equals(request.e2e())) {
    msg = messagingService.sendE2eMessage(conversationId, user.id().value(), request.text(),
        request.iv(), request.encryptedKeys(), request.mediaIds(),
        Boolean.TRUE.equals(request.mediaSpoiler()), replyTo);
}
```

Na construcao do MessageView de retorno, incluir `msg.encryptedKeys()`.

- [ ] **Step 4: Atualizar MessagingService.sendE2eMessage**

Adicionar parametro `String encryptedKeys` ao metodo. Validar: se `encryptedKeys` presente, tamanho max 16000 chars. Passar ao `Message.createE2e(...)`.

- [ ] **Step 5: Atualizar a listagem de mensagens**

Procurar onde `MessageView` e construido na listagem (`GET /conversations/{id}/messages`) e incluir `encryptedKeys` do domain.

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/socialcoisa/rede/messaging/
git commit -m "feat(e2e): aceitar e devolver encrypted_keys na mensagem"
```

---

## Task 3: Backend — Endpoint batch de public keys

**Files:**

- Modify: `enois-backend/src/main/java/com/socialcoisa/rede/e2e/adapters/in/web/E2eKeyController.java`
- Modify: `enois-backend/src/main/java/com/socialcoisa/rede/e2e/application/E2eKeyService.java`

- [ ] **Step 1: Adicionar metodo batch no E2eKeyService**

```java
/** Retorna a chave publica ativa de cada usuario da lista. Quem nao tem keypair nao aparece. */
public Map<String, String> activePublicKeys(List<String> userIds) {
    Map<String, String> result = new java.util.LinkedHashMap<>();
    for (String userId : userIds) {
        activeKeypair(userId).ifPresent(kp -> result.put(userId, kp.publicKey()));
    }
    return result;
}
```

- [ ] **Step 2: Adicionar endpoint no E2eKeyController**

```java
@PostMapping("/e2e/keypairs/batch")
Map<String, String> batchPublicKeys(@RequestHeader("X-Session-Token") String sessionToken,
    @RequestBody List<String> userIds) {
    currentUserResolver.resolve(sessionToken);
    if (userIds == null || userIds.size() > 50) {
        throw new ApiException(400, "INVALID_REQUEST", "Maximo 50 usuarios por batch.");
    }
    return e2eKeys.activePublicKeys(userIds);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main/java/com/socialcoisa/rede/e2e/
git commit -m "feat(e2e): endpoint batch de public keys pra evitar N+1"
```

---

## Task 4: Frontend — API client atualizado

**Files:**

- Modify: `enois-frontend/src/lib/api/e2e.ts`
- Modify: `enois-frontend/src/lib/api/messages.ts`
- Modify: `enois-frontend/src/types/application/message/message.ts`

- [ ] **Step 1: Adicionar batchPublicKeys no e2eApi**

```typescript
batchPublicKeys: (userIds: string[]) =>
  api.post<Record<string, string>>("/e2e/keypairs/batch", userIds),
```

- [ ] **Step 2: Atualizar tipo Message**

Adicionar ao type `Message`:

```typescript
/** Chaves AES cifradas por participante (per-message E2E). JSON: {userId: encryptedAesKey} */
encryptedKeys?: Record<string, string> | null;
```

- [ ] **Step 3: Atualizar messagesApi.sendMessage**

```typescript
sendMessage: (
  conversationId: string,
  text: string,
  mediaIds: string[] = [],
  mediaSpoiler = false,
  e2e?: { ciphertext: string; iv: string; encryptedKeys: Record<string, string> },
  replyToId?: string,
) =>
  api.post<Message>(`/conversations/${conversationId}/messages`, {
    text: e2e ? e2e.ciphertext : text,
    mediaIds,
    mediaSpoiler,
    ...(e2e ? { e2e: true, iv: e2e.iv, encryptedKeys: JSON.stringify(e2e.encryptedKeys) } : {}),
    ...(replyToId ? { replyToId } : {}),
  }),
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/e2e.ts src/lib/api/messages.ts src/types/application/message/message.ts
git commit -m "feat(e2e): api client com encrypted_keys e batch public keys"
```

---

## Task 5: Frontend — Reescrever conversation.ts pra per-message

**Files:**

- Rewrite: `enois-frontend/src/lib/e2e/conversation.ts`

Este e o core da mudanca. O arquivo inteiro e reescrito — de ~210 linhas com caches e redistribuicao pra ~80 linhas sem estado.

- [ ] **Step 1: Reescrever conversation.ts**

```typescript
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

/**
 * Cifra uma mensagem pra envio. Retorna ciphertext, iv e as chaves cifradas por participante.
 * Lanca erro se algum participante nao tem keypair E2E (nao envia plaintext).
 */
export async function encryptForSend(
  conversationId: string,
  plaintext: string,
  participantIds: string[],
): Promise<{ ciphertext: string; iv: string; encryptedKeys: Record<string, string> }> {
  // 1. Busca public keys de todos os participantes de uma vez.
  const pubKeysMap = await e2eApi.batchPublicKeys(participantIds);
  const missing = participantIds.filter((id) => !pubKeysMap[id]);
  if (missing.length > 0) {
    throw new Error(
      `E2E indisponivel: ${missing.length} participante(s) sem criptografia configurada.`,
    );
  }

  // 2. Gera AES key descartavel e cifra o texto.
  const aesKey = await generateConversationKey();
  const { ciphertext, iv } = await encryptMessage(plaintext, aesKey);
  const aesKeyBase64 = await exportSymmetricKey(aesKey);

  // 3. Cifra a AES key com a public key de cada participante.
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

/** Fallback pra mensagens antigas que usam conversation key. */
async function decryptWithConversationKey(
  message: Message,
  privateKeyBase64: string,
): Promise<string> {
  const existing = await e2eApi.myConversationKey(message.conversationId);
  if (!existing.encryptedKey) throw new Error("sem chave de conversa");
  const privateKey = await importPrivateKey(privateKeyBase64);
  const symmetricKeyBase64 = await decryptWithPrivateKey(existing.encryptedKey, privateKey);
  const key = await importSymmetricKey(symmetricKeyBase64);
  return await decryptMessage(message.text, message.iv!, key);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/e2e/conversation.ts
git commit -m "feat(e2e): reescrever conversation.ts pra cifragem per-message"
```

---

## Task 6: Frontend — Atualizar use-decrypted-messages com currentUserId

**Files:**

- Modify: `enois-frontend/src/lib/e2e/use-decrypted-messages.ts`
- Modify: `enois-frontend/src/components/messages/conversation-thread.tsx`
- Modify: `enois-frontend/src/components/chat-dock/chat-dock.tsx` (se usa o hook)

O hook `useDecryptedMessages` agora precisa do `currentUserId` pra saber qual copia da AES key pegar.

- [ ] **Step 1: Atualizar o hook**

```typescript
import { useEffect, useRef, useState } from "react";

import type { Message } from "@/types/application/message/message";
import type { DecryptedResult } from "@/types/lib/decrypted-result";

import { decryptReceived } from "./conversation";
import { hasLocalKeys } from "./key-manager";

const MIN_DECRYPT_MS = 800;

export function useDecryptedMessages(
  messages: Message[],
  currentUserId: string | null,
): DecryptedResult {
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
            messages.map((msg) => (msg.e2e ? { ...msg, text: "\u{1f512} Mensagem cifrada" } : msg)),
          );
          setDecrypting(false);
        }
        return;
      }

      const results = await Promise.all(
        messages.map(async (msg) => {
          if (!msg.e2e) return msg;
          const plaintext = await decryptReceived(msg, currentUserId);
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
```

- [ ] **Step 2: Atualizar conversation-thread.tsx**

Mudar a chamada ao hook:

```typescript
const { messages, decrypting } = useDecryptedMessages(rawMessages, currentUserId);
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/e2e/use-decrypted-messages.ts src/components/messages/conversation-thread.tsx
git commit -m "feat(e2e): hook de decifra recebe currentUserId pra per-message"
```

---

## Task 7: Frontend — Atualizar o envio pra per-message e bloquear plaintext

**Files:**

- Modify: `enois-frontend/src/components/messages/conversation-thread.tsx`

- [ ] **Step 1: Reescrever a funcao send**

A cifragem e obrigatoria. Se falhar, bloqueia o envio com erro — nao envia plaintext.

```typescript
const send = async ({ text, files, mediaSpoiler, replyToId }: ConversationSendValues) => {
  let mediaIds: string[] = [];
  if (files.length > 0) {
    const results = await upload.uploadAll(files.map((file) => ({ file })));
    mediaIds = results.map((result) => result.mediaId);
  }

  // E2E obrigatorio: se nao tem chaves, o gate ja impediu de chegar aqui.
  // Se a cifragem falhar, NAO envia — mostra erro.
  if (text && (await hasLocalKeys())) {
    try {
      const e2e = await encryptForSend(conversation.id, text, conversation.participantIds);
      sendMessage.mutate({
        conversationId: conversation.id,
        text,
        mediaIds,
        mediaSpoiler,
        e2e,
        replyToId,
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : texts.messages.e2eFallback, "error");
      // NAO envia. O usuario ve o erro e pode tentar de novo.
      return;
    }
  } else if (mediaIds.length > 0) {
    // Mensagem so com midia, sem texto pra cifrar.
    sendMessage.mutate({
      conversationId: conversation.id,
      text: "",
      mediaIds,
      mediaSpoiler,
      e2e: undefined,
      replyToId,
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/messages/conversation-thread.tsx
git commit -m "fix(e2e): bloquear envio quando cifragem falha, nunca plaintext"
```

---

## Task 8: Frontend — Atualizar conversation-item preview

**Files:**

- Modify: `enois-frontend/src/components/messages/conversation-item.tsx`

- [ ] **Step 1: Verificar como o preview decifra**

O `conversation-item.tsx` mostra preview da ultima mensagem na lista de conversas. Atualmente usa `hasLocalKeys` pra decidir se mostra texto ou "[Mensagem cifrada]". Precisa receber `currentUserId` e usar `decryptReceived` com o formato novo.

Localizar o trecho que faz a decifra do preview e atualizar pra passar `currentUserId` ao `decryptReceived`.

- [ ] **Step 2: Commit**

```bash
git add src/components/messages/conversation-item.tsx
git commit -m "fix(e2e): preview de conversa usa decryptReceived com userId"
```

---

## Task 9: Frontend — Limpar codigo morto

**Files:**

- Modify: `enois-frontend/src/lib/e2e/conversation.ts` (remover exports antigos)
- Modify: `enois-frontend/src/lib/e2e/crypto.ts` (manter tudo — generateConversationKey ainda usado)
- Delete ou limpar: imports de `clearConversationKeyCache` em qualquer lugar
- Modify: `enois-frontend/src/lib/e2e/key-manager.ts` (remover `restoreFromBackup` do import em conversation.ts se nao for mais usado la)

- [ ] **Step 1: Remover clearConversationKeyCache de onde for importado**

Buscar por `clearConversationKeyCache` em todo o frontend e remover imports e chamadas.

- [ ] **Step 2: Remover imports mortos do conversation.ts**

O novo `conversation.ts` nao importa mais `getLocalPublicKey`, `restoreFromBackup`. Verificar que o arquivo final nao tem imports nao usados.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(e2e): remover codigo morto do sistema de conversation keys"
```

---

## Task 10: Testes unitarios

**Files:**

- Modify: `enois-frontend/src/lib/e2e/conversation.test.ts`
- Modify: `enois-frontend/src/lib/e2e/use-decrypted-messages.test.tsx`
- Modify: `enois-frontend/src/components/chat-dock/chat-dock.test.tsx`

- [ ] **Step 1: Reescrever conversation.test.ts pra per-message**

Cenarios:

1. `encryptForSend` gera ciphertext + iv + encrypted keys pra todos os participantes
2. `encryptForSend` lanca erro quando participante nao tem public key
3. `decryptReceived` decifra mensagem per-message corretamente
4. `decryptReceived` faz fallback pra conversation key em mensagem antiga
5. `decryptReceived` retorna fallback text quando private key nao existe

- [ ] **Step 2: Atualizar use-decrypted-messages.test.tsx**

Adicionar `currentUserId` nas chamadas ao hook.

- [ ] **Step 3: Atualizar chat-dock.test.tsx**

O mock ja foi atualizado pra `isE2eReady`. Verificar que compila.

- [ ] **Step 4: Rodar testes**

```bash
npm run test -- --run
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(e2e): testes pro sistema per-message"
```

---

## Task 11: Backend — Push, PR e validar CI

- [ ] **Step 1: Push backend**

```bash
cd enois-backend
git push -u origin feat/e2e-per-message
```

- [ ] **Step 2: Abrir PR pra qa**

Titulo: `feat(e2e): cifragem per-message no lugar de conversation keys`
Corpo curto explicando a mudanca.

- [ ] **Step 3: Verificar CI verde**

---

## Task 12: Frontend — Push, PR e validar CI

- [ ] **Step 1: Push frontend**

```bash
cd enois-frontend
git push -u origin feat/e2e-per-message
```

- [ ] **Step 2: Abrir PR pra qa**

Titulo: `feat(e2e): cifragem per-message e bloqueio de plaintext`
Corpo referenciando o PR do backend.

- [ ] **Step 3: Verificar CI verde**

---

## Ordem de merge

1. **Backend primeiro** — adiciona o campo e o endpoint. Nao quebra nada (campo novo e nullable, endpoint novo).
2. **Frontend depois** — comeca a usar o campo novo. Mensagens antigas continuam decifraveis pelo fallback.

## O que NAO fazer neste plano

- Nao apagar a tabela `conversation_e2e_keys` (mensagens antigas precisam)
- Nao apagar os endpoints `POST /e2e/conversations/{id}/keys` e `GET /e2e/conversations/{id}/key` (fallback de leitura)
- Nao migrar mensagens antigas pro formato novo (sao imutaveis no banco)
