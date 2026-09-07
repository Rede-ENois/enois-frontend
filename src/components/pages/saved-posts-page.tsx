import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { ArrowLeft, Bookmark } from "lucide-react";

import { listSavedPosts } from "@/lib/api/feed/list-saved-posts";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";

export function SavedPosts() {
  const { data: savedData } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => listSavedPosts(),
  });
  const savedPosts = savedData?.items ?? [];

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Link
              to="/feed"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /><>{texts.saved.back}</>
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">{texts.saved.title}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{texts.saved.count(savedPosts.length)}</p>
        </div>

        {savedPosts.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <Bookmark className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{texts.saved.empty}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppContainer>
  );
}
