import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Check, X } from "lucide-react";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { getCurrentUserId } from "@/lib/current-user";
import { texts } from "@/texts";
import type { RequestCardProps } from "@/types/components/network/request-card-props";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function RequestCard({ request, onAccept, onCancel }: RequestCardProps) {
  const currentUserId = getCurrentUserId();
  const isOutgoing = request.fromUserId === currentUserId;
  const targetUserId = isOutgoing ? request.toUserId : request.fromUserId;

  const { data: user } = useQuery({
    queryKey: ["profile", "by-id", targetUserId],
    queryFn: () => getProfileById(targetUserId),
  });

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
          <p className="text-[11px] text-muted-foreground">
            {isOutgoing ? texts.network.requestSent : texts.network.wantsToConnect}
          </p>
        </div>
      </div>

      {isOutgoing ? (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 rounded-full gap-1.5"
          onClick={() => onCancel(request.toUserId)}
        >
          <X className="h-4 w-4" /><>{texts.network.cancel}</>
        </Button>
      ) : (
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5"
            onClick={() => onCancel(request.fromUserId)}
          >
            <X className="h-4 w-4" /><>{texts.network.reject}</>
          </Button>
          <Button
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => onAccept(request.fromUserId)}
          >
            <Check className="h-4 w-4" /><>{texts.network.accept}</>
          </Button>
        </div>
      )}
    </div>
  );
}
