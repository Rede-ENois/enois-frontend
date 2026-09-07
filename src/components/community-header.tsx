import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CommunityHeaderProps } from "@/types/components/communities/community-header-props";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";
import { Settings, Users } from "lucide-react";

import { resolveCdnUrl } from "@/lib/api/media";
import { useCommunityHeaderController } from "@/lib/use-community-header-controller";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { EditCommunityForm } from "@/components/edit-community-form";

export function CommunityHeader({ community, members }: CommunityHeaderProps) {
  const { editOpen, setEditOpen, isAdmin, primaryAdmin, membershipPending, toggleMembership } =
    useCommunityHeaderController(community, members);

  return (
    <div className="surface-card overflow-hidden">
      {community.cover ? (
        <img src={resolveCdnUrl(community.cover)} alt="" className="h-48 w-full object-cover" />
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
                  <Users className="h-4 w-4" />

                  <>{texts.communities.memberCount(community.members)}</>
                </span>
                {primaryAdmin && (
                  <span>
                    <>{texts.communities.detail.createdBy}</>

                    <Link
                      to="/perfil/$username"
                      params={{ username: primaryAdmin.username }}
                      className="font-medium text-foreground hover:underline"
                    >
                      {primaryAdmin.name}
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
                    <Settings className="h-4 w-4" />

                    <>{texts.communities.detail.edit}</>
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
              disabled={membershipPending}
              onClick={toggleMembership}
            >
              {community.joined ? texts.communities.participating : texts.communities.enter}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
