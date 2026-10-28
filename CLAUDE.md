# CLAUDE.md

@AGENTS.md

O `AGENTS.md` (importado acima) é o contrato operacional de todo agente de IA neste repositório. As
regras valem por inteiro; a de baixo é repetida porque é a mais fácil de pular:

- **Regra do escoteiro: toda falha é corrigida quando encontrada.** Teste quebrado ou instável,
  build quebrado, erro de lint ou de tipo, bug ou falha de segurança que você encontrar é corrigido
  na mesma tarefa, mesmo que seja anterior à sua mudança. Se o conserto estiver realmente fora de
  alcance, registre (issue ou item do backlog) e diga na PR — nunca deixe em silêncio.

<!-- engineering-learn:live -->

- Cliente de sessão: nunca altere o estado local de autenticação (apagar token legado, marcar ou limpar a sessão) antes de o servidor confirmar, e trate toda recusa explícita de `/auth/*` (400/401/403) como sessão recusada — só falha de rede é "indisponível".

- Repintar um token do design system num escopo (tema de cartão, seção escura): antes, liste todo uso dele ali dentro — `--primary` pinta texto (`text-primary`) e fundo com tinta fixa (`bg-primary` + `--primary-foreground`). Troque o par junto e confira o contraste em cada tom (claro e escuro); token que depende do tom vai inline por tema, não numa regra única. Antes de repintar, confira qual variável a utilitária lê de fato no CSS do DS (`.text-primary` lê `--primary-text`, não `--primary`) e prove o contraste com teste numérico, não só com print.

<!-- /engineering-learn:live -->
