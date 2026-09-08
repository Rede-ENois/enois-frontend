import { useFeedPageController } from "@/utils/components/feed/use-feed-page-controller";
import { Loader2 } from "lucide-react";

import { AppContainer } from "@/components/app-container";
import { FeedComposerProvider } from "@/components/feed-composer-provider";
import { FeedSidebar } from "@/components/feed-sidebar";
import { FeedTabs } from "@/components/feed-tabs";
import { PostCardProvider } from "@/components/post-card-provider";

export function Home() {
  const { tabsProps, posts, showLoading, showPosts } = useFeedPageController();

  return (
    <AppContainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <FeedComposerProvider />
          <FeedTabs {...tabsProps} />

          <div className="space-y-4">
            {showLoading && (
              <div className="flex items-center justify-center py-8 text-text-subtle">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {showPosts &&
              posts.map((post) => <PostCardProvider key={post.id} post={post} />)}
          </div>
        </div>

        <FeedSidebar />
      </div>
    </AppContainer>
  );
}
