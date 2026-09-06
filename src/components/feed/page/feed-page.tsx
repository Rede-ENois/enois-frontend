import { useAuth } from "@/lib/use-auth";

import { AppContainer } from "@/components/app-container";
import { FeedComposer } from "../composer/feed-composer";
import { FeedSidebar } from "../sidebar/feed-sidebar";
import { FeedTabs } from "../feed-tabs";
import { FeedTimeline } from "../feed-timeline";
import { useFeedComposer } from "./use-feed-composer";
import { useFeedPageState } from "./use-feed-page-state";

export function FeedPage() {
  const { user: currentUser } = useAuth();
  const composerState = useFeedComposer();
  const pageState = useFeedPageState();

  return (
    <AppContainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <FeedComposer
            currentUser={currentUser}
            content={composerState.content}
            postType={composerState.postType}
            mediaItems={composerState.mediaItems}
            publicationError={composerState.publicationError}
            isUploading={composerState.isUploading}
            uploadProgress={composerState.uploadProgress}
            isPublishing={composerState.isPublishing}
            onSubmit={composerState.handlePublish}
            onContentChange={composerState.setContent}
            onPostTypeChange={composerState.setPostType}
            onMediaSelect={composerState.handleAddMedia}
            onRemoveMedia={composerState.handleRemoveMedia}
          />
          <FeedTabs activeTab={pageState.activeTab} onTabChange={pageState.setActiveTab} />
          <FeedTimeline posts={pageState.posts} isLoading={pageState.isFeedLoading} />
        </div>
        <FeedSidebar
          currentUser={currentUser}
          suggestions={pageState.suggestions}
          events={pageState.events}
          onConnectSuggestion={pageState.handleConnectSuggestion}
        />
      </div>
    </AppContainer>
  );
}
