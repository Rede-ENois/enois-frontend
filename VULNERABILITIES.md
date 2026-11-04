# Relatório de Vulnerabilidades — Connect-Grow Frontend

**Data:** 2026-06-10
**Branch analisada:** `main` (commit `24ef379`)
**Comparação:** `main` vs `develop`

> **Retrato histórico (2026-06-10).** Vários itens já foram corrigidos e não descrevem o código atual:
> a sessão saiu do `localStorage` para cookies HttpOnly (C2), o callback OAuth não leva token na URL
> (C4), `X-User-Id` não é enviado nem aceito (C3), o fallback de chave do ImageKit saiu do código (C1;
> o envio pelo ImageKit está desativado), links passam por uma lista de esquemas (H3) e há CSP com nonce
> (H5). Para o estado atual, veja o [`SECURITY.md`](SECURITY.md).

---

## 🔴 CRÍTICO (5)

| #   | Vulnerabilidade                            | Arquivo:Linha                                           | Descrição                                                                                                                                                          |
| --- | ------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | ImageKit public key hardcoded no bundle    | `src/lib/api/media.ts:24`                               | `IMAGEKIT_PUBLIC_KEY` tem fallback fixo `public_0Y+bnNURFVY+XZuqyCWQGafHo/0=` que vai para o bundle do cliente. Qualquer um pode extrair e fazer upload no bucket. |
| C2  | Token JWT armazenado em localStorage       | `src/lib/api-client.ts:22`, `src/routes/__root.tsx:134` | Token de sessão acessível a qualquer JS na página. Se houver XSS, o token é roubado. Deveria ser cookie `HttpOnly` + `Secure`.                                     |
| C3  | Header `X-User-Id` controlado pelo cliente | `src/lib/api-client.ts:38-41`                           | `userId` lido do `localStorage` e enviado como header. Backend pode confiar nesse valor para autorização → IDOR. Qualquer requisição pode forjar userId alheio.    |
| C4  | Token OAuth exposto em parâmetros de URL   | `src/routes/__root.tsx:130-136`                         | `?token=...&expiresAt=...` na callback URL. Vaza via Referer header, logs de servidor, histórico do navegador.                                                     |
| C5  | Fallback de upload URL hardcoded           | `src/lib/api/media.ts:26-28`                            | `IMAGEKIT_UPLOAD_URL` e `IMAGEKIT_URL_ENDPOINT` com fallback fixo, mesma informação sensível duplicada no .env e no source.                                        |

---

## 🟠 ALTO (7)

| #   | Vulnerabilidade                              | Arquivo:Linha                                                                                                                   | Descrição                                                                                                                                                                   |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | Casts `as any` em todo código                | Múltiplos arquivos (`edit-profile-dialog.tsx`, `post-card.tsx`, `comunidades.tsx`, `routeTree.gen.ts`)                          | TypeScript anulado parcialmente. Erros de tipo só descobertos em runtime.                                                                                                   |
| H2  | Iframe Twitch com `window.location.hostname` | `src/components/post-card.tsx:710`                                                                                              | URL do iframe Twitch injeta `window.location.hostname` diretamente. Padrão abre precedente para injeção se extrator de ID for enganado.                                     |
| H3  | `linkifyText` permite `javascript:` em href  | `src/components/post-card.tsx:777-819`                                                                                          | URLs extraídas do texto são colocadas em `<a href={token}>`. React não bloqueia `javascript:alert(1)` — navegador executa.                                                  |
| H4  | `allowedHosts: true` no Vite                 | `vite.config.ts:21`                                                                                                             | Permite qualquer host no dev server → DNS rebinding attack.                                                                                                                 |
| H5  | Sem Content Security Policy (CSP)            | `vite.config.ts`                                                                                                                | Nenhum header CSP configurado. Sem proteção contra injeção de scripts ou clickjacking. Iframes carregam de youtube.com, vimeo.com, dailymotion.com, twitch.tv, imagekit.io. |
| H6  | Email exposto na API de perfil               | `src/lib/api/profile.ts:3-24`                                                                                                   | Tipo `UserProfile` inclui `email`. Endpoint `/users/:username` retorna email de qualquer usuário consultado.                                                                |
| H7  | Catches silenciosos (12+ blocos)             | `post-card.tsx:191,280,296-298,308-310,323-325,333-345`, `image-crop-dialog.tsx:79-80`, `feed.tsx:103-105`, `app-shell.tsx:286` | Erros engolidos sem logging. Impossível debugar ou monitorar falhas.                                                                                                        |

