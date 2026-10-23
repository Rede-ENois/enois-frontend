import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { MARKETPLACE_KINDS, MARKETPLACE_KIND_LABELS } from "@/constants/marketplace-kinds";
import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import type { MarketplaceListing as MarketplaceListingView } from "@/types/application/marketplace/marketplace-listing";
import type { MarketplacePalette } from "@/types/application/marketplace/marketplace-palette";
import type { MarketplacePurchase } from "@/types/application/marketplace/marketplace-purchase";
import { BadgeCheck, Check, RotateCcw, Search, Sparkles, Store } from "lucide-react";

import { marketplaceApi, themesApi } from "@/lib/api";
import { formatFaisca, parseFaiscaInput } from "@/lib/faisca";
import { registerGalleryCollection } from "@/lib/theme/gallery-collections";
import { useIsAuthenticated } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";
import { ThemeSellDialog } from "@/components/appearance/theme-sell-dialog";
import { MarketplaceContentDialog } from "@/components/marketplace/marketplace-content-dialog";
import { MarketplaceSellDialog } from "@/components/marketplace/marketplace-sell-dialog";

/** Piso de preço do marketplace: 50 faíscas (o backend também recusa abaixo disso). */
const MIN_PRICE = parseFaiscaInput("50") ?? 50_000;

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace · Énóis" }] }),
  component: Marketplace,
});

/**
 * O marketplace em faíscas (Fase 4): temas da comunidade à venda, sempre com ESCROW —
 * as faíscas ficam retidas até o comprador confirmar (ou pedir reembolso em 7 dias).
 */
