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

A alteração exige entrega coordenada: backend com os metadados de citação e design system
com as props abaixo. A validação local usa um tarball do DS, sem persistir seu caminho no
manifesto ou lockfile. Antes de integrar, os mantenedores precisam publicar uma versão
aprovada do DS e atualizar a dependência do consumidor. Instalação local não comprova release.

O container `ConversationThread` liga o clique da citação ao `replyTo.id` do preview exibido.
O hook `useReplyNavigation` coordena a busca, a espera pelo DOM e o foco, sem decifrar conteúdo
nem fazer chamadas diretas à API.

## Estado do porte para QA

A base deste porte é `578c0c89e1649db6bdb575f2ce9b441cfecd4418` da `upstream/qa`.
Foram preservados o cache e o teto da decifragem, as mensagens atuais e a fixture de agenda com
recorrência já integrada na QA. O porte contém somente o delta local de mensagens privadas,
sem incorporar os commits anteriores da branch de origem.

As provas da composição anterior são **históricas**: não validam esta nova base, nem o novo pacote
do design system. Nesta etapa, a cópia isolada das dependências exclui deliberadamente o DS e os
caches do Vite. Testes puros/focais e lint não substituem a validação da integração real.

A instalação do novo tarball reconciliado, a verificação dos exports/declarações, o typecheck
integral, os testes com as views reais, a suíte completa, o build e o navegador ainda dependem da
integração do pacote pelo responsável da entrega. A publicação de uma versão aprovada e o bump
correspondente permanecem **pendentes dos mantenedores**, mesmo após eventual prova com tarball.
Nenhuma versão antiga ou inventada foi instalada para contornar esse bloqueio.

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
