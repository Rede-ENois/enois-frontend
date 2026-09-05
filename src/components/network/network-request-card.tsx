import { Link } from "@tanstack/react-router";

import { Check, X } from "lucide-react";

import { texts } from "@/texts";
import type { RequestDirection } from "@/utils/network";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import type { NetworkRequestItem } from "./network-request-item";

export function NetworkRequestCard({
  item,
  onAccept,
  onCancel,
}: {
  item: NetworkRequestItem;
  onAccept: (userId: string) => void;
  onCancel: (userId: string) => void;
}) {
  const { request, direction, targetUserId, user } = item;
  const descriptions: Record<RequestDirection, string> = {
    outgoing: texts.network.requestSent,
    incoming: texts.network.wantsToConnect,
  };
  const actions: Record<RequestDirection, React.ReactNode> = {
    outgoing: (
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 rounded-full gap-1.5"
        onClick={() => onCancel(request.toUserId)}
      >
        <X className="h-4 w-4" /> {texts.network.cancel}
      </Button>
    ),
    incoming: (
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-1.5"
          onClick={() => onCancel(request.fromUserId)}
        >
          <X className="h-4 w-4" /> {texts.network.reject}
        </Button>
        <Button
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => onAccept(request.fromUserId)}
        >
          <Check className="h-4 w-4" /> {texts.network.accept}
        </Button>
      </div>
    ),
  };

  return (
    <div className="surface-card flex items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar src={user?.avatar} alt={user?.name} className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <Link
            to="/perfil/$username"
            params={{ username: user?.username ?? targetUserId }}
            className="font-semibold hover:underline"
          >
            {user?.name ?? texts.common.loading}
          </Link>
          {user?.headline && (
            <p className="truncate text-xs text-muted-foreground">{user.headline}</p>
          )}
          <p className="text-[11px] text-muted-foreground">{descriptions[direction]}</p>
        </div>
      </div>
      {actions[direction]}
    </div>
  );
}
