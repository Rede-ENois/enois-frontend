import { type FormEvent, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Send } from "lucide-react";

import { messagesApi } from "@/lib/api/messages";
import { profileApi } from "@/lib/api/profile";
import { getCurrentUserId } from "@/lib/current-user";
import { texts } from "@/texts";
import type { ActiveConversationProps } from "@/types/components/messages/active-conversation-props";
import type { SendMessageInput } from "@/types/components/messages/send-message-input";
import { formatRelativeTime } from "@/utils/format-relative-time";

import { ConversationHeader } from "@/components/conversation-header";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";

export function ActiveConversation({ conversationId, onBack }: ActiveConversationProps) {
  const currentUserId = getCurrentUserId();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.listConversations(),
    refetchInterval: 15_000,
  });

  const conversations = conversationsData?.items ?? [];
  const activeConversation = conversationId
    ? conversations.find((conversation) => conversation.id === conversationId)
    : null;

  const { data: messagesData } = useQuery({
    queryKey: ["messages", activeConversation?.id],
    queryFn: () => messagesApi.listMessages(activeConversation!.id),
    enabled: !!activeConversation,
    refetchInterval: 10_000,
  });

  const messages = (messagesData?.items ?? []).sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  const activeMessages = activeConversation ? messages : [];

  const otherParticipantId = activeConversation?.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherParticipantId],
    queryFn: () => profileApi.getById(otherParticipantId ?? ""),
    enabled: !!otherParticipantId,
  });

  const sendMessage = useMutation({
    mutationFn: ({ conversationId, text }: SendMessageInput) =>
      messagesApi.sendMessage(conversationId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setText("");
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || !activeConversation) return;
    sendMessage.mutate({ conversationId: activeConversation.id, text: content });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  return (
    <div className={`flex min-h-0 flex-col ${!activeConversation ? "hidden md:flex" : "flex"}`}>
      {!activeConversation ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">{texts.messages.selectConversation}</p>
        </div>
      ) : (
        <>
          <ConversationHeader conversation={activeConversation} onBack={onBack} />
          <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
            <div className="space-y-3">
              {activeMessages.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  {texts.messages.noMessages}
                </p>
              ) : (
                activeMessages.map((message) => {
                  const isMe = message.from === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <Link
                          to="/perfil/$username"
                          params={{ username: otherUser?.username ?? otherParticipantId ?? "" }}
                        >
                          <UserAvatar
                            src={otherUser?.avatar}
                            alt={otherUser?.name}
                            className="h-7 w-7 shrink-0 mb-1"
                          />
                        </Link>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isMe
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md bg-card text-foreground"
                        }`}
                      >
                        <p className="break-words">{message.text}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatRelativeTime(message.time)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={texts.messages.inputPlaceholder}
              className="h-10 rounded-full bg-muted"
            />
            <button
              type="submit"
              disabled={!text.trim() || sendMessage.isPending}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
