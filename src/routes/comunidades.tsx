import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { COMMUNITY_FAVORITES_KEY } from "@/constants/community-favorites";
import { TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import type { Community } from "@/types/application/community/community";
import type { CommunityTopic } from "@/types/application/community/community-topic";
import type { CreateCommunityDialogProps } from "@/types/routes/communities/create-community-dialog-props";
import { CommunityCardSkeletons } from "@rede-enois/design-system/domain";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Input,
  Label,
  PageHeader,
  Pill,
  PillRow,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import { Loader2, Plus, Search, Star, Users } from "lucide-react";

import { communitiesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { litePageSize } from "@/lib/lite-mode";
import { useAuth, useIsAuthenticated } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

import { AppContainer } from "@/components/app-container";
import { CommunityCard } from "@/components/community-card";
import { SaciSpot } from "@/components/events/saci-spot";

export const Route = createFileRoute("/comunidades")({
  head: () => ({ meta: [{ title: texts.communities.seoTitle }] }),
  component: Comunidades,
});

/** Tamanho que o catálogo sempre usou; em modo lite cada página vem maior. */
const COMMUNITIES_PAGE_SIZE = 20;

function Comunidades() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const matchRoute = useMatchRoute();
  const isAuthenticated = useIsAuthenticated();
  const lite = useLiteMode();
  const { requireAuth: needsLogin } = useAuth();
  const [topic, setTopic] = useState<CommunityTopic | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<Community | null>(null);
  const [ownerBlockedId, setOwnerBlockedId] = useState<string | null>(null);
  const isDetail = matchRoute({ to: "/comunidades/$communityId" });

  // A busca é do servidor (nome/descrição em todas as páginas), com 300 ms de debounce para
  // não disparar uma requisição por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Pagina por cursor com `useInfiniteQuery`: todas as páginas carregadas ficam sob a mesma
  // chave, então invalidar ["communities"] (entrar/sair) rebusca todas elas, não só a última.
  const {
    data: communitiesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: communitiesLoading,
  } = useInfiniteQuery({
    queryKey: ["communities", topic, query],
    queryFn: ({ pageParam }) =>
      communitiesApi.list(
        topic,
        pageParam,
        litePageSize(COMMUNITIES_PAGE_SIZE, lite),
        query || undefined,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !isDetail,
  });

  // Favoritas têm seção própria no início da página; a lista principal não repete
  // nenhuma delas (remover o favorito devolve o card para o fluxo comum). Só pedem sessão:
  // visitante vê a lista pública sem 401 no console.
  const { data: favoritesData } = useQuery({
    queryKey: COMMUNITY_FAVORITES_KEY,
    queryFn: () => communitiesApi.favorites(),
    enabled: !isDetail && isAuthenticated,
  });

  // As comunidades em que a pessoa já está vêm ANTES de tudo (pedido de quem usa: as primeiras
  // exibidas são as nossas). Mesmo padrão das favoritas: seção fixa e fora do fluxo comum.
  const { data: mineData } = useQuery({
    queryKey: ["my-communities"],
    queryFn: () => communitiesApi.mine(50),
    enabled: !isDetail && isAuthenticated,
  });

  // Um item pode reaparecer na página seguinte se a lista mudar entre as buscas; fica o primeiro.
  const byId = new Map<string, Community>();
  for (const page of communitiesData?.pages ?? []) {
    for (const c of page.items) if (!byId.has(c.id)) byId.set(c.id, c);
  }
  const allItems = [...byId.values()];
  const matchesSearch = (community: Community) => {
    if (!query) return true;
    const needle = query.toLocaleLowerCase("pt-BR");
    return (
      community.name.toLocaleLowerCase("pt-BR").includes(needle) ||
      (community.description ?? "").toLocaleLowerCase("pt-BR").includes(needle)
    );
  };
  // Com um tópico ativo, as seções fixas mostram só o daquele tópico.
  const pinnedFavorites = (favoritesData?.items ?? [])
    .filter((c) => (!topic || c.topic === topic) && matchesSearch(c))
    .map((c) => byId.get(c.id) ?? c);
  // Aqui vale o item de /mine: ele é a fonte da participação e não depende da lista paginada
  // já ter sido rebuscada depois de entrar/sair.
  const mineItems = (mineData?.items ?? []).filter(
    (c) => (!topic || c.topic === topic) && matchesSearch(c),
  );
  const pinnedIds = new Set([...mineItems, ...pinnedFavorites].map((c) => c.id));
  const gridItems = allItems.filter((c) => !pinnedIds.has(c.id));

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const handleTopicChange = (t: (typeof TOPICS)[number]) => {
    setTopic(t === "Todas" ? undefined : t);
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
        <PageHeader
          title={texts.communities.title}
          description={texts.communities.description}
          actions={
            <>
              <CreateCommunityDialog
                open={open}
                onOpenChange={(o) => {
                  // Visitante nao abre o formulario: manda para o login.
                  if (o && !needsLogin()) return;
                  setOpen(o);
                }}
              >
                <Button className="rounded-full gap-1.5">
                  <Plus className="h-4 w-4" />

                  <>{texts.communities.createCommunity}</>
                </Button>
              </CreateCommunityDialog>

              <SaciSpot spot="comunidades" />
            </>
          }
        />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {/* Sem `maxLength`: o contador que ele acende abaixo do campo cresce este container e
              desloca a lupa (`top-1/2` passa a centrar no conjunto, não no input). */}
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={texts.communities.searchPlaceholder}
            className="pl-9"
            aria-label={texts.communities.searchPlaceholder}
          />
        </div>

        <PillRow label={texts.communities.topicsLabel}>
          {TOPICS.map((t) => (
            <Pill
              key={t}
              active={(t === "Todas" && !topic) || t === topic}
              onClick={() => handleTopicChange(t)}
            >
              {TOPIC_LABELS[t]}
            </Pill>
          ))}
        </PillRow>

        {mineItems.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-text-strong">
              <Users className="h-4 w-4 text-primary" />

              <>{texts.communities.mineTitle}</>
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mineItems.map((c) => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  joinPending={join.isPending}
                  leavePending={leave.isPending}
                  ownerBlocked={ownerBlockedId === c.id}
                  onJoin={(id) => {
                    if (needsLogin()) join.mutate(id);
                  }}
                  onLeave={setLeaveTarget}
                />
              ))}
            </div>
          </section>
        )}

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
                  onJoin={(id) => {
                    if (needsLogin()) join.mutate(id);
                  }}
                  onLeave={setLeaveTarget}
                />
              ))}
            </div>
          </section>
        )}

        {/* Esqueleto na primeira carga: antes a área ficava em branco até a lista chegar, e parecia
            que não existia comunidade nenhuma. */}
        {communitiesLoading && <CommunityCardSkeletons />}

        {!communitiesLoading && allItems.length === 0 && (
          <EmptyState title={texts.communities.empty} />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((c) => (
            <CommunityCard
              key={c.id}
              community={c}
              joinPending={join.isPending}
              leavePending={leave.isPending}
              ownerBlocked={ownerBlockedId === c.id}
              onJoin={(id) => {
                if (needsLogin()) join.mutate(id);
              }}
              onLeave={setLeaveTarget}
            />
          ))}
        </div>

        {hasNextPage && (
          <div className="flex justify-center pb-8">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={loadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
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
    mutationFn: () =>
      communitiesApi.create({ name, description: description.trim() || null, topic }),
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
            disabled={!name.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? texts.common.creating : texts.common.create}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
