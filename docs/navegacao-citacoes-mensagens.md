# Navegação de citações em mensagens privadas

## Conteúdo da citação e criptografia

O hook `useDecryptedMessages` decifra também a original citada, inclusive quando a resposta
contém apenas mídia. Quando a original já está carregada, reutiliza seu texto decifrado. Fora
da página atual, usa `replyTo.iv` e `replyTo.encryptedKeys` junto do ciphertext integral em
`replyTo.text`; o backend não deve truncar o ciphertext. O formato de chaves pode ser um mapa
ou JSON serializado, como no histórico principal. Mensagens antigas continuam usando a chave
legada da conversa.

O texto decifrado fica somente em memória: estado da tela e cache de plaintext preservado da QA.
O cache da consulta conserva os dados cifrados. O cache de plaintext evita repetir a decifragem
quando chega uma página e também atende às citações; a troca de conta limpa esse cache, e resultados
anteriores à limpeza não podem repopulá-lo. O teto de cinco segundos da QA vale para o corpo e para
a original citada, com o mesmo placeholder de mensagem protegida.
O balão apresenta o trecho recebido do hook, sem substituir todo E2E por um rótulo fixo. Sem
identidade, chave local ou metadados válidos, a interface informa a indisponibilidade e nunca
mostra ciphertext como se fosse texto. A autoria de “Você” é comparada com a pessoa que está
lendo, não com a autoria da resposta. Citações sem texto mostram “Mensagem com mídia”.

A alteração exige o contrato backend com os metadados de citação e o design system com as props
abaixo. O lockfile herdado da QA resolve o DS `0.37.10`, que contém esse contrato. A validação
local usa um tarball reproduzido da fonte oficial, com integridade idêntica à referência do lock,
sem persistir caminho local no manifesto ou lockfile. Isso não comprova acesso ao registro privado;
a instalação pelo registro original deve ser confirmada no CI remoto.

O container `ConversationThread` liga o clique da citação ao `replyTo.id` do preview exibido.
O hook `useReplyNavigation` coordena a busca, a espera pelo DOM e o foco, sem decifrar conteúdo
nem fazer chamadas diretas à API.

## Estado do porte para QA

A atualização incorpora a QA `4d651c15627a8c6a25e0886b45173733f90be6e3`, mantendo o histórico
publicado da correção. As mudanças atuais de envio, restauração do rascunho de resposta,
histórico de chaves, cache limitado e falha isolada de decifragem foram preservadas. A baseline
de supressões, o manifesto e o lockfile são idênticos aos dessa QA.

Na composição atual, lint, typecheck, suíte completa (1.597 testes), testes das regras do ESLint,
build e comparador de supressões passaram. O navegador foi repetido em 390 e 1280 px, claro e
escuro, com o container e as views reais. O transporte era simulado, com dados fictícios e
criptografia real; não é E2E integrado com backend.

Os relatórios e capturas anteriores ficam identificados como históricos. A proveniência do DS,
a integridade do pacote, as novas capturas e o limite de acesso ao registro estão em
[prova da atualização](proof/message-replies-qa/atualizacao/README.md).

## Comportamento

- Se o original já está renderizado, centraliza a mensagem no quadro rolável e transfere o foco
  com `preventScroll`, sem mover a página inteira nem consultar o histórico.
- Caso contrário, usa a consulta infinita existente para buscar páginas anteriores em sequência.
  Para assim que encontra o id nos dados e espera o balão renderizar, inclusive após a decifragem.
  Não busca o restante do histórico depois de encontrar o alvo.
- Antes de paginar, aguarda um refetch compartilhado em andamento e verifica novamente o cache.
  Uma atualização das páginas existentes não é confundida com cursor repetido; trocar de conversa
  durante essa espera impede o início de uma nova busca.
- Cada tentativa permite até dez páginas adicionais e quinze segundos no total. Limite atingido,
  cursor repetido, falha de rede ou falha de renderização usam `texts.messages.replyNavigationError`.
  O fim real do histórico sem o alvo usa `texts.messages.replyUnavailable`.
- Durante uma tentativa, `texts.messages.loadingReply` informa o carregamento. Cliques repetidos
  não iniciam novas buscas. O carregamento manual de páginas fica suspenso nessa instância.
- Trocar de conversa, desabilitar o histórico placeholder ou desmontar a thread cancela a
  navegação e limpa o observador. Respostas atrasadas não rolam, focam, notificam nem iniciam
  outra página. A consulta em andamento pode terminar no cache da conversa original, pois é
  compartilhada por outras instâncias; o cancelamento não interrompe o transporte compartilhado.
- Citações do histórico placeholder, de mensagens de outra conversa ou em modo de seleção não
  recebem o callback de navegação.

## Contrato com o design system

`MessageBubble` recebe `onReplyQuoteClick?: () => void`. A raiz de cada balão expõe
`id="message-${id}"` e `tabIndex={-1}`. A busca é limitada ao contêiner rolável da instância,
nunca a `document.getElementById`, pois rota e dock podem exibir o mesmo id simultaneamente.

A view `ConversationThread` precisa expor duas props opcionais:

- `messagesScrollRef?: Ref<HTMLDivElement>`: referência para o quadro rolável que contém os balões.
- `suppressAutoScroll?: boolean`: impede a rolagem automática ao fim durante a navegação. A view
  deve consumir a mudança de `newestMessageId` mesmo quando suprimida, sem executar uma rolagem
  atrasada ao liberar a flag.

Esses contratos precisam existir no pacote efetivamente instalado. Um teste com a view substituída
não comprova a integração. `conversation-thread.test.tsx` usa as views reais de `ConversationThread`
e `MessageBubble`, com API e decifragem simuladas e dados fictícios; não é E2E com backend real.
`use-reply-navigation.test.tsx` exercita paginação, limites, cursor repetido, cancelamento,
concorrência, indisponibilidade e isolamento de ids no DOM.
