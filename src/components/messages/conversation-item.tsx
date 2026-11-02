import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ConversationItemProps } from "@/types/routes/messages/conversation-item-props";
import { ConversationItem as ConversationItemView } from "@rede-enois/design-system/domain";

import { conversationPeer } from "@/lib/conversation-peer";
import { useCurrentUser } from "@/lib/current-user";
import { decryptReceived } from "@/lib/e2e/conversation";
import { hasLocalKeys } from "@/lib/e2e/key-manager";
import { profileQueries } from "@/lib/query-options/profiles";

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
    ...profileQueries.byId(otherId ?? ""),
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
      } as Parameters<typeof decryptReceived>[0])
        .then((plain) => {
          if (!cancelled) {
            setPreview(plain);
            setDecryptingPreview(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPreview("[Mensagem cifrada]");
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

  const { peer, profileHref } = conversationPeer(conversation, otherId, otherUser);

  // Who wrote the preview: "Você" for the viewer; in a group, the sender's first name, since the
  // row shows the group and not the author.
  const from = conversation.lastMessageFrom ?? undefined;
  const mine = !!currentUserId && from === currentUserId;
  const groupSenderId = conversation.kind === "GROUP" && !mine ? from : undefined;
  const { data: groupSender } = useQuery({
    ...profileQueries.byId(groupSenderId ?? ""),
    enabled: !!groupSenderId,
  });
  const groupSenderName = groupSenderId
    ? conversationPeer(conversation, groupSenderId, groupSender).peer?.name?.split(" ")[0]
    : undefined;
  const author = mine ? texts.messages.you : groupSenderName;
  const lastMessage = preview && author ? texts.messages.authoredPreview(author, preview) : preview;

  return (
    <ConversationItemView
      conversation={{ ...conversation, lastMessage }}
      peer={peer}
      profileHref={profileHref}
      timeLabel={conversation.time ? formatTime(conversation.time) : ""}
      isActive={isActive}
      onSelect={onSelect}
      selecting={selecting}
      selected={selected}
      previewLoading={decryptingPreview}
    />
  );
}
