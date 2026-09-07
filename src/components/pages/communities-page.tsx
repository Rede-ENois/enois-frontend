import { Outlet, useMatchRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Loader2, Plus } from "lucide-react";

import { useCommunitiesPageController } from "@/utils/components/communities/use-communities-page-controller";

import { Button } from "@/components/ui/button";

import { AppContainer } from "@/components/app-container";
import { CommunityCard } from "@/components/community-card";
import { CreateCommunityDialog } from "@/components/create-community-dialog";

export function Comunidades() {
  const matchRoute = useMatchRoute();
  const isDetail = Boolean(matchRoute({ to: "/comunidades/$communityId" }));
  const communities = useCommunitiesPageController(isDetail);

  if (isDetail) return <Outlet />;

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{texts.communities.title}</h1>

            <p className="mt-1 text-sm text-muted-foreground">{texts.communities.description}</p>
          </div>

          <CreateCommunityDialog>
            <Button className="rounded-full gap-1.5">
              <Plus className="h-4 w-4" />

              <>{texts.communities.createCommunity}</>
            </Button>
          </CreateCommunityDialog>
        </div>

        <div className="flex flex-wrap gap-2">
          {communities.topicOptions.map((option) => (
            <button
              key={option.value}
              onClick={option.select}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                option.selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.communities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              membershipPending={communities.membershipPending}
              onToggleMembership={communities.toggleMembership}
            />
          ))}
        </div>

        {communities.showLoadMore && (
          <div className="flex justify-center pb-8">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={communities.loadMore}
              disabled={communities.loadMoreDisabled}
            >
              {communities.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                texts.communities.loadMore
              )}
            </Button>
          </div>
        )}
      </div>
    </AppContainer>
  );
}
