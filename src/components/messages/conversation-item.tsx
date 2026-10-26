import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ConversationItemProps } from "@/types/routes/messages/conversation-item-props";
import { StyledName, UserAvatar, UserBadges } from "@rede-enois/design-system/domain";
import { Loader2 } from "lucide-react";

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
  onToggle,
}: ConversationItemProps) {
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const otherId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => profileApi.getById(otherId ?? ""),
    enabled: !!otherId,
  });

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;
  const otherNameStyle = authorNameStyle(otherUser);

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
    <li>
      <button
        onClick={onSelect}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
          selected ? "bg-primary-soft" : isActive ? "bg-primary-soft" : "hover:bg-muted"
        }`}
      >
        {selecting && (
          <span
            aria-hidden
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
              selected ? "border-primary bg-primary text-primary-foreground" : "border-border-soft"
            }`}
          >
            {selected ? "✓" : ""}
          </span>
        )}
        <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherId ?? "" }}>
          <UserAvatar src={otherUser?.avatar} alt={title} className="h-11 w-11 shrink-0" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium">
                {conversation.title ?? <StyledName name={title} style={otherNameStyle} />}
              </span>

              <UserBadges badges={otherUser?.badges} badge={otherUser?.badge} />
            </span>

            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {conversation.time ? formatTime(conversation.time) : ""}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {decryptingPreview ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
              </span>
            ) : (
              <p className="truncate text-xs text-muted-foreground">{preview}</p>
            )}
            {conversation.unread > 0 && (
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
