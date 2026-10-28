import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ConversationListSkeletons, UserAvatar } from "@rede-enois/design-system/domain";
import { Button, ConfirmDialog, Input, useToast } from "@rede-enois/design-system/ui";
import { Search } from "lucide-react";

import { messagesApi, networkApi } from "@/lib/api";
import { conversationErrorMessage } from "@/lib/conversation-error";
import { useCurrentUser } from "@/lib/current-user";
import { liteInterval, litePageSize } from "@/lib/lite-mode";
import { requireAuth } from "@/lib/require-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

import { AppContainer } from "@/components/app-container";
import { SaciSpot } from "@/components/events/saci-spot";
import { ConversationItem } from "@/components/messages/conversation-item";
import { ConversationThread } from "@/components/messages/conversation-thread";

export const Route = createFileRoute("/mensagens")({
  beforeLoad: requireAuth,
  // Permite abrir direto numa conversa (ex.: botao "Mensagem" do perfil passa o id).
  validateSearch: (search: Record<string, unknown>): { conversation?: string } => ({
    conversation: typeof search.conversation === "string" ? search.conversation : undefined,
  }),
  head: () => ({ meta: [{ title: texts.messages.seoTitle }] }),
  component: Mensagens,
});

/** Tamanho que o app sempre usou; em modo lite cada página vem maior (menos idas ao servidor). */
const CONVERSATIONS_PAGE_SIZE = 20;

