import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CHANGELOG_RELEASES } from "@/constants/changelog";
import type { Personalization } from "@/types/application/preferences/personalization";
import { Button, Switch, useToast } from "@rede-enois/design-system/ui";
import { ArrowRight, CheckCircle2, History, Sparkles } from "lucide-react";

import { preferencesApi } from "@/lib/api";
import { hasSession } from "@/lib/require-auth";
import { usePersonalization } from "@/lib/use-personalization";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/novidades")({
  head: () => ({ meta: [{ title: "Novidades do Sistema e Design — É-Nóis" }] }),
  component: WhatsNewPage,
});

export function WhatsNewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: personalization } = usePersonalization();
  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);

  const whatsNewEnabled = localEnabled ?? personalization?.whatsNewEnabled ?? true;

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      preferencesApi.setPersonalization({ whatsNewEnabled: enabled }),
    onMutate: (enabled) => {
      setLocalEnabled(enabled);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<Personalization>(["personalization"], saved);
      toast(
        saved.whatsNewEnabled
          ? "Avisos de novas atualizações ativados."
          : "Avisos de novas atualizações desativados.",
        "success",
      );
    },
    onError: () => {
      setLocalEnabled(null);
      toast("Não foi possível salvar sua preferência.", "error");
    },
  });

  return (
    <AppContainer>
      <div className="mx-auto max-w-2xl space-y-6 py-4">
        {/* Cabeçalho */}
        <header className="rounded-2xl border border-border-soft bg-surface-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>

            <div>
              <h1 className="text-2xl font-bold text-text-strong">O que há de novo no É-Nóis</h1>

              <p className="mt-0.5 text-sm text-text-subtle">
                Acompanhe o lançamento de novas ferramentas, melhorias no design system e novidades
                de layout.
              </p>
            </div>
          </div>

          {/* Controle de notificações do usuário */}
          {hasSession() && (
            <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border-soft bg-surface-1 p-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-strong">
                  Avisar sobre novas atualizações no primeiro acesso
                </p>

                <p className="text-xs text-text-subtle">
                  Quando ativo, mostramos um resumo explicativo na sua primeira visita após uma
                  atualização.
                </p>
              </div>

              <Switch
                checked={whatsNewEnabled}
                disabled={toggleMutation.isPending}
                onCheckedChange={(checked) => toggleMutation.mutate(checked)}
              />
            </div>
          )}
        </header>

        {/* Releases do Changelog */}
        <div className="space-y-8">
          {CHANGELOG_RELEASES.map((release) => (
            <section
              key={release.version}
              className="space-y-4 rounded-2xl border border-border-soft bg-surface-card p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      Versão {release.version}
                    </span>

                    <span className="text-xs text-text-subtle">{release.date}</span>
                  </div>

                  <h2 className="mt-1.5 text-lg font-bold text-text-strong">{release.title}</h2>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-text-subtle">
                  <History className="h-3.5 w-3.5" />

                  <span>{release.items.length} novidades</span>
                </div>
              </div>

              <p className="text-sm text-text-subtle">{release.description}</p>

              {/* Itens da release */}
              <div className="space-y-4 pt-2">
                {release.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-border-soft bg-surface-1 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-text-strong">{item.title}</h3>
                      {item.tag && (
                        <span className="shrink-0 rounded-full border border-border-soft px-2 py-0.5 text-[11px] font-medium text-text-subtle">
                          {item.tag}
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-sm text-text-subtle">{item.description}</p>

                    {item.steps && item.steps.length > 0 && (
                      <div className="mt-3 rounded-lg bg-surface-2/60 p-3">
                        <p className="text-xs font-semibold text-text-strong">Como usar:</p>

                        <ol className="mt-1 space-y-1">
                          {item.steps.map((step, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-text-subtle"
                            >
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />

                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {item.action && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 rounded-full text-xs"
                          onClick={() => void navigate({ to: item.action!.to })}
                        >
                          <span>{item.action.label}</span>

                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppContainer>
  );
}
