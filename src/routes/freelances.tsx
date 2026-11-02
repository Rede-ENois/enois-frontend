import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { FreelanceView } from "@/types/application/freelance/freelance-view";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  LoadingState,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import {
  Banknote,
  CalendarClock,
  Handshake,
  Pencil,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

import { freelancesApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { dataCurta } from "@/lib/date/format";
import { formatFaisca, parseBrlInput, parseFaiscaInput } from "@/lib/faisca";
import { litePageSize } from "@/lib/lite-mode";
import { requireAuth } from "@/lib/require-auth";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

import { AppContainer } from "@/components/app-container";
import { ApplyFreelanceDialog } from "@/components/apply-freelance-dialog";

export const Route = createFileRoute("/freelances")({
  head: () => ({ meta: [{ title: "Freelances · Énóis" }] }),
  component: Freelances,
});

const PAGE_SIZE = 24;

/** Dinheiro é exibido em reais inteiros: 1500 → "R$ 1.500". */
const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Freelances() {
  const authenticated = useIsAuthenticated();
  const lite = useLiteMode();
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");

  // Espera a pessoa parar de digitar: uma requisição por termo, não por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setBuscaAplicada(busca.trim()), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const query = useInfiniteQuery({
    queryKey: ["freelances", buscaAplicada],
    queryFn: ({ pageParam }) =>
      freelancesApi.list({
        limit: litePageSize(PAGE_SIZE, lite),
        cursor: pageParam,
        q: buscaAplicada || undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Handshake className="h-6 w-6 text-primary" />

              <>{texts.jobs.freelancePage.title}</>
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-text-subtle">
              {texts.jobs.freelancePage.description}
            </p>
          </div>

          {authenticated && (
            <Button
              className="w-auto rounded-full gap-2"
              onClick={() => {
                requireAuth();
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />

              <>{texts.jobs.freelancePage.create}</>
            </Button>
          )}
        </header>

        {/* Quem chega sem conta precisa saber por que contratar (publicar) exige cadastro: sem o
            aviso, o painel de publicar simplesmente não aparece e parece que a aba está vazia. */}
        {!authenticated && (
          <section
            aria-labelledby="freelances-hiring-notice"
            className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-primary-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <p id="freelances-hiring-notice" className="font-semibold text-text-strong">
                  {texts.jobs.freelancePage.hiringNoticeTitle}
                </p>

                <p className="mt-1 text-sm text-text-subtle">
                  {texts.jobs.freelancePage.hiringNotice}
                </p>
              </div>
            </div>

            <Link
              to="/entrar"
              search={{ tab: "signup" }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {texts.jobs.freelancePage.hiringNoticeCta}
            </Link>
          </section>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <Input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder={texts.jobs.freelancePage.searchPlaceholder}
            aria-label={texts.jobs.freelancePage.searchPlaceholder}
            className="pl-9"
          />
        </div>

        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <p className="text-sm text-destructive">{texts.jobs.freelancePage.error}</p>
        ) : items.length === 0 ? (
          <div className="surface-card">
            {buscaAplicada ? (
              <EmptyState
                icon={Search}
                title={texts.jobs.freelancePage.searchEmpty}
                description={texts.jobs.freelancePage.searchEmptyHint}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 w-auto rounded-full"
                  onClick={() => setBusca("")}
                >
                  {texts.jobs.freelancePage.clearSearch}
                </Button>
              </EmptyState>
            ) : (
              <EmptyState
                icon={Handshake}
                title={texts.jobs.freelancePage.empty}
                description={texts.jobs.freelancePage.emptyHint}
              />
            )}
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <FreelanceCard key={item.id} item={item} authenticated={authenticated} />
              ))}
            </ul>

            {query.hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="w-auto rounded-full"
                  disabled={query.isFetchingNextPage}
                  onClick={() => void query.fetchNextPage()}
                >
                  {texts.projects.loadMore}
                </Button>
              </div>
            )}
          </>
        )}

        <FreelanceDialog open={open} onOpenChange={setOpen} />
      </div>
    </AppContainer>
  );
}

function FreelanceCard({ item, authenticated }: { item: FreelanceView; authenticated: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applyOpen, setApplyOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const remove = useMutation({
    mutationFn: () => freelancesApi.remove(item.id),
    onSuccess: () => {
      setDeleteOpen(false);
      toast(texts.jobs.freelancePage.deleteSuccess, "success");
      void queryClient.invalidateQueries({ queryKey: ["freelances"] });
    },
    onError: () => toast(texts.jobs.freelancePage.deleteError, "error"),
  });
  const close = useMutation({
    mutationFn: () => freelancesApi.close(item.id),
    onSuccess: () => {
      setCloseOpen(false);
      toast(texts.jobs.freelancePage.closed, "success");
      void queryClient.invalidateQueries({ queryKey: ["freelances"] });
    },
    onError: () => toast(texts.jobs.freelancePage.error, "error"),
  });

  return (
    // `min-w-0` + `break-words`: item de grid nasce com `min-width:auto` e o titulo e texto do
    // prestador (pode ser uma palavra gigante sem espaco). Sem os dois, o card estica a coluna
    // e a pagina rola de lado no celular.
    <li className="surface-card flex h-full min-w-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="min-w-0 break-words font-semibold text-text-strong">{item.title}</h2>

        {item.owned && (
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {item.status === "OPEN" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-auto rounded-full gap-1.5"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />

                  <>{texts.jobs.freelancePage.edit}</>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-auto rounded-full"
                  disabled={close.isPending}
                  onClick={() => setCloseOpen(true)}
                >
                  {texts.jobs.freelancePage.close}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-auto rounded-full gap-1.5 text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />

              <>{texts.jobs.freelancePage.remove}</>
            </Button>
          </div>
        )}
      </div>

      <p className="line-clamp-4 whitespace-pre-line text-sm text-text-subtle">{item.scope}</p>

      <div className="mt-auto flex flex-wrap items-center gap-3 text-sm">
        {item.paymentMethod === "CASH" ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-growth">
            <Banknote className="h-4 w-4" />
            {money(item.budgetMin)}–{money(item.budgetMax)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            {formatFaisca(item.budgetMin)}–{formatFaisca(item.budgetMax)} faíscas
          </span>
        )}

        <span className="inline-flex items-center gap-1.5 text-text-subtle">
          <CalendarClock className="h-4 w-4" />
          {texts.jobs.freelancePage.deadline}: {dataCurta(item.deadline)}
        </span>
      </div>

      {/* O @ leva ao perfil de quem publicou: antes de se candidatar a pessoa quer saber com
          quem vai combinar o trabalho. */}
      {item.username && (
        <Link
          to="/perfil/$username"
          params={{ username: item.username }}
          className="-my-1 max-w-full self-start break-words py-1 text-xs text-text-subtle hover:text-text-strong hover:underline"
        >
          @{item.username}
        </Link>
      )}

      {/* Candidatar-se é falar com quem publicou: abre a conversa direta (mesma API do botão
          "Mensagem" do perfil) e manda a apresentação. Sem conta, o clique leva ao login. */}
      {!item.owned && item.status === "OPEN" && (
        <>
          <Button
            className="w-full gap-2 rounded-full"
            onClick={() => {
              if (!authenticated) {
                void navigate({ to: "/entrar", search: { tab: "login" } });
                return;
              }
              setApplyOpen(true);
            }}
          >
            <Send className="h-4 w-4" />

            {texts.jobs.freelancePage.apply}
          </Button>

          <ApplyFreelanceDialog freelance={item} open={applyOpen} onOpenChange={setApplyOpen} />
        </>
      )}

      {/* Encerrar tira o título e o escopo da lista. O primeiro clique só abre a confirmação,
          o mesmo diálogo das comunidades, para um toque acidental não apagar o combinado. */}
      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={texts.jobs.freelancePage.closeTitle}
        description={texts.jobs.freelancePage.closeDescription}
        confirmLabel={texts.jobs.freelancePage.close}
        destructive
        pending={close.isPending}
        onConfirm={() => close.mutate()}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={texts.jobs.freelancePage.deleteTitle}
        description={texts.jobs.freelancePage.deleteDescription}
        confirmLabel={texts.jobs.freelancePage.remove}
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
      <FreelanceDialog open={editOpen} onOpenChange={setEditOpen} initial={item} />
    </li>
  );
}

/**
 * Formulário de freela, usado para publicar e para editar. Na edição os campos nascem com o
 * conteúdo atual e o corpo é o mesmo da criação (o backend recusa editar freela encerrado).
 */
function FreelanceDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: FreelanceView;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [scope, setScope] = useState(initial?.scope ?? "");
  // O valor gravado é reais inteiros (dinheiro) ou milésimos de faísca — o texto volta na unidade
  // que a pessoa digitaria em cada caso.
  const initialBudget = (value: number) =>
    initial ? (initial.paymentMethod === "CASH" ? String(value) : formatFaisca(value)) : "";
  const [budgetMin, setBudgetMin] = useState(initialBudget(initial?.budgetMin ?? 0));
  const [budgetMax, setBudgetMax] = useState(initialBudget(initial?.budgetMax ?? 0));
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"FAISCAS" | "CASH">(
    initial?.paymentMethod ?? "FAISCAS",
  );

  const parseBudget = paymentMethod === "CASH" ? parseBrlInput : parseFaiscaInput;
  const min = parseBudget(budgetMin) ?? 0;
  const max = parseBudget(budgetMax) ?? 0;
  const valid =
    title.trim().length >= 3 &&
    scope.trim().length >= 20 &&
    min > 0 &&
    max >= min &&
    Boolean(deadline);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: title.trim(),
        scope: scope.trim(),
        budgetMin: min,
        budgetMax: max,
        deadline,
        paymentMethod,
      };
      return initial ? freelancesApi.update(initial.id, body) : freelancesApi.create(body);
    },
    onSuccess: () => {
      toast(
        initial ? texts.jobs.freelancePage.editSuccess : texts.jobs.freelancePage.saved,
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["freelances"] });
      if (!initial) {
        setTitle("");
        setScope("");
        setBudgetMin("");
        setBudgetMax("");
        setDeadline("");
        setPaymentMethod("FAISCAS");
      }
      onOpenChange(false);
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast(
        code === "FREELANCE_CLOSED"
          ? texts.jobs.freelancePage.editClosed
          : code === "NOT_OWNER"
            ? texts.jobs.freelancePage.notOwner
            : error instanceof Error
              ? error.message
              : initial
                ? texts.jobs.freelancePage.editError
                : texts.jobs.freelancePage.error,
        "error",
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">
            {initial ? texts.jobs.freelancePage.editTitle : texts.jobs.freelancePage.createTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={texts.jobs.freelancePage.titleField}
            maxLength={200}
          />
          <Textarea
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            placeholder={texts.jobs.freelancePage.scopeField}
            rows={5}
            maxLength={4000}
          />

          <label className="block space-y-1 text-sm">
            <span className="text-text-subtle">{texts.jobs.freelancePage.payment}</span>

            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as "FAISCAS" | "CASH")}
              aria-label={texts.jobs.freelancePage.payment}
              className="h-10 w-full rounded-lg border border-border-soft bg-surface-card px-3 text-sm text-text-strong outline-none focus:border-primary"
            >
              <option value="FAISCAS">{texts.jobs.freelancePage.paymentFaiscas}</option>

              <option value="CASH">{texts.jobs.freelancePage.paymentCash}</option>
            </select>

            <p className="text-xs text-text-subtle">
              {paymentMethod === "CASH"
                ? texts.jobs.freelancePage.paymentCashHint
                : texts.jobs.freelancePage.paymentFaiscasHint}
            </p>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              value={budgetMin}
              onChange={(event) => setBudgetMin(event.target.value)}
              placeholder={
                paymentMethod === "CASH"
                  ? texts.jobs.freelancePage.budgetMinCash
                  : texts.jobs.freelancePage.budgetMin
              }
              inputMode="decimal"
            />
            <Input
              value={budgetMax}
              onChange={(event) => setBudgetMax(event.target.value)}
              placeholder={
                paymentMethod === "CASH"
                  ? texts.jobs.freelancePage.budgetMaxCash
                  : texts.jobs.freelancePage.budgetMax
              }
              inputMode="decimal"
            />
          </div>

          <Input
            type="date"
            value={deadline}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDeadline(event.target.value)}
            aria-label={texts.jobs.freelancePage.deadlineField}
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              {texts.projects.editor.cancel}
            </Button>

            <Button
              className="rounded-full"
              disabled={!valid || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending
                ? texts.projects.editor.saving
                : initial
                  ? texts.jobs.freelancePage.saveEdit
                  : texts.jobs.freelancePage.submit}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
