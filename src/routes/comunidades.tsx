import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { Community } from "@/types/application/community/community";
import type { CommunityTopic } from "@/types/application/community/community-topic";
import type { CreateCommunityDialogProps } from "@/types/routes/communities/create-community-dialog-props";
import { Loader2, Plus, Star, Users } from "lucide-react";

import { communitiesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill } from "@/components/ui/pill";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";
import { CommunityCard } from "@/components/community-card";
import { COMMUNITY_FAVORITES_KEY } from "@/components/community-favorite-button";

const TOPICS = [
  "Todas",
  "TECNOLOGIA",
  "ENGENHARIA",
  "DESIGN",
  "PRODUTO",
  "LIDERANCA",
  "CARREIRA",
  "FREELANCE",
] as const;

const TOPIC_LABELS: Record<(typeof TOPICS)[number], string> = {
  Todas: texts.communities.topics.all,
  TECNOLOGIA: texts.communities.topics.TECNOLOGIA,
  ENGENHARIA: texts.communities.topics.ENGENHARIA,
  DESIGN: texts.communities.topics.DESIGN,
  PRODUTO: texts.communities.topics.PRODUTO,
  LIDERANCA: texts.communities.topics.LIDERANCA,
  CARREIRA: texts.communities.topics.CARREIRA,
  FREELANCE: texts.communities.topics.FREELANCE,
};

export const Route = createFileRoute("/comunidades")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: buildPageShareTags({ title: texts.communities.seoTitle, path: "/comunidades" }),
  }),
  component: Comunidades,
});

function Comunidades() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const matchRoute = useMatchRoute();
  const [topic, setTopic] = useState<CommunityTopic | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allItems, setAllItems] = useState<Community[]>([]);
  const [leaveTarget, setLeaveTarget] = useState<Community | null>(null);
  const [ownerBlockedId, setOwnerBlockedId] = useState<string | null>(null);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const isDetail = matchRoute({ to: "/comunidades/$communityId" });

  const { data: communitiesData, isFetching } = useQuery({
    queryKey: ["communities", topic, cursor],
    queryFn: () => communitiesApi.list(topic, cursor),
    enabled: !isDetail,
  });

  const nextCursor = communitiesData?.nextCursor ?? null;

  // Favoritas têm seção própria no início da página; a lista principal não repete
  // nenhuma delas (remover o favorito devolve o card para o fluxo comum).
  const { data: favoritesData } = useQuery({
    queryKey: COMMUNITY_FAVORITES_KEY,
    queryFn: () => communitiesApi.favorites(),
    enabled: !isDetail,
  });

  useEffect(() => {
    if (!communitiesData?.items) return;
    setAllItems((prev) => {
      if (cursorRef.current) {
        const existing = new Set(prev.map((c) => c.id));
        const newItems = communitiesData.items.filter((c) => !existing.has(c.id));
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      }
      return communitiesData.items;
    });
  }, [communitiesData]);

  const byId = new Map(allItems.map((c) => [c.id, c]));
  // Com um tópico ativo, a seção mostra só as favoritas daquele tópico.
  const pinnedFavorites = (favoritesData?.items ?? [])
    .filter((c) => !topic || c.topic === topic)
    .map((c) => byId.get(c.id) ?? c);
  const favoriteIds = new Set(pinnedFavorites.map((c) => c.id));
  const gridItems = allItems.filter((c) => !favoriteIds.has(c.id));

  const loadMore = () => {
    if (nextCursor && !isFetching) {
      setCursor(nextCursor);
    }
  };

  const handleTopicChange = (t: (typeof TOPICS)[number]) => {
    setTopic(t === "Todas" ? undefined : t);
    setCursor(undefined);
    setAllItems([]);
  };

  const join = useMutation({
    mutationFn: (id: string) => communitiesApi.join(id),
    onSuccess: () => {
      toast(texts.communities.joined);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
    },
    onError: () => toast(texts.communities.actionError, "error"),
  });

  const leave = useMutation({
    mutationFn: (id: string) => communitiesApi.leave(id),
    onSuccess: () => {
      setLeaveTarget(null);
      toast(texts.communities.left);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
    },
    onError: () => {
      // Dono não sai sem transferir: orientamos a abrir a comunidade para transferir.
      toast(texts.communities.actionError, "error");
      setLeaveTarget(null);
      setOwnerBlockedId(leaveTarget?.id ?? null);
    },
  });

  if (isDetail) {
    return <Outlet />;
  }

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
              <Plus className="h-4 w-4" />

              <>{texts.communities.createCommunity}</>
            </Button>
          </CreateCommunityDialog>
        </div>

        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <Pill
              key={t}
              active={(t === "Todas" && !topic) || t === topic}
              onClick={() => handleTopicChange(t)}
            >
              {TOPIC_LABELS[t]}
            </Pill>
          ))}
        </div>

        {pinnedFavorites.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-text-strong">
              <Star className="h-4 w-4 text-primary" />

              <>{texts.communities.favoritesTitle}</>
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pinnedFavorites.map((c) => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  joinPending={join.isPending}
                  leavePending={leave.isPending}
                  ownerBlocked={ownerBlockedId === c.id}
                  onJoin={join.mutate}
                  onLeave={setLeaveTarget}
                />
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((c) => (
            <CommunityCard
              key={c.id}
              community={c}
              joinPending={join.isPending}
              leavePending={leave.isPending}
              ownerBlocked={ownerBlockedId === c.id}
              onJoin={join.mutate}
              onLeave={setLeaveTarget}
            />
          ))}
        </div>

        {nextCursor && (
          <div className="flex justify-center pb-8">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={loadMore}
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

      <ConfirmDialog
        open={leaveTarget !== null}
        onOpenChange={(open) => !open && setLeaveTarget(null)}
        title={texts.communities.leave.title}
        description={leaveTarget ? texts.communities.leave.description(leaveTarget.name) : ""}
        confirmLabel={texts.communities.leave.confirm}
        destructive
        pending={leave.isPending}
        onConfirm={() => leaveTarget && leave.mutate(leaveTarget.id)}
      />
    </AppContainer>
  );
}

function CreateCommunityDialog({ children, open, onOpenChange }: CreateCommunityDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState<CommunityTopic>("TECNOLOGIA");

  const create = useMutation({
    mutationFn: () => communitiesApi.create({ name, description, topic }),
    onSuccess: () => {
      toast(texts.communities.created);
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
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
              onChange={(e) => setName(e.target.value)}
              className="h-10 border-transparent bg-muted"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {texts.communities.create.description}
            </Label>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              // Sem `h-10`: brigava com o `min-h-[60px]` do primitivo e o campo não respeitava
              // as `rows`. Aqui a descrição merece as 3 linhas.
              className="border-transparent bg-muted"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {texts.communities.create.topic}
            </Label>

            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as CommunityTopic)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 border-transparent bg-muted"
            >
              {TOPICS.filter((t) => t !== "Todas").map((t) => (
                <option key={t} value={t}>
                  {TOPIC_LABELS[t]}
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
