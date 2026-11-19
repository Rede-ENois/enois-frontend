import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ColecaoDoPost } from "@/types/application/colecoes/colecao-do-post";
import type { MuralDoPost } from "@/types/application/murais/mural-do-post";
import type { AcaoDoSeletor } from "@/types/application/post-destinos/acao-do-seletor";
import type { ErroDoSeletor } from "@/types/application/post-destinos/erro-do-seletor";
import type { PostDestinoItem } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, colecoesApi, muraisApi, reactionsApi } from "@/lib/api";
import { savedStateFromAction } from "@/lib/feed/saved-posts";
import { useAuth } from "@/lib/use-auth";

/**
 * O seletor "para onde vai este post" do card: busca os meus murais e coleções já marcando onde
 * o post está (`tem`), e executa as duas ações do seletor com estado próprio.
 *
 * Guardar numa coleção exige o post salvo (regra do backend), então o fluxo salva antes quando
 * o card ainda não está salvo — e devolve o novo estado de "salvo" para o botão do card
 * acompanhar. O seletor só abre para quem tem sessão; sem sessão, o botão nem aparece.
 */
export function usePostDestinos(post: { id: string; type: string; community?: unknown }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pendentes, setPendentes] = useState<ReadonlySet<string>>(new Set());
  const [erro, setErro] = useState<ErroDoSeletor | null>(null);

  // Só faz sentido onde o post vive no feed: conteúdo de comunidade e tipos que não viajam
  // (página, artigo, blog, corporativo, momento, instante) ficam fora do seletor, como o repost.
  const disponivel =
    !!user &&
    !post.community &&
    !["PAGE", "ARTICLE", "BLOG", "BUSINESS", "MOMENT", "INSTANTE"].includes(post.type);

  const muraisQuery = useQuery({
    queryKey: ["post-destinos", "murais", post.id],
    queryFn: () => muraisApi.meus(post.id),
    enabled: open && disponivel,
    staleTime: 30_000,
  });
  const colecoesQuery = useQuery({
    queryKey: ["post-destinos", "colecoes", post.id],
    queryFn: () => colecoesApi.minhas(post.id),
    enabled: open && disponivel,
    staleTime: 30_000,
  });

  const murais: PostDestinoItem[] = (muraisQuery.data?.items ?? []).map((mural: MuralDoPost) => ({
    id: mural.id,
    title: mural.title,
    description: mural.description,
    count: mural.contributions,
    tem: mural.tem,
  }));
  const colecoes: PostDestinoItem[] = (colecoesQuery.data?.items ?? []).map(
    (colecao: ColecaoDoPost) => ({
      id: colecao.id,
      title: colecao.title,
      description: colecao.description,
      count: colecao.postCount,
      tem: colecao.tem,
    }),
  );

  const marcarPendente = (id: string, pendente: boolean) =>
    setPendentes((atual) => {
      const proximo = new Set(atual);
      if (pendente) proximo.add(id);
      else proximo.delete(id);
      return proximo;
    });

  /** A linha do seletor passa a mostrar `tem` sem esperar a releitura. */
  const marcarDestino = (acao: AcaoDoSeletor, destinoId: string) => {
    const chave = acao === "colar" ? "murais" : "colecoes";
    void queryClient.setQueryData(
      ["post-destinos", chave, post.id],
      (atual: { items: { id: string; tem: boolean }[] } | undefined) =>
        atual && {
          items: atual.items.map((item) => (item.id === destinoId ? { ...item, tem: true } : item)),
        },
    );
  };

  const colarNoMural = async (muralId: string) => {
    marcarPendente(muralId, true);
    setErro(null);
    try {
      await muraisApi.contribute(muralId, post.id);
      marcarDestino("colar", muralId);
      toast(texts.postDestinos.colado, "success");
      void queryClient.invalidateQueries({ queryKey: ["murais", muralId] });
    } catch (error) {
      const codigo = codigoDoErro(error);
      setErro({ destinoId: muralId, mensagem: mensagemDoErro(codigo, "colar") });
      toast(mensagemDoErro(codigo, "colar"), "error");
    } finally {
      marcarPendente(muralId, false);
    }
  };

  const guardarNaColecao = async (
    colecaoId: string,
    salvo: boolean,
    marcarSalvo: (v: boolean) => void,
  ) => {
    marcarPendente(colecaoId, true);
    setErro(null);
    try {
      if (!salvo) {
        // Regra do backend: só se guarda o que está salvo. Salvar aqui e seguir.
        const salvoAgora = await reactionsApi.save(post.id);
        if (savedStateFromAction(salvoAgora.status) === true) marcarSalvo(true);
      }
      await colecoesApi.addPost(colecaoId, post.id);
      marcarDestino("guardar", colecaoId);
      // O catálogo de "salvos" e o contador do card estavam dessincronizados por causa do
      // salvar implícito: releitura derruba os dois para a verdade do backend.
      void queryClient.invalidateQueries({ queryKey: ["colecoes", colecaoId] });
      void queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    } catch (error) {
      const codigo = codigoDoErro(error);
      setErro({ destinoId: colecaoId, mensagem: mensagemDoErro(codigo, "guardar") });
      toast(mensagemDoErro(codigo, "guardar"), "error");
    } finally {
      marcarPendente(colecaoId, false);
    }
  };

  return {
    disponivel,
    open,
    abrir: () => setOpen(true),
    onOpenChange: (next: boolean) => {
      setOpen(next);
      if (!next) setErro(null);
    },
    murais,
    colecoes,
    carregando: open && (muraisQuery.isPending || colecoesQuery.isPending),
    erro,
    pendentes,
    colarNoMural: (id: string) => void colarNoMural(id),
    guardarNaColecao: (id: string, salvo: boolean, marcarSalvo: (v: boolean) => void) =>
      void guardarNaColecao(id, salvo, marcarSalvo),
  };
}

/** O `ApiError` carrega o `code` do backend; sem ele, o fallback da feature. */
function codigoDoErro(error: unknown): string | null {
  return error instanceof ApiError ? (error.code ?? null) : null;
}
function mensagemDoErro(codigo: string | null, acao: AcaoDoSeletor): string {
  const t = texts.postDestinos;
  if (codigo === "IDEMPOTENCY_KEY_REQUIRED") return t.erro;
  if (acao === "colar") {
    if (codigo === "MURAL_NOT_FOUND") return texts.murais.naoEncontrado;
    if (codigo === "RATE_LIMITED") return texts.murais.rateLimitError;
    if (codigo === "POST_NOT_FOUND") return texts.murais.postNaoEncontrado;
    return texts.murais.erroColar;
  }
  if (codigo === "COLECAO_NOT_FOUND") return texts.colecoes.naoEncontrado;
  if (codigo === "RATE_LIMITED") return texts.colecoes.rateLimitError;
  if (codigo === "POST_NOT_FOUND") return texts.colecoes.postNaoEncontrado;
  return texts.colecoes.erroGuardar;
}
