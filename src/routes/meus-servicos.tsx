import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ServiceListing } from "@/types/application/services/service-listing";
import type { ServiceListingInput } from "@/types/application/services/service-listing-input";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  Label,
  LoadingState,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import { Pencil, Plus, Search, Trash2, Wrench } from "lucide-react";

import { ApiError, servicesApi } from "@/lib/api";
import { formatBrlCents, formatFaisca, parseFaiscaInput } from "@/lib/faisca";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/meus-servicos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Gerenciar serviços · Énóis" }] }),
  component: MyServices,
});

function MyServices() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceListing | null>(null);
  const [removing, setRemoving] = useState<ServiceListing | null>(null);
  const [term, setTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mine = useQuery({ queryKey: ["services", "mine"], queryFn: () => servicesApi.mine() });

  const remove = useMutation({
    mutationFn: (offer: ServiceListing) => servicesApi.removeListing(offer.id),
    onSuccess: () => {
      toast(texts.services.mine.removed, "success");
      setRemoving(null);
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      toast(
        error instanceof ApiError && error.code === "SERVICE_HAS_OPEN_CONTRACTS"
          ? texts.services.mine.removeBlocked
          : error instanceof Error
            ? error.message
            : texts.services.mine.removeFailed,
        "error",
      );
    },
  });

  if (mine.isLoading) {
    return (
      <AppContainer>
        <LoadingState />
      </AppContainer>
    );
  }

  const allOffers = mine.data?.ofertas ?? [];
  const needle = term.trim().toLowerCase();
  const offers = needle
    ? allOffers.filter((offer) =>
        `${offer.title} ${offer.description} ${offer.deliverables} ${offer.category}`
          .toLowerCase()
          .includes(needle),
      )
    : allOffers;

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Wrench className="h-6 w-6 text-primary" />

              <>Gerenciar serviços</>
            </h1>

            <p className="mt-1 text-sm text-text-subtle">
              Para qualquer prestador: publique o que você faz e cobre em <b>faíscas</b> (escrow; a
              taxa de 10% é só em compras) ou em <b>reais</b> (pagamento combinado direto, sem taxa
              do Énóis). Transferência direta de faíscas entre perfis é isenta.
            </p>
          </div>

          <Button className="w-auto rounded-full gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />

            <>Publicar serviço</>
          </Button>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <Input
            aria-label="Buscar nos meus serviços"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar nos meus serviços"
            className="pl-9"
          />
        </div>

        {offers.length === 0 ? (
          <div className="surface-card">
            <EmptyState
              icon={Wrench}
              title="Nenhum serviço publicado"
              description="Publique seu primeiro serviço com preço, prazo e o que está incluído."
            />
          </div>
        ) : (
          <ul className="space-y-3">
            {offers.map((offer) => (
              <ServiceRow
                key={offer.id}
                offer={offer}
                onEdit={setEditing}
                onRemove={setRemoving}
                removing={remove.isPending}
              />
            ))}
          </ul>
        )}

        <ServiceFormDialog
          open={open}
          onOpenChange={setOpen}
          title={texts.services.mine.newTitle}
          submit={texts.services.mine.publish}
          onSave={(input) => servicesApi.publishListing(input)}
          success={texts.services.mine.published}
        />
        <ServiceFormDialog
          key={editing?.id ?? "nova"}
          open={editing !== null}
          onOpenChange={(next) => {
            if (!next) setEditing(null);
          }}
          title={texts.services.mine.editTitle}
          submit={texts.services.mine.save}
          initial={editing}
          onSave={(input) => servicesApi.editListing(editing!.id, input)}
          success={texts.services.mine.saved}
        />

        <Dialog
          open={removing !== null}
          onOpenChange={(next) => {
            if (!next) setRemoving(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-normal">{texts.services.mine.removeTitle}</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-text-subtle">
              {texts.services.mine.removeBody(removing?.title ?? "")}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-full" onClick={() => setRemoving(null)}>
                {texts.services.mine.removeCancel}
              </Button>

              <Button
                className="rounded-full"
                disabled={remove.isPending}
                onClick={() => removing && remove.mutate(removing)}
              >
                {remove.isPending ? texts.services.mine.removing : texts.services.mine.remove}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppContainer>
  );
}

function ServiceRow({
  offer,
  onEdit,
  onRemove,
  removing,
}: {
  offer: ServiceListing;
  onEdit: (offer: ServiceListing) => void;
  onRemove: (offer: ServiceListing) => void;
  removing: boolean;
}) {
  const price =
    offer.currency === "BRL" ? formatBrlCents(offer.price) : `${formatFaisca(offer.price)} faíscas`;
  const removed = offer.status !== "ACTIVE";

  return (
    <li className="surface-card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-text-strong">{offer.title}</p>

        <p className="text-xs text-text-subtle">
          {offer.category} · entrega em {offer.deliveryDays} dia{offer.deliveryDays > 1 ? "s" : ""}{" "}
          · {removed ? "removido" : "aberto"}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-text">
        {price}
      </span>

      {/* Remover tira da vitrine e não apaga o contrato: por isso editar continua valendo para
          um serviço removido — é o caminho de corrigir o texto e publicar de novo. */}
      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        {removed && (
          <span className="mr-auto text-xs text-text-subtle sm:mr-0">
            {texts.services.mine.removedHint}
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-auto rounded-full gap-1.5"
          disabled={removing}
          onClick={() => onEdit(offer)}
        >
          <Pencil className="h-3.5 w-3.5" />

          <>{texts.services.mine.edit}</>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-auto rounded-full gap-1.5 text-destructive hover:text-destructive"
          disabled={removing || removed}
          onClick={() => onRemove(offer)}
        >
          <Trash2 className="h-3.5 w-3.5" />

          <>{texts.services.mine.remove}</>
        </Button>
      </div>
    </li>
  );
}

function ServiceFormDialog({
  open,
  onOpenChange,
  title: dialogTitle,
  submit: submitLabel,
  onSave,
  success,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  submit: string;
  onSave: (input: ServiceListingInput) => Promise<unknown>;
  success: string;
  /** O serviço a editar; sem ele o formulário publica um novo. */
  initial?: ServiceListing | null;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Desenvolvimento");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [deliverables, setDeliverables] = useState(initial?.deliverables ?? "");
  const [currency, setCurrency] = useState<"FAISCA" | "BRL">(
    initial?.currency === "BRL" ? "BRL" : "FAISCA",
  );
  // O preço volta para a mesma unidade do campo: faíscas em número, reais em centavos.
  const [price, setPrice] = useState(
    initial
      ? initial.currency === "BRL"
        ? (initial.price / 100).toFixed(2).replace(".", ",")
        : formatFaisca(initial.price)
      : "",
  );
  const [deliveryDays, setDeliveryDays] = useState(String(initial?.deliveryDays ?? 7));

  const amount =
    currency === "BRL"
      ? Math.round(Number(price.replace(/\./g, "").replace(",", ".") || 0) * 100)
      : (parseFaiscaInput(price) ?? 0);
  const days = Math.round(Number(deliveryDays) || 0);
  const valid =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    deliverables.trim().length >= 10 &&
    amount > 0 &&
    days >= 1 &&
    days <= 365;

  const save = useMutation({
    mutationFn: () =>
      onSave({
        category: category.trim(),
        title: title.trim(),
        description: description.trim(),
        deliverables: deliverables.trim(),
        price: amount,
        currency,
        deliveryDays: days,
      }),
    onSuccess: () => {
      toast(success, "success");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.code === "SERVICE_HAS_OPEN_CONTRACTS"
          ? texts.services.mine.priceLocked
          : error instanceof Error
            ? error.message
            : texts.services.mine.saveFailed;
      toast(message, "error");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            aria-label="Título do serviço"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do serviço"
            maxLength={160}
          />
          <Input
            aria-label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoria"
            maxLength={40}
          />
          <Textarea
            aria-label="O que você faz"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que você faz"
            rows={3}
            maxLength={2000}
          />
          <Textarea
            aria-label="O que está incluído (entregáveis)"
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            placeholder="O que está incluído (entregáveis)"
            rows={3}
            maxLength={1000}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-text-subtle">Moeda</Label>

              <select
                aria-label="Moeda"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "FAISCA" | "BRL")}
                className="h-10 w-full rounded-md border border-border-soft bg-surface-1 px-3 text-sm"
              >
                <option value="FAISCA">Faíscas</option>

                <option value="BRL">Reais (R$)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-text-subtle">
                {currency === "BRL" ? "Preço (R$)" : "Preço (faíscas)"}
              </Label>

              <Input
                aria-label={currency === "BRL" ? "Preço (R$)" : "Preço (faíscas)"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={currency === "BRL" ? "150,00" : "50"}
                inputMode="decimal"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-text-subtle">Prazo (dias)</Label>

              <Input
                aria-label="Prazo (dias)"
                type="number"
                min={1}
                max={365}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-text-subtle">
            {currency === "BRL"
              ? "Em reais o Énóis não cobra taxa: o pagamento é combinado direto com o cliente."
              : "Em faíscas o Énóis retém 10% ao liberar o pagamento. Em dinheiro não há taxa."}
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>

            <Button
              className="rounded-full"
              disabled={!valid || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? texts.services.mine.saving : submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
