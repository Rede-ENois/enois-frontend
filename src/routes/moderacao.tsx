import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft, Gamepad2, Gavel, ShieldAlert } from "lucide-react";

import { gamesApi, sanctionsApi, walletApi } from "@/lib/api";
import { formatFaisca } from "@/lib/faisca";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";

/**
 * Fila de recursos das penalidades automaticas. Somente administradores (REDE_ADMIN_EMAILS)
 * conseguem de fato decidir — para os demais a API devolve 403 e a pagina avisa.
 */
export const Route = createFileRoute("/moderacao")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.sanctions.moderationTitle }] }),
  component: Moderacao,
});

function Moderacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const matchRoute = useMatchRoute();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-appeals"],
    queryFn: () => sanctionsApi.pendingAppeals(),
    retry: false,
    // A decisão de um recurso é filha desta fila: quando é ela que está na tela, a fila não precisa
    // ser buscada (e o roteador só renderiza o filho se a fila devolver o Outlet).
    enabled: !matchRoute({ to: "/moderacao/$reportId" }),
  });

  const decide = useMutation({
    mutationFn: ({ appealId, deny }: { appealId: string; deny: boolean }) =>
      deny ? sanctionsApi.denyAppeal(appealId) : sanctionsApi.approveAppeal(appealId),
    onSuccess: () => {
      toast(texts.sanctions.decided, "success");
      void queryClient.invalidateQueries({ queryKey: ["pending-appeals"] });
    },
    onError: () => toast(texts.sanctions.moderationError, "error"),
  });

  // Sem devolver o filho aqui, o roteador renderiza a fila no lugar da tela de decisão (a mesma
  // armadilha do Outlet que derrubava o post do blog).
  if (matchRoute({ to: "/moderacao/$reportId" })) {
    return <Outlet />;
  }

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.sanctions.back}</>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {texts.sanctions.moderationTitle}
          </h1>

          <p className="text-sm text-muted-foreground">{texts.sanctions.moderationDescription}</p>
        </div>

        <DisputasSection />
        <JogosSection />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-sm text-text-subtle">
            {texts.sanctions.moderationError}
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-border-soft bg-surface-card">
            <EmptyState icon={Gavel} title={texts.sanctions.moderationEmpty} />
          </div>
        ) : (
          <ul className="space-y-3">
            {data!.map((item) => (
              <li
                key={item.id}
                className="space-y-2 rounded-2xl border border-border-soft bg-surface-card p-4"
              >
                <p className="text-sm">{item.message}</p>

                <p className="text-xs text-text-subtle">
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ appealId: item.id, deny: false })}
                  >
                    {texts.sanctions.approve}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ appealId: item.id, deny: true })}
                  >
                    {texts.sanctions.deny}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppContainer>
  );
}

/**
 * As contestações de transferência (golpe) na fila de moderação: VERDADEIRA reverte a
 * transferência e restringe o golpista; FALSA restringe quem contestou de má-fé.
 * Somente administradores — para os demais a API devolve 403 e a seção nem aparece.
 */
function DisputasSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    data: disputas,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["coin-disputas"],
    queryFn: () => walletApi.disputasPendentes(30),
    retry: false,
  });

  const decidir = useMutation({
    mutationFn: ({ id, deferir, note }: { id: string; deferir: boolean; note?: string }) =>
      deferir ? walletApi.deferirDisputa(id, note) : walletApi.rejeitarDisputa(id, note),
    onSuccess: (resposta) => {
      toast(
        resposta.state === "UPHELD"
          ? "Contestação deferida: a transferência foi revertida e o valor voltou para a vítima."
          : "Contestação rejeitada: quem contestou foi restringido.",
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["coin-disputas"] });
    },
    onError: () => toast("Não foi possível decidir a contestação.", "error"),
  });

  // 403 = não é admin: a seção não existe para quem não decide.
  if (error) return null;

  return (
    <section className="space-y-3" aria-label="Contestações de transferência">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-primary" />

        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          Contestações de transferência
        </h2>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (disputas?.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-text-subtle">
          Nenhuma contestação esperando decisão.
        </p>
      ) : (
        <ul className="space-y-3">
          {disputas!.map((d) => (
            <li
              key={d.id}
              className="space-y-2 rounded-2xl border border-border-soft bg-surface-card p-4"
            >
              <p className="text-sm font-semibold">
                Transferência de {formatFaisca(d.amount)} faíscas · motivo: {d.reason}
              </p>

              <p className="text-xs text-text-subtle">
                {new Date(d.createdAt).toLocaleString("pt-BR")} · ref {d.entryRef.slice(0, 16)}…
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={decidir.isPending}
                  onClick={() => decidir.mutate({ id: d.id, deferir: true })}
                >
                  Procede (reverter)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={decidir.isPending}
                  onClick={() => decidir.mutate({ id: d.id, deferir: false })}
                >
                  Não procede (punir contestador)
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** A proporção do quadro, escolhida pelo criador — igual à da página do jogo. */
const ASPECT: Record<string, string> = {
  WIDESCREEN: "16 / 9",
  CLASSIC: "4 / 3",
  SQUARE: "1 / 1",
  PORTRAIT: "9 / 16",
};

/**
 * A fila de jogos submetidos (E3 do plano): o revisor testa o jogo NO MESMO quadro isolado em
 * que ele vai rodar em produção e decide — aprovado entra no catálogo, recusado volta ao criador
 * com o motivo (que aparece no painel dele junto ao status). Somente administradores — para os
 * demais a API devolve 403 e a seção nem aparece.
 */
function JogosSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [testando, setTestando] = useState<string | null>(null);
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  const {
    data: jogos,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["games-pendentes"],
    queryFn: () => gamesApi.pendentes(30),
    retry: false,
  });

  const decidir = useMutation({
    mutationFn: ({ id, aprovar, note }: { id: string; aprovar: boolean; note?: string }) =>
      aprovar ? gamesApi.aprovar(id, note) : gamesApi.rejeitar(id, note),
    onSuccess: (_resposta, vars) => {
      toast(
        vars.aprovar
          ? "Jogo aprovado: já está no catálogo."
          : "Jogo recusado: o motivo vai para o painel do criador.",
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["games-pendentes"] });
    },
    onError: () => toast("Não foi possível decidir sobre o jogo.", "error"),
  });

  // 403 = não é admin: a seção não existe para quem não decide.
  if (error) return null;

  return (
    <section className="space-y-3" aria-label="Jogos esperando revisão">
      <div className="flex items-center gap-2">
        <Gamepad2 className="h-4 w-4 text-primary" />

        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          Jogos esperando revisão
        </h2>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (jogos?.length ?? 0) === 0 ? (
        <p className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm text-text-subtle">
          Nenhum jogo na fila de revisão.
        </p>
      ) : (
        <ul className="space-y-3">
          {jogos!.map((g) => (
            <li
              key={g.id}
              className="space-y-3 rounded-2xl border border-border-soft bg-surface-card p-4"
            >
              <div className="flex gap-3">
                {g.cover && (
                  <img
                    src={g.cover}
                    alt=""
                    className="h-14 w-24 shrink-0 rounded-lg border border-border-soft object-cover"
                  />
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{g.title}</p>

                  <p className="text-xs text-text-subtle">
                    @{g.username ?? g.userId} ·{" "}
                    {new Date(g.submittedAt).toLocaleDateString("pt-BR")}
                    {g.tags ? ` · ${g.tags}` : ""}
                  </p>
                </div>
              </div>

              {g.description && (
                <p className="whitespace-pre-line text-sm font-normal text-muted-foreground">
                  {g.description}
                </p>
              )}

              <p className="break-all text-xs text-text-subtle">{g.url}</p>

              {testando === g.id ? (
                <div
                  className="relative w-full overflow-hidden rounded-xl border border-border-soft"
                  style={{ aspectRatio: ASPECT[g.aspect] ?? "16 / 9" }}
                >
                  <iframe
                    src={g.url}
                    title={g.title}
                    className="h-full w-full border-0"
                    allow="fullscreen; gamepad; autoplay"
                    sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => setTestando(g.id)}
                  >
                    <Gamepad2 className="h-3.5 w-3.5" />

                    <>{texts.games.game.play}</>
                  </Button>
                </div>
              )}

              <Input
                value={motivos[g.id] ?? ""}
                onChange={(e) => setMotivos((m) => ({ ...m, [g.id]: e.target.value }))}
                placeholder="Motivo da decisão (opcional — quem recusa deve dizer por quê)"
                maxLength={300}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={decidir.isPending}
                  onClick={() => decidir.mutate({ id: g.id, aprovar: true, note: motivos[g.id] })}
                >
                  Aprovar
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  disabled={decidir.isPending}
                  onClick={() => decidir.mutate({ id: g.id, aprovar: false, note: motivos[g.id] })}
                >
                  Recusar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
