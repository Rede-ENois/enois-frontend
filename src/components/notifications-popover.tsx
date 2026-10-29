import { useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { Notification } from "@/types/application/notification/notification";
import { navigateToHref } from "@/utils/navigation";
import { formatNotificationTime } from "@/utils/notification-time";
import { NotificationsPopover as NotificationsPopoverView } from "@rede-enois/design-system/domain";

import { networkApi, notificationsApi, profileApi } from "@/lib/api";
import { getCurrentUserId } from "@/lib/current-user";
import { formatarData } from "@/lib/date/format";
import { isNotificationHidden } from "@/lib/notification-module";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useDisabledModules } from "@/lib/use-personalization";

/** Maps an API notification into what the design system row shows. */
function toNotificationData(notification: Notification) {
  return {
    ...notification,
    actorHref: notification.actorUsername ? `/perfil/${notification.actorUsername}` : null,
    timeLabel: formatNotificationTime(notification.createdAt),
  };
}

export function NotificationsPopover() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const disabledModules = useDisabledModules();
  const authenticated = useIsAuthenticated();

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
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
      queryClient.invalidateQueries({ queryKey: ["network"] });
    },
  });

  // Quem AINDA tem pedido pendente. A notificação não guarda o estado do pedido: sem esta lista,
  // o botão "Aceitar" continuava ativo no Histórico depois de aceito (e clicar de novo não tinha
  // mais o que fazer). A chave é a mesma da página /rede, então as duas telas compartilham o cache.
  const pendingRequests = useQuery({
    queryKey: ["network", "requests"],
    queryFn: () => networkApi.requests(null, 50),
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

  const currentUserId = getCurrentUserId();
  const rawIncoming = (pendingRequests.data?.items ?? []).filter(
    (r) => r.status === "PENDING" && r.fromUserId !== currentUserId,
  );

  // Busca perfis em batch — so depois de carregar filtramos os removidos/inexistentes.
  const profileQueries = useQueries({
    queries: rawIncoming.map((r) => ({
      queryKey: ["profile", "by-id", r.fromUserId],
      queryFn: () => profileApi.getById(r.fromUserId),
      retry: 1,
      staleTime: 60_000,
    })),
  });
  const profilesLoading = rawIncoming.length > 0 && profileQueries.some((q) => q.isLoading);
  const profilesByUserId = new Map(
    profileQueries.filter((q) => q.data).map((q) => [q.data!.id, q.data!]),
  );

  // Filtra removidos/banidos/inexistentes ANTES de contar — badge e lista ja nascem corretos.
  const incomingRequests = profilesLoading
    ? []
    : rawIncoming.filter((r) => {
        const p = profilesByUserId.get(r.fromUserId);
        if (!p) return false;
        if (p.username?.startsWith("removed-")) return false;
        if (p.name === "Usuario removido") return false;
        return true;
      });

  const rejectConnection = useMutation({
    mutationFn: (targetUserId: string) => networkApi.remove(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network"] });
    },
  });

  return (
    <NotificationsPopoverView
      open={open}
      onOpenChange={setOpen}
      notifications={notificationList.map(toNotificationData)}
      chatNotifications={[]}
      requests={incomingRequests.map((request) => {
        const profile = profilesByUserId.get(request.fromUserId) ?? null;
        return {
          id: request.id,
          fromUserId: request.fromUserId,
          dateLabel: formatarData(request.createdAt, {
            day: "numeric",
            month: "short",
          }),
          profileHref: profile?.username ? `/perfil/${profile.username}` : null,
          profile,
        };
      })}
      requestsLoading={profilesLoading}
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