function Marketplace() {
  const authenticated = useIsAuthenticated();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<string | null>(null);
  const [sellContentOpen, setSellContentOpen] = useState(false);
  const [contentPurchase, setContentPurchase] = useState<MarketplacePurchase | null>(null);
  const [bought, setBought] = useState<{ title: string; price: number; purchaseId: string } | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const catalog = useQuery({
    queryKey: ["marketplace", "catalog", search, kind],
    queryFn: () => marketplaceApi.catalog(60, search || undefined, kind || undefined),
  });
  const purchases = useQuery({
    queryKey: ["marketplace", "purchases"],
    queryFn: () => marketplaceApi.purchases(),
    enabled: authenticated,
  });
  const sales = useQuery({
    queryKey: ["marketplace", "sales"],
    queryFn: () => marketplaceApi.sales(),
    enabled: authenticated,
  });

  return (
    <AppContainer>
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <div className="mb-6">
          <PageHeader
            icon={Store}
            title="Marketplace"
            description="Temas e conteúdos feitos pela comunidade, em faíscas. O valor fica retido até você confirmar (ou em 7 dias) e o reembolso devolve tudo."
            actions={
              authenticated && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5"
                    onClick={() => setSellContentOpen(true)}
                  >
                    <Store className="h-4 w-4" />
                    Vender conteúdo
                  </Button>

                  <PublishButton />
                </>
              )
            }
          />
        </div>

        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar no marketplace..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setKind(null)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                kind === null
                  ? "bg-primary text-primary-foreground"
                  : "border border-border-soft text-text-subtle hover:border-primary/50",
              )}
            >
              Todas
            </button>

            {MARKETPLACE_KINDS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(kind === value ? null : value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  kind === value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border-soft text-text-subtle hover:border-primary/50",
                )}
              >
                {MARKETPLACE_KIND_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        {purchases.data && purchases.data.length > 0 && (
          <MyPurchases
            purchases={purchases.data}
            onOpenContent={(purchase) => setContentPurchase(purchase)}
          />
        )}
        {sales.data && sales.data.length > 0 && <MySales sales={sales.data} />}

        {catalog.isLoading ? (
          <p className="py-10 text-center text-sm text-text-subtle">Carregando…</p>
        ) : catalog.isError ? (
          <p className="py-10 text-center text-sm text-text-subtle">
            Não foi possível carregar o marketplace agora.
          </p>
        ) : (catalog.data?.length ?? 0) === 0 ? (
          <div className="surface-card rounded-2xl p-8 text-center">
            <Store className="mx-auto h-10 w-10 text-primary" />

            <p className="mt-3 text-sm font-medium">Nada à venda ainda.</p>

            <p className="mt-1 text-sm text-text-subtle">
              Toque em “Publicar tema” acima: a sua aparência vira uma listagem aqui, por no mínimo
              50 faíscas.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.data!.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onBought={(purchaseId) => setBought({ title: l.title, price: l.price, purchaseId })}
              />
            ))}
          </ul>
        )}
        <Dialog open={bought !== null} onOpenChange={(open) => !open && setBought(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-normal">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
                  <Check className="h-5 w-5" />
                </span>

                <>{texts.marketplace.purchaseConfirmed}</>
              </DialogTitle>
            </DialogHeader>

            {bought && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border-soft bg-surface-1 p-4">
                  <p className="text-sm font-semibold text-text-strong">{bought.title}</p>

                  <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-primary">
                    <Sparkles className="h-4 w-4" />
                    {formatFaisca(bought.price)} faíscas
                  </p>

                  <p className="mt-2 text-xs text-text-subtle">{texts.marketplace.purchaseHeld}</p>
                </div>

                <div className="flex justify-end">
                  <Button className="rounded-full" onClick={() => setBought(null)}>
                    {texts.marketplace.keepShopping}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {contentPurchase && (
          <MarketplaceContentDialog
            purchaseId={contentPurchase.id}
            title={contentPurchase.title}
            onClose={() => setContentPurchase(null)}
          />
        )}

        <MarketplaceSellDialog open={sellContentOpen} onOpenChange={setSellContentOpen} />
      </div>
    </AppContainer>
  );
}

/** Lê as cores do pacote com fallbacks: pacote inválido não pode quebrar a vitrine. */
function paletteOf(packageJson: string): MarketplacePalette {
  const fallback: MarketplacePalette = {
    bg: "#f5f5f5",
    surface: "#ffffff",
    border: "#e5e5e5",
    primary: "#7c3aed",
    strong: "#111111",
    subtle: "#5f5f5f",
  };
  try {
    const palette = JSON.parse(packageJson).palette ?? {};
    return {
      bg: palette.background ?? fallback.bg,
      surface: palette.surface ?? fallback.surface,
      border: palette.border ?? fallback.border,
      primary: palette.primary ?? fallback.primary,
      strong: palette.text?.strong ?? fallback.strong,
      subtle: palette.text?.subtle ?? fallback.subtle,
    };
  } catch {
    return fallback;
  }
}

/** Miniatura real: renderiza os tokens do pacote do tema. */
function Miniatura({ packageJson }: { packageJson: string }) {
  const { bg, surface, primary } = paletteOf(packageJson);

  return (
    <div
      className="h-16 w-full rounded-md border border-border-soft p-1.5"
      style={{ background: bg }}
    >
      <div
        className="flex h-full flex-col justify-center gap-1 rounded-sm p-1.5"
        style={{ background: surface }}
      >
        <div className="h-1.5 w-2/3 rounded-full" style={{ background: primary }} />
        <div className="h-1 w-full rounded-full opacity-60" style={{ background: primary }} />
        <div className="mt-0.5 h-1 w-3/5 rounded-full opacity-40" style={{ background: primary }} />
      </div>
    </div>
  );
}

/** Amostra maior do item: um cartão de perfil/post com as cores reais do pacote. */
function PreviewMock({ packageJson }: { packageJson: string }) {
  const p = paletteOf(packageJson);

  return (
    <div className="min-w-0 rounded-xl p-4" style={{ background: p.bg }}>
      <div
        className="rounded-lg border p-4"
        style={{ background: p.surface, borderColor: p.border }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full" style={{ background: p.primary }} />

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2.5 w-2/3 rounded-full" style={{ background: p.strong }} />
            <div
              className="h-2 w-1/2 rounded-full"
              style={{ background: p.subtle, opacity: 0.55 }}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div
            className="h-2 w-full rounded-full"
            style={{ background: p.subtle, opacity: 0.35 }}
          />
          <div
            className="h-2 w-11/12 rounded-full"
            style={{ background: p.subtle, opacity: 0.35 }}
          />
          <div className="h-2 w-3/5 rounded-full" style={{ background: p.subtle, opacity: 0.35 }} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span
            className="rounded-full px-4 py-1.5 text-xs font-medium"
            style={{ background: p.primary, color: p.bg }}
          >
            Botão
          </span>

          <span
            className="rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{ borderColor: p.border, color: p.strong }}
          >
            Secundário
          </span>
        </div>
      </div>
    </div>
  );
}

/** Botão "Ver preview": abre a amostra maior sem sair da vitrine. */
function PreviewButton({ packageJson, title }: { packageJson: string; title: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full rounded-full">
          Ver preview
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preview · {title}</DialogTitle>
        </DialogHeader>

        <PreviewMock packageJson={packageJson} />

        <p className="text-xs text-text-subtle">
          Amostra com as cores do pacote. O item pode incluir outros ajustes além da paleta.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** A listagem com o preview do tema (buscado da galeria). */
function ListingCard({
  listing,
  onBought,
}: {
  listing: MarketplaceListingView;
  onBought: (purchaseId: string) => void;
}) {
  const theme = useQuery({
    queryKey: ["themes", "item", listing.itemId],
    queryFn: () => themesApi.get(listing.itemId),
  });
  const queryClient = useQueryClient();
  const buy = useMutation({
    mutationFn: () => marketplaceApi.buy(listing.id),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      onBought(result.purchaseId);
    },
  });

  return (
    <li className="surface-card flex h-full min-w-0 flex-col overflow-hidden">
      <div className="p-3 pb-0">
        {theme.data ? (
          <Miniatura packageJson={theme.data.packageJson} />
        ) : (
          <div
            className="flex h-16 w-full items-center justify-center rounded-md border border-border-soft"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Store className="h-6 w-6 text-primary-foreground/80" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="inline-flex w-fit rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-subtle">
          {MARKETPLACE_KIND_LABELS[listing.itemKind]}
        </span>

        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold text-text-strong">{listing.title}</h3>

          {theme.data?.name && theme.data.name !== listing.title && (
            <p className="truncate text-xs text-text-subtle">{theme.data.name}</p>
          )}

          <p className="truncate text-xs text-text-subtle">
            {listing.sellerName ?? ""}
            {listing.sellerUsername ? ` · @${listing.sellerUsername}` : ""}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          {theme.data && (
            <PreviewButton packageJson={theme.data.packageJson} title={listing.title} />
          )}

          <span className="flex items-center gap-1.5 text-lg font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            {formatFaisca(listing.price)} faíscas
          </span>

          <Button
            size="sm"
            className="w-full rounded-full"
            disabled={buy.isPending}
            onClick={() => buy.mutate()}
          >
            {buy.isPending ? "Retendo faíscas…" : "Comprar"}
          </Button>
        </div>
      </div>
    </li>
  );
}

/** As compras do usuário, com a decisão do escrow. */
function MyPurchases({
  purchases,
  onOpenContent,
}: {
  purchases: MarketplacePurchase[];
  onOpenContent: (purchase: MarketplacePurchase) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const setThemeCollection = usePreferencesStore((state) => state.setThemeCollection);

  const confirm = useMutation({
    mutationFn: (id: string) => marketplaceApi.confirm(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marketplace"] }),
  });
  const refund = useMutation({
    mutationFn: (id: string) => marketplaceApi.refund(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marketplace"] }),
  });
  const applyTheme = useMutation({
    mutationFn: (itemId: string) => themesApi.get(itemId),
    onSuccess: (theme) => {
      const collection = registerGalleryCollection({
        id: theme.id,
        name: theme.name,
        description: "",
        packageJson: theme.packageJson,
        modeDefault: theme.modeDefault,
      });
      setThemeCollection(collection.id);
      toast("Tema aplicado!", "success");
    },
    onError: () => toast("Não foi possível aplicar o tema agora.", "error"),
  });

  // Agrupado por categoria: "Temas", "Templates", "Banners"... — o comprador acha o que comprou.
  const groups = new Map<string, MarketplacePurchase[]>();
  for (const purchase of purchases) {
    const key = purchase.itemKind ?? "THEME";
    groups.set(key, [...(groups.get(key) ?? []), purchase]);
  }

  return (
    <section className="mb-6 space-y-3">
      <h2 className="text-sm font-semibold text-text-subtle">Minhas compras</h2>

      {[...groups.entries()].map(([kind, list]) => (
        <div key={kind} className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-text-subtle">
            {MARKETPLACE_KIND_LABELS[kind as keyof typeof MARKETPLACE_KIND_LABELS] ?? kind}
          </h3>

          <ul className="space-y-2">
            {list.map((p) => (
              <li key={p.id} className="surface-card flex flex-wrap items-center gap-2 p-3">
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-medium text-text-strong">
                    {p.title ?? "Compra no marketplace"}
                  </span>

                  <span className="block text-xs text-text-subtle">
                    {formatFaisca(p.price)} faíscas ·{" "}
                    {p.state === "HELD"
                      ? "retidas no escrow"
                      : p.state === "RELEASED"
                        ? "concluída"
                        : "reembolsada"}
                  </span>
                </span>

                <StateChip state={p.state} />

                {p.state !== "REFUNDED" && p.itemKind === "THEME" && p.itemId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={applyTheme.isPending}
                    onClick={() => applyTheme.mutate(p.itemId!)}
                  >
                    Aplicar tema
                  </Button>
                )}

                {p.state !== "REFUNDED" && p.itemKind && p.itemKind !== "THEME" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => onOpenContent(p)}
                  >
                    Abrir conteúdo
                  </Button>
                )}

                {p.state === "HELD" && (
                  <>
                    <Button
                      size="sm"
                      className="rounded-full gap-1"
                      disabled={confirm.isPending}
                      onClick={() => confirm.mutate(p.id)}
                    >
                      <BadgeCheck className="h-4 w-4" />
                      Confirmar
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1"
                      disabled={refund.isPending}
                      onClick={() => refund.mutate(p.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reembolso
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function MySales({ sales }: { sales: Awaited<ReturnType<typeof marketplaceApi.sales>> }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-text-subtle">Minhas vendas</h2>

      <ul className="space-y-2">
        {sales.map((s) => (
          <li key={s.id} className="surface-card flex items-center gap-2 p-3">
            <span className="min-w-0 flex-1 text-sm">Venda de {formatFaisca(s.price)} faíscas</span>

            <StateChip state={s.state} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function StateChip({ state }: { state: string }) {
  const map: Record<string, string> = {
    HELD: "bg-surface-2 text-text-subtle",
    RELEASED: "bg-primary-soft text-primary-text",
    REFUNDED: "bg-surface-2 text-text-subtle",
  };
  const label: Record<string, string> = {
    HELD: "em escrow",
    RELEASED: "liberada",
    REFUNDED: "reembolsada",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[state] ?? map.HELD}`}>
      {label[state] ?? state}
    </span>
  );
}

/**
 * Publica a APARÊNCIA ATUAL como tema à venda.
 *
 * O formulário vive aqui no marketplace (e não só no diálogo de Aparência) para funcionar no
 * celular: abre o mesmo `ThemeSellDialog`, que monta o pacote da personalização ativa e lista
 * com o piso de 50 faíscas.
 */
function PublishButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" className="rounded-full gap-1.5" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" />
        Publicar tema
      </Button>

      <ThemeSellDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