function Mensagens() {
  const { conversation } = Route.useSearch();
  const lite = useLiteMode();
  // Inscrito na query do /me: quando a resposta chega, a tela redesenha com o id certo (sem
  // isso, a busca de "outro participante" ficava com o id de quem esta olhando).
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [inboxTab, setInboxTab] = useState<"all" | "jobs" | "services" | "people" | "archived">(
    "all",
  );
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Veio de um link/perfil com uma conversa: abre ela direto.
  useEffect(() => {
    if (conversation) setActiveId(conversation);
  }, [conversation]);

  // Paginado por cursor: a primeira pagina so traz as mais recentes — sem carregar as anteriores
  // (muitas vindas de vaga) as conversas/mensagens antigas ficavam inalcancaveis.
  const {
    data: conversationsData,
    fetchNextPage: fetchMoreConversations,
    hasNextPage: hasMoreConversations,
    isFetchingNextPage: isLoadingMoreConversations,
    isLoading: isLoadingConversations,
  } = useInfiniteQuery({
    queryKey: ["conversations", inboxTab === "archived" ? "archived" : "inbox"],
    queryFn: ({ pageParam }) =>
      inboxTab === "archived"
        ? messagesApi.archivedConversations(pageParam, litePageSize(CONVERSATIONS_PAGE_SIZE, lite))
        : messagesApi.listConversations(pageParam, litePageSize(CONVERSATIONS_PAGE_SIZE, lite)),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: liteInterval(15_000, lite),
  });

  // O servidor ordena por updatedAt; reforçamos no cliente pelo horário da última mensagem —
  // é isso que a pessoa enxerga na lista ("quem falou por último fica no topo").
  const conversations = [...(conversationsData?.pages.flatMap((page) => page.items) ?? [])].sort(
    (a, b) => (b.time ? Date.parse(b.time) : 0) - (a.time ? Date.parse(a.time) : 0),
  );
  // Separa a caixa de entrada: vagas (candidatura), serviços (contratação) e pessoas.
  // Arquivadas não separa por tipo: é a lista de quem foi apagado "para mim", e ali a pessoa quer
  // reencontrar o que sumiu, não filtrar.
  const visibleConversations = conversations.filter((c) =>
    inboxTab === "archived" || inboxTab === "all"
      ? true
      : inboxTab === "jobs"
        ? c.kind === "JOB"
        : inboxTab === "services"
          ? c.kind === "SERVICE"
          : c.kind !== "JOB" && c.kind !== "SERVICE",
  );
  const activeConversation = activeId ? conversations.find((c) => c.id === activeId) : null;

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => networkApi.list(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const filteredUsers = (searchResults?.items ?? []).filter((u) => u.id !== currentUserId);

  const createConversation = useMutation({
    mutationFn: (participantId: string) =>
      messagesApi.createConversation({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conv) => {
      setActiveId(conv.id);
      setShowSearch(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err) => toast(conversationErrorMessage(err), "error"),
  });

  const restoreSelected = useMutation({
    mutationFn: () => messagesApi.unhideConversations(Array.from(selected)),
    onSuccess: () => {
      setSelected(new Set());
      setSelecting(false);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast(texts.messages.restored);
    },
    onError: () => toast(texts.messages.restoreError, "error"),
  });

  const hideSelected = useMutation({
    mutationFn: () => messagesApi.hideConversations(Array.from(selected)),
    onSuccess: () => {
      setConfirmDelete(false);
      setSelecting(false);
      setSelected(new Set());
      toast(texts.messages.deleted);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast(texts.communities.actionError, "error"),
  });

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const markAsRead = useMutation({
    mutationFn: (conversationId: string) => messagesApi.markAsRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });

  return (
    <AppContainer>
      {/* `dvh` nos dois tamanhos: `100vh` no desktop é o valor que não encolhe quando a barra
          do navegador aparece no celular, e aí o compositor ficava escondido atrás do teclado. */}
      <div className="-my-4 grid h-[calc(100dvh-3.5rem)] grid-cols-1 overflow-hidden overscroll-none sm:-my-6 sm:h-[calc(100dvh-4rem)] md:my-0 md:h-[calc(100dvh-7rem)] md:grid-cols-[320px_minmax(0,1fr)] md:rounded-2xl md:border md:border-border-soft md:bg-surface-card md:shadow-card">
        <div
          className={`flex min-h-0 flex-col border-r border-border ${activeConversation ? "hidden md:flex" : "flex"}`}
        >
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold">{texts.messages.title}</h1>

              <div className="flex gap-2">
                {!selecting && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setSelecting(true)}
                  >
                    {texts.messages.selectMode}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  {showSearch ? texts.messages.back : texts.messages.new}
                </Button>

                <SaciSpot spot="mensagens" />
              </div>
            </div>
            {showSearch ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={texts.messages.searchContacts}
                    className="h-9 rounded-full bg-muted pl-9"
                    autoFocus
                  />
                </div>
                {searchQuery && (
                  <div className="space-y-1">
                    {filteredUsers.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        {texts.messages.noContact}
                      </p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => createConversation.mutate(u.id)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted"
                        >
                          <UserAvatar src={u.avatar} alt={u.name} className="h-10 w-10" />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{u.name}</p>

                            <p className="truncate text-xs text-muted-foreground">{u.headline}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={texts.messages.searchConversations}
                  className="h-9 rounded-full bg-muted pl-9"
                />
              </div>
            )}
          </div>

          {/* `flex-wrap`: com cinco abas o rótulo maior ("Arquivadas") estoura a coluna no celular. */}
          <div className="flex flex-wrap gap-1 border-b border-border px-3 pb-2 pt-2">
            {(["all", "jobs", "services", "people", "archived"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setInboxTab(tab)}
                className={`rounded-full px-3 py-1 text-xs font-normal transition ${
                  inboxTab === tab
                    ? "bg-primary-soft text-primary"
                    : "text-text-subtle hover:bg-surface-2"
                }`}
              >
                {texts.messages.tabs[tab]}
              </button>
            ))}
          </div>

          {selecting && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
              <button
                type="button"
                className="text-xs font-normal text-primary hover:underline"
                onClick={() =>
                  setSelected(
                    selected.size === visibleConversations.length
                      ? new Set()
                      : new Set(visibleConversations.map((c) => c.id)),
                  )
                }
              >
                {selected.size === visibleConversations.length
                  ? texts.messages.clearSelection
                  : texts.messages.selectAll}
              </button>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setSelecting(false);
                    setSelected(new Set());
                  }}
                >
                  {texts.messages.cancelSelection}
                </Button>

                {inboxTab === "archived" ? (
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={selected.size === 0 || restoreSelected.isPending}
                    onClick={() => restoreSelected.mutate()}
                  >
                    {texts.messages.restoreSelected(selected.size)}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full"
                    disabled={selected.size === 0 || hideSelected.isPending}
                    onClick={() => setConfirmDelete(true)}
                  >
                    {texts.messages.deleteSelected(selected.size)}
                  </Button>
                )}
              </div>
            </div>
          )}

          <ul className="flex-1 overflow-y-auto overscroll-contain">
            {isLoadingConversations ? (
              <li>
                <ConversationListSkeletons />
              </li>
            ) : visibleConversations.length === 0 ? (
              <li className="p-4 text-center text-sm text-muted-foreground">
                {inboxTab === "archived"
                  ? texts.messages.noArchived
                  : texts.messages.noConversations}
              </li>
            ) : (
              visibleConversations.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  isActive={c.id === (activeConversation?.id ?? "")}
                  selecting={selecting}
                  selected={selected.has(c.id)}
                  onToggle={() => toggleSelected(c.id)}
                  onSelect={() => {
                    if (selecting) {
                      toggleSelected(c.id);
                      return;
                    }
                    setActiveId(c.id);
                    if (c.unread > 0) markAsRead.mutate(c.id);
                  }}
                />
              ))
            )}

            {hasMoreConversations && (
              <li className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-full text-xs"
                  disabled={isLoadingMoreConversations}
                  onClick={() => fetchMoreConversations()}
                >
                  {isLoadingMoreConversations
                    ? texts.messages.loadingOlder
                    : texts.messages.loadMoreConversations}
                </Button>
              </li>
            )}
          </ul>
        </div>

        <div
          className={`flex min-h-0 min-w-0 flex-col ${!activeConversation ? "hidden md:flex" : "flex"}`}
        >
          {!activeConversation ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">{texts.messages.selectConversation}</p>
            </div>
          ) : (
            <ConversationThread
              conversation={activeConversation}
              currentUserId={currentUserId}
              onBack={() => setActiveId(null)}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={texts.messages.deleteTitle}
        description={texts.messages.deleteDescription}
        confirmLabel={texts.messages.deleteConfirm}
        destructive
        pending={hideSelected.isPending}
        onConfirm={() => hideSelected.mutate()}
      />
    </AppContainer>
  );
}
