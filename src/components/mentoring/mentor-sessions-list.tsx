import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { MenteeSession } from "@/types/application/mentor/mentee-session";
import { UserAvatar } from "@rede-enois/design-system/domain";
import { Badge, Button, ConfirmDialog, EmptyState, useToast } from "@rede-enois/design-system/ui";
import { CalendarDays, CheckCircle2, Coins, MessageCircle, X } from "lucide-react";

import { mentorsApi, messagesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { formatarData } from "@/lib/date/format";
import { formatFaisca } from "@/lib/faisca";

import { SessionRoom } from "@/components/mentoring/session-room";

const STATUS_LABELS: Record<MenteeSession["status"], string> = {
  SCHEDULED: texts.mentoring.statusScheduled,
  COMPLETED: texts.mentoring.statusCompleted,
  CANCELLED: texts.mentoring.statusCancelled,
};

const formatWhen = (value: string | null) => {
  if (!value) return texts.mentoring.noSlot;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return texts.mentoring.noSlot;
  return formatarData(date, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Agenda do mentor: quem se inscreveu, quando e o recado. Fica na seção "Minhas sessões" (aba
 * "Como mentor") e também no diálogo do card, então o comportamento — concluir, cancelar, abrir
 * conversa e entrar na sala — mora aqui, num lugar só.
 */
export function MentorSessionsList({
  mentorId,
  maxHeight,
}: {
  mentorId: string;
  /** Rolagem interna quando o painel é um diálogo; na página a lista cresce com o conteúdo. */
  maxHeight?: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [contacting, setContacting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Ação pendente de confirmação (concluir/cancelar) — uma por vez, com o diálogo do design system. */
  const [pending, setPending] = useState<{
    kind: "complete" | "cancel";
    session: MenteeSession;
  } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mentor-sessions", mentorId],
    queryFn: () => mentorsApi.getSessions(mentorId),
  });

  const sessions = data ?? [];
  const upcoming = sessions.filter((session) => session.status === "SCHEDULED");
  const others = sessions.filter((session) => session.status !== "SCHEDULED");

  const refreshAfterAction = () => {
    queryClient.invalidateQueries({ queryKey: ["mentor-sessions", mentorId] });
    queryClient.invalidateQueries({ queryKey: ["mentors"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
  };

  const complete = useMutation({
    mutationFn: (session: MenteeSession) => mentorsApi.completeSession(mentorId, session.id),
    onSuccess: () => {
      refreshAfterAction();
      toast(texts.mentoring.completeSuccess, "success");
      setPending(null);
    },
    onError: () => {
      toast(texts.mentoring.completeError, "error");
      setPending(null);
    },
  });

  const cancel = useMutation({
    mutationFn: (session: MenteeSession) => mentorsApi.cancelSession(mentorId, session.id),
    onSuccess: () => {
      refreshAfterAction();
      toast(texts.mentoring.cancelSuccess, "success");
      setPending(null);
    },
    onError: () => {
      toast(texts.mentoring.cancelError, "error");
      setPending(null);
    },
  });

  const confirming = pending?.kind === "complete" ? complete : cancel;

  const openConversation = async (menteeId: string) => {
    setError(null);
    setContacting(menteeId);
    try {
      const conversation = await messagesApi.openDirect(menteeId);
      navigate({ to: "/mensagens", search: { conversation: conversation.id } });
    } catch {
      setError(texts.mentoring.agendaMessageError);
    } finally {
      setContacting(null);
    }
  };

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-text-subtle">{texts.mentoring.agendaLoading}</p>}

      {!isLoading && isError && (
        <div className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <p>{texts.mentoring.agendaError}</p>

          <Button
            variant="outline"
            size="sm"
            className="mt-2 rounded-full"
            onClick={() => refetch()}
          >
            {texts.mentoring.retry}
          </Button>
        </div>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <EmptyState icon={CalendarDays} title={texts.mentoring.agendaEmpty} />
      )}

      {!isLoading && !isError && sessions.length > 0 && (
        <div className={`space-y-4 ${maxHeight ?? ""}`}>
          <SessionGroup
            mentorId={mentorId}
            title={texts.mentoring.agendaUpcoming}
            sessions={upcoming}
            emptyLabel={texts.mentoring.agendaNoUpcoming}
            contacting={contacting}
            onMessage={openConversation}
            onComplete={(session) => setPending({ kind: "complete", session })}
            onCancel={(session) => setPending({ kind: "cancel", session })}
          />

          {others.length > 0 && (
            <SessionGroup
              mentorId={mentorId}
              title={texts.mentoring.agendaHistory}
              sessions={others}
              contacting={contacting}
              onMessage={openConversation}
            />
          )}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}

      <ConfirmDialog
        open={pending != null}
        onOpenChange={(next) => {
          if (!next) setPending(null);
        }}
        title={
          pending?.kind === "complete"
            ? texts.mentoring.completeSession
            : texts.mentoring.cancelSession
        }
        description={
          pending?.kind === "complete"
            ? texts.mentoring.completeConfirm
            : texts.mentoring.cancelConfirm
        }
        confirmLabel={
          pending?.kind === "complete"
            ? texts.mentoring.completeSession
            : texts.mentoring.cancelSession
        }
        cancelLabel={texts.mentoring.agendaKeep}
        destructive={pending?.kind === "cancel"}
        pending={confirming.isPending}
        onConfirm={() => {
          if (pending) confirming.mutate(pending.session);
        }}
      />
    </div>
  );
}

function SessionGroup({
  mentorId,
  title,
  sessions,
  emptyLabel,
  contacting,
  onMessage,
  onComplete,
  onCancel,
}: {
  mentorId: string;
  title: string;
  sessions: MenteeSession[];
  emptyLabel?: string;
  contacting: string | null;
  onMessage: (menteeId: string) => void;
  /** Só o grupo das agendadas oferece as ações de conclusão e cancelamento. */
  onComplete?: (session: MenteeSession) => void;
  onCancel?: (session: MenteeSession) => void;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-border-soft px-3 py-3 text-sm text-text-subtle">
          {emptyLabel ?? texts.mentoring.agendaEmpty}
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="space-y-2 rounded-xl border border-border-soft px-3 py-2 text-sm"
            >
              <div className="flex items-start gap-2">
                <UserAvatar
                  src={session.menteeAvatar ? resolveCdnUrl(session.menteeAvatar) : undefined}
                  alt={session.menteeName ?? texts.mentoring.menteeFallback}
                  className="h-8 w-8 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {session.menteeName ?? texts.mentoring.menteeFallback}
                    {session.menteeUsername && (
                      <span className="ml-1 text-xs font-normal text-text-subtle">
                        @{session.menteeUsername}
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground">{formatWhen(session.startsAt)}</p>

                  {session.priceSparks != null && (
                    <p className="inline-flex items-center gap-1 text-xs text-primary">
                      <Coins className="h-3 w-3" />

                      <>{texts.mentoring.paidWithSparks(formatFaisca(session.priceSparks))}</>
                    </p>
                  )}
                </div>

                <Badge variant="secondary" className="shrink-0 rounded-full text-xs font-normal">
                  {STATUS_LABELS[session.status]}
                </Badge>
              </div>

              {session.message && (
                <p className="rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                  {session.message}
                </p>
              )}

              <SessionRoom
                mentorId={mentorId}
                sessionId={session.id}
                roomUrl={session.roomUrl}
                roomMode={session.roomMode}
              />

              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  disabled={contacting === session.menteeId}
                  onClick={() => onMessage(session.menteeId)}
                >
                  <MessageCircle className="mr-1 h-3.5 w-3.5" />
                  {contacting === session.menteeId
                    ? texts.mentoring.agendaOpening
                    : texts.mentoring.agendaMessage}
                </Button>

                {onComplete && session.status === "SCHEDULED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => onComplete(session)}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    {texts.mentoring.completeSession}
                  </Button>
                )}

                {onCancel && session.status === "SCHEDULED" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive"
                    onClick={() => onCancel(session)}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    {texts.mentoring.cancelSession}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
