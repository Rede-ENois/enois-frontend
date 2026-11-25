import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { FigurinhaComunidade } from "@/types/application/figurinhas/figurinha-comunidade";
import { FigurinhaComunidadeCatalogo } from "@rede-enois/design-system/domain";
import { PageHeader, useToast } from "@rede-enois/design-system/ui";

import { getCurrentUserId } from "@/lib/current-user";
import { figurinhasApi } from "@/lib/figurinhas/api";
import { cartoesDoCatalogo, useFigurinhasPage } from "@/lib/figurinhas/use-figurinhas";
import { useDebouncedValue } from "@/lib/use-debounced-value";

import { AppContainer } from "@/components/app-container";
import { EnvioDeFigurinha } from "@/components/figurinhas/envio-de-figurinha";
import { ReportDialog } from "@/components/post/report-dialog";

/**
 * Figurinhas da comunidade: o catálogo que quem entrou consulta, busca e denuncia, e o envio de uma
 * nova.
 *
 * O catálogo é só para quem entrou (`GET /figurinhas` responde 401 sem sessão, e o guard de rota
 * manda a visita ao login antes da consulta). A busca vai ao servidor (nome, código ou id) e só as
 * ativas voltam: figurinha desativada pela moderação sai daqui e do menu do `:` na mesma hora.
 */
export const Route = createFileRoute("/figurinhas")({
  head: () => ({
    meta: [
      { title: texts.figurinhas.pagina.seoTitle },
      { name: "description", content: texts.figurinhas.pagina.seoDescription },
    ],
  }),
  component: FigurinhasPage,
});

function FigurinhasPage() {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const termo = useDebouncedValue(busca.trim(), 300);
  const meuId = getCurrentUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [denunciando, setDenunciando] = useState<FigurinhaComunidade | null>(null);

  const catalogo = useFigurinhasPage(pagina, termo, Boolean(meuId));

  const remover = useMutation({
    mutationFn: (figurinha: FigurinhaComunidade) => figurinhasApi.remover(figurinha.id),
    onSuccess: () => {
      toast(texts.figurinhas.pagina.removida, "success");
      void queryClient.invalidateQueries({ queryKey: ["figurinhas"] });
    },
    onError: () => toast(texts.figurinhas.pagina.removidaErro, "error"),
  });

  const copiar = async (figurinha: FigurinhaComunidade) => {
    if (!meuId) {
      toast(texts.figurinhas.pagina.loginParaUsar, "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(figurinha.codigo);
      toast(texts.figurinhas.pagina.copiado, "success");
    } catch {
      toast(texts.figurinhas.pagina.copiarErro, "error");
    }
  };

  const cartoes = cartoesDoCatalogo({
    items: catalogo.data?.items ?? [],
    autores: catalogo.data?.autores ?? {},
    autorId: meuId ?? undefined,
    aoUsar: (figurinha) => void copiar(figurinha),
    aoDenunciar: setDenunciando,
    aoRemover: (figurinha) => remover.mutate(figurinha),
  });

  const estado = catalogo.isLoading
    ? "loading"
    : catalogo.isError
      ? "error"
      : cartoes.length === 0
        ? "empty"
        : "ready";

  return (
    <AppContainer>
      <PageHeader
        title={texts.figurinhas.pagina.title}
        description={texts.figurinhas.pagina.intro}
      />
      <EnvioDeFigurinha logado={!!meuId} />
      <FigurinhaComunidadeCatalogo
        cartoes={cartoes}
        total={catalogo.data?.total ?? null}
        termo={busca}
        onTermoChange={(valor) => {
          setBusca(valor);
          setPagina(1);
        }}
        page={catalogo.data?.page ?? 1}
        totalPages={catalogo.data?.totalPages ?? 1}
        state={estado}
        title={texts.figurinhas.pagina.title}
        intro={texts.figurinhas.pagina.intro}
        searchPlaceholder={texts.figurinhas.pagina.searchPlaceholder}
        labels={{
          loading: texts.figurinhas.pagina.loading,
          empty: texts.figurinhas.pagina.empty,
          error: texts.figurinhas.pagina.error,
          guest: texts.figurinhas.pagina.loginParaUsar,
          count: texts.figurinhas.pagina.count,
          page: texts.figurinhas.pagina.page,
          previous: texts.figurinhas.pagina.previous,
          next: texts.figurinhas.pagina.next,
        }}
        onPageChange={setPagina}
        onRetry={() => void catalogo.refetch()}
        retryLabel={texts.colecoes.tentarDeNovo}
      />

      {denunciando && (
        <ReportDialog
          targetId={denunciando.id}
          targetType="FIGURINHA_COMUNIDADE"
          open={!!denunciando}
          onOpenChange={(aberto) => {
            if (!aberto) setDenunciando(null);
          }}
        />
      )}
    </AppContainer>
  );
}
