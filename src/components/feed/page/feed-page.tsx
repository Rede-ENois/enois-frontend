import { useAuth } from "@/lib/use-auth";

import { AppContainer } from "@/components/app-container";
import { FeedComposer } from "../composer/feed-composer";
import { FeedSidebar } from "../sidebar/feed-sidebar";
import { FeedTabs } from "../feed-tabs";
import { FeedTimeline } from "../feed-timeline";
import { useFeedComposer } from "./use-feed-composer";
import { useFeedPageData } from "./use-feed-page-data";

export function FeedPage() {
  const { user: profileUser } = useAuth();
  const composer = useFeedComposer();
  const data = useFeedPageData();

  return (
    <AppContainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <FeedComposer
            profile={profileUser}
            draft={composer.draft}
            postType={composer.postType}
            media={composer.media}
            publishError={composer.publishError}
            isUploading={composer.isUploading}
            uploadProgress={composer.uploadProgress}
            isPublishing={composer.isPublishing}
            onSubmit={composer.publish}
            onDraftChange={composer.setDraft}
            onPostTypeChange={composer.setPostType}
            onMediaSelect={composer.addMedia}
            onRemoveMedia={composer.removeMedia}
          />
          <FeedTabs activeTab={data.tab} onChange={data.setTab} />
          <FeedTimeline posts={data.posts} loading={data.feedLoading} />
        </div>
        <FeedSidebar
          profile={profileUser}
          suggestions={data.suggestions}
          events={data.events}
          onConnect={data.connectSuggestion}
        />
      </div>
    </AppContainer>
  );
}
