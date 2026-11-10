import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CalendarAvailabilityWindowInput } from "@/types/application/calendar/create-calendar-availability-window-input";
import { CalendarAvailabilitySurface } from "@rede-enois/design-system/domain";
import { LoadingState, PageHeader } from "@rede-enois/design-system/ui";
import { Clock } from "lucide-react";

import { calendarApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

/**
 * A semana de disponibilidade de quem está lendo (fase 6, D24): "toda terça, das 9h às 12h". A
 * escrita é substituição — o que a superfície devolve é a semana inteira, e o que a pessoa tirou
 * da lista deixa de existir no servidor.
 *
 * O desenho é do Design System (`CalendarAvailabilitySurface`); aqui ficam a consulta, a mutação
 * e as frases do app, como na `/agenda`.
 */
export const Route = createFileRoute("/agenda_/disponibilidade")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.agenda.availability.seoTitle }] }),
  component: AvailabilityPage,
});

function browserZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
}

function AvailabilityPage() {
  const queryClient = useQueryClient();
  const timeZoneId = browserZone();

  const week = useQuery({
    queryKey: ["agenda", "disponibilidade"] as const,
    queryFn: () => calendarApi.availability(),
  });

  const save = useMutation({
    mutationFn: (windows: CalendarAvailabilityWindowInput[]) =>
      calendarApi.setAvailability(windows),
    onSuccess: (saved) => {
      queryClient.setQueryData(["agenda", "disponibilidade"], saved);
    },
  });

  return (
    <AppContainer>
      <PageHeader
        title={texts.agenda.availability.title}
        description={texts.agenda.availability.subtitle}
        icon={Clock}
      />

      {week.isPending ? (
        <LoadingState />
      ) : (
        <CalendarAvailabilitySurface
          windows={week.data ?? []}
          timeZoneId={timeZoneId}
          savePending={save.isPending}
          saveError={save.isError ? texts.agenda.availability.errorSave : null}
          onSave={async (windows) => {
            try {
              await save.mutateAsync(windows);
              return true;
            } catch {
              return false;
            }
          }}
        />
      )}
    </AppContainer>
  );
}
