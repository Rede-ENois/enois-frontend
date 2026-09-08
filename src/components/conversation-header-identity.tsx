import { Link } from "@tanstack/react-router";

import type { ConversationHeaderIdentityProps } from "@/types/components/messages/conversation-header-identity-props";

import { UserAvatar } from "@/components/user-avatar";

export function ConversationHeaderIdentity({
  profileUsername,
  avatar,
  title,
  headline,
}: ConversationHeaderIdentityProps) {
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
