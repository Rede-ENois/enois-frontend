import { useState } from "react";

import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Settings, Users } from "lucide-react";

import { communitiesApi } from "@/lib/api/communities";
import { resolveCdnUrl } from "@/lib/api/media";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import type { CommunityHeaderProps } from "@/types/components/communities/community-header-props";

import { EditCommunityForm } from "@/components/edit-community-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

export function CommunityHeader({ community, members }: CommunityHeaderProps) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const admins = members.filter((member) => member.role === "ADMIN");
  const isAdmin = currentUser
    ? admins.some((admin) => admin.userId === currentUser.id)
    : false;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["community", community.id] });
  };

  const join = useMutation({
    mutationFn: () => communitiesApi.join(community.id),
    onSuccess: invalidate,
  });

  const leave = useMutation({
    mutationFn: () => communitiesApi.leave(community.id),
    onSuccess: invalidate,
  });

  return (
    <div className="surface-card overflow-hidden">
      {community.cover ? (
        <img
          src={resolveCdnUrl(community.cover)}
          alt=""
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
      )}
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {community.avatar && (
              <img
                src={resolveCdnUrl(community.avatar)}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-card"
              />
            )}
            <div className="min-w-0">
              <Badge className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
                {community.topic}
              </Badge>
              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight">
                {community.name}
              </h1>
              <p className="mt-1 break-words text-muted-foreground">{community.description}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" /><>{texts.communities.memberCount(community.members)}</>
                </span>
                {admins.length > 0 && (
                  <span>
                    <>{texts.communities.detail.createdBy}</><Link
                      to="/perfil/$username"
                      params={{ username: admins[0].username }}
                      className="font-medium text-foreground hover:underline"
                    >
                      {admins[0].name}
                    </Link>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full gap-1.5">
                    <Settings className="h-4 w-4" /><>{texts.communities.detail.edit}</>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{texts.communities.detail.editTitle}</DialogTitle>
                  </DialogHeader>
                  <EditCommunityForm community={community} onClose={() => setEditOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
            <Button
              className="shrink-0 rounded-full"
              variant={community.joined ? "secondary" : "default"}
              disabled={join.isPending || leave.isPending}
              onClick={() => (community.joined ? leave.mutate() : join.mutate())}
            >
              {community.joined ? texts.communities.participating : texts.communities.enter}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
