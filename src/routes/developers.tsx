import { type ComponentProps, useState } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";

import {
  API_BASE_URL,
  API_V1_BASE_URL,
  apiSections,
  apiUseCases,
} from "@/constants/developers-api";
import { texts } from "@/texts";
import type { ApiEndpoint } from "@/types/application/developers/api-endpoint";
import type { HttpMethod } from "@/types/application/developers/http-method";
import { Check, Copy } from "lucide-react";

import { ogMetas } from "@/lib/seo";

import { AppContainer } from "@/components/app-container";
import { DeveloperOriginsSection } from "@/components/developers/developer-origins-section";

export const Route = createFileRoute("/developers")({
  // Pagina PUBLICA de documentacao. O subdominio developers.enois.ia.br aponta para ca quando o
  // DNS/TLS estiver configurado (ver docs/DEVELOPERS_PORTAL.md no backend).
  head: () => ({
    meta: [
      { title: texts.developers.seoTitle },
      { name: "description", content: texts.developers.seoDescription },
      ...ogMetas(texts.developers.seoTitle, texts.developers.seoDescription),
    ],
  }),
  component: Developers,
});

const METHOD_STYLE: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  POST: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  PUT: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  PATCH: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  DELETE: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

// Chips PREENCHIDOS (não tingidos): com temas pastéis, text-primary sobre fundo
// tingido de primary ficava ilegível — texto sobre a cor cheia contrasta sempre,
// porque onPrimary é definido pelo tema contra o próprio primary.
const ACCESS_STYLE: Record<ApiEndpoint["access"], { label: string; className: string }> = {
  public: { label: "público", className: "bg-primary text-primary-foreground" },
  auth: { label: "com sessão", className: "bg-primary text-primary-foreground" },
  admin: { label: "admin", className: "bg-destructive text-destructive-foreground" },
};

function Code({ children }: { children: string }) {
  return <CodeBlock code={children} />;
}

function CodeBlock({ code }: { code: string }) {
  return <CopyableCode code={code.trim()} />;
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Sem clipboard (contexto inseguro): o texto continua selecionavel a mao.
    }
  };

  return (
    <div className="group relative mt-2 min-w-0">
      {/* No celular a linha longa NAO pode sair da caixa: com o `overflow-x-auto` o comando
          ficava cortado e o scroll lateral (sem nenhuma pista) era a unica saida. Quebrando a
          linha, o exemplo inteiro cabe na tela. O `pr-11` abre espaco para o botao de copiar,
          que no toque fica sempre visivel. */}
      <pre className="max-w-full overflow-x-auto whitespace-pre-wrap rounded-xl border border-border-soft bg-surface-1 p-3 pr-11 text-xs leading-relaxed sm:pr-3">
        <code className="break-words">{code}</code>
      </pre>

      <button
        type="button"
        onClick={() => void copy()}
        className="absolute right-2 top-2 rounded-md border border-border-soft bg-surface-card p-1.5 text-text-subtle opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        aria-label={copied ? texts.developersChrome.copied : texts.developersChrome.copy}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function Section({ title, children, ...rest }: ComponentProps<"section"> & { title?: string }) {
  return (
    <section className="surface-card scroll-mt-20 p-5" {...rest}>
      {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}

      {children}
    </section>
  );
}

