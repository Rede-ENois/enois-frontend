import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import type { ServiceListing } from "@/types/application/services/service-listing";
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
import { Plus, Search, Wrench } from "lucide-react";

import { servicesApi } from "@/lib/api";
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
  const [term, setTerm] = useState("");
  const mine = useQuery({ queryKey: ["services", "mine"], queryFn: () => servicesApi.mine() });

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
              <ServiceRow key={offer.id} offer={offer} />
            ))}
          </ul>
        )}

        <NewServiceDialog open={open} onOpenChange={setOpen} />
      </div>
    </AppContainer>
  );
}

function ServiceRow({ offer }: { offer: ServiceListing }) {
  const price =
    offer.currency === "BRL" ? formatBrlCents(offer.price) : `${formatFaisca(offer.price)} faíscas`;

  return (
    <li className="surface-card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-text-strong">{offer.title}</p>

        <p className="text-xs text-text-subtle">
          {offer.category} · entrega em {offer.deliveryDays} dia{offer.deliveryDays > 1 ? "s" : ""}{" "}
          · {offer.status === "ACTIVE" ? "aberto" : "removido"}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-text">
        {price}
      </span>
    </li>
  );
}

function NewServiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Desenvolvimento");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<"FAISCA" | "BRL">("FAISCA");
  const [deliveryDays, setDeliveryDays] = useState("7");

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
      servicesApi.publishListing({
        category: category.trim(),
        title: title.trim(),
        description: description.trim(),
        deliverables: deliverables.trim(),
        price: amount,
        currency,
        deliveryDays: days,
      }),
    onSuccess: () => {
      toast("Serviço publicado.", "success");
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setDeliverables("");
      setPrice("");
    },
    onError: (error) =>
      toast(
        error instanceof Error ? error.message : "Não foi possível publicar o serviço.",
        "error",
      ),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">Publicar serviço</DialogTitle>
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
              {save.isPending ? "Publicando…" : "Publicar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
