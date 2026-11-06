# CLAUDE.md

@AGENTS.md

O `AGENTS.md` (importado acima) é o contrato operacional de todo agente de IA neste repositório. Ele
vale por inteiro. As regras abaixo são repetidas porque são as que os agentes mais quebram aqui:

- **Você nunca faz merge, nunca dá push em `qa`/`main`, nunca abre `qa` → `main`.** Abra a PR para a
  `qa` e pare. O `.claude/settings.json` bloqueia esses comandos; não procure um jeito de contornar.
- **Você nunca reverte nem refaz trabalho alheio, e nunca muda layout ou linguagem visual, sem o aval
  escrito de um mantenedor.** Se a tarefa parece pedir isso, pare e pergunte.
- **UI nova vai para o design system.** Aqui entra só o container.
- **Duas tentativas falhas no mesmo bug: pare e reporte** o que mediu e o que descartou. Nada de
  corrente de PRs de hotfix.
- **Concluído é comprovado:** `npm run lint && npm run typecheck && npm test && npm run build` na
  árvore final, e o navegador a 390px e desktop quando a mudança aparece na tela.
- **Regra do escoteiro:** toda falha que você encontrar é corrigida na mesma tarefa, mesmo que seja
  anterior a você. Se estiver realmente fora de alcance, abra uma issue e diga na PR. Nunca em
  silêncio.

<!-- engineering-learn:live -->

- Cliente de sessão: nunca altere o estado local de autenticação (apagar token legado, marcar ou limpar a sessão) antes de o servidor confirmar, e trate toda recusa explícita de `/auth/*` (400/401/403) como sessão recusada — só falha de rede é "indisponível".

- Repintar um token do design system num escopo (tema de cartão, seção escura): antes, liste todo uso dele ali dentro — `--primary` pinta texto (`text-primary`) e fundo com tinta fixa (`bg-primary` + `--primary-foreground`). Troque o par junto e confira o contraste em cada tom (claro e escuro); token que depende do tom vai inline por tema, não numa regra única. Antes de repintar, confira qual variável a utilitária lê de fato no CSS do DS (`.text-primary` lê `--primary-text`, não `--primary`) e prove o contraste com teste numérico, não só com print.

<!-- /engineering-learn:live -->
