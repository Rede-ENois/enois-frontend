import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { Loader2, Plus, Users } from "lucide-react";

import { communitiesApi } from "@/lib/api";
import type { Community } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";
import { mergeUniquePage } from "@/utils/collections";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { AppContainer } from "@/components/app-container";

const TOPICS = [
  "TECNOLOGIA",
  "ENGENHARIA",
  "DESIGN",
  "PRODUTO",
  "LIDERANCA",
  "CARREIRA",
  "FREELANCE",
] as const;

type Topic = (typeof TOPICS)[number];

export const Route = createFileRoute("/comunidades")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.communities.seoTitle }] }),
  component: Comunidades,
});

function Comunidades() {
  const queryClient = useQueryClient();
  const matchRoute = useMatchRoute();
  const [topic, setTopic] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [allItems, setAllItems] = useState<Community[]>([]);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const isDetail = Boolean(matchRoute({ to: "/comunidades/$communityId" }));

  const { data: communitiesData, isFetching } = useQuery({
    queryKey: ["communities", topic, cursor],
    queryFn: () => communitiesApi.list(topic, cursor),
    enabled: !isDetail,
  });

  const nextCursor = communitiesData?.nextCursor ?? null;

  useEffect(() => {
    const page = communitiesData?.items;
    if (!page) return;
    setAllItems((current) =>
      mergeUniquePage(current, page, !cursorRef.current, (community) => community.id),
    );
  }, [communitiesData]);

  const handleTopicChange = (nextTopic?: Topic) => {
    setTopic(nextTopic);
    setCursor(undefined);
    setAllItems([]);
  };

  const join = useMutation({
    mutationFn: (id: string) => communitiesApi.join(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });

  const leave = useMutation({
    mutationFn: (id: string) => communitiesApi.leave(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });

  if (isDetail) return <Outlet />;

  const membershipActions = {
    joined: { label: texts.communities.participating, variant: "secondary" as const, run: leave.mutate },
    available: { label: texts.communities.enter, variant: "default" as const, run: join.mutate },
  };

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{texts.communities.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{texts.communities.description}</p>
          </div>
          <CreateCommunityDialog open={open} onOpenChange={setOpen}>
            <Button className="rounded-full gap-1.5">
              <Plus className="h-4 w-4" /> {texts.communities.createCommunity}
            </Button>
          </CreateCommunityDialog>
        </div>

        <div className="flex flex-wrap gap-2">
          <TopicButton active={!topic} onClick={() => handleTopicChange(undefined)}>
            {texts.communities.topics.all}
          </TopicButton>
          {TOPICS.map((value) => (
            <TopicButton
              key={value}
              active={value === topic}
              onClick={() => handleTopicChange(value)}
            >
              {texts.communities.topics[value]}
            </TopicButton>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allItems.map((community) => {
            const action = membershipActions[community.joined ? "joined" : "available"];

            return (
              <Link
                key={community.id}
                to="/comunidades/$communityId"
                params={{ communityId: community.id }}
              >
                <article className="surface-card overflow-hidden cursor-pointer transition hover:shadow-[var(--shadow-card)]">
                  {community.cover ? (
                    <img
                      src={resolveCdnUrl(community.cover)}
                      alt=""
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      {community.avatar && (
                        <img
                          src={resolveCdnUrl(community.avatar)}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-primary">
                          {community.topic}
                        </p>
                        <h3 className="font-semibold truncate">{community.name}</h3>
                      </div>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {community.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {texts.communities.members(community.members ?? 0)}
                      </span>
                      <Button
                        size="sm"
                        variant={action.variant}
                        className="rounded-full"
                        disabled={join.isPending || leave.isPending}
                        onClick={(event) => {
                          event.preventDefault();
                          action.run(community.id);
                        }}
                      >
                        {action.label}
                      </Button>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {nextCursor && (
          <div className="flex justify-center pb-8">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                if (!isFetching) setCursor(nextCursor);
              }}
              disabled={isFetching}
            >
              {isFetching ? (
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

function TopicButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function CreateCommunityDialog({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState<Topic>("TECNOLOGIA");

  const create = useMutation({
    mutationFn: () => communitiesApi.create({ name, description, topic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      onOpenChange(false);
      setName("");
      setDescription("");
      setTopic("TECNOLOGIA");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.communities.create.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{texts.communities.create.name}</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 border-transparent bg-muted"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {texts.communities.create.description}
            </Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="h-10 border-transparent bg-muted"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{texts.communities.create.topic}</Label>
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value as Topic)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-transparent bg-muted"
            >
              {TOPICS.map((value) => (
                <option key={value} value={value}>
                  {texts.communities.topics[value]}
                </option>
              ))}
            </select>
          </div>
          <Button
            className="w-full rounded-full"
            disabled={!name.trim() || !description.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? texts.common.creating : texts.common.create}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
