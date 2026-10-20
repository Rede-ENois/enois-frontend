import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import type { ServiceContract } from "@/types/application/services/service-contract";
import type { ServiceListing } from "@/types/application/services/service-listing";
import type { ServiceRequest } from "@/types/application/services/service-request";
import { Briefcase, Handshake, Send, Sparkles } from "lucide-react";

import { servicesApi } from "@/lib/api";
import { formatFaisca, parseFaiscaInput } from "@/lib/faisca";
import { isAuthenticated } from "@/lib/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/servicos")({
  head: () => ({ meta: [{ title: "Serviços · Énóis" }] }),
  component: Servicos,
});

/**
 * Serviços freelance (Fase 5): profissionais OFERTECem (modelo Fiverr) e pessoas/
 * empresas PEDem (orçamento em faixa). Tudo pago em faíscas com escrow — o contrato
 * de escopo (entregáveis) existe antes de qualquer faísca mover.
 */
function Servicos() {
  const authenticated = isAuthenticated();
  const catalog = useQuery({
    queryKey: ["services", "catalog"],
    queryFn: () => servicesApi.catalog(),
  });
  const mine = useQuery({
    queryKey: ["services", "mine"],
    queryFn: () => servicesApi.mine(),
    enabled: authenticated,
  });
  const [tab, setTab] = useState<"ofertas" | "pedidos">("ofertas");

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Briefcase className="h-6 w-6 text-primary" />
              Serviços
            </h1>

            <p className="mt-1 text-sm text-text-subtle">
              Trabalho entre pessoas, pago em faíscas. Toda contratação retém as faíscas até você
              aceitar a entrega — recusa devolve tudo.
            </p>
          </div>
          {authenticated && (
            <div className="flex shrink-0 gap-2">
              <NewOfferButton />
              <NewRequestButton />
            </div>
          )}
        </header>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${tab === "ofertas" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-subtle"}`}
            onClick={() => setTab("ofertas")}
          >
            Ofertas
          </button>

          <button
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${tab === "pedidos" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-subtle"}`}
            onClick={() => setTab("pedidos")}
          >
            Pedidos abertos
          </button>
        </div>

        {mine.data && (
          <MyContracts
            contracts={mine.data.contratosComoComprador}
            sellerContracts={mine.data.contratosComoVendedor}
          />
        )}

        {catalog.isLoading ? (
          <p className="py-10 text-center text-sm text-text-subtle">Carregando…</p>
        ) : catalog.isError ? (
          <p className="py-10 text-center text-sm text-text-subtle">
            Não foi possível carregar agora.
          </p>
        ) : tab === "ofertas" ? (
          (catalog.data?.ofertas?.length ?? 0) === 0 ? (
            <p className="py-10 text-center text-sm text-text-subtle">
              Nenhuma oferta publicada ainda.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {catalog.data!.ofertas.map((l) => (
                <OfferCard key={l.id} listing={l} />
              ))}
            </ul>
          )
        ) : (catalog.data?.pedidos?.length ?? 0) === 0 ? (
          <p className="py-10 text-center text-sm text-text-subtle">Nenhum pedido aberto ainda.</p>
        ) : (
          <ul className="space-y-3">
            {catalog.data!.pedidos.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </ul>
        )}
      </div>
    </AppContainer>
  );
}

function Price({ value }: { value: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary-text">
      <Sparkles className="h-3.5 w-3.5" />
      {formatFaisca(value)}
    </span>
  );
}

function OfferCard({ listing }: { listing: ServiceListing }) {
  const queryClient = useQueryClient();
  const buy = useMutation({
    mutationFn: () => servicesApi.buyListing(listing.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  return (
    <li className="surface-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate font-semibold">{listing.title}</span>

          <span className="text-xs text-text-subtle">
            {listing.category} · entrega em {listing.deliveryDays} dia
            {listing.deliveryDays > 1 ? "s" : ""}
          </span>
        </span>

        <Price value={listing.price} />
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-text-subtle">{listing.description}</p>

      <p className="mt-1 text-xs text-text-subtle">Entrega: {listing.deliverables}</p>

      <Button
        size="sm"
        className="mt-3 w-full rounded-full"
        disabled={buy.isPending}
        onClick={() => buy.mutate()}
      >
        {buy.isPending ? "Retendo faíscas…" : "Contratar (escrow)"}
      </Button>
    </li>
  );
}

function RequestCard({ request }: { request: ServiceRequest }) {
  const authenticated = isAuthenticated();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const propose = useMutation({
    mutationFn: () =>
      servicesApi.propose(request.id, { message, price: Math.round(Number(price) || 0) }),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  return (
    <li className="surface-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate font-semibold">{request.title}</span>

          <span className="text-xs text-text-subtle">{request.category}</span>
        </span>

        <span className="shrink-0 text-sm font-semibold text-primary-text">
          {formatFaisca(request.budgetMin)}–{formatFaisca(request.budgetMax)} faíscas
        </span>
      </div>

      <p className="mt-2 text-sm text-text-subtle">{request.description}</p>

      <p className="mt-1 text-xs text-text-subtle">Entregáveis: {request.deliverables}</p>
      {authenticated && request.status === "OPEN" && !open && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 rounded-full"
          onClick={() => setOpen(true)}
        >
          Mandar proposta
        </Button>
      )}
      {open && (
        <div className="mt-3 space-y-2">
          <Textarea
            rows={3}
            placeholder="Como você faria? (mínimo 10 caracteres)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <Input
              inputMode="decimal"
              placeholder={`${formatFaisca(request.budgetMin)}–${formatFaisca(request.budgetMax)}`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <Button
              size="sm"
              className="rounded-full gap-1"
              disabled={
                propose.isPending ||
                message.trim().length < 10 ||
                (() => {
                  const mf = parseFaiscaInput(price);
                  return mf === null || mf < request.budgetMin || mf > request.budgetMax;
                })()
              }
              onClick={() => propose.mutate()}
            >
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function MyContracts({
  contracts,
  sellerContracts,
}: {
  contracts: ServiceContract[];
  sellerContracts: ServiceContract[];
}) {
  const queryClient = useQueryClient();
  const act = useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string;
      action: "aceitar" | "reembolso" | "entregar";
      note?: string;
    }) =>
      action === "aceitar"
        ? servicesApi.accept(id)
        : action === "reembolso"
          ? servicesApi.refund(id)
          : servicesApi.deliver(id, note ?? ""),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });
  const [note, setNote] = useState("");

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold text-text-subtle">Meus contratos</h2>

      <ul className="space-y-2">
        {contracts.map((c) => (
          <li key={c.id} className="surface-card flex flex-wrap items-center gap-2 p-3">
            <span className="min-w-0 flex-1 text-sm">
              Contratei · {c.price} faíscas
              {c.escrowState === "HELD" &&
                (c.deliverableNote ? ` · entrega: ${c.deliverableNote}` : " · aguardando entrega")}
            </span>

            <StateChip state={c.escrowState} />
            {c.escrowState === "HELD" && (
              <>
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={act.isPending}
                  onClick={() => act.mutate({ id: c.id, action: "aceitar" })}
                >
                  Aceitar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={act.isPending}
                  onClick={() => act.mutate({ id: c.id, action: "reembolso" })}
                >
                  Reembolso
                </Button>
              </>
            )}
          </li>
        ))}
        {sellerContracts.map((c) => (
          <li key={c.id} className="surface-card flex flex-wrap items-center gap-2 p-3">
            <span className="min-w-0 flex-1 text-sm">
              Executei · {c.price} faíscas
              {c.escrowState === "HELD" && !c.deliverableNote && " · entregue o que foi combinado"}
            </span>

            <StateChip state={c.escrowState} />
            {c.escrowState === "HELD" && !c.deliverableNote && (
              <div className="flex w-full items-center gap-2">
                <Input
                  placeholder="O que foi entregue (link, material…)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <Button
                  size="sm"
                  className="shrink-0 rounded-full gap-1"
                  disabled={act.isPending || !note.trim()}
                  onClick={() => act.mutate({ id: c.id, action: "entregar", note })}
                >
                  <Handshake className="h-4 w-4" />
                  Entregar
                </Button>
              </div>
            )}
          </li>
        ))}
        {contracts.length === 0 && sellerContracts.length === 0 && (
          <li className="text-sm text-text-subtle">Nenhum contrato ainda.</li>
        )}
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

function NewOfferButton() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    category: "design",
    title: "",
    description: "",
    deliverables: "",
    price: "30",
    deliveryDays: "7",
  });
  const queryClient = useQueryClient();
  const publish = useMutation({
    mutationFn: () =>
      servicesApi.publishListing({
        category: f.category.trim(),
        title: f.title.trim(),
        description: f.description.trim(),
        deliverables: f.deliverables.trim(),
        price: parseFaiscaInput(f.price) ?? 0,
        deliveryDays: Math.round(Number(f.deliveryDays) || 0),
      }),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  return (
    <>
      <Button size="sm" className="rounded-full gap-1" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" />
        Oferecer
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
            <h2 className="text-lg font-semibold">Oferecer um serviço</h2>

            <p className="mt-1 text-sm text-text-subtle">
              O que você faz, por quanto (faíscas) e o que entrega. Você pode ter até 5 ofertas
              abertas.
            </p>

            <div className="mt-3 space-y-2">
              <Input
                placeholder="Categoria (design, código, escrita…)"
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              />
              <Input
                placeholder="Título (mín. 5 caracteres)"
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
              />
              <Textarea
                rows={3}
                placeholder="Descrição (mín. 20 caracteres)"
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
              />
              <Input
                placeholder="Entregáveis (obrigatório)"
                value={f.deliverables}
                onChange={(e) => setF({ ...f, deliverables: e.target.value })}
              />

              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={f.price}
                  onChange={(e) => setF({ ...f, price: e.target.value })}
                />
                <Input
                  type="number"
                  min={1}
                  value={f.deliveryDays}
                  onChange={(e) => setF({ ...f, deliveryDays: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Fechar
              </Button>

              <Button
                disabled={
                  publish.isPending ||
                  f.title.trim().length < 5 ||
                  f.description.trim().length < 20 ||
                  !f.deliverables.trim()
                }
                onClick={() => publish.mutate()}
              >
                Publicar oferta
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NewRequestButton() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    category: "código",
    title: "",
    description: "",
    deliverables: "",
    budgetMin: "40",
    budgetMax: "80",
  });
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: () =>
      servicesApi.createRequest({
        category: f.category.trim(),
        title: f.title.trim(),
        description: f.description.trim(),
        deliverables: f.deliverables.trim(),
        budgetMin: parseFaiscaInput(f.budgetMin) ?? 0,
        budgetMax: parseFaiscaInput(f.budgetMax) ?? 0,
      }),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full gap-1"
        onClick={() => setOpen(true)}
      >
        <Briefcase className="h-4 w-4" />
        Pedir
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
            <h2 className="text-lg font-semibold">Pedir um serviço</h2>

            <p className="mt-1 text-sm text-text-subtle">
              Descreva o que precisa e o orçamento (faixa). Profissionais propõem dentro dela — quem
              você escolher recebe as faíscas em escrow.
            </p>

            <div className="mt-3 space-y-2">
              <Input
                placeholder="Categoria"
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              />
              <Input
                placeholder="Título (mín. 5 caracteres)"
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
              />
              <Textarea
                rows={3}
                placeholder="Descrição (mín. 20 caracteres)"
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
              />
              <Input
                placeholder="Entregáveis e critérios de aceite (obrigatório)"
                value={f.deliverables}
                onChange={(e) => setF({ ...f, deliverables: e.target.value })}
              />

              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  placeholder="mín"
                  value={f.budgetMin}
                  onChange={(e) => setF({ ...f, budgetMin: e.target.value })}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="máx"
                  value={f.budgetMax}
                  onChange={(e) => setF({ ...f, budgetMax: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Fechar
              </Button>

              <Button
                disabled={
                  create.isPending ||
                  f.title.trim().length < 5 ||
                  f.description.trim().length < 20 ||
                  !f.deliverables.trim()
                }
                onClick={() => create.mutate()}
              >
                Publicar pedido
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
