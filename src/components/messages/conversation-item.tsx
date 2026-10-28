import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { ConversationItemProps } from "@/types/routes/messages/conversation-item-props";
import { ConversationItem as ConversationItemView } from "@rede-enois/design-system/domain";

import { profileApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { decryptReceived } from "@/lib/e2e/conversation";
import { hasLocalKeys } from "@/lib/e2e/key-manager";
import { authorNameStyle } from "@/lib/profile-name-style";

import { formatTime } from "@/components/post/format-time";

/** Uma linha da lista de conversas. Vive fora da rota para o dock poder reaproveitá-la. */
export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  selecting,
  selected,
}: ConversationItemProps) {
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const otherId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => profileApi.getById(otherId ?? ""),
    enabled: !!otherId,
  });

  // Prévia da última mensagem: E2E chega cifrada e só vira texto com a chave local.
  const [preview, setPreview] = useState(
    conversation.lastMessageE2e ? "" : (conversation.lastMessage ?? ""),
  );
  const [decryptingPreview, setDecryptingPreview] = useState(!!conversation.lastMessageE2e);
  useEffect(() => {
    if (!conversation.lastMessageE2e || !conversation.lastMessage || !conversation.lastMessageIv) {
      setPreview(conversation.lastMessage ?? "");
      setDecryptingPreview(false);
      return;
    }
    setDecryptingPreview(true);
    let cancelled = false;
    hasLocalKeys().then((has) => {
      if (cancelled) return;
      if (!has) {
        setPreview("🔒");
        setDecryptingPreview(false);
        return;
      }
      decryptReceived({
        e2e: true,
        text: conversation.lastMessage!,
        iv: conversation.lastMessageIv!,
        conversationId: conversation.id,
      } as Parameters<typeof decryptReceived>[0]).then((plain) => {
        if (!cancelled) {
          setPreview(plain);
          setDecryptingPreview(false);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    conversation.lastMessage,
    conversation.lastMessageE2e,
    conversation.lastMessageIv,
    conversation.id,
  ]);

  return (
    <ConversationItemView
      conversation={{ ...conversation, lastMessage: preview }}
      peer={otherUser && { ...otherUser, nameStyle: authorNameStyle(otherUser) }}
      profileHref={`/perfil/${otherUser?.username ?? otherId ?? ""}`}
      timeLabel={conversation.time ? formatTime(conversation.time) : ""}
      isActive={isActive}
      onSelect={onSelect}
      selecting={selecting}
      selected={selected}
      previewLoading={decryptingPreview}
    />
  );
}
