# Superfície administrativa: total, mas com trava

Contexto do dono do projeto: o admin global precisa agir sobre qualquer entidade com um clique a
partir da própria página, com o motivo escrito. Moderador local não tem esses controles. O pedido
original mandava varrer tudo; aqui ficam registradas as decisões que não são óbvias no código.

## Quem vê o controle

`useIsPlatformAdmin` (`src/lib/admin/use-is-platform-admin.ts`) pergunta ao backend
(`GET /moderation/me` → `admin`, lido de `users.is_admin`) e usa essa resposta como única fonte. Não
existe cargo escolhido na tela, e falha de rede ou sessão ausente contam como "não é admin". O
cache é um só para o app inteiro.

Duas consequências:

- Mediador aprovado (`moderator: true`, `admin: false`) **não** vê os controles; ele decide pela
  fila e pela votação, que continuam separadas.
- A tela nunca é a autoridade. Toda rota usada aqui vive em `/admin/**`, que o
  `AdminRouteInterceptor` e o `AdminGuard` recusam para qualquer outra conta — inclusive quando
  alguém chama a API direto.

## O que é feito neste repositório

- **Postagem:** "Excluir postagem" no próprio card, com motivo de 10+ caracteres, chamando
  `POST /admin/moderation/posts/{id}/remove`. A resposta (`REMOVED`, `ALREADY_OFFLINE`,
  `NOT_FOUND`) é repetida na tela; a postagem sai do feed sem recarregar a página.
- **Conta:** painel no perfil de outra pessoa (advertir, banir, banir permanentemente, revogar
  advertência, excluir conta e ler o histórico) chamando `/admin/moderation/users/{username}/*`.
  No próprio perfil o painel não aparece, e o backend recusa autopunição de qualquer forma.
- **Comunidade e grupo:** gerenciar membros, remover dono/moderador local, excluir e encerrar,
  com motivo obrigatório.
- **Comentário:** removido pelo mesmo caminho administrativo de conteúdo, com motivo.

Quando a ação é aceita, o app revalida os dados que mostram o resultado em vez de "otimizar" a
lista; assim o que a pessoa vê é o que o backend gravou.

## O que NÃO é feito aqui (e por quê)

- **Concessão de `is_admin`.** Não existe rota. Promover/rebaixar admin continua sendo operação de
  infraestrutura (banco/servidor), com registro fora da aplicação. Um endpoint desses seria o alvo
  mais óbvio de escalonamento de privilégio.
- **Apagar a trilha de auditoria.** A aplicação não tem escrita em `audit_logs` (nem delete, nem
  update). Cada decisão registra uma linha própria; o acesso ao banco é usado por quem administra a
  aplicação inteira — aí a barreira é a infraestrutura, não uma rota HTTP.
- **Contas de administração.** Ninguém exclui a própria conta nem a de outro administrador pela
  superfície administrativa: derrubar a administração e a trilha de quem age não pode sair daqui.
- **Exclusão física de comunidade.** Já existe; o que mudou foi a limpeza das tabelas que não
  tinham FK (`community_channels`, `community_pinned_posts`, favoritos e publicações de canal com
  seus comentários e reações), que antes ficavam órfãs no banco.