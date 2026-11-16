import { useState } from "react";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ColecaoFormulario, ColecoesLista } from "@rede-enois/design-system/domain";
import { Button, PageHeader, useToast } from "@rede-enois/design-system/ui";

import { colecoesApi } from "@/lib/api";
import { mensagemDeErroColecao as mensagemDeErro } from "@/lib/colecoes-helpers";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

/**
 * Coleções: suas pastas privadas de posts salvos. A página lista as pastas e cria uma nova; os
 * posts guardados moram na página de cada coleção. O desenho vive no design system; aqui ficam
 * os dados e os avisos.
 */
export const Route = createFileRoute("/colecoes")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.colecoes.seoTitle }] }),
  component: ColecoesPage,
});

function ColecoesPage() {
  const navigate = useNavigate();
  const [criando, setCriando] = useState(false);

  const lista = useInfiniteQuery({
    queryKey: ["colecoes"],
    queryFn: ({ pageParam }) => colecoesApi.list(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const colecoes = lista.data?.pages.flatMap((page) => page.items) ?? [];
  const estado = lista.isLoading
    ? ({ kind: "loading" } as const)
    : lista.isError
      ? ({ kind: "error" } as const)
      : colecoes.length === 0
        ? ({ kind: "empty" } as const)
        : ({ kind: "ready" } as const);

  return (
    <AppContainer>
      <PageHeader title={texts.colecoes.title} description={texts.colecoes.subtitle} />

      <Button onClick={() => setCriando(true)}>{texts.colecoes.criar}</Button>

      <ColecoesLista
        colecoes={colecoes}
        state={estado}
        onOpen={(colecaoId) => void navigate({ to: "/colecoes/$colecaoId", params: { colecaoId } })}
        hasMore={lista.hasNextPage ?? false}
        loadingMore={lista.isFetchingNextPage}
        onLoadMore={() => void lista.fetchNextPage()}
      />
      <CriacaoColecao aberto={criando} onFechar={() => setCriando(false)} />
    </AppContainer>
  );
}

function CriacaoColecao({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const criar = useMutation({
    mutationFn: (dados: { title: string; description: string }) =>
      colecoesApi.create({ title: dados.title, description: dados.description }),
    onSuccess: (colecao) => {
      toast(texts.colecoes.criado, "success");
      onFechar();
      void queryClient.invalidateQueries({ queryKey: ["colecoes"] });
      void navigate({ to: "/colecoes/$colecaoId", params: { colecaoId: colecao.id } });
    },
    onError: (erro) => {
      toast(mensagemDeErro(erro, texts.colecoes.erroCriar), "error");
    },
  });

  return (
    <ColecaoFormulario
      aberto={aberto}
      ocupado={criar.isPending}
      onSalvar={(dados) => {
        void criar.mutateAsync(dados).catch(() => undefined);
      }}
      onFechar={onFechar}
    />
  );
}
