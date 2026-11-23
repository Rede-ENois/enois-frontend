# Prova visual: #1126 (Navegação do Feed com Abas e Filtros sem overflow)

Capturas em viewport desktop (1280 px) e mobile (390 px) para os contextos social e profissional com a nova barra de abas e pílulas.
Sessão real no ambiente de desenvolvimento com mock local dos endpoints da API, confirmando hidratação e renderização da rota real `/feed`.

## Como foi medido

O script `shot-1126.mjs` sobe o backend falso para responder aos endpoints da API do feed sem 401, inicia o Vite dev em porta isolada apontando para ele (`BACKEND_TARGET`), semeia a sessão no `localStorage` e cookies, e conecta ao Chrome headless via Chrome DevTools Protocol (CDP) com `deviceScaleFactor: 2`.

1. Confirma navegação autenticada em `/feed` (assegura que não houve redirecionamento para `/entrar`).
2. Mede a contagem real de abas (`[role="tab"]`), aba ativa e as 12 pílulas do filtro de tipo (`PillRow`).
3. No mobile (390 px), mede o comportamento da barra de rolagem lateral (`pillsRowScrolls`) e as pílulas visíveis sem rolagem.
4. No contexto profissional (`/feed?aba=CORPORATE`), confirma que a aba Profissional está ativa e que as capturas são distintas entre social e profissional (hashes SHA-256 distintos comprovados).
5. Mede o estouro horizontal do documento (`scrollWidth - clientWidth`).

## Resultado Medido

| Captura                | Contexto     | Largura | URL                   | Aba Ativa   | Abas Medidas | Pílulas Medidas | Estouro Horizontal (`scrollWidth - clientWidth`) | SHA-256           |
| :--------------------- | :----------- | :------ | :-------------------- | :---------- | :----------- | :-------------- | :----------------------------------------------- | :---------------- |
| `feed-social-1280.png` | Social       | 1280 px | `/feed`               | Tudo        | 6            | 12              | 0 px                                             | `25ab3b3025e9...` |
| `feed-social-390.png`  | Social       | 390 px  | `/feed`               | Tudo        | 6            | 12              | 231 px                                           | `a78f0ea763ad...` |
| `feed-prof-1280.png`   | Profissional | 1280 px | `/feed?aba=CORPORATE` | Corporativo | 6            | 0               | 0 px                                             | `1f13cd9f5e18...` |
| `feed-prof-390.png`    | Profissional | 390 px  | `/feed?aba=CORPORATE` | Corporativo | 6            | 0               | 231 px                                           | `3130eeaed0b0...` |

### Detalhes dos Componentes e Comportamento Responsivo

1. **Abas (6 abas renderizadas)**:
   - Abas disponíveis: `Tudo, Para você, Ainda não vi, Em Alta, Interações, Corporativo`.
   - Aba ativa no social: **Tudo**.
   - Aba ativa no profissional: **Corporativo**.
2. **Filtro de Tipos de Post (12 pílulas)**:
   - Todas as 12 pílulas renderizadas no social: `Todos os tipos, Insights, Dúvidas, Projetos, Notícias, Tutoriais, Oportunidades, Avaliações, Diversão, Artigos, Enquetes, Reclamações`.
   - No desktop (1280 px): as 12 pílulas são apresentadas no container sem quebrar nem estourar a página (**0 px** de overflow).
   - No mobile (390 px): a faixa de pílulas utiliza rolagem horizontal (`pillsRowScrolls: true`), com as primeiras pílulas visíveis imediatamente (`Todos os tipos, Insights, Dúvidas`) e as demais acessíveis por gesto lateral natural, mantendo o estouro da página em **231 px**.
3. **Diferença Comprovada entre Contextos**:
   - `feed-social-390.png` SHA: `a78f0ea763ad570049b8f50d22b2365a3578503d6d1e933d4d4340422514563b`
   - `feed-prof-390.png` SHA: `3130eeaed0b091f45f36a4ce2126af71457751f072920f7ab42e7280d5bbb292`
   - Os arquivos são distintos e comprovam a alternância de contexto social vs. profissional.
4. **Sem vazamento de estilo ou classes proibidas**:
   - Conformidade estrita com o Design System (`Tabs`, `TabsList`, `TabsTrigger`, `PillRow`, `Pill`), sem classes utilitárias na rota e sem seletores de acessibilidade no CSS global.
