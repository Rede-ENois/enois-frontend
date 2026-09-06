import { Link } from "@tanstack/react-router";

import { Check, X } from "lucide-react";

import { texts } from "@/texts";
import type { NetworkRequestCardProps } from "@/types/components/network/network-request-card-props";
import type { RequestDirection } from "@/types/components/network/network-request-view-model";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";

export function NetworkRequestCard({
  requestViewModel,
  onAccept,
  onCancel,
}: NetworkRequestCardProps) {
  const { request, direction, targetUserId, user } = requestViewModel;
  const descriptionsByDirection: Record<RequestDirection, string> = {
    outgoing: texts.network.requestSent,
    incoming: texts.network.wantsToConnect,
  };
  const actionsByDirection: Record<RequestDirection, React.ReactNode> = {
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
          <p className="text-[11px] text-muted-foreground">{descriptionsByDirection[direction]}</p>
        </div>
      </div>
      {actionsByDirection[direction]}
    </div>
  );
}
