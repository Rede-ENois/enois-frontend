import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { GAME_GENRES, GAME_STAGES } from "@/constants/game-options";
import { texts } from "@/texts";
import type { GameView } from "@/types/application/games/game-view";
import { ExternalLink, Gamepad2, Pencil, Rocket, Send, Star } from "lucide-react";

import { gamesApi } from "@/lib/api";
import { formatFaisca } from "@/lib/faisca";
import { isAuthenticated } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { AppContainer } from "@/components/app-container";
import { GameIcon } from "@/components/game-icon";
import { GameEditorDialog } from "@/components/games/game-editor-dialog";

export const Route = createFileRoute("/games")({
  head: () => ({ meta: [{ title: "Jogos · Énóis" }] }),
  component: Games,
});

/**
 * /games é a rota-MÃE de /games/$username e /games/$username/$gameSlug. Sem devolver o
 * <Outlet/>, o hub engolia as filhas: clicar num jogo trocava a URL e continuava mostrando a
 * lista — o "não abre o player" relatado. O hub em si mora no GamesHub.
 */
function Games() {
  const matchRoute = useMatchRoute();
  return matchRoute({ to: "/games", fuzzy: false }) ? <GamesHub /> : <Outlet />;
}

/**
 * Agregador de jogos (Parte E do plano): o Énóis NÃO hospeda jogo nenhum — o criador
 * envia o LINK de onde o jogo já está publicado (itch.io, site próprio), a moderação
 * revisa e o jogo roda EMBUTIDO no Énóis, num quadro isolado, com a página do criador
 * em /games/{username}.
 */
