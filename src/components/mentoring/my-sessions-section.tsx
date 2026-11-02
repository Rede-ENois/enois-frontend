import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MySession } from "@/types/application/mentor/my-session";
import { UserAvatar } from "@rede-enois/design-system/domain";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from "@rede-enois/design-system/ui";
import { CalendarDays, Coins, GraduationCap, User, X } from "lucide-react";

import { mentorsApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { useCurrentUser } from "@/lib/current-user";
import { formatarData } from "@/lib/date/format";
import { formatFaisca } from "@/lib/faisca";

import { MentorSessionsList } from "@/components/mentoring/mentor-sessions-list";
import { SessionRoom } from "@/components/mentoring/session-room";

const STATUS_LABELS: Record<MySession["status"], string> = {
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
 * A agenda em um lugar só: o que EU agendei ("Como mentorado") e quem agendou comigo
 * ("Como mentor"). Antes a agenda de mentor só existia escondida no diálogo do card, então
 * parecia que a página só mostrava o lado de quem se inscreve.
 */
export function MySessionsSection({ mentorId }: { mentorId?: string | null }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const [pending, setPending] = useState<MySession | null>(null);
  const [tab, setTab] = useState<"mentorado" | "mentor">("mentorado");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-mentor-sessions"],
    queryFn: () => mentorsApi.getMySessions(),
    enabled: me != null,
  });

  const cancel = useMutation({
    mutationFn: (session: MySession) => mentorsApi.cancelSession(session.mentorId, session.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-mentor-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["mentor-slots"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast(texts.mentoring.cancelSuccess, "success");
      setPending(null);
    },
    onError: (error) => {
      toast(
        error instanceof Error && error.message ? error.message : texts.mentoring.cancelError,
        "error",
      );
      setPending(null);
    },
  });

  if (!me) return null;

  const sessions = data ?? [];
  const upcoming = sessions.filter((session) => session.status === "SCHEDULED");
  const others = sessions.filter((session) => session.status !== "SCHEDULED");

  return (
    <section className="surface-card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />

        <div>
          <h2 className="text-lg font-semibold">{texts.mentoring.mySessionsTitle}</h2>

          <p className="text-sm text-muted-foreground">{texts.mentoring.mySessionsHint}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList>
          <TabsTrigger value="mentorado">
            <User className="h-4 w-4" aria-hidden="true" />
            {texts.mentoring.asMenteeTab}
          </TabsTrigger>

          {mentorId && (
            <TabsTrigger value="mentor">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              {texts.mentoring.asMentorTab}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="mentorado" className="space-y-3 pt-2">
          {isLoading && (
            <p className="text-sm text-text-subtle">{texts.mentoring.mySessionsLoading}</p>
          )}

          {!isLoading && isError && (
            <div className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <p>{texts.mentoring.mySessionsError}</p>

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
            <EmptyState icon={CalendarDays} title={texts.mentoring.mySessionsEmpty} />
          )}

          {!isLoading && !isError && sessions.length > 0 && (
            <div className="space-y-3">
              <SessionList
                title={texts.mentoring.agendaUpcoming}
                sessions={upcoming}
                emptyLabel={texts.mentoring.agendaNoUpcoming}
                onCancel={setPending}
              />

              {others.length > 0 && (
                <SessionList title={texts.mentoring.agendaHistory} sessions={others} />
              )}
            </div>
          )}
        </TabsContent>

        {mentorId && (
          <TabsContent value="mentor" className="pt-2">
            <MentorSessionsList mentorId={mentorId} />
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={pending != null}
        onOpenChange={(next) => {
          if (!next) setPending(null);
        }}
        title={texts.mentoring.cancelSession}
        description={texts.mentoring.cancelConfirm}
        confirmLabel={texts.mentoring.cancelSession}
        cancelLabel={texts.mentoring.agendaKeep}
        destructive
        pending={cancel.isPending}
        onConfirm={() => {
          if (pending) cancel.mutate(pending);
        }}
      />
    </section>
  );
}

function SessionList({
  title,
  sessions,
  emptyLabel,
  onCancel,
}: {
  title: string;
  sessions: MySession[];
  emptyLabel?: string;
  onCancel?: (session: MySession) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-border-soft px-3 py-3 text-sm text-text-subtle">
          {emptyLabel ?? texts.mentoring.mySessionsEmpty}
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
                  src={session.mentorAvatar ? resolveCdnUrl(session.mentorAvatar) : undefined}
                  alt={session.mentorName ?? texts.mentoring.mentorFallback}
                  className="h-8 w-8 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {session.mentorName ?? texts.mentoring.mentorFallback}
                    {session.mentorUsername && (
                      <span className="ml-1 text-xs font-normal text-text-subtle">
                        @{session.mentorUsername}
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground">{formatWhen(session.startsAt)}</p>

                  <p className="inline-flex items-center gap-1 text-xs text-primary">
                    <Coins className="h-3 w-3" />

                    <>
                      {session.priceSparks != null
                        ? texts.mentoring.paidWithSparks(formatFaisca(session.priceSparks))
                        : texts.mentoring.freeSession}
                    </>
                  </p>
                </div>

                <Badge variant="secondary" className="shrink-0 rounded-full text-xs font-normal">
                  {STATUS_LABELS[session.status]}
                </Badge>
              </div>

              <SessionRoom
                mentorId={session.mentorId}
                sessionId={session.id}
                roomUrl={session.roomUrl}
                roomMode={session.roomMode}
              />

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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
