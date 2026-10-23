# Política de Segurança do Énóis (frontend)

> Uma falha de segurança **nunca** vira issue ou PR pública. Reporte pelo canal privado abaixo.
> A API, a autorização e a moderação têm a política equivalente em
> [`enois-backend/SECURITY.md`](https://github.com/Rede-ENois/enois-backend/blob/main/SECURITY.md).

## Como reportar (canal privado)

1. **E-mail — canal principal:** **seguranca@enois.ia.br** (se preferir, `suporte@enois.ia.br`
   encaminha para a mesma fila). Quem recebe é o time do Énóis, e o conteúdo não é publicado.
2. **O que incluir:**
   - **versão/commit** em que o problema aparece e o navegador usado;
   - **mínimo que reproduz**: a tela, a sequência de cliques ou a requisição;
   - **comportamento observado × esperado**;
   - **impacto estimado** (vazamento de dado de outra pessoa, bypass de permissão na interface,
     execução de script de terceiro, negação de serviço, automação indevida da conta). Prova de
     conceito é bem-vinda; explorations já automatizadas e massivas, não.
3. **Não** abra issue pública, PR público nem comente em issue aberta antes da correção
   combinada — isso expõe quem usa a plataforma.

**Não** inclua em reportes, issues, prints ou PRs: dados pessoais de usuários, credenciais, tokens,
segredos de sessão ou capturas de conversas privadas.

## Escopo

**Em escopo** (este repositório, GPLv3):

- A aplicação em `enois.ia.br`: interface, sessão, renderização no servidor, quadro isolado de
  HTML/CSS de terceiros, service worker, cache e as integrações oficiais no navegador.
- O contrato com a API quando o frontend erra (por exemplo, exibindo ou aceitando algo que o
  servidor devia recusar).

**Fora de escopo:** engenharia social, phishing contra o time, DDoS/ataques de volume, a
infraestrutura de quem usa o Énóis, programas escritos por terceiros dentro da plataforma, e
qualquer associação com marcas de terceiros.

O detalhamento do backend (contratos, autorização por recurso, integridade financeira) está no
`SECURITY.md` do repositório `enois-backend`.

## Compromisso de resposta (open source, melhor esforço)

- **Triagem em até 5 dias úteis**, pelo time do Énóis.
- Gravidade pelo impacto real: execução de script de terceiro > vazamento de dado de outra pessoa >
  bypass de permissão > negação de serviço > endurecimento.
- A correção vai na branch ativa **com teste de regressão no mesmo commit** (é o portão de qualidade
  do repositório) e a publicação do aviso acompanha a versão que traz a correção.
- **Divulgação coordenada:** pedimos **até 90 dias** entre o reporte privado e a divulgação
  pública, proporcionais ao risco. Damos crédito a quem reportar, salvo se preferir o anonimato.

## Safe harbor

Pesquisa de boa-fé neste repositório é bem-vinda: não tomamos ação contra quem segue esta política
(escopo respeitado, sem extrair dado de terceiro, sem degradar o serviço, sem divulgar antes da
correção). Teste automatizado agressivo contra `enois.ia.br` fora do seu próprio fork/clone não é
pesquisa — é abuso.

## Como este projeto se protege (para quem for reportar)

Vale saber antes de reportar, para não confundir escolha com falha:

- **A sessão fica em `localStorage`, não em cookie** — não há CSRF de formulário; toda escrita manda
  o token em cabeçalho, e quem valida é o backend.
- **HTML/CSS colado por usuário roda em quadro isolado** (`sandbox` sem `allow-scripts` no modo
  embutido, CSP própria dentro do documento, sem rede). `allow-same-origin` existe só para o nosso
  código medir a altura do quadro — quem executa script é `allow-scripts`, que continua fora.
- **Nada crítico é decidido na tela.** Limite de caracteres, permissão, propriedade e regra de
  negócio são conferidos no backend; a interface só evita o erro antes de ele acontecer.
- **A base da API vem do ambiente** (`VITE_API_BACKEND`), nunca de um endereço fixo no código.

## Referências

OWASP ASVS 5.0 (nível 2 como referência mínima de verificação) e a política de segurança do
backend. Isso **não** equivale a certificação nem substitui uma avaliação independente.

---

### Resumo (EN)

**Do not open a public issue for security vulnerabilities.** Report privately to
**seguranca@enois.ia.br**, including the affected version/commit, a minimal reproduction, the
observed vs expected behaviour and the estimated impact. Triage within 5 business days; coordinated
disclosure for up to 90 days; the advisory ships with the fixing release. Good-faith research
within scope is welcome. The scope, the commitments and what is already in force are described
above.
