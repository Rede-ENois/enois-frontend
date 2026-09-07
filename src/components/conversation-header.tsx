import { Link } from "@tanstack/react-router";

import type { ConversationHeaderProps } from "@/types/components/messages/conversation-header-props";
import { ArrowLeft } from "lucide-react";

import { useConversationHeaderController } from "@/utils/components/messages/use-conversation-header-controller";

import { UserAvatar } from "@/components/user-avatar";

export function ConversationHeader(props: ConversationHeaderProps) {
  const { onBack } = props;
  const { otherUser, title, profileUsername } = useConversationHeaderController(props);

  return (
    <header className="flex items-center gap-3 border-b border-border p-4">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <Link to="/perfil/$username" params={{ username: profileUsername }}>
          <UserAvatar src={otherUser?.avatar} alt={title} className="h-10 w-10 shrink-0" />
        </Link>

        <div className="min-w-0">
          <p className="truncate font-semibold">{title}</p>
          {otherUser?.headline && (
            <p className="truncate text-xs text-muted-foreground">{otherUser.headline}</p>
          )}
        </div>
      </div>
    </header>
  );
}
