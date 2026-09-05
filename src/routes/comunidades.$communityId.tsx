import { type FormEvent, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { communitiesApi, feedApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { CommunityBackLink } from "@/components/community/detail/community-back-link";
import { CommunityComposer } from "@/components/community/detail/community-composer";
import { CommunityFeed } from "@/components/community/detail/community-feed";
import { CommunityHeader } from "@/components/community/detail/community-header";
import { CommunityMembers } from "@/components/community/detail/community-members";
import { EditCommunityForm } from "@/components/community/detail/edit-community-form";

export const Route = createFileRoute("/comunidades/$communityId")({
  beforeLoad: requireAuth,
  loader: async ({ params }) => {
    try {
      return await communitiesApi.get(params.communityId);
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.name ?? texts.communities.detail.seoFallback} · ${texts.brand.name}`,
      },
    ],
  }),
  component: CommunityDetailRoute,
});

function CommunityDetailRoute() {
  const queryClient = useQueryClient();
  const community = Route.useLoaderData();
  const { user: currentUser } = useAuth();
  const [draft, setDraft] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const { data: live } = useQuery({
    queryKey: ["community", community.id],
    queryFn: () => communitiesApi.get(community.id),
    initialData: community,
  });

  const { data: membersData } = useQuery({
    queryKey: ["community", community.id, "members"],
    queryFn: () => communitiesApi.getMembers(community.id),
  });

  const { data: feedData } = useQuery({
    queryKey: ["community", community.id, "feed"],
    queryFn: () => communitiesApi.getFeed(community.id),
  });

  const members = membersData?.items ?? [];
  const posts = feedData?.items ?? [];
  const admins = members.filter((member) => member.role === "ADMIN");
  const isAdmin = Boolean(currentUser && admins.some((admin) => admin.userId === currentUser.id));
  const isMember = live.joined;

  const invalidateCommunity = () =>
    queryClient.invalidateQueries({ queryKey: ["community", community.id] });

  const join = useMutation({
    mutationFn: () => communitiesApi.join(community.id),
    onSuccess: invalidateCommunity,
  });

  const leave = useMutation({
    mutationFn: () => communitiesApi.leave(community.id),
    onSuccess: invalidateCommunity,
  });

  const createPost = useMutation({
    mutationFn: (content: string) =>
      feedApi.create({ type: "INSIGHT", content, communityId: community.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id, "feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setDraft("");
    },
  });

  const handlePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (content) createPost.mutate(content);
  };

  const membershipAction = isMember
    ? {
        label: texts.communities.participating,
        variant: "secondary" as const,
        run: () => leave.mutate(),
      }
    : {
        label: texts.communities.enter,
        variant: "default" as const,
        run: () => join.mutate(),
      };
  const emptyFeedText = isMember
    ? texts.communities.detail.emptyMember
    : texts.communities.detail.emptyGuest;

  return (
    <AppContainer>
      <div className="space-y-6">
        <CommunityBackLink />

        <CommunityHeader
          community={live}
          admins={admins}
          isAdmin={isAdmin}
          editOpen={editOpen}
          editForm={<EditCommunityForm community={live} onClose={() => setEditOpen(false)} />}
          membershipLabel={membershipAction.label}
          membershipVariant={membershipAction.variant}
          membershipPending={join.isPending || leave.isPending}
          onEditOpenChange={setEditOpen}
          onMembership={membershipAction.run}
        />

        {isMember && (
          <CommunityComposer
            draft={draft}
            pending={createPost.isPending}
            onDraftChange={setDraft}
            onSubmit={handlePost}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <CommunityFeed posts={posts} emptyText={emptyFeedText} />
          <CommunityMembers members={members} />
        </div>
      </div>
    </AppContainer>
  );
}
