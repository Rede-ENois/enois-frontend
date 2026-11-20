# Avisos de novos projetos da comunidade

Origem: Rede-ENois/enois-backend#676.

A preferência `communityProjects` controla a assinatura de lançamentos em `/projetos`.
Ela nasce desligada; não é uma permissão de push do navegador. O backend é responsável
por selecionar destinatários e publicar os avisos depois da aprovação de um projeto.

`NotificationPreferencesPanel` lê o valor no GET autenticado e salva somente a chave
alterada no PUT `/me/notification-preferences`. A atualização é otimista, trava o
interruptor durante o envio e restaura o valor anterior quando a operação falha.
Se o backend ainda não devolve o campo, a seção não aparece; o app não inventa suporte.

A view é `NotificationPreferences` do design system, com as props opcionais
`communityProjects`, `onCommunityProjectsChange` e `communityProjectsPending`.
A linguagem visual, o interruptor e as mensagens continuam pertencendo ao DS.
Os links `/projetos/{username}/{projectSlug}` dos avisos são resolvidos pelo roteador
existente para abrir o projeto específico. O tipo `NEW_COMMUNITY_PROJECT` pertence ao
módulo `COMMUNITY_PROJECTS`, inclusive no fallback para respostas sem `module`, para
respeitar a escolha de ocultar esse módulo.

## Dependência de entrega

A integração requer a versão do design system que contém essas props. A validação
local usa o pacote gerado por `npm pack`; esse caminho não entra no manifesto nem
no lockfile. A publicação da versão e sua atualização no consumidor são ações
coordenadas com os mantenedores antes do merge da integração.

Ao testar o consumidor com a `qa` atual do DS, a falta de `recurrence: "NONE"` na
fixture de edição da agenda também foi reproduzida na base limpa com o mesmo
pacote local. Essa correção foi integrada pelo upstream durante o desenvolvimento;
a branch foi atualizada e não duplica a alteração.

O teste de aniversário também falhava na base limpa perto da virada do dia UTC.
A correção definitiva entrou no upstream durante o desenvolvimento: a fixture usa
o calendário local e inclui uma regressão de fuso. Essa alteração foi incorporada
sem duplicação neste diff e sem mudança na regra de idade.

## Verificação da interface

O container real e o pacote local foram exercitados no Chromium, com a configuração
Vite do app e uma API HTTP sintética isolada. Foram conferidos: valor inicial false,
PUT de uma única chave, estado otimista/pending, confirmação, erro com rollback,
carregamento, falha de leitura e backend sem o campo (sem escrita automática).
Desktop 1280px e mobile 390px foram inspecionados em claro e escuro.
Isso comprova a integração de UI/transporte com fixture; as falhas simuladas não são
apresentadas como um E2E com Spring.

Uma segunda prova exercitou o mesmo container contra Spring Boot real, em HTTP,
com sessão sintética e H2 isolado. A opção passou de false para true por um único
PUT parcial; GET e recarga mantiveram true, sem alterar `pushSocial`. O teste do
servidor também leu a linha persistida via JDBC e passou. Essa prova não percorreu
o shell/roteamento completo nem o fluxo de publicação pela UI; a publicação e a
entrega são verificadas separadamente nos testes do backend.
