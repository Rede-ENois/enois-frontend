import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CalendarAgendaItemView } from "@/types/application/calendar/calendar-agenda-item-view";
import type { CalendarScope } from "@/types/application/calendar/calendar-scope";
import type {
  CalendarAgendaItemData,
  CalendarEntryData,
  CalendarEntryFormValues,
  CalendarView,
} from "@rede-enois/design-system/domain";
import {
  CalendarAgendaSurface,
  instantOf,
  periodOfToday,
  periodWindow,
  todayIn,
} from "@rede-enois/design-system/domain";
import {
  LoadingState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from "@rede-enois/design-system/ui";
import { CalendarDays } from "lucide-react";

import { calendarApi } from "@/lib/api";
import { calendarQueries } from "@/lib/query-options/calendar";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

const VIEWS: CalendarView[] = ["month", "week", "day", "list"];

/**
 * A agenda do próprio usuário. Visão, período e agenda vivem na URL, para o link abrir na mesma
 * tela e para o "voltar" andar pela agenda em vez de sair dela.
 *
 * O servidor exige a janela (`from`/`to`) em instante ISO; `periodWindow` diz quais dias a visão
 * desenha e o instante nasce no fuso de quem está lendo — o mesmo em que o calendário interpreta os
 * cliques, então uma entrada não aparece um dia fora do lugar.
 */
export const Route = createFileRoute("/agenda")({
  beforeLoad: requireAuth,
  validateSearch: (
    search: Record<string, unknown>,
  ): { view?: CalendarView; period?: string; scope?: CalendarScope } => {
    const result: { view?: CalendarView; period?: string; scope?: CalendarScope } = {};
    if (typeof search.view === "string" && VIEWS.includes(search.view as CalendarView)) {
      result.view = search.view as CalendarView;
    }
    if (typeof search.period === "string" && isPeriod(search.period)) {
      result.period = search.period;
    }
    if (search.scope === "SOCIAL" || search.scope === "PROFESSIONAL") {
      result.scope = search.scope;
    }
    return result;
  },
  head: () => ({ meta: [{ title: texts.agenda.seoTitle }] }),
  component: AgendaPage,
});

function browserZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
}

/**
 * `YYYY-MM` (mês) ou `YYYY-MM-DD` (semana, dia, lista) que o calendário consegue desenhar. Mês ou
 * dia inexistente não passa: `2026-13` viraria uma janela inválida e a API responderia 400.
 */