function GamesHub() {
  const authenticated = isAuthenticated();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [stage, setStage] = useState("");
  const [order, setOrder] = useState<"recent" | "plays" | "title">("recent");
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<GameView[]>([]);

  // Busca com atraso: sem isso cada tecla dispara uma consulta ao backend.
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setTerm(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Trocar qualquer filtro recomeça a lista (o cursor antigo não vale para outra consulta).
  useEffect(() => {
    setCursor(null);
    setPages([]);
  }, [term, genre, stage, order]);

  const filters = {
    query: term || undefined,
    genre: genre || undefined,
    stage: stage || undefined,
    order,
  };
  const catalog = useQuery({
    queryKey: ["games", "catalog", filters, cursor],
    queryFn: () => gamesApi.catalog({ ...filters, limit: 24, cursor }),
  });

  useEffect(() => {
    if (!catalog.data) return;
    setPages((current) =>
      cursor === null ? catalog.data.items : [...current, ...catalog.data.items],
    );
  }, [catalog.data, cursor]);

  const ratingIds = pages.map((game) => game.id);
  const ratings = useQuery({
    queryKey: ["games", "ratings", ratingIds.join(",")],
    queryFn: () => gamesApi.ratings(ratingIds),
    enabled: ratingIds.length > 0,
    staleTime: 60_000,
  });

  const mine = useQuery({
    queryKey: ["games", "mine"],
    queryFn: () => gamesApi.mine(),
    enabled: authenticated,
  });

  // O jogo que está sendo editado na própria loja: quem publicou tem que poder editar daqui,
  // sem caçar o endereço do painel.
  const [editing, setEditing] = useState<GameView | null>(null);

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Gamepad2 className="h-6 w-6 text-primary" />
              Jogos
            </h1>

            <p className="mt-1 text-sm text-text-subtle">
              Feitos pela comunidade. O Énóis não hospeda: cada jogo roda no lugar onde o criador o
              publicou — aqui só o convite.
            </p>
          </div>

          {authenticated && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                to="/games/painel"
                className="inline-flex h-9 items-center rounded-full border border-border-soft px-3 text-sm font-medium transition hover:bg-muted"
              >
                {texts.games.panel.title}
              </Link>

              <SubmitButton />
            </div>
          )}
        </header>

        {mine.data && mine.data.length > 0 && (
          <MyGames games={mine.data} onEdit={(game) => setEditing(game)} />
        )}

        <ColecoesSection />

        {/* Busca e filtros: o catálogo é para DESCOBRIR — sem isto só rola quem já sabe o que quer. */}
        <div className="mb-4 space-y-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={texts.games.searchPlaceholder}
            aria-label={texts.games.searchPlaceholder}
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {GAME_STAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStage(stage === item.id ? "" : item.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  stage === item.id
                    ? "border-primary bg-primary-soft text-primary-text"
                    : "border-border-soft text-text-subtle hover:bg-surface-2",
                )}
              >
                {item.label}
              </button>
            ))}

            <span className="mx-1 h-4 w-px bg-border-soft" aria-hidden />

            <button
              type="button"
              onClick={() => setOrder(order === "plays" ? "recent" : "plays")}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                order === "plays"
                  ? "border-primary bg-primary-soft text-primary-text"
                  : "border-border-soft text-text-subtle hover:bg-surface-2",
              )}
            >
              {texts.games.mostPlayed}
            </button>

            <button
              type="button"
              onClick={() => setOrder(order === "title" ? "recent" : "title")}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                order === "title"
                  ? "border-primary bg-primary-soft text-primary-text"
                  : "border-border-soft text-text-subtle hover:bg-surface-2",
              )}
            >
              {texts.games.alphabetical}
            </button>
          </div>

          {GAME_GENRES.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {GAME_GENRES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGenre(genre === item ? "" : item)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-normal transition",
                    genre === item
                      ? "bg-primary text-primary-foreground"
                      : "text-text-subtle hover:bg-surface-2",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {catalog.isLoading ? (
          <p className="py-10 text-center text-sm text-text-subtle">Carregando…</p>
        ) : catalog.isError ? (
          <p className="py-10 text-center text-sm text-text-subtle">
            Não foi possível carregar o catálogo agora.
          </p>
        ) : pages.length === 0 ? (
          <div className="surface-card rounded-2xl p-8 text-center">
            <Gamepad2 className="mx-auto h-10 w-10 text-primary" />

            <p className="mt-3 text-sm font-medium">Nenhum jogo publicado ainda.</p>

            <p className="mt-1 text-sm text-text-subtle">
              Você fez um jogo? Envie o link e ele aparece aqui depois da moderação.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pages.map((g) => (
              <li key={g.id} className="surface-card flex min-w-0 items-center gap-2 p-2">
                <Link
                  to="/games/$username/$gameSlug"
                  params={{ username: g.username ?? "", gameSlug: g.slug }}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition hover:bg-muted/50"
                >
                  <GameCover cover={g.cover} icon={g.icon} url={g.url} />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{g.title}</span>

                    <span className="block truncate text-sm text-text-subtle">
                      {g.description || " "}
                    </span>

                    {ratings.data?.[g.id] && ratings.data[g.id].reviews > 0 && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-text-subtle">
                        <Star className="h-3 w-3 fill-opportunity text-opportunity" />

                        <>{ratings.data[g.id].average.toFixed(1)}</>

                        <span>({ratings.data[g.id].reviews})</span>
                      </span>
                    )}
                  </span>

                  <ExternalLink className="h-4 w-4 shrink-0 text-text-subtle" />
                </Link>

                {/* Meu jogo na loja: editar aqui mesmo (o backend marca `owned` no catálogo). */}
                {g.owned && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full gap-1.5"
                    onClick={() => setEditing(g)}
                  >
                    <Pencil className="h-3.5 w-3.5" />

                    <>{texts.games.panel.edit}</>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {catalog.data?.nextCursor && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              className="rounded-full"
              disabled={catalog.isFetching}
              onClick={() => setCursor(catalog.data?.nextCursor ?? null)}
            >
              {catalog.isFetching ? texts.common.loading : texts.games.loadMore}
            </Button>
          </div>
        )}
      </div>

      {editing && (
        <GameEditorDialog
          game={editing}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </AppContainer>
  );
}

function GameCover({
  cover,
  icon,
  url,
}: {
  cover?: string | null;
  icon?: string | null;
  url?: string | null;
}) {
  return <GameIcon cover={cover} icon={icon} url={url} />;
}

/** Os jogos de quem está logado, com o status da moderação, o Editar, o reenvio e o impulso. */
function MyGames({
  games,
  onEdit,
}: {
  games: Awaited<ReturnType<typeof gamesApi.mine>>;
  onEdit: (game: GameView) => void;
}) {
  const queryClient = useQueryClient();
  const resubmit = useMutation({
    mutationFn: (gameId: string) => gamesApi.resubmit(gameId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["games"] }),
  });
  const boost = useMutation({
    mutationFn: (gameId: string) => gamesApi.boost(gameId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["games"] }),
  });

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-text-subtle">Meus envios</h2>

      <ul className="space-y-2">
        {games.map((g) => (
          <li key={g.id} className="surface-card flex flex-wrap items-center gap-2 p-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{g.title}</span>
              {g.status === "REJECTED" && g.reviewNote && (
                <span className="block truncate text-xs text-text-subtle">
                  Moderação: {g.reviewNote}
                </span>
              )}
            </span>

            {g.boosted && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-text">
                impulsionado
              </span>
            )}
            <StatusBadge status={g.status} />

            {/* Quem publicou edita: ficha, endereço, ícone/banner e o próprio excluir. */}
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-1.5"
              onClick={() => onEdit(g)}
            >
              <Pencil className="h-3.5 w-3.5" />

              <>{texts.games.panel.edit}</>
            </Button>

            {g.status === "REJECTED" && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={resubmit.isPending}
                onClick={() => resubmit.mutate(g.id)}
              >
                Reenviar
              </Button>
            )}
            {g.status === "PUBLISHED" && !g.boosted && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full gap-1"
                disabled={boost.isPending}
                onClick={() => boost.mutate(g.id)}
                title={`Sobe no catálogo por 7 dias — ${formatFaisca(5000)} faíscas`}
              >
                <Rocket className="h-4 w-4" />
                Impulsionar
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: "bg-primary-soft text-primary-text",
    SUBMITTED: "bg-surface-2 text-text-subtle",
    REJECTED: "bg-surface-2 text-text-subtle",
  };
  const label: Record<string, string> = {
    PUBLISHED: "publicado",
    SUBMITTED: "em revisão",
    REJECTED: "não aceito",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? map.SUBMITTED}`}
    >
      {label[status] ?? status}
    </span>
  );
}

function SubmitButton() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", slug: "", url: "", description: "", tags: "" });
  const submit = useMutation({
    mutationFn: () =>
      gamesApi.submit({
        slug: form.slug.trim().toLowerCase() || undefined,
        title: form.title.trim(),
        url: form.url.trim(),
        description: form.description.trim() || undefined,
        tags: form.tags.trim() || undefined,
      }),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });

  return (
    <>
      <Button size="sm" className="rounded-full gap-1.5" onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" />
        Enviar jogo
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="surface-card w-full max-w-md rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Enviar um jogo</h2>

            <p className="mt-1 text-sm text-text-subtle">
              O jogo precisa estar publicado em outro lugar (itch.io, site próprio). Envie o link —
              a moderação revisa antes de publicar.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Título</span>

                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Slug (o endereço do jogo)</span>

                <Input
                  placeholder="kawaiigame"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  maxLength={60}
                  pattern="[a-zA-Z0-9-]*"
                  title="Só letras, números e hífen. Pode deixar vazio."
                />

                <span className="mt-1 block text-xs text-text-subtle">
                  Só letras, números e hífen. Deixe vazio para gerar do título.
                </span>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Link do jogo (https)</span>

                <Input
                  placeholder="https://meujogo.itch.io/…"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Descrição</span>

                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium">Tags (separadas por vírgula)</span>

                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </label>
            </div>

            {submit.isError && (
              <p className="mt-3 text-sm text-red-500">
                {submit.error instanceof Error
                  ? submit.error.message
                  : "Não foi possível enviar o jogo. Tente novamente."}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>

              <Button
                disabled={submit.isPending || !form.title.trim() || !form.url.trim()}
                onClick={() => submit.mutate()}
              >
                Enviar para moderação
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * As coleções curadas (G3 do plano): blocos temáticos de jogos escolhidos pela
 * curadoria, com os jogos resolvidos dentro.
 */
function ColecoesSection() {
  const colecoes = useQuery({
    queryKey: ["games", "colecoes"],
    queryFn: () => gamesApi.colecoes(20),
  });
  const itens = colecoes.data ?? [];
  if (colecoes.isLoading || itens.length === 0) return null;

  return (
    <section className="mb-6 space-y-3" aria-label="Coleções curadas">
      {itens.map((c) => (
        <div key={c.id} className="surface-card p-4">
          <h2 className="text-sm font-semibold">{c.title}</h2>
          {c.description && <p className="mt-0.5 text-xs text-text-subtle">{c.description}</p>}
          <ul className="mt-2 flex flex-wrap gap-2">
            {c.jogos.map((g) => (
              <li key={g.id}>
                <Link
                  to="/games/$username/$gameSlug"
                  params={{ username: g.username ?? "", gameSlug: g.slug }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-soft px-3 py-1.5 text-sm font-medium transition hover:border-primary"
                >
                  <Gamepad2 className="h-3.5 w-3.5 text-primary" />
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
