import { type FormEvent, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { communityApi, feedApi } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { CommunityBackLink } from "@/components/community/detail/community-back-link";
import { CommunityComposer } from "@/components/community/detail/community-composer";
import { EditCommunityForm } from "@/components/community/detail/edit/edit-community-form";
import { CommunityFeed } from "@/components/community/detail/community-feed";
import { CommunityHeader } from "@/components/community/detail/community-header";
import { CommunityMembers } from "@/components/community/detail/community-members";

export const Route = createFileRoute("/comunidades/$communityId")({
  beforeLoad: requireAuth,
  loader: async ({ params }) => {
    try {
      return await communityApi.getById(params.communityId);
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? texts.communities.detail.seoFallback} · ${texts.brand.name}` }],
  }),
  component: CommunityDetailPage,
});

function CommunityDetailPage() {
  const queryClient = useQueryClient();
  const initialCommunity = Route.useLoaderData();
  const { user: currentUser } = useAuth();
  const [postContent, setPostContent] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: liveCommunity } = useQuery({
    queryKey: ["community", initialCommunity.id],
    queryFn: () => communityApi.getById(initialCommunity.id),
    initialData: initialCommunity,
  });
  const { data: membersData } = useQuery({
    queryKey: ["community", initialCommunity.id, "members"],
    queryFn: () => communityApi.listMembers(initialCommunity.id),
  });
  const { data: feedData } = useQuery({
    queryKey: ["community", initialCommunity.id, "feed"],
    queryFn: () => communityApi.listFeed(initialCommunity.id),
  });

  const members = membersData?.items ?? [];
  const posts = feedData?.items ?? [];
  const admins = members.filter((member) => member.role === "ADMIN");
  const isAdmin = Boolean(currentUser && admins.some((admin) => admin.userId === currentUser.id));
  const isMember = liveCommunity.joined;
  const invalidateCommunity = () =>
    queryClient.invalidateQueries({ queryKey: ["community", initialCommunity.id] });

  const joinCommunityMutation = useMutation({
    mutationFn: () => communityApi.join(initialCommunity.id),
    onSuccess: invalidateCommunity,
  });
  const leaveCommunityMutation = useMutation({
    mutationFn: () => communityApi.leave(initialCommunity.id),
    onSuccess: invalidateCommunity,
  });
  const createPostMutation = useMutation({
    mutationFn: (content: string) =>
      feedApi.create({ type: "INSIGHT", content, communityId: initialCommunity.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", initialCommunity.id, "feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setPostContent("");
    },
  });

  const handlePostSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = postContent.trim();
    if (content) createPostMutation.mutate(content);
  };

  const membershipAction = isMember
    ? {
        label: texts.communities.participating,
        variant: "secondary" as const,
        run: () => leaveCommunityMutation.mutate(),
      }
    : {
        label: texts.communities.enter,
        variant: "default" as const,
        run: () => joinCommunityMutation.mutate(),
      };
  const emptyFeedText = isMember
    ? texts.communities.detail.emptyMember
    : texts.communities.detail.emptyGuest;
  const isMembershipPending =
    joinCommunityMutation.isPending || leaveCommunityMutation.isPending;

  return (
    <AppContainer>
      <div className="space-y-6">
        <CommunityBackLink />
        <CommunityHeader
          community={liveCommunity}
          admins={admins}
          isAdmin={isAdmin}
          isEditOpen={isEditOpen}
          editForm={
            <EditCommunityForm community={liveCommunity} onClose={() => setIsEditOpen(false)} />
          }
          membershipLabel={membershipAction.label}
          membershipVariant={membershipAction.variant}
          isMembershipPending={isMembershipPending}
          onEditOpenChange={setIsEditOpen}
          onMembership={membershipAction.run}
        />
        {isMember && (
          <CommunityComposer
            content={postContent}
            isPending={createPostMutation.isPending}
            onContentChange={setPostContent}
            onSubmit={handlePostSubmit}
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
