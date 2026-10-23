import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ConversationHeaderProps } from "@/types/routes/messages/conversation-header-props";
import { ArrowLeft } from "lucide-react";

import { profileApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";

import { UserAvatar } from "@/components/user-avatar";
import { UserBadges } from "@/components/user-badge";

/** Cabeçalho do filão: quem é o outro, voltar para a lista e a ação da tela. */
export function ConversationHeader({ conversation, onBack, action }: ConversationHeaderProps) {
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const otherId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => profileApi.getById(otherId ?? ""),
    enabled: !!otherId,
  });

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;

  return (
    <header className="flex items-center gap-3 border-b border-border p-4">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            aria-label={texts.messages.back}
            title={texts.messages.back}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherId ?? "" }}>
          <UserAvatar src={otherUser?.avatar} alt={title} className="h-10 w-10 shrink-0" />
        </Link>

        <div className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-semibold">{title}</span>

            <UserBadges badges={otherUser?.badges} badge={otherUser?.badge} />
          </span>
          {otherUser?.headline && (
            <p className="truncate text-xs text-muted-foreground">{otherUser.headline}</p>
          )}
        </div>
      </div>

      {action && <div className="ml-auto shrink-0">{action}</div>}
    </header>
  );
}
