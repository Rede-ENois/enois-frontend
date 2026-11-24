import { useState } from "react";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Outlet, createFileRoute, useMatchRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import { MuraisLista, MuralFormulario } from "@rede-enois/design-system/domain";
import { Button, PageHeader, useToast } from "@rede-enois/design-system/ui";
import { z } from "zod";

import { muraisApi } from "@/lib/api";
import { mensagemDeErroMural as mensagemDeErro } from "@/lib/murais-helpers";
import { requireAuth } from "@/lib/require-auth";
import { useDebouncedValue } from "@/lib/use-debounced-value";

import { AppContainer } from "@/components/app-container";

/**
 * Murais: coleções colaborativas do Explorar. A página lista os quadros e cria um novo; a
 * publicação colada mora na página de cada mural. O desenho vive no design system; aqui ficam
 * os dados e os avisos.
 */
export const Route = createFileRoute("/murais")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.murais.seoTitle }] }),
  component: MuraisRota,
});

/**
 * A listagem é MÃE do quadro do mural (`/murais/{id}`): sem devolver o filho pelo `Outlet`, o
 * roteador desenha a lista no lugar do quadro e clicar num cartão só troca o endereço.
 */
function MuraisRota() {
  const matchRoute = useMatchRoute();
  return matchRoute({ to: "/murais", fuzzy: false }) ? <MuraisPage /> : <Outlet />;
}

function MuraisPage() {
  const navigate = useNavigate();
  const [criando, setCriando] = useState(false);
  const [busca, setBusca] = useState("");
  const termo = useDebouncedValue(busca.trim(), 300);

  const lista = useInfiniteQuery({
    queryKey: ["murais", termo],
    queryFn: ({ pageParam }) => muraisApi.list(pageParam, termo || undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  });

  const murais = lista.data?.pages.flatMap((page) => page.items) ?? [];
  const estado = lista.isLoading
    ? ({ kind: "loading" } as const)
    : lista.isError
      ? ({ kind: "error" } as const)
      : murais.length === 0
        ? ({ kind: "empty" } as const)
        : ({ kind: "ready" } as const);

  return (
    <AppContainer>
      <PageHeader title={texts.murais.title} description={texts.murais.subtitle} />

      <Button onClick={() => setCriando(true)}>{texts.murais.criar}</Button>

      <MuraisLista
        murais={murais}
        state={estado}
        onOpen={(muralId) => void navigate({ to: "/murais/$muralId", params: { muralId } })}
        busca={{ valor: busca, aoMudar: setBusca }}
        hasMore={lista.hasNextPage ?? false}
        loadingMore={lista.isFetchingNextPage}
        onLoadMore={() => void lista.fetchNextPage()}
      />
      <CriacaoMural aberto={criando} onFechar={() => setCriando(false)} />
    </AppContainer>
  );
}

function CriacaoMural({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const criar = useMutation({
    mutationFn: (dados: { title: string; description: string }) =>
      muraisApi.create({ title: dados.title, description: dados.description }),
    onSuccess: (mural) => {
      toast(texts.murais.criado, "success");
      onFechar();
      void queryClient.invalidateQueries({ queryKey: ["murais"] });
      void navigate({ to: "/murais/$muralId", params: { muralId: mural.id } });
    },
    onError: (erro) => {
      toast(mensagemDeErro(erro, texts.murais.erroCriar), "error");
    },
  });

  return (
    <MuralFormulario
      aberto={aberto}
      ocupado={criar.isPending}
      onSalvar={(dados) => {
        void criar.mutateAsync(dados).catch(() => undefined);
      }}
      onFechar={onFechar}
    />
  );
}
