import { useState } from "react";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ConversationThreadProps } from "@/types/routes/messages/conversation-thread-props";
import type { SendMessageInput } from "@/types/routes/messages/send-message-input";
import {
  type ConversationSendValues,
  ConversationThread as ConversationThreadView,
} from "@rede-enois/design-system/domain";
import { Button, useToast } from "@rede-enois/design-system/ui";
import { Briefcase } from "lucide-react";

import { messagesApi, reportsApi, servicesApi } from "@/lib/api";
import { conversationPeer } from "@/lib/conversation-peer";
import { encryptForSend } from "@/lib/e2e/conversation";
import { hasLocalKeys } from "@/lib/e2e/key-manager";
import { useDecryptedMessages } from "@/lib/e2e/use-decrypted-messages";
import { liteInterval, litePageSize } from "@/lib/lite-mode";
import { profileQueries } from "@/lib/query-options/profiles";
import { useLiteMode } from "@/lib/use-lite-mode";
import { useMediaUpload } from "@/lib/use-media-upload";

import { MessageBubble } from "./message-bubble";

/** Tamanho que o app sempre usou; em modo lite cada página vem maior (menos idas ao servidor). */
const MESSAGES_PAGE_SIZE = 50;

/**
 * O filão de uma conversa: cabeçalho, histórico e compositor.
 *
 * Mora fora da rota porque o dock quer abrir várias conversas ao mesmo tempo: cada aba é uma
 * instância desta tela, com o próprio estado de rascunho e rolagem.
 */
