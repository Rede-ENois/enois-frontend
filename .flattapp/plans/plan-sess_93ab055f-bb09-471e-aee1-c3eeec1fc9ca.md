## Objetivo

Personalização de tema por usuário (cores livres de destaque e fundo), acessível pelo próprio perfil, + correção dos problemas de UI/responsividade e unificação dos padrões duplicados.

## Achados que ancoram o plano

- Todo o tema já é 100% CSS variables em `src/styles.css` (`:root` claro / `.dark`), mapeadas no `@theme inline` do Tailwind v4. Componentes só usam classes (`bg-primary`, `text-text-subtle`) — **nenhum** `dark:` variant existe. Então mudar tokens em runtime tinge o app inteiro sem tocar em componente.
- A paleta da marca é toda derivada de uma matiz (~293–310). Isso torna viável derivar tokens por matiz e garante consistência.
- **Não há sistema de anti-flash**: `dark` é aplicado num `useEffect` (`theme-toggle.tsx`), então hoje já existe flash claro→escuro. Vou corrigir de brinde.
- Dívida que vou tocar: `--gradient-primary`, `--shadow-*`, `--mentorship-button`, `--highlight-project*`, `--background-user-project` e `--project-text` são literais roxos e **não** seguem o tema; `button-variants.ts:8` tem `hover:bg-[oklch(0.49_0.24_293)]` chumbado.
- Auditoria de responsividade: ~8 problemas concretos que quebram no mobile, listados na Fase 3.

## Fase 1 — Núcleo do tema (puro, sem UI)

- `src/lib/theme/color.ts`: oklch→sRGB, luminância relativa e contraste WCAG. Funções puras, sem dependência de DOM.
- `src/constants/theme-defaults.ts`: os valores atuais (extraídos de `styles.css`) como padrão + as bandas de limite (clamp de L do destaque, C máximo do fundo).
- `src/lib/theme/build-theme-tokens.ts`: `(settings, mode) → tokens`. Deriva `--primary-foreground` **por cálculo de contraste** (claro ou escuro, escolhido pelo mais legível), `--primary-soft`, `--secondary`, `--accent`, `--ring`, `--gradient-primary` (destaque + deslocamento de matiz, preservando o carácter do gradiente), e os tokens roxos hoje chumbados. Também gera o **texto CSS resolvido**.
- `src/lib/theme/apply-theme.ts`: aplica um `<style id="app-theme">` no `documentElement`; remove quando o tema está no padrão.
- **Anti-flash (resolve o existente também):** persisto o texto CSS resolvido junto das preferências e adiciono um script inline mínimo em `__root.tsx` que injeta esse CSS e a classe `dark` **antes do primeiro paint** — sem duplicar cálculo de cor no HTML.
- Tipos novos em `src/types/preferences/` (um por arquivo, conforme a regra `local/type-boundaries`).
- `preferences.store` ganha `themeSettings` + `setThemeSettings`/`resetTheme`, persistidos em `connect-grow-preferences` junto de `theme`/`sidebarCollapsed`.
- `texts.ts`: namespace `appearance` (todos os textos, como no resto do app).
- Segurança de contraste: na hora de gravar, valido os pares críticos (texto do destaque × destaque, texto × fundo, texto suave × fundo) e clampeio os valores — o usuário não consegue produzir combinação ilegível.

## Fase 2 — UI de personalização

Componentes em `src/components/appearance/`, com props tipadas em `src/types/components/appearance/`:

- Preview ao vivo (card de exemplo: botão, link, badge, avatar) refletindo as escolhas antes de salvar.
- Controles de destaque (matiz, saturação, luminosidade) e de fundo (matiz + intensidade), com `input type="range"` nativo rotulado (acessível por padrão).
- Atalhos de paleta curada como ponto de partida, e "Restaurar padrão".
- Indicador de contraste (AA / AAA / alerta com sugestão de ajuste).
- Alternância claro/escuro dentro do diálogo.
- **Entrada:** botão "Aparência" na linha de ações do **próprio perfil**, ao lado de "Editar perfil" (o bloco dono-only já existe em `perfil.$username.tsx:301-323`).

## Fase 3 — Correções de mobile (alto impacto)

1. `dialog.tsx`: `max-h-[90vh] overflow-y-auto` por padrão — conserta ~13 diálogos que hoje cortam em tela baixa (eventos, mentoria, comunidades, vagas, conta, reações).
2. `comunidades.$communityId.tsx:367`: ações de capa só no hover (**inalcançáveis no toque**) → padrão `md:opacity-0 md:group-hover:opacity-100`, igual ao perfil.
3. `mentoria.tsx:215-247`: MentorCard usa `md:col-span-*` dentro de um `flex` (não faz efeito, layout quebrado) → grid responsivo de verdade.
4. `user-avatar.tsx:25`: iniciais com `text-xl`/`leading-[30px]` fixos estouram em avatar `h-6`/`h-7`/`h-8`.
5. `vagas.tsx` e `post-card.tsx`: linha de ações sem `flex-wrap` estoura em 320–360px.
6. `mensagens.tsx:113`: altura mágica `h-[calc(100dvh-11rem)]` → `min-h-0` + flex, para não quebrar com teclado aberto.
7. `edit-profile-dialog.tsx` / `comunidades.tsx`: `Textarea` com `h-10` brigando com `min-h-[60px]`, e `pl-9` órfão na bio.
8. Alvos de toque < 40px nas ações de post/comentário/notificação.

## Fase 4 — Unificação de padrões

- `Pill` (4 implementações hoje), `EmptyState` (5), `LoadingState`/spinner (4), card padronizado no utilitário `surface-card` (2), escala única de `Label` (5 tamanhos), e remoção de classes mortas (`eventos.tsx:222`, `comunidades.tsx:295`, branch duplicado em `feed.tsx:208-214`).

## Fase 5 — Verificação

- Escopada aos meus arquivos: `eslint`, `tsc` e `npm run build` (a `main` tem ~66 erros de lint pré-existentes da outra sessão; não vou mexer neles).
- **Verificação visual com o browser**: a landing (`/`) e o `/entrar` são públicas, então consigo abrir o dev server, aplicar tema por `localStorage`, e tirar screenshots em claro/escuro × 2–3 combinações e larguras 360/768/1280. É a única forma de eu realmente _ver_ o resultado.
- **Limitação honesta:** telas autenticadas (feed, perfil, vagas) exigem login/backend, então as correções da Fase 3–4 eu valido por código + build, não visualmente. Se você me passar um usuário de teste, eu abro e confiro.

## Riscos e como trato

- **Outra sessão commita neste mesmo working tree.** Vou trabalhar em commits pequenos e temáticos, checar `git status` antes de cada um, e escopar `eslint --fix`/reverts aos meus arquivos (nunca repo-wide).
- Fase 3–4 mexem em arquivos que a outra sessão também edita (`mentoria.tsx`, `comunidades.tsx`, `post-card.tsx`). Deixo essas para o fim e faço uma tela por vez para reduzir conflito.

## Ordem de entrega

Fase 1 → 2 (feature principal, verificável visualmente) → 3 → 4. Se em algum ponto você preferir parar, cada fase é um commit independente e reversível.
