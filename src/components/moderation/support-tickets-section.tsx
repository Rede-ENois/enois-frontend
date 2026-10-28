import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { SupportCategory } from "@/types/application/support/support-category";
import type { SupportStatus } from "@/types/application/support/support-status";
import {
  type SupportTicketData,
  SupportTicketsSection as SupportTicketsSectionView,
  TicketReply as TicketReplyView,
  TicketThread as TicketThreadView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { supportApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

const CATEGORIES: SupportCategory[] = ["BUG", "ACCOUNT", "CONTENT", "IDEA", "OTHER"];

/** Filtros da fila ATIVA: o que está resolvido foi para a aba Histórico. */
const ACTIVE_STATUS_FILTERS: (SupportStatus | "ALL")[] = ["ALL", "OPEN", "IN_PROGRESS"];

/**
 * Tickets de suporte do painel central. A aba "Issues" usa o mesmo componente com `lockedCategory`
 * em BUG: é a mesma fila, só enxergada pela categoria de problema.
 */
export function SupportTicketsSection({
  lockedCategory,
  mode = "active",
}: {
  lockedCategory?: SupportCategory;
  mode?: "active" | "history";
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [category, setCategory] = useState<SupportCategory | undefined>(lockedCategory);
  const [status, setStatus] = useState<SupportStatus | "ALL">("ALL");
  const history = mode === "history";

  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "support", category ?? "all", history ? "CLOSED" : status],
    queryFn: () =>
      supportApi.adminList({
        category,
        status: history ? "CLOSED" : status === "ALL" ? undefined : status,
        limit: 100,
      }),
    retry: false,
  });

  const move = useMutation({
    mutationFn: ({ id, next }: { id: string; next: SupportStatus }) =>
      supportApi.adminUpdate(id, { status: next }),
    onSuccess: () => {
      toast(texts.moderator.support.moved, "success");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "support"] });
    },
    onError: () => toast(texts.moderator.support.error, "error"),
  });

  // A fila ativa não mostra o que já foi concluído; o histórico é a única porta para CLOSED.
  const visible = history
    ? (data ?? [])
    : (data ?? []).filter((ticket) => ticket.status !== "CLOSED");

  const tickets = visible.map((ticket) => ({
    ...ticket,
    createdAtLabel: dataHora(ticket.createdAt),
    repliedAtLabel: ticket.repliedAt ? dataHora(ticket.repliedAt) : null,
  }));

  return (
    <SupportTicketsSectionView
      history={history}
      locked={Boolean(lockedCategory)}
      categories={CATEGORIES}
      category={category}
      onCategoryChange={(value) => setCategory(value as SupportCategory | undefined)}
      statusFilters={ACTIVE_STATUS_FILTERS}
      status={status}
      onStatusChange={(value) => setStatus(value as SupportStatus | "ALL")}
      loading={isLoading}
      tickets={tickets}
      pending={move.isPending}
      onStart={(id) => move.mutate({ id, next: "IN_PROGRESS" })}
      onResolve={(id) => move.mutate({ id, next: "CLOSED" })}
      onReopen={(id) => move.mutate({ id, next: "OPEN" })}
      renderThread={(ticket) => <TicketThread ticket={ticket} />}
      renderReply={(ticketId) => <TicketReply ticketId={ticketId} />}
    />
  );
}

/** Conversa do ticket: respostas do painel + comentários da issue do GitHub, em ordem. */
function TicketThread({ ticket }: { ticket: SupportTicketData }) {
  const { data, isError } = useQuery({
    queryKey: ["moderator", "support", ticket.id, "messages"],
    queryFn: () => supportApi.adminMessages(ticket.id),
    retry: false,
  });

  return (
    <TicketThreadView
      messages={(data ?? []).map((message) => ({
        ...message,
        createdAtLabel: dataHora(message.createdAt),
      }))}
      mirrored={ticket.githubIssueNumber != null}
      legacyReply={ticket.adminReply}
      legacyRepliedAtLabel={ticket.repliedAtLabel}
      error={isError}
    />
  );
}

function TicketReply({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reply = useMutation({
    mutationFn: (message: string) => supportApi.adminReply(ticketId, message),
    onSuccess: () => {
      toast(texts.moderator.support.replySent, "success");
      void queryClient.invalidateQueries({ queryKey: ["moderator", "support"] });
    },
    onError: () => toast(texts.moderator.support.replyError, "error"),
  });

  return (
    <TicketReplyView
      pending={reply.isPending}
      onSubmit={(message) =>
        reply.mutateAsync(message).then(
          () => true,
          () => false,
        )
      }
    />
  );
}