---

## 🟡 MÉDIO (8)

| #   | Vulnerabilidade                                       | Arquivo:Linha                                           | Descrição                                                                                                    |
| --- | ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| M1  | `noUnusedLocals: false` e `noUnusedParameters: false` | `tsconfig.json:19-20`                                   | Código morto passa despercebido.                                                                             |
| M2  | `@typescript-eslint/no-unused-vars: off`              | `eslint.config.js:36`                                   | Lint não detecta imports/variáveis não utilizados.                                                           |
| M3  | Conteúdo de post sem sanitização (XSS stored)         | `post-card.tsx:362-363,587,777-819`                     | `post.content` e `comment.content` renderizados direto. Se backend não sanitizar, XSS armazenado é possível. |
| M4  | Ordenação por `new Date()` sem timezone               | `mensagens.tsx:44-45`                                   | Depende de fuso do cliente → ordenação inconsistente.                                                        |
| M5  | Senha permanece em memória no estado                  | `entrar.tsx:229,341`                                    | `Object.fromEntries(fd)` converte FormData, mas senha fica em memória no componente após submit.             |
| M6  | Links Termos/Privacidade quebrados (`#`)              | `entrar.tsx:136-144`                                    | Links de política e termos apontam para `#`.                                                                 |
| M7  | Cookie sidebar sem Secure/HttpOnly                    | `sidebar.tsx:85-86`                                     | `document.cookie` definido sem flags de segurança.                                                           |
| M8  | User IDs expostos em URLs e responses                 | `api/feed.ts:5`, `api/network.ts:3`, `api/profile.ts:4` | IDs internos (`authorId`, `userId`) expostos → permite enumeração.                                           |

---

## 🟢 BAIXO (6)

| #   | Item                                         | Arquivo:Linha          | Descrição                                                                                     |
| --- | -------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| L1  | `noValidate` nos formulários                 | `entrar.tsx:271`       | Validação nativa do browser desabilitada.                                                     |
| L2  | Mock data realista ainda presente            | `src/lib/mock-data.ts` | 885 linhas de dados mock com avatares DiceBear, nomes reais-like. Pode confundir em produção. |
| L3  | Imports não utilizados                       | `post-card.tsx:22-23`  | `Label` e `Textarea` importados mas nunca usados.                                             |
| L4  | Re-renders desnecessários                    | Múltiplos arquivos     | `useState` para dados que poderiam ser derivados de query.                                    |
| L5  | Dependências sem vulnerabilidades conhecidas | `package.json`         | React 19, Vite 7, TanStack, Zod — todos versões recentes estáveis.                            |

---

## Top 10 Recomendações Imediatas

1. **🔴** Remover fallback hardcoded do ImageKit em `media.ts` — usar apenas `import.meta.env`
2. **🔴** Migrar token de `localStorage` para cookie `HttpOnly` + `Secure`
3. **🔴** Remover header `X-User-Id` e mover user identification para o JWT
4. **🔴** Mover token OAuth da query string para hash fragment ou POST
5. **🟠** Adicionar sanitização com DOMPurify no `linkifyText` e no conteúdo de posts
6. **🟠** Configurar CSP headers no `vite.config.ts`
7. **🟠** Remover `allowedHosts: true` ou restringir a `localhost`
8. **🟠** Substituir catches silenciosos por logging estruturado
9. **🟠** Validar URLs em `linkifyText` para bloquear `javascript:` scheme
10. **🟡** Reativar `noUnusedLocals` e `noUnusedParameters` no tsconfig

---

Gerado automaticamente em 2026-06-10.
