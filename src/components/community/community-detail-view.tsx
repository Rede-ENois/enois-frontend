import type { FormEventHandler, ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { ArrowLeft, Send, Settings, Users } from "lucide-react";

import type { Community, CommunityMember, PostView } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";

import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function CommunityBackLink() {
  return (
    <Link
      to="/comunidades"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {texts.communities.title}
    </Link>
  );
}

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

type CommunityComposerProps = {
  draft: string;
  pending: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function CommunityComposer({
  draft,
  pending,
  onDraftChange,
  onSubmit,
}: CommunityComposerProps) {
  return (
    <form onSubmit={onSubmit} className="surface-card p-5">
      <Textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder={texts.communities.detail.composerPlaceholder}
        className="min-h-20 resize-none rounded-2xl border-border bg-muted/40 text-sm"
        maxLength={1024}
      />
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          className="rounded-full gap-1.5"
          disabled={!draft.trim() || pending}
        >
          <Send className="h-4 w-4" />
          {pending ? texts.common.publishing : texts.common.publish}
        </Button>
      </div>
    </form>
  );
}

export function CommunityFeed({ posts, emptyText }: { posts: PostView[]; emptyText: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{texts.communities.detail.feed}</h2>
      {posts.length === 0 ? (
        <p className="surface-card p-8 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}

export function CommunityMembers({ members }: { members: CommunityMember[] }) {
  return (
    <aside className="space-y-4">
      <div className="surface-card p-5">
        <h3 className="mb-3 text-sm font-semibold">
          {texts.communities.detail.membersTitle(members.length)}
        </h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center gap-3">
              <Link to="/perfil/$username" params={{ username: member.username }}>
                <UserAvatar
                  src={member.avatar}
                  alt={member.name}
                  className="h-9 w-9 shrink-0"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to="/perfil/$username"
                  params={{ username: member.username }}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {member.name}
                </Link>
                {member.role === "ADMIN" && (
                  <Badge
                    variant="outline"
                    className="ml-2 rounded-full px-1.5 py-0 text-[10px]"
                  >
                    {texts.communities.detail.admin}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
