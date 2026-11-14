import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { Notification } from "@/types/application/notification/notification";
import { navigateToHref } from "@/utils/navigation";
import { formatNotificationTime, notificationDayLabel } from "@/utils/notification-time";
import type { NotificationsPanelProps } from "@rede-enois/design-system/domain";

import { networkApi, notificationsApi } from "@/lib/api";
import { formatarData, ingressoDeEvento } from "@/lib/date/format";
import { refreshNotifications } from "@/lib/inbox-sync";
import { isNotificationHidden } from "@/lib/notification-module";
import { markReadInCache } from "@/lib/notification-read-cache";
import { networkQueries } from "@/lib/query-options/network";
import { useDisabledModules } from "@/lib/use-personalization";

/** Maps an API notification into what the design system row shows. */
export function toNotificationData(notification: Notification) {
  return {
    ...notification,
    actorHref: notification.actorUsername
      ? notification.actorIdentity === "CORPORATE"
        ? `/profissional/${notification.actorUsername}`
        : `/perfil/${notification.actorUsername}`
      : null,
    timeLabel: formatNotificationTime(notification.createdAt),
    dayLabel: notificationDayLabel(notification.createdAt),
    eventDay: ingressoDeEvento(notification.eventDate)?.day ?? null,
  };
}

/**
 * Everything the notices panel needs, shared by the bell popover and the full page so they never
 * disagree: visible rows, requests, and the actions (read one, read all, accept, reject, open).
 * Reading marks the row in every cached list at once, then the server answer refreshes them and
 * the summary behind the menu signals.
 */
export function useNotificationsPanel(
  items: Notification[],
  { requestsEnabled, onOpened }: { requestsEnabled: boolean; onOpened?: () => void },
): Omit<NotificationsPanelProps, "variant" | "onNavigate" | "allHref"> {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const disabledModules = useDisabledModules();
  // Marcar como lida muda a linha e o resumo: a primeira página de cada lista na tela é conferida,
  // sem refazer todas as páginas carregadas (o que a invalidação do prefixo fazia).
  const refresh = () => void refreshNotifications(queryClient);

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: (id) => markReadInCache(queryClient, id),
    onSettled: refresh,
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: () => markReadInCache(queryClient, "all"),
    onSettled: refresh,
  });

  const acceptConnection = useMutation({
    mutationFn: (actorId: string) => networkApi.accept(actorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: networkQueries.all }),
  });

  const rejectConnection = useMutation({
    mutationFn: (targetUserId: string) => networkApi.remove(targetUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: networkQueries.all }),
  });

  // Quem AINDA tem pedido pendente. A notificação não guarda o estado do pedido: sem esta lista,
  // o botão "Aceitar" continuava ativo no Histórico depois de aceito. O limite faz parte da chave
  // para não misturar listas diferentes.
  const pendingRequests = useQuery({ ...networkQueries.requests(50), enabled: requestsEnabled });
  const pendingActorIds = pendingRequests.data
    ? new Set(
        pendingRequests.data.items
          .filter((request) => request.status === "PENDING")
          .map((request) => request.fromUserId),
      )
    : undefined;
  // The server already resolves the other person and leaves out blocked or removed accounts
  // (`peer` is missing only on a backend older than that).
  const incomingRequests = (pendingRequests.data?.items ?? []).filter(
    (request) => request.status === "PENDING" && request.direction === "INCOMING" && request.peer,
  );

  // Módulo desativado não volta pela porta do sino. Mensagens têm o próprio canal (dock e balão);
  // convites de conexão vivem na aba Solicitações.
  const notifications = items.filter(
    (notification) =>
      !isNotificationHidden(notification, disabledModules) &&
      notification.kind.toLowerCase() !== "connection_request" &&
      notification.kind.toLowerCase() !== "new_message" &&
      notification.kind.toLowerCase() !== "new_work_message",
  );

  return {
    notifications: notifications.map(toNotificationData),
    requests: incomingRequests.map((request) => ({
      id: request.id,
      fromUserId: request.fromUserId,
      dateLabel: formatarData(request.createdAt, { day: "numeric", month: "short" }),
      profileHref: `/perfil/${request.peer.username}`,
      profile: request.peer,
    })),
    requestsLoading: pendingRequests.isLoading,
    stillPendingActorIds: pendingActorIds,
    acceptingActorId: acceptConnection.isPending ? acceptConnection.variables : null,
    rejectingActorId: rejectConnection.isPending ? rejectConnection.variables : null,
    markAllPending: markAllAsRead.isPending,
    onMarkAllRead: () => markAllAsRead.mutate(),
    onMarkAsRead: (id) => markAsRead.mutate(id),
    onAcceptConnection: (actorId) => acceptConnection.mutate(actorId),
    onRejectConnection: (actorId) => rejectConnection.mutate(actorId),
    onOpenNotification: (href) => {
      navigateToHref(href, navigate);
      onOpened?.();
    },
    preferencesHref: "/notificacoes/preferencias",
  };
}
