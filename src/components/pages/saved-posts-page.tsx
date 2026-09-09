import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { useSavedPostsPageController } from "@/utils/components/feed/use-saved-posts-page-controller";
import { ArrowLeft, Bookmark } from "lucide-react";

import { AppContainer } from "@/components/layout/app-container";
import { PostCardProvider } from "@/components/post-card-provider";

export function SavedPosts() {
  const { savedPosts, countLabel, showEmptyState } = useSavedPostsPageController();

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Link
              to="/feed"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />

              <>{texts.saved.back}</>
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />

            <h1 className="text-2xl font-semibold tracking-tight">{texts.saved.title}</h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">{countLabel}</p>
        </div>

        {showEmptyState ? (
          <div className="surface-card p-8 text-center">
            <Bookmark className="mx-auto h-8 w-8 text-muted-foreground" />

            <p className="mt-3 text-sm text-muted-foreground">{texts.saved.empty}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <PostCardProvider key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppContainer>
  );
}
