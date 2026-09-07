import { Loader2 } from "lucide-react";

import { useFeedPageController } from "@/lib/use-feed-page-controller";

import { AppContainer } from "@/components/app-container";
import { FeedComposer } from "@/components/feed-composer";
import { FeedSidebar } from "@/components/feed-sidebar";
import { FeedTabs } from "@/components/feed-tabs";
import { PostCard } from "@/components/post-card";

export function Home() {
  const { tab, setTab, posts, loading } = useFeedPageController();

  return (
    <AppContainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <FeedComposer />
          <FeedTabs activeTab={tab} onTabChange={setTab} />

          <div className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-8 text-text-subtle">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {!loading && posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>

        <FeedSidebar />
      </div>
    </AppContainer>
  );
}
