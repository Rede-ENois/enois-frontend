import { useEffect, useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { Notification } from "@/types/application/notification/notification";
import { navigateToHref } from "@/utils/navigation";
import { formatNotificationTime } from "@/utils/notification-time";
import { NotificationsPopover as NotificationsPopoverView } from "@rede-enois/design-system/domain";

import { messagesApi, networkApi, notificationsApi, profileApi } from "@/lib/api";
import { getCurrentUserId } from "@/lib/current-user";
import { formatarData } from "@/lib/date/format";
import { decryptReceived } from "@/lib/e2e/conversation";
import { hasLocalKeys } from "@/lib/e2e/key-manager";
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

  // Módulo desativado não volta pela porta do sino: a notificação dele fica fora da lista
  // (mesma fonte de verdade do menu — /me/preferences).
  // Convites de conexao agora vivem na tab Solicitacoes — tirar das notificacoes normais
  // evita duplicidade (a mesma pessoa aparecia em Novas e em Solicitacoes ao mesmo tempo).
  // Conversa tem canal próprio (aba Chat): misturar com curtida/convite no sino fazia a pessoa
  // perder mensagem no meio do resto — e o pedido do suporte foi justamente separar.
  const isChatNotification = (kind: string) => kind.toLowerCase() === "new_message";
  const visibleNotifications = (notificationsData?.items ?? []).filter(
    (notification) => !isNotificationHidden(notification.kind, disabledModules),
  );
  const chatNotifications = visibleNotifications.filter((notification) =>
    isChatNotification(notification.kind),
  );
  const notificationList = visibleNotifications.filter(
    (notification) =>
      notification.kind.toLowerCase() !== "connection_request" &&
      !isChatNotification(notification.kind),
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

  // A aba ativa vive na view; decifrar com o popover aberto cobre a aba Chat.
  const chatPreviewOverrides = useDecryptedChatPreviews(open ? chatNotifications : []);

  return (
    <NotificationsPopoverView
      open={open}
      onOpenChange={setOpen}
      notifications={notificationList.map(toNotificationData)}
      chatNotifications={chatNotifications
        .map((notification) =>
          chatPreviewOverrides.has(notification.id)
            ? { ...notification, body: chatPreviewOverrides.get(notification.id)! }
            : notification,
        )
        .map(toNotificationData)}
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

/**
 * Para notificacoes de chat com "Mensagem cifrada", busca as conversas e decifra o preview.
 * Retorna um mapa notificationId → texto decifrado.
 */
function useDecryptedChatPreviews(chatNotifications: Notification[]): Map<string, string> {
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());

  const needsDecrypt = chatNotifications.filter((n) => n.body === "Mensagem cifrada");

  const { data: conversations } = useQuery({
    queryKey: ["conversations", "e2e-preview"],
    queryFn: () => messagesApi.listConversations(null, 20),
    enabled: needsDecrypt.length > 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!conversations || needsDecrypt.length === 0) return;
    let cancelled = false;

    async function decrypt() {
      const has = await hasLocalKeys();
      if (!has || cancelled) return;

      const convMap = new Map(conversations!.items.map((c) => [c.id, c]));
      const result = new Map<string, string>();

      for (const notif of needsDecrypt) {
        const convId = notif.href.replace(/.*\/conversations\//, "").split(/[/?#]/)[0];
        const conv = convMap.get(convId);
        if (!conv?.lastMessageE2e || !conv.lastMessage || !conv.lastMessageIv) continue;
        try {
          const plain = await decryptReceived({
            e2e: true,
            text: conv.lastMessage,
            iv: conv.lastMessageIv,
            conversationId: convId,
          } as Parameters<typeof decryptReceived>[0]);
          result.set(notif.id, plain);
        } catch {
          /* decifrar falhou, mantém o body original */
        }
      }

      if (!cancelled) setPreviews(result);
    }

    decrypt();
    return () => {
      cancelled = true;
    };
  }, [conversations, needsDecrypt.length]);

  return previews;
}