function Endpoint({ endpoint }: { endpoint: ApiEndpoint }) {
  const access = ACCESS_STYLE[endpoint.access];

  return (
    <div className="mt-3 min-w-0 rounded-xl border border-border-soft p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${METHOD_STYLE[endpoint.method]}`}
        >
          {endpoint.method}
        </span>

        <code className="break-all font-mono text-xs font-semibold text-text-strong">
          {endpoint.path}
        </code>

        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${access.className}`}
        >
          {access.label}
        </span>
      </div>

      <p className="mt-1.5 text-sm font-normal text-text-subtle">{endpoint.description}</p>

      {endpoint.request && (
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
          requisição
        </p>
      )}

      {endpoint.request && <CodeBlock code={endpoint.request} />}

      {endpoint.response && (
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
          resposta
        </p>
      )}

      {endpoint.response && <CodeBlock code={endpoint.response} />}
    </div>
  );
}

function Developers() {
  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {texts.developers.title}
          </h1>

          <p className="text-sm text-text-subtle sm:text-base">{texts.developers.subtitle}</p>

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href="#comecando"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
            >
              {texts.developersChrome.start}
            </a>

            <a
              href="#modulos"
              className="rounded-full border border-border-soft px-4 py-1.5 text-sm font-semibold hover:bg-surface-2"
            >
              {texts.developersChrome.modules}
            </a>

            <a
              href="#casos"
              className="rounded-full border border-border-soft px-4 py-1.5 text-sm font-semibold hover:bg-surface-2"
            >
              {texts.developersChrome.useCases}
            </a>
          </div>
        </header>

        <Section title={texts.developers.philosophyTitle} id="filosofia">
          <p className="mt-2 text-sm font-normal text-text-subtle">{texts.developers.philosophy}</p>
        </Section>

        <Section title={texts.developers.originsTitle} id="origens">
          <p className="mt-2 text-sm font-normal text-text-subtle">
            {texts.developers.originsDescription}
          </p>

          <DeveloperOriginsSection />
        </Section>

        <Section title={texts.developersChrome.startTitle} id="comecando">
          <div className="mt-2 space-y-3 text-sm font-normal text-text-subtle">
            <p>
              {texts.developers.baseUrlHint}{" "}
              <code className="font-mono text-text-strong">{API_BASE_URL}</code>{" "}
              {texts.developers.baseUrlNote}
            </p>

            <p>{texts.developersChrome.intro}</p>

            {/* A API publica roda no sandbox desde o incidente de 22/10; producao exige pedido. */}
            <div className="rounded-2xl border border-border-soft bg-surface-2 p-4">
              <p className="text-sm font-medium text-text-strong">
                {texts.developers.sandboxTitle}
              </p>

              <p className="mt-1 text-sm">{texts.developers.sandboxBody}</p>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {texts.developers.sandboxFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>

              <p className="mt-2 text-sm">{texts.developers.sandboxWhy}</p>

              <p className="mt-2 text-sm">
                <Link to="/suporte" className="font-medium text-primary hover:underline">
                  {texts.developers.sandboxCta}
                </Link>
              </p>
            </div>

            <div className="rounded-xl border border-border-soft p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                {texts.developersChrome.versionTitle}
              </p>

              <p className="mt-1 text-sm">
                {texts.developersChrome.versionHint}{" "}
                <code className="font-mono text-text-strong">{API_V1_BASE_URL}</code>
              </p>

              <CodeBlock
                code={`GET ${API_V1_BASE_URL}/feed/posts/$POST_ID
GET ${API_V1_BASE_URL}          # indice da versao`}
              />

              <p className="mt-2 text-sm text-text-subtle">{texts.developersChrome.versionNote}</p>

              <p className="mt-1 text-sm text-text-subtle">{texts.developersChrome.versionNow}</p>
            </div>

            <CodeBlock
              code={`# 1. Autentique-se (o mesmo token que o app usa)
curl -X POST ${API_BASE_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"ada@exemplo.com","password":"senha-forte-1"}'

# 2. Autentique cada chamada com a sessao
curl ${API_BASE_URL}/me -H "X-Session-Token: <token>"`}
            />

            <p>{texts.developersChrome.chromeIntroPublic}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl border border-border-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  {texts.developersChrome.paginationTitle}
                </p>

                <p className="mt-1 text-sm">{texts.developers.pagination}</p>

                <CodeBlock
                  code={`GET ${API_BASE_URL}/feed/posts/$POST_ID/comments?limit=20\nGET ...?cursor=<nextCursor>&limit=20`}
                />
              </div>

              <div className="min-w-0 rounded-xl border border-border-soft p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  {texts.developersChrome.errorsTitle}
                </p>

                <p className="mt-1 text-sm">{texts.developers.errors}</p>

                <CodeBlock
                  code={`{"code":"UNAUTHENTICATED","message":"Sessao invalida ou expirada.",
 "timestamp":"2026-10-17T14:20:39Z"}`}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border-soft">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-1 font-semibold text-text-strong">
                  <tr>
                    <th className="px-3 py-2">HTTP</th>

                    <th className="px-3 py-2">código</th>

                    <th className="px-3 py-2">quando</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-soft">
                  {[
                    [
                      "400",
                      "BAD_REQUEST",
                      "corpo inválido (e Idempotency-Key ausente onde é exigida)",
                    ],
                    ["401", "UNAUTHENTICATED", "sem sessão, sessão expirada ou token forjado"],
                    [
                      "403",
                      "FORBIDDEN / ACCOUNT_RESTRICTED / ACCOUNT_BANNED",
                      "sem permissão; conta restrita ou banida",
                    ],
                    ["404", "NOT_FOUND", "recurso inexistente (ou de outra pessoa)"],
                    [
                      "409",
                      "CONFLICT / ALREADY_REPORTED / APPEAL_ALREADY_PENDING",
                      "estado atual não permite a operação",
                    ],
                    ["422", "INVALID_COMMENT", "regra de conteúdo violada"],
                    ["429", "RATE_LIMITED", "limite de requisições excedido"],
                  ].map(([http, code, when]) => (
                    <tr key={code}>
                      <td className="px-3 py-1.5 font-mono">{http}</td>

                      <td className="px-3 py-1.5 font-mono text-text-strong">{code}</td>

                      <td className="px-3 py-1.5">{when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              {texts.developers.limits} {texts.developersChrome.idempotencyHint}
            </p>
          </div>
        </Section>

        <div id="modulos" className="scroll-mt-20" />

        <nav className="surface-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
            {texts.developersChrome.modules}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {apiSections.map((section) => (
              <a
                key={section.id}
                href={`#modulo-${section.id}`}
                className="rounded-full border border-border-soft px-3 py-1 text-xs font-medium transition hover:border-primary hover:text-primary"
              >
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        {apiSections.map((section) => (
          <Section key={section.id} title={section.title} id={`modulo-${section.id}`}>
            <p className="mt-2 text-sm font-normal text-text-subtle">{section.description}</p>

            {section.endpoints.map((endpoint) => (
              <Endpoint key={`${endpoint.method} ${endpoint.path}`} endpoint={endpoint} />
            ))}
          </Section>
        ))}

        <div id="casos" className="scroll-mt-20" />

        <header className="space-y-1 pt-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {texts.developersChrome.useCasesTitle}
          </h2>

          <p className="text-sm text-text-subtle">{texts.developersChrome.useCasesIntro}</p>
        </header>

        {apiUseCases.map((useCase) => (
          <Section key={useCase.id} title={useCase.title} id={`caso-${useCase.id}`}>
            <p className="mt-2 text-sm font-normal text-text-subtle">{useCase.description}</p>

            <ol className="mt-3 space-y-3">
              {useCase.steps.map((step, index) => (
                <li key={index} className="space-y-1">
                  <p className="text-sm font-medium text-text-strong">
                    <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                      {index + 1}
                    </span>

                    {step.note}
                  </p>

                  {step.code && <CodeBlock code={step.code} />}
                </li>
              ))}
            </ol>
          </Section>
        ))}

        <Section title={texts.developers.statusTitle} id="status">
          <div className="mt-2 space-y-2 text-sm font-normal text-text-subtle">
            <p>{texts.developers.status}</p>

            <p>
              {texts.developers.securityLinkPrefix} <code className="font-mono">SECURITY.md</code>{" "}
              {texts.developersChrome.securityHint}
            </p>

            <p>
              {texts.developersChrome.guidelinesHint}{" "}
              <a href="/diretrizes" className="text-primary hover:underline">
                {texts.legal.footer.guidelines}
              </a>
            </p>
          </div>
        </Section>
      </div>
    </AppContainer>
  );
}
