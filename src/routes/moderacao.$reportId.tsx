import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ModeracaoAcao } from "@/types/routes/moderacao/moderacao-acao";
import { Button } from "@rede-enois/design-system/ui";

import { reportsAdminApi } from "@/lib/api/reports-admin";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/moderacao/$reportId")({
  beforeLoad: requireAuth,
  component: ModeracaoDenuncia,
});

/**
 * Revisão de uma denúncia — o destino dos links rápidos do e-mail de suporte.
 *
 * O e-mail chega com `?acao=…` sugerindo a ação; aqui a pessoa confirma com a própria
 * sessão de admin (os endpoints são POST com AdminGuard — nada executa por clique de
 * e-mail, porque clientes de e-mail pré-carregam links).
 */
function ModeracaoDenuncia() {
  const { reportId } = useParams({ from: "/moderacao/$reportId" });
  const { acao } = useSearch({ from: "/moderacao/$reportId" }) as { acao?: ModeracaoAcao };

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "report", reportId],
    queryFn: () => reportsAdminApi.review(reportId),
    retry: false,
  });

  const apply = useMutation({
    mutationFn: (action: ModeracaoAcao) => {
      if (action === "penalizar") return reportsAdminApi.penalize(reportId);
      if (action === "avisar") return reportsAdminApi.warn(reportId);
      if (action === "banir") return reportsAdminApi.ban(reportId);
      if (action === "empresa") return reportsAdminApi.removeCompany(reportId);
      return reportsAdminApi.deletePost(reportId, "Excluído pelo painel de revisão");
    },
  });

  // Página empresarial tem ação própria: fechar a página, sem tocar na conta do dono. Banir ou
  // penalizar o dono por algo que a página publicou é recusado pelo servidor.
  const isCompany = data?.report.targetType === "COMPANY";

  const acoes: {
    id: ModeracaoAcao;
    label: string;
    variant: "default" | "outline" | "destructive";
  }[] = isCompany
    ? [
        { id: "empresa", label: texts.moderacaoReview.removeCompany, variant: "destructive" },
        { id: "avisar", label: texts.moderacaoReview.warn, variant: "outline" },
      ]
    : [
        { id: "penalizar", label: texts.moderacaoReview.penalize, variant: "default" },
        { id: "avisar", label: texts.moderacaoReview.warn, variant: "outline" },
        { id: "excluir", label: texts.moderacaoReview.deletePost, variant: "outline" },
        { id: "banir", label: texts.moderacaoReview.ban, variant: "destructive" },
      ];

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">{texts.moderacaoReview.title}</h1>

        {isLoading && <p className="text-sm text-muted-foreground">{texts.common.loading}</p>}

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {texts.moderacaoReview.forbidden}
          </p>
        )}

        {data && (
          <>
            <section className="surface-card space-y-2 p-4 text-sm">
              <p>
                <span className="text-muted-foreground">{texts.moderacaoReview.type}: </span>

                <span className="font-medium">{data.report.reason}</span>

                <span className="text-muted-foreground">
                  {" "}
                  · {data.report.targetType.toLowerCase()}
                </span>
              </p>

              <p>
                <span className="text-muted-foreground">{texts.moderacaoReview.reporter}: </span>
                {data.reporter}
              </p>

              <p>
                <span className="text-muted-foreground">{texts.moderacaoReview.reported}: </span>
                {data.author || texts.moderacaoReview.noAuthor}
              </p>

              <p className="text-xs text-text-date">#{data.report.id}</p>
            </section>

            {data.content && (
              <section className="surface-card p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-subtle">
                  {texts.moderacaoReview.content}
                </p>

                <p className="whitespace-pre-wrap break-words text-sm">{data.content}</p>
              </section>
            )}

            <section className="surface-card space-y-2 p-4">
              <p className="text-xs text-muted-foreground">{texts.moderacaoReview.confirmHint}</p>

              <div className="flex flex-wrap gap-2">
                {acoes.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    className={`rounded-full ${acao === action.id ? "ring-2 ring-primary" : ""}`}
                    disabled={apply.isPending || data.report.status !== "PENDING"}
                    onClick={() => apply.mutate(action.id)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>

              {apply.isPending && (
                <p className="text-xs text-muted-foreground">{texts.common.sending}</p>
              )}

              {apply.isSuccess && (
                <p className="text-sm text-growth">{texts.moderacaoReview.applied}</p>
              )}

              {apply.isError && (
                <p className="text-sm text-destructive">{texts.moderacaoReview.actionError}</p>
              )}

              {data.report.status !== "PENDING" && (
                <p className="text-xs text-text-date">{texts.moderacaoReview.alreadyReviewed}</p>
              )}
            </section>
          </>
        )}
      </div>
    </AppContainer>
  );
}