export function ConversationThread({
  conversation,
  currentUserId,
  onBack,
}: ConversationThreadProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lite = useLiteMode();
  const upload = useMediaUpload();
  const [showServices, setShowServices] = useState(false);
  const [selectingMessages, setSelectingMessages] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    from: string;
    text: string;
  } | null>(null);

  // Paginado por cursor: a primeira pagina so traz as mensagens mais recentes — sem carregar as
  // anteriores as de semanas atras ficavam inalcancaveis.
  const {
    data: messagesData,
    fetchNextPage: fetchOlderMessages,
    hasNextPage: hasOlderMessages,
    isFetchingNextPage: isLoadingOlder,
    isLoading: isLoadingMessages,
    isPlaceholderData: showingPreviousThread,
  } = useInfiniteQuery({
    queryKey: ["messages", conversation.id],
    queryFn: ({ pageParam }) =>
      messagesApi.listMessages(conversation.id, pageParam, litePageSize(MESSAGES_PAGE_SIZE, lite)),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    // Trocando de conversa, o filao anterior fica na tela ate o novo chegar: sem isso a area de
    // mensagens esvaziava e o skeleton piscava a cada clique da lista. Enquanto e o filao antigo
    // (placeholder) os botoes por mensagem estao inertes — aqueles ids nao sao da conversa aberta.
    placeholderData: keepPreviousData,
    refetchInterval: liteInterval(10_000, lite),
  });

  const peerLastReadAt = conversation.otherLastReadAt
    ? new Date(conversation.otherLastReadAt).getTime()
    : null;
  const rawMessages = (messagesData?.pages.flatMap((page) => page.items) ?? []).sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  const { messages, decrypting } = useDecryptedMessages(rawMessages);

  const sendMessage = useMutation({
    mutationFn: ({
      conversationId,
      text,
      mediaIds,
      mediaSpoiler,
      e2e,
      replyToId,
    }: SendMessageInput) =>
      messagesApi.sendMessage(conversationId, text, mediaIds, mediaSpoiler, e2e, replyToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    // Sem isto o envio falhava em silêncio: o texto já tinha sido limpo e a pessoa achava que
    // tinha mandado.
    onError: () => toast(texts.messages.sendError, "error"),
  });

  // O prestador pode oferecer o serviço dele DENTRO da conversa: o painel só busca as ofertas
  // quando abre (uma chamada por abertura, não a cada mensagem digitada).
  const { data: myServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", "mine"],
    queryFn: () => servicesApi.mine(),
    enabled: showServices,
  });

  const reactToMessage = useMutation({
    mutationFn: ({ messageId, type }: { messageId: string; type: string }) =>
      messagesApi.react(conversation.id, messageId, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] }),
  });

  // Apagar MENSAGEM para mim: some só para quem apagou (o outro continua vendo na conversa dele).
  const hideMessages = useMutation({
    mutationFn: () => messagesApi.hideMessages(conversation.id, Array.from(selectedMessages)),
    onSuccess: () => {
      setSelectedMessages(new Set());
      setSelectingMessages(false);
      queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
      toast(texts.messages.messagesDeleted);
    },
    onError: () => toast(texts.messages.messagesDeleteError, "error"),
  });

  const reportMessage = async (messageId: string, conversationId: string) => {
    try {
      let e2eKey: string | undefined;
      try {
        // Tenta exportar a chave simétrica da conversa pra o moderador decifrar.
        const convKeyView = await (
          await import("@/lib/api/e2e")
        ).e2eApi.myConversationKey(conversationId);
        if (convKeyView.encryptedKey) {
          const { importPrivateKey, decryptWithPrivateKey } = await import("@/lib/e2e/crypto");
          const { getLocalPrivateKey } = await import("@/lib/e2e/key-manager");
          const pk = await getLocalPrivateKey();
          if (pk) {
            const privateKey = await importPrivateKey(pk);
            e2eKey = await decryptWithPrivateKey(convKeyView.encryptedKey, privateKey);
          }
        }
      } catch {
        // Sem chave E2E — envia a denúncia sem ela.
      }
      await reportsApi.create({
        targetType: "MESSAGE",
        targetId: messageId,
        reason: "SPAM",
        description: "Mensagem denunciada pelo chat",
        e2eConversationKey: e2eKey,
      });
      toast("Denúncia enviada.");
    } catch {
      toast("Não foi possível denunciar.", "error");
    }
  };

  /** Sobe as imagens (a falha volta para o compositor mostrar) e envia a mensagem. */
  const send = async ({ text, files, mediaSpoiler, replyToId }: ConversationSendValues) => {
    let mediaIds: string[] = [];
    if (files.length > 0) {
      const results = await upload.uploadAll(files.map((file) => ({ file })));
      mediaIds = results.map((result) => result.mediaId);
    }
    let e2e: { ciphertext: string; iv: string } | undefined;
    if (text && (await hasLocalKeys())) {
      try {
        e2e = await encryptForSend(conversation.id, text, conversation.participantIds);
      } catch {
        // E2E falhou — envia em texto claro.
      }
    }
    sendMessage.mutate({
      conversationId: conversation.id,
      text,
      mediaIds,
      mediaSpoiler,
      e2e,
      replyToId,
    });
  };

  const otherParticipantId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    ...profileQueries.byId(otherParticipantId ?? ""),
    enabled: !!otherParticipantId,
  });

  const { peer, profileHref } = conversationPeer(conversation, otherParticipantId, otherUser);

  // Banner profissional: conversa profissional e o usuario nao tem identidade corporativa nela.
  const isProfessional = conversation.context === "PROFESSIONAL";
  const hasMyProfessionalIdentity = Boolean(
    currentUserId && conversation.identities?.[currentUserId],
  );
  const [dismissedProfessionalBanner, setDismissedProfessionalBanner] = useState(false);
  const showProfessionalBanner =
    isProfessional && !hasMyProfessionalIdentity && !dismissedProfessionalBanner;

  /** O clique só marca no filão de verdade: no placeholder os ids são de outra conversa. */
  const toggleMessage = (messageId: string) =>
    setSelectedMessages((current) => {
      const next = new Set(current);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });

  return (
    <ConversationThreadView
      conversationTitle={conversation.title}
      peer={peer}
      profileHref={profileHref}
      onBack={onBack}
      banner={
        showProfessionalBanner ? (
          <div className="flex flex-col gap-2 rounded-xl border border-border-soft bg-surface-2 p-4">
            <div className="flex items-start gap-3">
              <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

              <p className="text-sm text-text-strong">{texts.messages.professionalPrompt}</p>
            </div>

            <div className="flex items-center gap-2 pl-8">
              <Link to="/profissional">
                <Button size="sm" className="rounded-full">
                  {texts.messages.professionalPromptCta}
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => setDismissedProfessionalBanner(true)}
              >
                {texts.messages.professionalPromptSocial}
              </Button>
            </div>
          </div>
        ) : undefined
      }
      loading={isLoadingMessages || decrypting}
      empty={messages.length === 0}
      newestMessageId={messages.length > 0 ? messages[messages.length - 1].id : null}
      hasOlderMessages={hasOlderMessages}
      loadingOlder={isLoadingOlder}
      onLoadOlder={() => fetchOlderMessages()}
      selecting={selectingMessages}
      selectedCount={selectedMessages.size}
      onStartSelecting={() => setSelectingMessages(true)}
      onCancelSelection={() => {
        setSelectingMessages(false);
        setSelectedMessages(new Set());
      }}
      deletePending={hideMessages.isPending}
      onDeleteSelected={() => hideMessages.mutate()}
      sendPending={sendMessage.isPending}
      onSend={send}
      servicesOpen={showServices}
      onServicesOpenChange={setShowServices}
      servicesLoading={isLoadingServices}
      services={myServices?.ofertas ?? []}
      serviceHref={(serviceId) => {
        const origin = typeof window === "undefined" ? "" : window.location.origin;
        return `${origin}/servicos#oferta-${serviceId}`;
      }}
      replyingTo={
        replyingTo
          ? {
              id: replyingTo.id,
              from: replyingTo.from === currentUserId ? "Você" : (peer?.name ?? "..."),
              text: replyingTo.text,
            }
          : null
      }
      onCancelReply={() => setReplyingTo(null)}
    >
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          isMe={m.from === currentUserId}
          readByOther={
            peerLastReadAt !== null &&
            m.from === currentUserId &&
            new Date(m.time).getTime() <= peerLastReadAt
          }
          peer={peer}
          profileHref={profileHref}
          selecting={selectingMessages}
          selected={selectedMessages.has(m.id)}
          onToggleSelect={
            !selectingMessages || showingPreviousThread ? undefined : () => toggleMessage(m.id)
          }
          onReact={
            showingPreviousThread
              ? undefined
              : (type) => reactToMessage.mutate({ messageId: m.id, type })
          }
          onReport={
            showingPreviousThread || m.from === currentUserId
              ? undefined
              : () => reportMessage(m.id, conversation.id)
          }
          onReply={
            showingPreviousThread
              ? undefined
              : () => setReplyingTo({ id: m.id, from: m.from, text: m.text })
          }
        />
      ))}
    </ConversationThreadView>
  );
}
