import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft } from "lucide-react";

import { useCommunityDetailPageController } from "@/utils/components/communities/use-community-detail-page-controller";

import { AppContainer } from "@/components/app-container";
import { CommunityComposer } from "@/components/community-composer";
import { CommunityHeader } from "@/components/community-header";
import { CommunityMembers } from "@/components/community-members";
import { PostCard } from "@/components/post-card";

export function CommunityDetail() {
  const { community, members, posts, showComposer, showEmptyState, emptyMessage } =
    useCommunityDetailPageController();

  return (
    <AppContainer>
      <div className="space-y-6">
        <Link
          to="/comunidades"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.communities.title}</>
        </Link>

        <CommunityHeader community={community} members={members} />

        {showComposer && <CommunityComposer communityId={community.id} />}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{texts.communities.detail.feed}</h2>
            {showEmptyState ? (
              <p className="surface-card p-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>

          <CommunityMembers members={members} />
        </div>
      </div>
    </AppContainer>
  );
}
