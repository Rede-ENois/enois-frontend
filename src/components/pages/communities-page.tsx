import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";

import { Loader2, Plus, Users } from "lucide-react";

import { COMMUNITY_TOPICS } from "@/constants/community-topics";
import { listCommunities } from "@/lib/api/communities";
import { joinCommunity } from "@/lib/api/communities/join-community";
import { leaveCommunity } from "@/lib/api/communities/leave-community";
import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";
import type { Community } from "@/types/application/community/community";
import type { CommunityTopic } from "@/types/application/community/community-topic";

import { AppContainer } from "@/components/app-container";
import { CreateCommunityDialog } from "@/components/create-community-dialog";
import { Button } from "@/components/ui/button";

export function Comunidades() {
  const queryClient = useQueryClient();
  const matchRoute = useMatchRoute();
  const [topic, setTopic] = useState<CommunityTopic | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allItems, setAllItems] = useState<Community[]>([]);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const isDetail = matchRoute({ to: "/comunidades/$communityId" });

  const { data: communitiesData, isFetching } = useQuery({
    queryKey: ["communities", topic, cursor],
    queryFn: () => listCommunities(topic, cursor),
    enabled: !isDetail,
  });

  const nextCursor = communitiesData?.nextCursor ?? null;

  useEffect(() => {
    if (!communitiesData?.items) return;
    setAllItems((previous) => {
      if (cursorRef.current) {
        const existing = new Set(previous.map((community) => community.id));
        const newItems = communitiesData.items.filter((community) => !existing.has(community.id));
        return newItems.length > 0 ? [...previous, ...newItems] : previous;
      }
      return communitiesData.items;
    });
  }, [communitiesData]);

  const loadMore = () => {
    if (nextCursor && !isFetching) setCursor(nextCursor);
  };

  const handleTopicChange = (nextTopic: (typeof COMMUNITY_TOPICS)[number]["value"]) => {
    setTopic(nextTopic === "Todas" ? undefined : nextTopic);
    setCursor(undefined);
    setAllItems([]);
  };

  const join = useMutation({
    mutationFn: joinCommunity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });

  const leave = useMutation({
    mutationFn: leaveCommunity,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });

  if (isDetail) return <Outlet />;

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{texts.communities.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{texts.communities.description}</p>
          </div>
          <CreateCommunityDialog open={open} onOpenChange={setOpen}>
            <Button className="rounded-full gap-1.5">
              <Plus className="h-4 w-4" /><>{texts.communities.createCommunity}</>
            </Button>
          </CreateCommunityDialog>
        </div>

        <div className="flex flex-wrap gap-2">
          {COMMUNITY_TOPICS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTopicChange(value)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                (value === "Todas" && !topic) || value === topic
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allItems.map((community) => (
            <Link
              key={community.id}
              to="/comunidades/$communityId"
              params={{ communityId: community.id }}
            >
              <article className="surface-card overflow-hidden cursor-pointer transition hover:shadow-[var(--shadow-card)]">
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
                  <div className="flex items-center gap-3 mb-3">
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
                      <>{texts.communities.members(community.members ?? 0)}</>
                    </span>
                    <Button
                      size="sm"
                      variant={community.joined ? "secondary" : "default"}
                      className="rounded-full"
                      disabled={join.isPending || leave.isPending}
                      onClick={(event) => {
                        event.preventDefault();
                        if (community.joined) leave.mutate(community.id);
                        else join.mutate(community.id);
                      }}
                    >
                      {community.joined ? texts.communities.participating : texts.communities.enter}
                    </Button>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {nextCursor && (
          <div className="flex justify-center pb-8">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={loadMore}
              disabled={isFetching}
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : texts.communities.loadMore}
            </Button>
          </div>
        )}
      </div>
    </AppContainer>
  );
}
