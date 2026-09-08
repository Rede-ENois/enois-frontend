import { Link } from "@tanstack/react-router";

import { useConversationHeaderContext } from "@/utils/components/messages/use-conversation-header-context";

import { UserAvatar } from "@/components/user-avatar";

export function ConversationHeaderIdentity() {
  const { profileUsername, avatar, title, headline } = useConversationHeaderContext();

  return (
    <>
      <Link to="/perfil/$username" params={{ username: profileUsername }}>
        <UserAvatar src={avatar} alt={title} className="h-10 w-10 shrink-0" />
      </Link>

      <div className="min-w-0">
        <p className="truncate font-semibold">{title}</p>
        {headline && <p className="truncate text-xs text-muted-foreground">{headline}</p>}
      </div>
    </>
  );
}
