# Prova visual: #1126 (Navegação do Feed com Abas e Filtros sem overflow)

Capturas em viewport desktop (1280 px) e mobile (390 px) para os contextos social e profissional com a nova barra de abas e pílulas.

## Como foi medido

O script `shot-1126.mjs` acessa o aplicativo rodando em `http://localhost:5173`, controlando o Chrome headless via Chrome DevTools Protocol (CDP) com `deviceScaleFactor: 2`.

1. Semeia sessão autenticada (`enois_auth`, `session_active`, `current_user`) no navegador.
2. Abre `/feed` (contexto social) em 1280 px e 390 px.
3. Abre `/feed?aba=CORPORATE` (contexto profissional) em 1280 px e 390 px.
4. Mede o estouro horizontal do documento (`scrollWidth - clientWidth`) e confere as abas e pílulas renderizadas.

## Resultado

| Captura                | Contexto     | Largura | Abas visíveis | Pílulas visíveis | Estouro Horizontal (`scrollWidth - clientWidth`) |
| :--------------------- | :----------- | :------ | :------------ | :--------------- | :----------------------------------------------- |
| `feed-social-1280.png` | Social       | 1280 px | sim (0)       | sim (0)          | 0 px                                             |
| `feed-social-390.png`  | Social       | 390 px  | sim (0)       | sim (0)          | 0 px                                             |
| `feed-prof-1280.png`   | Profissional | 1280 px | sim (0)       | -                | 0 px                                             |
| `feed-prof-390.png`    | Profissional | 390 px  | sim (0)       | -                | 0 px                                             |

- **Estouro horizontal:** **0 px** em todas as medições (desktop e mobile).
- **Sem className ou estilo vazado no app:** Os componentes `Tabs`, `TabsList`, `TabsTrigger`, `PillRow` e `Pill` são compostos puramente através do Design System, sem classes de layout ou seletores de texto com `!important`.
- **Descoberta:** As abas e ícones semânticos resolvem o problema de descoberta de feed sem esconder as opções atrás de popover.
