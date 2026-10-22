import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MediaItem } from "@/types/routes/feed/media-item";
import type { ConversationThreadProps } from "@/types/routes/messages/conversation-thread-props";
import type { SendMessageInput } from "@/types/routes/messages/send-message-input";
import { EyeOff, ImageIcon, Send, X } from "lucide-react";

import { messagesApi, profileApi } from "@/lib/api";
import { liteInterval, litePageSize } from "@/lib/lite-mode";
import { insertSnippet } from "@/lib/rich-text/insert-snippet";
import { useLiteMode } from "@/lib/use-lite-mode";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { useToast } from "@/components/ui/toast";

import { SpoilerPreview } from "@/components/post/spoiler-preview";
import { MessageSkeletons } from "@/components/skeletons/message-skeletons";

import { ConversationHeader } from "./conversation-header";
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
  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaSpoiler, setMediaSpoiler] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectingMessages, setSelectingMessages] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const messagesScrollRef = useRef<HTMLDivElement>(null);

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
  const messages = (messagesData?.pages.flatMap((page) => page.items) ?? []).sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  const sendMessage = useMutation({
    mutationFn: ({ conversationId, text, mediaIds, mediaSpoiler }: SendMessageInput) =>
      messagesApi.sendMessage(conversationId, text, mediaIds, mediaSpoiler),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sendMessage.isPending) return;
    const content = text.trim();
    if (!content && media.length === 0) return;
    // Limpa na hora para evitar reenvio se Enter disparar duas vezes antes do onSuccess.
    setText("");
    setMedia([]);
    const shouldSpoiler = mediaSpoiler;
    setMediaSpoiler(false);
    setUploadError(null);
    try {
      let mediaIds: string[] = [];
      if (media.length > 0) {
        const results = await upload.uploadAll(media.map((item) => ({ file: item.file })));
        mediaIds = results.map((result) => result.mediaId);
      }
      sendMessage.mutate({
        conversationId: conversation.id,
        text: content,
        mediaIds,
        mediaSpoiler: shouldSpoiler,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : texts.messages.mediaError);
    }
  };

  const addMediaFiles = (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    setMedia((current) => {
      const room = 4 - current.length;
      if (room <= 0) {
        setUploadError(texts.messages.mediaLimit);
        return current;
      }
      setUploadError(null);
      return [
        ...current,
        ...images.slice(0, room).map((file) => ({
          type: "image" as const,
          file,
          preview: URL.createObjectURL(file),
        })),
      ];
    });
  };

  const handleMediaSelect = (event: ChangeEvent<HTMLInputElement>) => {
    addMediaFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const removeMediaItem = (index: number) => {
    setMedia((current) => {
      URL.revokeObjectURL(current[index].preview);
      const next = current.filter((_, i) => i !== index);
      if (next.length === 0) setMediaSpoiler(false);
      return next;
    });
  };

  // Campo de mensagem cresce com o texto (teto 128px) e volta a 1 linha ao enviar.
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  /** Emoji do seletor: entra na posição do cursor (o campo é o mesmo, então vale para o chat). */
  const insertEmoji = (emoji: string) => {
    const el = messageInputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? start;
    const result = insertSnippet(text, start, end, emoji);
    setText(result.value);

    requestAnimationFrame(() => {
      const node = messageInputRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const otherParticipantId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherParticipantId],
    queryFn: () => profileApi.getById(otherParticipantId ?? ""),
    enabled: !!otherParticipantId,
  });

  // Rola para o fim quando chega mensagem nova — mas NAO quando o usuario carrega mensagens
  // antigas (senao a lista salta para o fim e ele perde o ponto em que estava lendo).
  const newestMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
  const lastScrolledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!newestMessageId || lastScrolledRef.current === newestMessageId) return;
    lastScrolledRef.current = newestMessageId;
    // Rola DENTRO do quadro de mensagens: `scrollIntoView` fazia o navegador rolar a página
    // inteira quando o teclado abria no mobile.
    const el = messagesScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [newestMessageId]);

  /** O clique só marca no filão de verdade: no placeholder os ids são de outra conversa. */
  const toggleMessage = (messageId: string) =>
    setSelectedMessages((current) => {
      const next = new Set(current);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });

  return (
    <>
      <ConversationHeader
        action={
          selectingMessages ? undefined : (
            <button
              type="button"
              onClick={() => setSelectingMessages(true)}
              className="rounded-full px-3 py-1 text-xs font-normal text-text-subtle transition hover:bg-surface-2 hover:text-primary"
            >
              {texts.messages.selectMessages}
            </button>
          )
        }
        conversation={conversation}
        onBack={onBack}
      />

      <div
        ref={messagesScrollRef}
        className="flex-1 overflow-y-auto overscroll-contain bg-muted/30 p-5"
      >
        {hasOlderMessages && (
          <div className="mb-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              disabled={isLoadingOlder}
              onClick={() => fetchOlderMessages()}
            >
              {isLoadingOlder ? texts.messages.loadingOlder : texts.messages.loadOlderMessages}
            </Button>
          </div>
        )}
        <div className="space-y-3">
          {isLoadingMessages ? (
            <MessageSkeletons />
          ) : messages.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {texts.messages.noMessages}
            </p>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isMe={m.from === currentUserId}
                readByOther={
                  peerLastReadAt !== null &&
                  m.from === currentUserId &&
                  new Date(m.time).getTime() <= peerLastReadAt
                }
                otherUser={otherUser}
                otherId={otherParticipantId}
                selecting={selectingMessages}
                selected={selectedMessages.has(m.id)}
                onToggleSelect={
                  !selectingMessages || showingPreviousThread
                    ? undefined
                    : () => toggleMessage(m.id)
                }
                onReact={
                  showingPreviousThread
                    ? undefined
                    : (type) => reactToMessage.mutate({ messageId: m.id, type })
                }
              />
            ))
          )}
          <div />
        </div>
      </div>

      {selectingMessages ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-2 p-3">
          <span className="text-xs font-normal text-text-subtle">
            {texts.messages.selectedMessages(selectedMessages.size)}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setSelectingMessages(false);
                setSelectedMessages(new Set());
              }}
            >
              {texts.messages.cancelSelection}
            </Button>

            <Button
              size="sm"
              variant="destructive"
              className="rounded-full"
              disabled={selectedMessages.size === 0 || hideMessages.isPending}
              onClick={() => hideMessages.mutate()}
            >
              {texts.messages.deleteSelectedMessages(selectedMessages.size)}
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="border-t border-border px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          {media.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {media.map((item, index) => (
                <div key={item.preview} className="relative">
                  <SpoilerPreview
                    active={mediaSpoiler}
                    label={texts.posts.mediaSpoiler.badge}
                    className="h-16 w-16 rounded-lg"
                  >
                    <img
                      src={item.preview}
                      alt=""
                      className="h-16 w-16 rounded-lg border border-border-soft object-cover"
                    />
                  </SpoilerPreview>

                  <button
                    type="button"
                    onClick={() => removeMediaItem(index)}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-foreground text-background shadow"
                    aria-label={texts.messages.removeMedia}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMediaSpoiler((active) => !active)}
                className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition ${
                  mediaSpoiler
                    ? "bg-primary text-primary-foreground"
                    : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
                }`}
                aria-label={mediaSpoiler ? texts.messages.mediaSpoilerActive : texts.messages.mediaSpoiler}
                title={mediaSpoiler ? texts.messages.mediaSpoilerActive : texts.messages.mediaSpoiler}
              >
                <EyeOff className="h-3.5 w-3.5" />
                {mediaSpoiler ? texts.messages.mediaSpoilerActive : texts.messages.mediaSpoiler}
              </button>
            </div>
          )}

          {uploadError && <p className="mb-2 text-xs text-destructive">{uploadError}</p>}

          <div className="flex items-end gap-2">
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleMediaSelect}
            />

            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-text-subtle transition hover:bg-muted hover:text-foreground"
              aria-label={texts.messages.attachMedia}
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // Enter envia; Shift+Enter quebra linha (padrao de chat).
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                }
              }}
              onPaste={(event) => {
                const files = Array.from(event.clipboardData?.files ?? []);
                if (files.some((file) => file.type.startsWith("image/"))) {
                  event.preventDefault();
                  addMediaFiles(files);
                }
              }}
              ref={messageInputRef}
              rows={1}
              placeholder={texts.messages.inputPlaceholder}
              className="max-h-32 min-h-[40px] w-full resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm outline-none"
            />
            <EmojiPicker
              onPick={insertEmoji}
              buttonTitle={texts.posts.formatting.emoji}
              buttonClassName="grid h-10 w-10 shrink-0 place-items-center rounded-full text-text-subtle transition hover:bg-muted hover:text-foreground"
            />

            <button
              type="submit"
              disabled={(!text.trim() && media.length === 0) || sendMessage.isPending}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </>
  );
}
