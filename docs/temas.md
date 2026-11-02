# Temas

O app tem um sistema de temas em duas camadas: **coleções** (temas prontos) e **tema personalizado**
(CSS do usuário).

## Como funciona

- Cada coleção define variáveis CSS (`--primary`, `--background`, `--surface-*`, `--text-*`…) nos
  dois modos, claro e escuro.
- O tema ativo fica no `localStorage`:
  - `connect-grow-theme-collection` — o id da coleção (aplicado como `data-theme` no `<html>`);
  - `connect-grow-theme-css` — CSS extra de tema personalizado (injetado num `<style id="app-theme">`).
- O `THEME_BOOTSTRAP_SCRIPT` ([`src/lib/theme-bootstrap.ts`](../src/lib/theme-bootstrap.ts), injetado
  inline no `<head>` de [`src/routes/__root.tsx`](../src/routes/__root.tsx)) aplica os dois **antes da
  primeira tinta** (no HTML do SSR), então não há flash de tema errado. O mesmo script decide se a
  folha de fontes do Google entra: em modo econômico (Lite ou BATATA) ela não é pedida.
- Tema e modo econômico são escolhas separadas: trocar de coleção não liga nem desliga o BATATA
  (ver [`modo-batata.md`](modo-batata.md)).
- O seletor fica em Configurações → Aparência, com busca e categorias (as coleções têm identidade
  própria — paleta, não só matiz).

## Coleções

São 60 coleções prontas × 2 modos. Algumas têm nomes da cultura da comunidade. O auditor de temas
([`scripts/theme-audit.mjs`](../scripts/theme-audit.mjs)) varre todas as coleções × modos × páginas
medindo contraste real (WCAG) e overflow — é o teste de regressão visual do sistema.

## Vender tema

Um tema personalizado pode ser publicado como pacote na galeria/marketplace (em faíscas) pela
Aparência → "Vender no marketplace": o app empacota as variáveis do tema atual
([`buildGalleryPackage`](../src/lib/theme/gallery-package.ts)) e lista no marketplace.
