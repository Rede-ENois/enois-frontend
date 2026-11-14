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

## Verificação

`src/routes/-penalidades.test.tsx` exercita o container com a consulta real do React Query e respostas sintéticas da API. Os testes cobrem falha inicial, sucesso vazio, recuperação com/sem penalidade, falha persistente, falha de atualização e tentativa concorrente.

Esses testes não substituem verificação no navegador nem integração com o backend.
