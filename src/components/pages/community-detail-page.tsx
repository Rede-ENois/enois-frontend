import { Link } from "@tanstack/react-router";

import { ArrowLeft } from "lucide-react";

import { useCommunityDetailData } from "@/lib/use-community-detail-data";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { CommunityComposer } from "@/components/community-composer";
import { CommunityHeader } from "@/components/community-header";
import { CommunityMembers } from "@/components/community-members";
import { PostCard } from "@/components/post-card";

export function CommunityDetail() {
  const { community, members, posts } = useCommunityDetailData();

  return (
    <AppContainer>
      <div className="space-y-6">
        <Link
          to="/comunidades"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /><>{texts.communities.title}</>
        </Link>

        <CommunityHeader community={community} members={members} />

        {community.joined && <CommunityComposer communityId={community.id} />}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{texts.communities.detail.feed}</h2>
            {posts.length === 0 ? (
              <p className="surface-card p-8 text-center text-sm text-muted-foreground">
                {community.joined
                  ? texts.communities.detail.emptyMember
                  : texts.communities.detail.emptyGuest}
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
