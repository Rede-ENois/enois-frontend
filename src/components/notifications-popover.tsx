import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { Notification } from "@/types/application/notification/notification";
import { navigateToHref } from "@/utils/navigation";
import { formatNotificationTime } from "@/utils/notification-time";
import { NotificationsPopover as NotificationsPopoverView } from "@rede-enois/design-system/domain";

import { networkApi, notificationsApi } from "@/lib/api";
import { formatarData } from "@/lib/date/format";
import { useInterfaceContext } from "@/lib/interface-context";
import { isNotificationHidden } from "@/lib/notification-module";
import { networkQueries } from "@/lib/query-options/network";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useDisabledModules } from "@/lib/use-personalization";

/** Maps an API notification into what the design system row shows. */
function toNotificationData(notification: Notification) {
  return {
    ...notification,
    actorHref: notification.actorUsername
      ? notification.actorIdentity === "CORPORATE"
        ? `/profissional/${notification.actorUsername}`
        : `/perfil/${notification.actorUsername}`
      : null,
    timeLabel: formatNotificationTime(notification.createdAt),
  };
}

export function NotificationsPopover() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const disabledModules = useDisabledModules();
  const authenticated = useIsAuthenticated();

  // The bell follows the active interface: work notices in the professional one, community ones in
  // the social one, account-wide ones (security, moderation) in both.
  const context = useInterfaceContext();
  const { data: notificationsData } = useQuery({
    queryKey: ["notifications", context],
    queryFn: () => notificationsApi.list(null, 20, context),
    enabled: authenticated,
    staleTime: 30_000,
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // Lida tudo, o painel não tem mais o que mostrar: ele sai de cena sozinho. Fecha no sucesso
      // (e não no clique) de propósito — se a chamada falhar, o painel continua aberto, com as
      // notificações ainda marcadas, em vez de esconder a falha junto com o popup.
      setOpen(false);
    },
  });

  const acceptConnection = useMutation({
    mutationFn: (actorId: string) => networkApi.accept(actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkQueries.all });
    },
  });

  // Quem AINDA tem pedido pendente. A notificação não guarda o estado do pedido: sem esta lista,
  // o botão "Aceitar" continuava ativo no Histórico depois de aceito (e clicar de novo não tinha
  // mais o que fazer). O limite faz parte da chave para não misturar listas diferentes.
  const pendingRequests = useQuery({
    ...networkQueries.requests(50),
    enabled: open,
  });
  const pendingActorIds = pendingRequests.data
    ? new Set(
        pendingRequests.data.items
          .filter((request) => request.status === "PENDING")
          .map((request) => request.fromUserId),
      )
    : undefined;

  // Módulo desativado não volta pela porta do sino: a notificação dele fica fora da lista.
  // Mensagens de chat saíram do sino — o ChatDock e o ícone mobile são o canal de mensagens.
  // Convites de conexão vivem na tab Solicitações.
  const visibleNotifications = (notificationsData?.items ?? []).filter(
    (notification) => !isNotificationHidden(notification.kind, disabledModules),
  );
  const notificationList = visibleNotifications.filter(
    (notification) =>
      notification.kind.toLowerCase() !== "connection_request" &&
      notification.kind.toLowerCase() !== "new_message",
  );

  // The server already resolves the other person and leaves out blocked or removed accounts
  // (`peer` is missing only on a backend older than that).
  const incomingRequests = (pendingRequests.data?.items ?? []).filter(
    (r) => r.status === "PENDING" && r.direction === "INCOMING" && r.peer,
  );

  const rejectConnection = useMutation({
    mutationFn: (targetUserId: string) => networkApi.remove(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkQueries.all });
    },
  });

  return (
    <NotificationsPopoverView
      open={open}
      onOpenChange={setOpen}
      preferencesHref="/notificacoes/preferencias"
      notifications={notificationList.map(toNotificationData)}
      requests={incomingRequests.map((request) => ({
        id: request.id,
        fromUserId: request.fromUserId,
        dateLabel: formatarData(request.createdAt, {
          day: "numeric",
          month: "short",
        }),
        profileHref: `/perfil/${request.peer.username}`,
        profile: request.peer,
      }))}
      requestsLoading={pendingRequests.isLoading}
      stillPendingActorIds={pendingActorIds}
      acceptingActorId={acceptConnection.isPending ? acceptConnection.variables : null}
      rejectingActorId={rejectConnection.isPending ? rejectConnection.variables : null}
      markAllPending={markAllAsRead.isPending}
      onMarkAllRead={() => markAllAsRead.mutate()}
      onMarkAsRead={(id) => markAsRead.mutate(id)}
      onAcceptConnection={(actorId) => acceptConnection.mutate(actorId)}
      onRejectConnection={(actorId) => rejectConnection.mutate(actorId)}
      onOpenNotification={(href) => {
        navigateToHref(href, navigate);
        // Fecha o popover: aberto, ele cobria a pagina e dava a impressao de que o clique
        // "sumia com a notificacao" sem levar ao destino.
        setOpen(false);
      }}
    />
  );
}
