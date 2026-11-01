import { useEffect, useMemo, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MonitoringDailyUsers } from "@/types/application/monitoring/monitoring-daily-users";
import type { MonitoringEconomy } from "@/types/application/monitoring/monitoring-economy";
import type { MonitoringUsers } from "@/types/application/monitoring/monitoring-users";
import { MonitoringSection as MonitoringSectionView } from "@rede-enois/design-system/domain";
import { Button, useToast } from "@rede-enois/design-system/ui";
import { Coins, RefreshCw, Users } from "lucide-react";

import { monitoringApi } from "@/lib/api";
import { hora, valorDeDataLocal } from "@/lib/date/format";
import { formatBrlMicros, formatFaisca } from "@/lib/faisca";
import { cn } from "@/lib/utils";

const LEVELS = ["ERROR", "WARN", "INFO", "DEBUG"];

/**
 * Monitorabilidade do painel admin: KPIs, séries por minuto e a lista de eventos/logs/erros.
 * O backend já entrega tudo pronto; aqui só desenhamos os gráficos em SVG (sem lib) e atualizamos
 * por polling curto, que é o "tempo real" sem manter uma conexão SSE aberta por admin.
 */
export function MonitoringSection() {
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  // Intervalo de tempo dos eventos: guardamos o valor cru do campo datetime-local
  // e convertemos para ISO só na consulta.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const overview = useQuery({
    queryKey: ["monitoring", "overview"],
    queryFn: () => monitoringApi.overview(),
    refetchInterval: paused ? false : 10_000,
    retry: false,
  });

  // Supply da moeda: só administração tem acesso; para os demais o cartão simplesmente não aparece.
  const supply = useQuery({
    queryKey: ["monitoring", "supply"],
    queryFn: () => monitoringApi.supply(),
    refetchInterval: paused ? false : 30_000,
    retry: false,
  });

  // Contas da comunidade: muda devagar, então um minuto de polling basta (o backend também
  // guarda um minuto de cache).
  const users = useQuery({
    queryKey: ["monitoring", "users"],
    queryFn: () => monitoringApi.users(),
    refetchInterval: paused ? false : 60_000,
    retry: false,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Economia automática: mesma regra de acesso — sem admin, o cartão não aparece.
  const economy = useQuery({
    queryKey: ["monitoring", "economy"],
    queryFn: () => monitoringApi.economy(),
    refetchInterval: paused ? false : 30_000,
    retry: false,
  });

  const recalcular = useMutation({
    mutationFn: () => monitoringApi.recalculateEconomy(),
    onSuccess: (result) => {
      toast(
        result.publicada ? texts.coinEconomy.published : texts.coinEconomy.unchanged,
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["monitoring", "economy"] });
      void queryClient.invalidateQueries({ queryKey: ["monitoring", "supply"] });
      void queryClient.invalidateQueries({ queryKey: ["cotacao"] });
    },
    onError: (error) => toast(error.message || texts.coinEconomy.error, "error"),
  });

  const filtered = Boolean(level || type || debounced || from || to);
  const events = useInfiniteQuery({
    queryKey: ["monitoring", "events", level, type, debounced, from, to],
    queryFn: ({ pageParam }) =>
      monitoringApi.events({
        level: level || undefined,
        type: type || undefined,
        q: debounced || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        before: pageParam || undefined,
        limit: 100,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length >= 100 ? (lastPage[lastPage.length - 1]?.createdAt ?? undefined) : undefined,
    // Sempre busca no arquivo: a lista não pode depender de haver filtro, nem se limitar ao
    // "recent" do overview (era isso que resetava a cada recarga da página).
    refetchInterval: (query) => {
      if (paused) return false;
      // Com mais de uma página carregada, refazer o polling puxaria todas as páginas de novo.
      return (query.state.data?.pages.length ?? 1) > 1 ? false : 5_000;
    },
    retry: false,
  });

  const data = overview.data;
  const historico = events.data?.pages.flat();
  // Enquanto o arquivo não respondeu, o "recent" do overview serve de esqueleto.
  const rows = (historico ?? data?.recent ?? []).map((event) => ({
    ...event,
    timeLabel: hora(event.createdAt),
  }));
  const types = useMemo(() => data?.types24h.map((item) => item.label) ?? [], [data]);

  return (
    <div className="space-y-3">
      <MonitoringSectionView
        loading={overview.isLoading}
        overview={data}
        fetching={overview.isFetching}
        onRefresh={() => void overview.refetch()}
        generatedAtLabel={data ? hora(data.generatedAt) : ""}
        supply={
          supply.data && {
            totalLabel: formatFaisca(supply.data.total),
            cofreLabel: formatFaisca(supply.data.cofre),
            circulacaoLabel: formatFaisca(supply.data.circulacao),
            coerente: supply.data.coerente,
          }
        }
        paused={paused}
        onTogglePaused={() => setPaused((value) => !value)}
        levels={LEVELS}
        level={level}
        onLevelChange={setLevel}
        types={types}
        type={type}
        onTypeChange={setType}
        search={search}
        onSearchChange={setSearch}
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onLastHour={() => {
          setFrom(valorDeDataLocal(new Date(Date.now() - 3_600_000)));
          setTo("");
        }}
        onClearDates={() => {
          setFrom("");
          setTo("");
        }}
        onlyFailures={level === "ERROR"}
        onOnlyFailures={() => {
          setLevel("ERROR");
          setType("");
          setSearch("");
        }}
        filtered={filtered}
        rows={rows}
        hasNextPage={events.hasNextPage}
        fetchingNextPage={events.isFetchingNextPage}
        onLoadMore={() => void events.fetchNextPage()}
      />

      {users.data && <UsersCard users={users.data} />}

      {economy.data && (
        <EconomyCard
          economy={economy.data}
          pending={recalcular.isPending}
          onRecalculate={() => recalcular.mutate()}
        />
      )}
    </div>
  );
}

const numero = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor);

const percentual = (valor: number) =>
  `${valor > 0 ? "+" : ""}${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}%`;

/**
 * Contas da comunidade: total, entradas do dia, ritmo de crescimento e projeção. O cartão fica
 * acima da economia porque a curva de cadastros é o primeiro número que se olha pela manhã.
 */
export function UsersCard({ users }: { users: MonitoringUsers }) {
  const celulas: [string, string][] = [
    [texts.userMetrics.total, numero(users.total)],
    [texts.userMetrics.newToday, numero(users.newToday)],
    [texts.userMetrics.new7, numero(users.newLast7Days)],
    [texts.userMetrics.new30, numero(users.newLast30Days)],
    [texts.userMetrics.growthToday, percentual(users.growthTodayPercent)],
    [texts.userMetrics.growth7, percentual(users.growth7DaysPercent)],
    [texts.userMetrics.growth30, percentual(users.growth30DaysPercent)],
    [texts.userMetrics.average7, numero(users.averageDailyNew7Days)],
    [texts.userMetrics.average30, numero(users.averageDailyNew30Days)],
  ];

  return (
    <section className="surface-card min-w-0 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-subtle">
        <Users className="h-3.5 w-3.5" />
        {texts.userMetrics.title}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {celulas.map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-border-soft bg-surface-card p-2"
          >
            <p className="truncate text-[10px] uppercase tracking-wide text-text-subtle">{label}</p>

            <p className="text-sm font-semibold text-text-strong">{value}</p>
          </div>
        ))}
      </div>

      <UsersSeries series={users.series} />

      <p className="mt-3 text-[10px] uppercase tracking-wide text-text-subtle">
        {texts.userMetrics.projection}
      </p>

      <div className="mt-1 grid grid-cols-3 gap-2">
        {users.projections.map((projecao) => (
          <div
            key={projecao.days}
            className="min-w-0 rounded-xl border border-border-soft bg-surface-card p-2"
          >
            <p className="truncate text-[10px] uppercase tracking-wide text-text-subtle">
              {texts.userMetrics.inDays(projecao.days)}
            </p>

            <p className="text-sm font-semibold text-text-strong">{numero(projecao.total)}</p>

            <p className="text-[11px] text-text-subtle">{percentual(projecao.growthPercent)}</p>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-text-subtle">{texts.userMetrics.hint}</p>
    </section>
  );
}

/** Barras dos últimos 30 dias: a altura é relativa ao dia mais movimentado da janela. */
function UsersSeries({ series }: { series: MonitoringDailyUsers[] }) {
  const maximo = Math.max(1, ...series.map((ponto) => ponto.newUsers));

  return (
    <div className="mt-3">
      <p className="text-[10px] uppercase tracking-wide text-text-subtle">
        {texts.userMetrics.seriesTitle}
      </p>

      <div className="mt-1 flex h-16 items-end gap-[2px]">
        {series.map((ponto) => (
          <div
            key={ponto.date}
            className={cn(
              "min-w-0 flex-1 rounded-sm bg-primary/70",
              ponto.newUsers === 0 && "opacity-30",
            )}
            style={{ height: `${Math.max(3, (ponto.newUsers / maximo) * 100)}%` }}
            title={texts.userMetrics.chartLabel(
              ponto.date,
              numero(ponto.newUsers),
              numero(ponto.total),
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * O cartão da economia automática fica abaixo do painel do design system: mostra as métricas do
 * cálculo (cofre, retorno, emissão, giro, escassez, índice) e o botão que roda a reavaliação agora.
 */
export function EconomyCard({
  economy,
  pending,
  onRecalculate,
}: {
  economy: MonitoringEconomy;
  pending: boolean;
  onRecalculate: () => void;
}) {
  const linhas = [
    [texts.coinEconomy.cofre, formatFaisca(economy.cofre)],
    [texts.coinEconomy.retorno, formatFaisca(economy.retornoCofre)],
    [texts.coinEconomy.emissao, formatFaisca(economy.emissao)],
    [
      texts.coinEconomy.giro,
      formatFaisca(economy.usoEscrow + economy.usoP2p + economy.retornoCofre),
    ],
    [texts.coinEconomy.escassez, `${economy.escassez.toFixed(2)}×`],
    [texts.coinEconomy.indice, economy.indice.toFixed(2)],
    [texts.coinEconomy.periodo, `${Math.round(economy.periodoDecorrido * 100)}%`],
    [texts.coinEconomy.proxima, hora(economy.proximaAvaliacaoEm)],
    [
      texts.coinEconomy.janela,
      economy.publicavelAgora ? texts.coinEconomy.janelaAberta : texts.coinEconomy.janelaFechada,
    ],
  ];

  return (
    <section className="surface-card min-w-0 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-subtle">
          <Coins className="h-3.5 w-3.5" />
          {texts.coinEconomy.title}
        </p>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-1.5"
          // Fora da janela do período a chamada não publica nada — o botão desligado mostra isso.
          disabled={pending || !economy.publicavelAgora}
          onClick={onRecalculate}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />

          <>{pending ? texts.coinEconomy.calculating : texts.coinEconomy.recalculate}</>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {linhas.map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-border-soft bg-surface-card p-2"
          >
            <p className="truncate text-[10px] uppercase tracking-wide text-text-subtle">{label}</p>

            <p className="text-sm font-semibold text-text-strong">{value}</p>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-text-subtle">
        {texts.coinEconomy.cotacao}: {formatBrlMicros(economy.cotacaoAtualMicros)} →{" "}
        {formatBrlMicros(economy.cotacaoSugeridaMicros)}
      </p>

      <p className="mt-1 text-[11px] leading-relaxed text-text-subtle">{texts.coinEconomy.hint}</p>
    </section>
  );
}
