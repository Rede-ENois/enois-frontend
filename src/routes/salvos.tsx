import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft, Bookmark } from "lucide-react";

import { feedApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { EmptyState } from "@/components/ui/empty-state";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";

export const Route = createFileRoute("/salvos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: buildPageShareTags({ title: texts.saved.seoTitle, path: "/salvos" }) }),
  component: SavedPosts,
});

function SavedPosts() {
  const { data: savedData } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => feedApi.listSaved(),
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
              <ArrowLeft className="h-4 w-4" />

              <>{texts.saved.back}</>
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />

            <h1 className="text-2xl font-semibold tracking-tight">{texts.saved.title}</h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {texts.saved.count(savedPosts.length)}
          </p>
        </div>

        {savedPosts.length === 0 ? (
          <div className="surface-card">
            <EmptyState icon={Bookmark} title={texts.saved.empty} />
          </div>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </AppContainer>
  );
}
