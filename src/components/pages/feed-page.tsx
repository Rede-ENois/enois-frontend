import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Loader2 } from "lucide-react";

import { listFeedPosts } from "@/lib/api/feed";
import { texts } from "@/texts";
import type { FeedTab } from "@/types/application/feed/feed-tab";

import { AppContainer } from "@/components/app-container";
import { FeedComposer } from "@/components/feed-composer";
import { FeedSidebar } from "@/components/feed-sidebar";
import { PostCard } from "@/components/post-card";
import { TabButton } from "@/components/tab-button";

export function Home() {
  const [tab, setTab] = useState<FeedTab>("FOR_YOU");
  const { data: feedData, isFetching: feedLoading } = useQuery({
    queryKey: ["feed", tab],
    queryFn: () => listFeedPosts(null, 20, tab),
  });
  const feedPosts = feedData?.items ?? [];

  return (
    <AppContainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <FeedComposer />

          <div className="flex flex-wrap items-center gap-1.5">
            <TabButton variant="feed" active={tab === "FOR_YOU"} onClick={() => setTab("FOR_YOU")}>
              {texts.feed.tabs.forYou}
            </TabButton>
            <TabButton variant="feed" active={tab === "ALL"} onClick={() => setTab("ALL")}>
              {texts.feed.tabs.all}
            </TabButton>
            <TabButton variant="feed" active={tab === "FOLLOWING"} onClick={() => setTab("FOLLOWING")}>
              {texts.feed.tabs.following}
            </TabButton>
            <TabButton variant="feed" active={tab === "RECENT"} onClick={() => setTab("RECENT")}>
              {texts.feed.tabs.discussions}
            </TabButton>
            <TabButton variant="feed" active={tab === "PROJECTS"} onClick={() => setTab("PROJECTS")}>
              {texts.feed.tabs.projects}
            </TabButton>
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
