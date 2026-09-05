import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { Settings, Users } from "lucide-react";

import type { Community, CommunityMember } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CommunityHeaderProps = {
  community: Community;
  admins: CommunityMember[];
  isAdmin: boolean;
  editOpen: boolean;
  editForm: ReactNode;
  membershipLabel: string;
  membershipVariant: "default" | "secondary";
  membershipPending: boolean;
  onEditOpenChange: (open: boolean) => void;
  onMembership: () => void;
};

export function CommunityHeader({
  community,
  admins,
  isAdmin,
  editOpen,
  editForm,
  membershipLabel,
  membershipVariant,
  membershipPending,
  onEditOpenChange,
  onMembership,
}: CommunityHeaderProps) {
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
                  <Users className="h-4 w-4" /> {texts.communities.memberCount(community.members)}
                </span>
                {admins.length > 0 && (
                  <span>
                    {texts.communities.detail.createdBy}{" "}
                    <Link
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
              <Dialog open={editOpen} onOpenChange={onEditOpenChange}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full gap-1.5">
                    <Settings className="h-4 w-4" /> {texts.communities.detail.edit}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{texts.communities.detail.editTitle}</DialogTitle>
                  </DialogHeader>
                  {editForm}
                </DialogContent>
              </Dialog>
            )}
            <Button
              className="shrink-0 rounded-full"
              variant={membershipVariant}
              disabled={membershipPending}
              onClick={onMembership}
            >
              {membershipLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
