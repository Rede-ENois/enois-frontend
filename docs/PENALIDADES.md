# Penalidades da própria conta

A rota `/penalidades` consulta as sanções e os recursos da pessoa autenticada.

## Falha na consulta

- A ausência de penalidades só é apresentada após uma resposta bem-sucedida.
- Uma falha inicial ou de atualização apresenta mensagem explícita e a ação **Tentar novamente**.
- Durante a nova tentativa não há outra consulta disparada pelo mesmo botão.
- A resposta recuperada substitui o erro, seja uma lista vazia ou uma lista de penalidades.
- O tratamento de sessão continua sendo responsabilidade do cliente de API e dos guards existentes.

A correção de carregamento é independente das melhorias de transparência da punição.

## Relógio do contador

O hook `useSanctionClock` usa a referência temporal recebida do servidor e o tempo decorrido monotônico do navegador, não a hora configurada no computador. Ao atingir um prazo, solicita revalidação uma única vez para aquele prazo; não decide liberação nem banimento. Ao retomar uma aba visível, também solicita atualização. A desmontagem remove temporizador e ouvintes.

Referência temporal ausente ou inválida não gera um contador fictício. A integração visual depende do contrato de sanções e das views do design system.

## Contrato de transparência

O cliente de `GET /me/sanctions` valida a resposta em tempo de execução: referência do servidor, listas de sanções/recursos, significado e data do prazo, evidência segura e elegibilidade de recurso. Prazo de recurso e término efetivo são estados diferentes; combinações incoerentes ou datas inválidas produzem erro de consulta, não um contador inventado.

Somente os campos previstos pelo contrato são repassados à apresentação. A integração desse contrato depende da entrega coordenada do backend.

O snapshot da consulta conserva junto dos dados o instante monotônico da observação, apenas no cache local. Remontar a tela com dados ainda frescos não reinicia o prazo nem reassocia um `serverNow` antigo a uma nova observação. Esse metadado não integra o payload HTTP.

A troca do indicador de acesso limitado em outra aba também invalida o cache dependente da sessão. Assim, uma troca entre duas contas limitadas não conserva motivo, evidência ou recurso da conta anterior.

## Conta suspensa e recurso

A página `/conta-suspensa` usa a mesma consulta autorizada, sem depender do indicador de sessão normal. O backend confirma a identidade e todos os fatores antes de emitir o acesso `SANCTIONS_ONLY`, transportado pelos cookies HttpOnly existentes. Esse acesso não é gravado como uma sessão normal nem dispara sincronização de chaves, chat ou outras áreas privadas.

- Login por senha, segundo fator, confirmação de e-mail e retorno OAuth respeitam o escopo confirmado pelo servidor.
- OAuth com fator pendente consulta o desafio do cookie por `/auth/2fa/challenge` antes de concluir o login; essa etapa não revela suspensão.
- `ACCOUNT_SUSPENDED` e `SESSION_RESTRICTED` confirmados pelo servidor encaminham para a página específica. Erro de rede, CSRF ou um 401 genérico não são interpretados como suspensão.
- Um 401 na consulta limitada pede nova entrada, sem preservar dados da decisão como sucesso atual.
- O recurso envia texto aparado, impede duplicação durante o envio e reconcilia seu estado com o servidor. Pendência aparece como **Recurso em análise**.
- Após remoção da sanção, a tela apresenta o histórico e o caminho para entrar novamente; não promove a credencial limitada para sessão normal.

O indicador local de acesso restrito contém apenas estado de navegação. Não é credencial nem autoriza qualquer consulta. A proteção efetiva permanece no backend.

A apresentação é `SanctionsView`, do design system; o frontend mantém somente containers, consultas, relógio, navegação e autenticação. O formulário de segundo fator já existente é reutilizado no retorno OAuth. O arquivo legado de entrada continua extenso; o ajuste nele ficou restrito à aceitação do escopo e ao encaminhamento, sem refatoração visual.

## Dependência coordenada

A integração usa as novas exportações da entrega DS #231. A prova local utiliza um pacote gerado da branch dessa entrega, que mantém a versão-base `0.34.0`; não se trata do conteúdo já publicado dessa versão. O manifesto e o lockfile não recebem caminho local nem versão futura inventada. A publicação de uma versão ou pré-versão pelo mantenedor e a atualização coordenada do consumidor são requisitos antes de uma instalação limpa ou merge da integração.

## Verificação

`src/routes/-penalidades.test.tsx` exercita o container com a consulta real do React Query e respostas sintéticas da API. Os testes cobrem falha inicial, sucesso vazio, recuperação com/sem penalidade, falha persistente, falha de atualização e tentativa concorrente.

Esses testes não substituem verificação no navegador nem integração com o backend.