function isPeriod(value: string): boolean {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  if (Number(month) < 1 || Number(month) > 12) return false;
  if (day === undefined) return true;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

/** O que a tela desenha como `CalendarEntryData`; a API entrega o resto (`state`, origem) fora. */
function toEntryData(item: CalendarAgendaItemView): CalendarEntryData {
  return {
    id: item.entry.id,
    scope: item.entry.scope,
    kind: item.entry.kind,
    title: item.entry.title,
    description: item.entry.description,
    startsAt: item.entry.startsAt,
    endsAt: item.entry.endsAt,
    timeZoneId: item.entry.timeZoneId,
    allDay: item.entry.allDay,
    cancelledAt: item.entry.cancelledAt,
  };
}

function AgendaPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const timeZoneId = useMemo(browserZone, []);
  const today = useMemo(() => todayIn(timeZoneId), [timeZoneId]);

  const view = search.view ?? "month";
  const period = search.period ?? periodOfToday(view, today);
  const scope = search.scope;

  const [saveError, setSaveError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // `periodWindow` devolve dias; a API pede instantes. O `to` já é o dia seguinte (janela meio aberta).
  const window = useMemo(() => {
    const days = periodWindow(view, period);
    return {
      from: instantOf(days.from, "00:00", timeZoneId),
      to: instantOf(days.to, "00:00", timeZoneId),
    };
  }, [view, period, timeZoneId]);

  const agenda = useQuery(calendarQueries.agenda({ ...window, scope: scope ?? null }));

  // Aviso de conflito (D23): a mesma janela que a agenda desenha, sem escopo — um compromisso novo
  // pode cair na outra agenda. É leitura de referência: o formulário recorta a lista contra o que
  // está nos campos, e nada aqui bloqueia o salvar. Falha silenciosa: sem lista, sem aviso.
  const conflicts = useQuery(calendarQueries.conflicts(window));

  const save = useMutation({
    mutationFn: (values: CalendarEntryFormValues) =>
      calendarApi.create({
        scope: values.scope,
        kind: values.kind,
        title: values.title,
        description: values.description,
        startsAt: values.startsAt,
        endsAt: values.endsAt,
        timeZoneId: values.timeZoneId,
        allDay: values.allDay,
      }),
    onSuccess: () => {
      setSaveError(null);
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: () => setSaveError(texts.agenda.errorSave),
  });

  const respond = useMutation({
    mutationFn: ({
      entryId,
      answer,
    }: {
      entryId: string;
      answer: "ACCEPTED" | "DECLINED" | "TENTATIVE";
    }) => calendarApi.respond(entryId, answer),
    onMutate: ({ entryId }) => setRespondingId(entryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: () => toast(texts.agenda.errorRespond, "error"),
    onSettled: () => setRespondingId(null),
  });

  const items: CalendarAgendaItemData[] = useMemo(
    () =>
      (agenda.data ?? []).map((item) => ({
        entry: toEntryData(item),
        owner: item.owner,
        participation: item.participation,
      })),
    [agenda.data],
  );

  // Mesma conversão do `items`, para a lista de conflito: o formulário só le o compromisso.
  const conflictItems: CalendarAgendaItemData[] = useMemo(
    () =>
      (conflicts.data ?? []).map((item) => ({
        entry: toEntryData(item),
        owner: item.owner,
        participation: item.participation,
      })),
    [conflicts.data],
  );

  const go = (next: { view: CalendarView; period: string; scope?: CalendarScope }) => {
    void navigate({ search: next, replace: true });
  };

  const eyebrow =
    scope === "SOCIAL"
      ? texts.agenda.scopeSocial
      : scope === "PROFESSIONAL"
        ? texts.agenda.scopeProfessional
        : undefined;

  return (
    <AppContainer>
      <PageHeader
        title={texts.agenda.title}
        description={texts.agenda.subtitle}
        icon={CalendarDays}
      >
        <Tabs
          value={scope ?? "all"}
          onValueChange={(value) =>
            go({ view, period, scope: value === "all" ? undefined : (value as CalendarScope) })
          }
        >
          <TabsList aria-label={texts.agenda.scopeLabel}>
            <TabsTrigger value="all">{texts.agenda.scopeAll}</TabsTrigger>

            <TabsTrigger value="SOCIAL">{texts.agenda.scopeSocial}</TabsTrigger>

            <TabsTrigger value="PROFESSIONAL">{texts.agenda.scopeProfessional}</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      {agenda.isPending ? (
        <LoadingState />
      ) : (
        <CalendarAgendaSurface
          view={view}
          onViewChange={(nextView) =>
            go({ view: nextView, period: periodOfToday(nextView, today), scope })
          }
          period={period}
          onPeriodChange={(nextPeriod) => go({ view, period: nextPeriod, scope })}
          items={items}
          timeZoneId={timeZoneId}
          today={today}
          newEntryScope={scope}
          conflicts={conflictItems}
          savePending={save.isPending}
          saveError={saveError}
          onSave={async (values) => {
            try {
              await save.mutateAsync(values);
              return true;
            } catch {
              // O erro já foi para `saveError`; `false` é o que mantém o formulário aberto com o
              // que a pessoa digitou, em vez de fechá-lo como se tivesse salvado.
              return false;
            }
          }}
          onRespond={(entryId, answer) => respond.mutate({ entryId, answer })}
          respondingId={respondingId}
          loading={agenda.isFetching}
          error={agenda.isError}
          onRetry={() => void agenda.refetch()}
          eyebrow={eyebrow}
        />
      )}
    </AppContainer>
  );
}
