import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { WalletTab } from "@/types/routes/wallet/wallet-tab";
import {
  Button,
  Input,
  LoadingState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import {
  ArrowLeft,
  Send,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";

import { walletApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";
import { faiscaToBrlMicros, formatBrlMicros, formatFaisca, parseFaiscaInput } from "@/lib/faisca";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { SaciSpot } from "@/components/events/saci-spot";
import { MarketplaceSection } from "@/components/marketplace/marketplace-section";
import { UserPicker } from "@/components/user-picker";
import { CosmeticShop } from "@/components/wallet/cosmetic-shop";
import { FrameShop } from "@/components/wallet/frame-shop";

const WALLET_TABS: WalletTab[] = ["carteira", "marketplace", "loja", "minhas"];

export const Route = createFileRoute("/carteira")({
  beforeLoad: requireAuth,
  /** A aba vive na URL: /carteira?tab=marketplace (a rota antiga /marketplace redireciona para cá). */
  validateSearch: (search: Record<string, unknown>): { tab?: WalletTab } => {
    const tab =
      typeof search.tab === "string" && WALLET_TABS.includes(search.tab as WalletTab)
        ? (search.tab as WalletTab)
        : undefined;
    return tab ? { tab } : {};
  },
  head: () => ({ meta: [{ title: texts.wallet.seoTitle }] }),
  component: Carteira,
});

function Carteira() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeTab, setActiveTab] = useState<WalletTab>(search.tab ?? "carteira");
  // A aba vive na URL; o estado local mantém a troca imediata (e os testes que não montam o router).
  useEffect(() => {
    setActiveTab(search.tab ?? "carteira");
  }, [search.tab]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [payOpen, setPayOpen] = useState(false);
  const [form, setForm] = useState({ toUsername: "", amount: "", message: "" });

  const {
    data: wallet,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["carteira"],
    queryFn: () => walletApi.wallet(),
  });
  const { data: cotacao } = useQuery({
    queryKey: ["cotacao"],
    queryFn: () => walletApi.cotacao(90),
  });

  const transfer = useMutation({
    mutationFn: () =>
      walletApi.transfer(
        form.toUsername.trim(),
        parseFaiscaInput(form.amount) ?? 0,
        form.message.trim() || undefined,
      ),
    onSuccess: () => {
      setPayOpen(false);
      setForm({ toUsername: "", amount: "", message: "" });
      toast(texts.wallet.sent, "success");
      void queryClient.invalidateQueries({ queryKey: ["carteira"] });
    },
    onError: (error: unknown) => {
      const apiError = error as { code?: string; message?: string };
      // O motivo vem do backend (teto de conta nova, saldo, destinatário) — mostrar o
      // genérico escondia justamente a explicação de que a transferência foi recusada.
      const message =
        apiError.code === "NEW_ACCOUNT_LIMIT" && apiError.message
          ? apiError.message
          : apiError.code === "INSUFFICIENT_SPARKS"
            ? texts.wallet.insufficientSparks
            : apiError.code === "USER_NOT_FOUND"
              ? texts.wallet.recipientNotFound
              : apiError.code === "SELF_TRANSFER"
                ? texts.wallet.selfTransfer
                : texts.wallet.transferError;
      toast(message, "error");
    },
  });

  const [contestar, setContestar] = useState<{
    refId: string;
    motivo: string;
    descricao: string;
  } | null>(null);
  const contestarMutation = useMutation({
    mutationFn: () =>
      walletApi.contestar(contestar!.refId, contestar!.motivo, contestar!.descricao.trim()),
    onSuccess: () => {
      setContestar(null);
      toast("Contestação enviada: a moderação vai analisar os dois lados.", "success");
      void queryClient.invalidateQueries({ queryKey: ["carteira"] });
    },
    onError: (error: unknown) => {
      const code = (error as { code?: string }).code;
      toast(
        code === "CONTEST_WINDOW_CLOSED"
          ? "O prazo de contestação (7 dias) já fechou."
          : code === "ALREADY_CONTESTED"
            ? "Esta transferência já foi contestada."
            : "Não foi possível contestar agora.",
        "error",
      );
    },
  });

  const entries = wallet?.entries ?? [];

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.wallet.back}</>
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-text-strong">
              {texts.frameShop.title}
            </h1>

            <p className="text-sm text-text-subtle">{texts.frameShop.subtitle}</p>
          </div>

          <SaciSpot spot="carteira" className="shrink-0" />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const tab = value as WalletTab;
            setActiveTab(tab);
            void navigate({
              search: tab === "carteira" ? {} : { tab },
              replace: true,
            });
          }}
        >
          <TabsList className="wallet-shop-tabs">
            <TabsTrigger value="carteira">
              <Zap className="h-4 w-4" aria-hidden="true" />
              {texts.frameShop.walletTab}
            </TabsTrigger>

            <TabsTrigger value="marketplace">
              <Store className="h-4 w-4" aria-hidden="true" />
              {texts.frameShop.marketplaceTab}
            </TabsTrigger>

            <TabsTrigger value="loja">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {texts.frameShop.storeTab}
            </TabsTrigger>

            <TabsTrigger value="minhas">
              <User className="h-4 w-4" aria-hidden="true" />
              {texts.frameShop.ownedTab}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carteira" className="mx-auto max-w-2xl space-y-6 pt-5">
            <div className="surface-card space-y-4 p-6">
              <div className="flex items-center gap-2 text-text-subtle">
                <Sparkles className="h-4 w-4 text-primary" />

                <span className="text-xs font-medium uppercase tracking-widest">
                  {texts.wallet.title}
                </span>
              </div>

              {isLoading ? (
                <LoadingState />
              ) : isError ? (
                <div className="rounded-xl border border-border-soft p-4 text-sm text-text-subtle">
                  Não foi possível carregar a carteira agora.
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 rounded-full"
                    onClick={() => refetch()}
                  >
                    Tentar de novo
                  </Button>
                </div>
              ) : (
                <p className="text-4xl font-semibold tracking-tight text-text-strong">
                  {formatFaisca(wallet?.balance ?? 0)}{" "}
                  <span className="text-lg font-normal text-text-subtle">faíscas</span>
                </p>
              )}

              {wallet && (
                <p className="text-xs text-text-subtle">
                  {texts.wallet.chaveLabel}:{" "}
                  <span className="font-mono text-text-strong">{wallet.chave}</span>
                </p>
              )}

              <Button className="rounded-full gap-2" onClick={() => setPayOpen(true)}>
                <Send className="h-4 w-4" />
                {texts.wallet.pay}
              </Button>

              <p className="text-xs leading-relaxed text-text-subtle">{texts.wallet.notice}</p>
            </div>

            <CotacaoCard mf={wallet?.balance ?? 0} />

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
                {texts.wallet.history}
              </h2>

              {entries.length === 0 ? (
                <div className="rounded-2xl border border-border-soft bg-surface-card p-6 text-sm text-muted-foreground">
                  <Zap className="mb-2 h-4 w-4 text-primary" />
                  {texts.wallet.historyEmpty}
                </div>
              ) : (
                <ul className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
                  {entries.map((entry, index) => (
                    <li key={index} className="flex items-center gap-3 p-4">
                      <span
                        className={`text-sm font-semibold ${entry.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
                      >
                        {entry.amount >= 0 ? "+" : ""}
                        {formatFaisca(entry.amount)}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-text-strong">
                          {entry.message || (texts.wallet.kind[entry.kind] ?? entry.kind)}
                        </span>

                        <span className="block text-xs text-text-subtle">
                          {dataHora(entry.createdAt)}
                        </span>
                      </span>

                      {entry.kind === "TRANSFER_OUT" && entry.refId && (
                        <button
                          type="button"
                          className="shrink-0 rounded-full border border-border-soft px-2 py-1 text-xs text-text-subtle transition hover:border-destructive hover:text-destructive"
                          onClick={() =>
                            setContestar({ refId: entry.refId!, motivo: "golpe", descricao: "" })
                          }
                        >
                          Contestar
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="marketplace" className="pt-5">
            <MarketplaceSection />
          </TabsContent>

          <TabsContent value="loja" className="pt-5">
            <CosmeticShop />
          </TabsContent>

          <TabsContent value="minhas" className="pt-5">
            <FrameShop onlyOwned />
          </TabsContent>
        </Tabs>

        {payOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border-soft bg-surface-card p-5">
              <h3 className="text-base font-semibold">{texts.wallet.payTitle}</h3>

              <div className="mt-3 space-y-3 text-sm">
                <label className="block space-y-1">
                  <span className="text-xs text-text-subtle">{texts.wallet.toLabel}</span>

                  <UserPicker
                    value={form.toUsername}
                    onChange={(username) => setForm({ ...form, toUsername: username })}
                    placeholder={texts.wallet.toPlaceholder}
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-text-subtle">{texts.wallet.amountLabel}</span>

                  <Input
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) => setForm({ ...form, amount: event.target.value })}
                    placeholder="0,00"
                  />
                  {cotacao && parseFaiscaInput(form.amount) !== null && (
                    <span className="block text-xs text-text-subtle">
                      ≈{" "}
                      {formatBrlMicros(
                        faiscaToBrlMicros(parseFaiscaInput(form.amount)!, cotacao.brlMicros),
                      )}{" "}
                      na cotação de referência
                    </span>
                  )}
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-text-subtle">{texts.wallet.messageLabel}</span>

                  <Textarea
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    rows={2}
                    placeholder={texts.wallet.messagePlaceholder}
                  />
                </label>

                <p className="text-xs leading-relaxed text-text-subtle">
                  {texts.wallet.irreversible}
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" className="rounded-full" onClick={() => setPayOpen(false)}>
                  {texts.common.cancel}
                </Button>

                <Button
                  className="rounded-full"
                  disabled={
                    transfer.isPending ||
                    !form.toUsername.trim() ||
                    parseFaiscaInput(form.amount) === null
                  }
                  onClick={() => transfer.mutate()}
                >
                  {transfer.isPending ? texts.common.saving : texts.wallet.confirm}
                </Button>
              </div>
            </div>
          </div>
        )}

        {contestar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border-soft bg-surface-card p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Contestar transferência
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-text-subtle">
                Caiu num golpe? A contestação vai para a moderação, que analisa os dois lados: se
                proceder, a transferência é{" "}
                <span className="font-semibold text-text-strong">revertida</span> e o valor volta
                para você; se não proceder, quem contestou é penalizado.
              </p>

              <div className="mt-3 space-y-3 text-sm">
                <label className="block space-y-1">
                  <span className="text-xs text-text-subtle">Motivo</span>

                  <select
                    className="h-10 w-full rounded-lg border border-border-soft bg-transparent px-3 text-sm text-text-strong"
                    value={contestar.motivo}
                    onChange={(e) => setContestar({ ...contestar, motivo: e.target.value })}
                  >
                    <option value="golpe">Golpe / fraude</option>

                    <option value="nao-entregue">Não recebi o combinado</option>

                    <option value="conta-comprometida">Minha conta foi comprometida</option>

                    <option value="outro">Outro</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-text-subtle">
                    O que aconteceu (mín. 20 caracteres)
                  </span>

                  <Textarea
                    rows={4}
                    value={contestar.descricao}
                    maxLength={1000}
                    onChange={(e) => setContestar({ ...contestar, descricao: e.target.value })}
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" className="rounded-full" onClick={() => setContestar(null)}>
                  {texts.common.cancel}
                </Button>

                <Button
                  className="rounded-full"
                  disabled={contestarMutation.isPending || contestar.descricao.trim().length < 20}
                  onClick={() => contestarMutation.mutate()}
                >
                  {contestarMutation.isPending ? texts.common.saving : "Enviar contestação"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContainer>
  );
}

/**
 * A MINI BOLSA (plano C7/Fase 5): a cotação de REFERÊNCIA da faísca em BRL e o seu
 * histórico no gráfico. Cotação publicada pela plataforma — não é câmbio: comprar
 * faísca com dinheiro é Fase 6/7, condicionada a parecer jurídico.
 */
function CotacaoCard({ mf }: { mf: number }) {
  const { data: cotacao } = useQuery({
    queryKey: ["cotacao"],
    queryFn: () => walletApi.cotacao(90),
  });
  if (!cotacao) return null;

  const pontos = [...cotacao.historico].reverse();
  const atual = cotacao.brlMicros;
  const anterior = pontos.length > 1 ? pontos[pontos.length - 2].brlMicros : atual;
  const subiu = atual >= anterior;

  return (
    <section className="surface-card space-y-3 p-6" aria-label="Cotação da faísca">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-text-subtle">
          <TrendingUp className="h-4 w-4 text-primary" />

          <span className="text-xs font-medium uppercase tracking-widest">
            Cotação de referência
          </span>
        </div>

        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-subtle">
          não é câmbio
        </span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-text-strong">
          1 faísca = {formatBrlMicros(atual)}
        </p>

        <p className="text-sm text-text-subtle">
          Seu saldo ≈{" "}
          <span className="font-semibold text-text-strong">
            {formatBrlMicros(faiscaToBrlMicros(mf, atual))}
          </span>
        </p>
      </div>

      {pontos.length > 1 && <Sparkline valores={pontos.map((p) => p.brlMicros)} subiu={subiu} />}

      <p className="text-xs leading-relaxed text-text-subtle">
        Preço de referência recalculado pela plataforma a partir do uso da moeda (marketplace,
        serviços e transferências) e da emissão automática. O histórico fica no gráfico acima.
        Comprar faísca com dinheiro ainda não existe.
      </p>
    </section>
  );
}

/** O sparkline do histórico da cotação: SVG puro, sem biblioteca. */
function Sparkline({ valores, subiu }: { valores: number[]; subiu: boolean }) {
  const width = 320;
  const height = 48;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const span = max - min || 1;
  const step = valores.length > 1 ? width / (valores.length - 1) : width;
  const pontos = valores
    .map(
      (v, i) =>
        `${(i * step).toFixed(1)},${(height - 6 - ((v - min) / span) * (height - 12)).toFixed(1)}`,
    )
    .join(" ");
  const cor = subiu ? "text-green-600 dark:text-green-400" : "text-destructive";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={pontos}
        fill="none"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={cor}
        stroke="currentColor"
      />
    </svg>
  );
}
