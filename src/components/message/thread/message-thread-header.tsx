import { Link } from "@tanstack/react-router";

import { ArrowLeft } from "lucide-react";

import type { Profile } from "@/lib/api";

import { UserAvatar } from "@/components/user-avatar";

export function MessageThreadHeader({ title, otherUser, otherUserId, onBack }: {
  title: string;
  otherUser?: Profile;
  otherUserId: string;
  onBack: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-border p-4">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onBack} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherUserId }}>
          <UserAvatar src={otherUser?.avatar} alt={title} className="h-10 w-10 shrink-0" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-semibold">{title}</p>
          {otherUser?.headline && <p className="truncate text-xs text-muted-foreground">{otherUser.headline}</p>}
        </div>
      </div>
    </header>
  );
}
