import { useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { NotificationTab } from "@/types/components/notification/notification-tab";
import { Bell, Check, CheckCheck, Loader2, X } from "lucide-react";

import { networkApi, notificationsApi, profileApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { getCurrentUserId } from "@/lib/current-user";
import { isNotificationHidden } from "@/lib/notification-module";
import { useDisabledModules } from "@/lib/use-personalization";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { NotificationItem } from "./notification-item";

export function NotificationsPopover() {
  const queryClient = useQueryClient();
  const [notificationTab, setNotificationTab] = useState<NotificationTab>("novas");
  const [open, setOpen] = useState(false);

  const disabledModules = useDisabledModules();

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
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
  const unreadCount = notificationList.filter((notification) => !notification.read).length;
  const chatUnreadCount = chatNotifications.filter((notification) => !notification.read).length;
  // O sino continua sinalizando mensagem nova (senão a aba Chat passaria despercebida); o que muda
  // é que ela não se mistura mais com curtida/convite na lista de Novas.
  const totalUnread = unreadCount + chatUnreadCount;
  const displayedNotifications =
    notificationTab === "chat"
      ? chatNotifications
      : notificationList.filter((notification) =>
          notificationTab === "novas" ? !notification.read : notification.read,
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
  const requestCount = incomingRequests.length;

  const rejectConnection = useMutation({
    mutationFn: (targetUserId: string) => networkApi.remove(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network"] });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative grid h-10 w-10 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary"
          aria-label={
            totalUnread > 0
              ? texts.notifications.unreadLabel(totalUnread)
              : texts.notifications.title
          }
        >
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-xs font-medium leading-none text-primary-foreground">
              {totalUnread > 9 ? texts.notifications.overflowCount : totalUnread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border-border-soft bg-surface-card p-0 shadow-card"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
          <span className="text-sm font-normal text-text-strong">{texts.notifications.title}</span>
          {unreadCount > 0 && notificationTab === "novas" && (
            <button
              type="button"
              disabled={markAllAsRead.isPending}
              onClick={() => markAllAsRead.mutate()}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-normal text-text-subtle transition hover:text-primary disabled:opacity-60"
            >
              <CheckCheck className="h-3 w-3" />

              <>{texts.notifications.markAllRead}</>
            </button>
          )}
        </div>

        <div className="flex border-b border-border-soft">
          <button
            type="button"
            onClick={() => setNotificationTab("novas")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-normal transition",
              notificationTab === "novas"
                ? "border-b-2 border-primary text-primary"
                : "text-text-subtle hover:text-text-strong",
            )}
          >
            <>{texts.notifications.tabs.new}</>
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setNotificationTab("historico")}
            className={cn(
              "flex-1 py-2.5 text-xs font-normal transition",
              notificationTab === "historico"
                ? "border-b-2 border-primary text-primary"
                : "text-text-subtle hover:text-text-strong",
            )}
          >
            {texts.notifications.tabs.history}
          </button>

          <button
            type="button"
            onClick={() => setNotificationTab("chat")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-normal transition",
              notificationTab === "chat"
                ? "border-b-2 border-primary text-primary"
                : "text-text-subtle hover:text-text-strong",
            )}
          >
            <>{texts.notifications.tabs.chat}</>
            {chatUnreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                {chatUnreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setNotificationTab("solicitacoes")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-normal transition",
              notificationTab === "solicitacoes"
                ? "border-b-2 border-primary text-primary"
                : "text-text-subtle hover:text-text-strong",
            )}
          >
            <>{texts.notifications.tabs.requests}</>
            {requestCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                {requestCount}
              </span>
            )}
          </button>
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {notificationTab === "solicitacoes" ? (
            profilesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-text-subtle" />
              </div>
            ) : incomingRequests.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm font-normal text-text-subtle">
                {texts.notifications.emptyRequests}
              </p>
            ) : (
              incomingRequests.map((request) => {
                const p = profilesByUserId.get(request.fromUserId);
                return (
                  <ConnectionRequestItem
                    key={request.id}
                    request={request}
                    profile={p ?? null}
                    onAccept={(id) => acceptConnection.mutate(id)}
                    onReject={(id) => rejectConnection.mutate(id)}
                    accepting={
                      acceptConnection.isPending &&
                      acceptConnection.variables === request.fromUserId
                    }
                    rejecting={
                      rejectConnection.isPending &&
                      rejectConnection.variables === request.fromUserId
                    }
                    onNavigate={() => setOpen(false)}
                  />
                );
              })
            )
          ) : displayedNotifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm font-normal text-text-subtle">
              {notificationTab === "novas"
                ? texts.notifications.emptyNew
                : notificationTab === "chat"
                  ? texts.notifications.emptyChat
                  : texts.notifications.emptyHistory}
            </p>
          ) : (
            displayedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={(id) => markAsRead.mutate(id)}
                onAcceptConnection={(actorId) => acceptConnection.mutate(actorId)}
                stillPendingActorIds={pendingActorIds}
                acceptingActorId={acceptConnection.isPending ? acceptConnection.variables : null}
                onNavigate={() => setOpen(false)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Card de solicitação de conexão dentro do sininho. O perfil já vem resolvido pelo pai. */
function ConnectionRequestItem({
  request,
  profile,
  onAccept,
  onReject,
  accepting,
  rejecting,
  onNavigate,
}: {
  request: { id: string; fromUserId: string; createdAt: string };
  profile: {
    name?: string;
    username?: string;
    avatar?: string | null;
    headline?: string | null;
  } | null;
  onAccept: (userId: string) => void;
  onReject: (userId: string) => void;
  accepting: boolean;
  rejecting: boolean;
  onNavigate: () => void;
}) {
  const name = profile?.name ?? "Alguém";
  const username = profile?.username;
  const avatar = profile?.avatar;
  const headline = profile?.headline;

  return (
    <div className="flex items-start gap-3 border-b border-border-soft px-4 py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => {
          if (username) {
            onNavigate();
            window.location.href = `/perfil/${username}`;
          }
        }}
        className="shrink-0"
      >
        <Avatar className="h-10 w-10">
          {avatar && <AvatarImage src={resolveCdnUrl(avatar)} alt={name} />}
          <AvatarFallback className="bg-surface-2 text-xs text-text-subtle">
            {name[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium text-text-strong">{name}</span>
          {username && <span className="ml-1 text-text-subtle">@{username}</span>}
        </p>

        {headline && <p className="mt-0.5 truncate text-xs text-text-subtle">{headline}</p>}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={accepting || rejecting}
            onClick={() => onAccept(request.fromUserId)}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            <Check className="h-3 w-3" />
            {texts.notifications.accept}
          </button>

          <button
            type="button"
            disabled={accepting || rejecting}
            onClick={() => onReject(request.fromUserId)}
            className="inline-flex items-center gap-1 rounded-full border border-border-soft px-3 py-1 text-xs font-medium text-text-subtle transition hover:bg-surface-2 hover:text-text-strong disabled:opacity-60"
          >
            <X className="h-3 w-3" />
            {texts.notifications.reject}
          </button>
        </div>
      </div>

      <span className="shrink-0 text-xs text-text-subtle">
        {new Date(request.createdAt).toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "short",
        })}
      </span>
    </div>
  );
}
