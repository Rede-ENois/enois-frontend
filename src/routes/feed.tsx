import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Loader2 } from "lucide-react";

import { feedApi } from "@/lib/api/feed";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";
import type { FeedTab } from "@/types/application/feed/feed-tab";
import type { TabPillProps } from "@/types/routes/feed/tab-pill-props";

import { AppContainer } from "@/components/app-container";
import { FeedComposer } from "@/components/feed-composer";
import { FeedSidebar } from "@/components/feed-sidebar";
import { PostCard } from "@/components/post-card";

export const Route = createFileRoute("/feed")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: texts.feed.seo.title },
      {
        name: "description",
        content: texts.feed.seo.description,
      },
    ],
  }),
  component: Home,
});

function useFeed(tab: FeedTab) {
  return useQuery({
    queryKey: ["feed", tab],
    queryFn: () => feedApi.list(null, 20, tab),
  });
}

function Home() {
  const [tab, setTab] = useState<FeedTab>("FOR_YOU");
  const { data: feedData, isFetching: feedLoading } = useFeed(tab);
  const feedPosts = feedData?.items ?? [];

  return (
    <AppContainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <FeedComposer />

          <div className="flex flex-wrap items-center gap-1.5">
            <TabPill active={tab === "FOR_YOU"} onClick={() => setTab("FOR_YOU")}>
              {texts.feed.tabs.forYou}
            </TabPill>
            <TabPill active={tab === "ALL"} onClick={() => setTab("ALL")}>
              {texts.feed.tabs.all}
            </TabPill>
            <TabPill active={tab === "FOLLOWING"} onClick={() => setTab("FOLLOWING")}>
              {texts.feed.tabs.following}
            </TabPill>
            <TabPill active={tab === "RECENT"} onClick={() => setTab("RECENT")}>
              {texts.feed.tabs.discussions}
            </TabPill>
            <TabPill active={tab === "PROJECTS"} onClick={() => setTab("PROJECTS")}>
              {texts.feed.tabs.projects}
            </TabPill>
          </div>

          <div className="space-y-4">
            {feedLoading && (
              <div className="flex items-center justify-center py-8 text-text-subtle">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {!feedLoading && feedPosts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>

        <FeedSidebar />
      </div>
    </AppContainer>
  );
}

function TabPill({ children, active, onClick }: TabPillProps) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-light transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border-soft bg-surface-card text-text-subtle hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
