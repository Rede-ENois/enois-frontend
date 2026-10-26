import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { GamePlayer } from "@rede-enois/design-system/domain";
import { Button, EmptyState, Input, LoadingState, useToast } from "@rede-enois/design-system/ui";
import { ArrowLeft } from "lucide-react";
import { Ban, Gamepad2, Gavel, ShieldAlert, ShieldOff, Trash2 } from "lucide-react";

import { gamesApi, moderationApi, sanctionsApi, walletApi } from "@/lib/api";
import { dataCurta, dataHora } from "@/lib/date/format";
import { formatFaisca } from "@/lib/faisca";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { SuspiciousPostsSection } from "@/components/moderation/suspicious-posts-section";

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
        <SuspiciousPostsSection />
        <JogosSection />
        <AdminSection />

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

                <p className="text-xs text-text-subtle">{dataHora(item.createdAt)}</p>

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
                {dataHora(d.createdAt)} · ref {d.entryRef.slice(0, 16)}…
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

function AdminSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [motivo, setMotivo] = useState("");

  const { data: bloqueados, error: bloqueadosError } = useQuery({
    queryKey: ["blocked-ips"],
    queryFn: () => moderationApi.blockedIps(100),
    retry: false,
  });

  const {
    data: ips,
    refetch: buscarIps,
    isFetching: buscandoIps,
  } = useQuery({
    queryKey: ["user-ips", username.trim()],
    queryFn: () => moderationApi.userIps(username.trim()),
    enabled: false,
    retry: false,
  });

  const sanitizar = useMutation({
    mutationFn: () =>
      moderationApi.sanitizeUser(
        username.trim(),
        motivo.trim() || "Limpeza por spam decidida no painel.",
      ),
    onSuccess: (resposta) => {
      toast(
        `Conteúdo de @${resposta.username} apagado do banco: ${resposta.posts} posts e ${resposta.comments} comentários.`,
        "success",
      );
    },
    onError: () =>
      toast("Não foi possível sanitizar (mínimo de 10 caracteres no motivo).", "error"),
  });

  const banir = useMutation({
    mutationFn: ({ tipo }: { tipo: "BAN" | "PERMABAN" }) =>
      moderationApi.sanctionUser(
        username.trim(),
        tipo,
        motivo.trim() || "Banimento por spam decidido no painel.",
      ),
    onSuccess: (_resposta, vars) => {
      toast(
        vars.tipo === "PERMABAN" ? "Banimento permanente aplicado." : "Banimento aplicado.",
        "success",
      );
    },
    onError: () =>
      toast("Não foi possível banir o usuário (mínimo de 10 caracteres no motivo).", "error"),
  });

  const bloquear = useMutation({
    mutationFn: ({ ip, reason }: { ip: string; reason: string }) =>
      moderationApi.blockIp(ip, reason),
    onSuccess: (_resposta, vars) => {
      toast(`IP ${vars.ip} bloqueado: não cria conta nem entra.`, "success");
      void queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
    },
    onError: () => toast("Não foi possível bloquear o IP.", "error"),
  });

  const desbloquear = useMutation({
    mutationFn: (ip: string) => moderationApi.unblockIp(ip),
    onSuccess: (_resposta, ip) => {
      toast(`IP ${ip} liberado.`, "success");
      void queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
    },
    onError: () => toast("Não foi possível liberar o IP.", "error"),
  });

  const semUsuario = username.trim().length === 0;

  // 403 = não é admin: a seção não existe para quem não decide.
  if (bloqueadosError) return null;

  return (
    <section className="space-y-3" aria-label="Ações de administrador">
      <div className="flex items-center gap-2">
        <Ban className="h-4 w-4 text-primary" />

        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          Ações de administrador
        </h2>
      </div>

      <div className="space-y-2 rounded-2xl border border-border-soft bg-surface-card p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@usuário"
            autoComplete="off"
          />
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (mínimo 10 caracteres)"
            maxLength={500}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="destructive"
            className="rounded-full gap-1.5"
            disabled={semUsuario || sanitizar.isPending}
            onClick={() => {
              if (
                !window.confirm(
                  `Apagar do banco TODOS os posts e comentários de @${username.trim()}? Sem volta.`,
                )
              ) {
                return;
              }
              sanitizar.mutate();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Sanitizar
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={semUsuario || banir.isPending}
            onClick={() => {
              if (
                !window.confirm(
                  `Banir PERMANENTEMENTE @${username.trim()}? Sem caminho de recurso.`,
                )
              )
                return;
              banir.mutate({ tipo: "PERMABAN" });
            }}
          >
            Banir permanente
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={semUsuario || banir.isPending}
            onClick={() => banir.mutate({ tipo: "BAN" })}
          >
            Banir (com recurso)
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={semUsuario || buscandoIps}
            onClick={() => void buscarIps()}
          >
            Ver IPs
          </Button>
        </div>

        {ips && ips.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {ips.map((i) => (
              <li key={i.ip} className="flex items-center justify-between gap-2 text-sm">
                <span className="break-all font-mono text-xs">{i.ip}</span>

                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  disabled={bloquear.isPending}
                  onClick={() =>
                    bloquear.mutate({ ip: i.ip, reason: `IP de @${username.trim()} (spam)` })
                  }
                >
                  Bloquear IP
                </Button>
              </li>
            ))}
          </ul>
        )}

        {ips && ips.length === 0 && (
          <p className="text-xs text-text-subtle">
            Nenhum IP registrado para este usuário (aparece depois que ele logar de novo).
          </p>
        )}
      </div>

      {(bloqueados?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-4">
          <div className="flex items-center gap-2 pb-2">
            <ShieldOff className="h-4 w-4 text-text-subtle" />

            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-subtle">
              IPs bloqueados ({bloqueados!.length})
            </h3>
          </div>

          <ul className="space-y-1.5">
            {bloqueados!.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0">
                  <span className="break-all font-mono text-xs">{b.ip}</span>

                  {b.reason && (
                    <span className="ml-2 truncate text-xs text-text-subtle">{b.reason}</span>
                  )}
                </span>

                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  disabled={desbloquear.isPending}
                  onClick={() => desbloquear.mutate(b.ip)}
                >
                  Liberar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

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

                  <p className="break-words text-xs text-text-subtle">
                    @{g.username ?? g.userId} · {dataCurta(g.submittedAt)}
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
                <GamePlayer url={g.url} title={g.title} aspect={g.aspect} autoStart />
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
