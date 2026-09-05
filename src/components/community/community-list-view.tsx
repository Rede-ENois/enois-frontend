import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { Loader2, Plus, Users } from "lucide-react";

import type { Community } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

export const COMMUNITY_TOPICS = [
  "TECNOLOGIA",
  "ENGENHARIA",
  "DESIGN",
  "PRODUTO",
  "LIDERANCA",
  "CARREIRA",
  "FREELANCE",
] as const;

export type CommunityTopic = (typeof COMMUNITY_TOPICS)[number];

export function CommunitiesHeader({ createDialog }: { createDialog: ReactNode }) {
  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{texts.communities.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{texts.communities.description}</p>
      </div>
      {createDialog}
    </div>
  );
}

export function CommunityTopicFilters({
  selected,
  onChange,
}: {
  selected: string | undefined;
  onChange: (topic?: CommunityTopic) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <TopicButton active={!selected} onClick={() => onChange(undefined)}>
        {texts.communities.topics.all}
      </TopicButton>
      {COMMUNITY_TOPICS.map((topic) => (
        <TopicButton key={topic} active={topic === selected} onClick={() => onChange(topic)}>
          {texts.communities.topics[topic]}
        </TopicButton>
      ))}
    </div>
  );
}

export function CommunitiesGrid({
  communities,
  pending,
  onJoin,
  onLeave,
}: {
  communities: Community[];
  pending: boolean;
  onJoin: (communityId: string) => void;
  onLeave: (communityId: string) => void;
}) {
  const membershipMeta = {
    joined: {
      label: texts.communities.participating,
      variant: "secondary" as const,
      run: onLeave,
    },
    available: {
      label: texts.communities.enter,
      variant: "default" as const,
      run: onJoin,
    },
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => {
        const action = membershipMeta[community.joined ? "joined" : "available"];
        return (
          <Link
            key={community.id}
            to="/comunidades/$communityId"
            params={{ communityId: community.id }}
          >
            <article className="surface-card cursor-pointer overflow-hidden transition hover:shadow-[var(--shadow-card)]">
              {community.cover ? (
                <img
                  src={resolveCdnUrl(community.cover)}
                  alt=""
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
              <div className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  {community.avatar && (
                    <img
                      src={resolveCdnUrl(community.avatar)}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                      {community.topic}
                    </p>
                    <h3 className="truncate font-semibold">{community.name}</h3>
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                  {community.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {texts.communities.members(community.members ?? 0)}
                  </span>
                  <Button
                    size="sm"
                    variant={action.variant}
                    className="rounded-full"
                    disabled={pending}
                    onClick={(event) => {
                      event.preventDefault();
                      action.run(community.id);
                    }}
                  >
                    {action.label}
                  </Button>
                </div>
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}

export function CommunitiesLoadMore({
  visible,
  loading,
  onLoadMore,
}: {
  visible: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  return visible ? (
    <div className="flex justify-center pb-8">
      <Button
        variant="outline"
        className="rounded-full"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : texts.communities.loadMore}
      </Button>
    </div>
  ) : null;
}

export function CreateCommunityButton() {
  return (
    <Button className="rounded-full gap-1.5">
      <Plus className="h-4 w-4" /> {texts.communities.createCommunity}
    </Button>
  );
}

function TopicButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
