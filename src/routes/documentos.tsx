import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { DocumentoResumo } from "@/types/application/documentos/documento-resumo";
import type { DocumentoVigente } from "@/types/application/documentos/documento-vigente";
import type { DocumentoLegalPendente } from "@rede-enois/design-system/domain";
import { DocumentoLegalMeus } from "@rede-enois/design-system/domain";

import { ApiError } from "@/lib/api-client";
import { documentosApi } from "@/lib/documentos";
import { ogMetas } from "@/lib/seo";
import { useIsAuthenticated } from "@/lib/use-auth";

import { LegalLayout } from "@/components/legal-layout";
import { RichText } from "@/components/post/rich-text";

export const Route = createFileRoute("/documentos")({
  // Página pública: quem lê hoje tem de conseguir ver a versão em vigor mesmo sem conta.
  head: () => ({
    meta: [
      { title: texts.documentos.seoTitle },
      { name: "description", content: texts.documentos.seoDescription },
      ...ogMetas(texts.documentos.seoTitle, texts.documentos.seoDescription),
    ],
  }),
  component: Documentos,
});

const t = texts.documentos;

function comoPendencia(item: DocumentoResumo): DocumentoLegalPendente {
  return { id: item.id, tipo: item.tipo, titulo: item.titulo, versao: item.versao };
}

function vinheta(item: DocumentoResumo): string {
  return t.rotulo[item.tipo as keyof typeof t.rotulo] ?? item.titulo;
}

/**
 * "Meus documentos": o que está em vigor, o que falta aceitar e o histórico de versões.
 *
 * O aceite é explícito — o botão manda ao servidor o id da versão ABERTA, e o servidor recusa se ela
 * não for a atual (a pessoa não aceita um texto que não é o que vale). Abrir a página não marca
 * nada; sem sessão, a mesma leitura vem do endpoint público.
 */
function Documentos() {
  const logado = useIsAuthenticated();
  const client = useQueryClient();

  const situacao = useQuery({
    queryKey: ["documentos", "me"],
    queryFn: () => documentosApi.minhaSituacao(),
    enabled: logado,
    retry: false,
  });

  const vigentes = useQuery({
    queryKey: ["documentos", "vigentes"],
    queryFn: () => documentosApi.vigentes(),
    enabled: !logado,
  });

  // Uma leitura desligada (`enabled: false`) não está carregando nem falhou: com o `isLoading` da
  // leitura DESLIGADA, a tela abria como "pronta" antes de a visão certa chegar. Sem nenhum texto
  // para ela pousar em cima (página sem versão em vigor), ficava a visão de logado na tela — e,
  // ao voltar para a tela, a leitura do visitante ia para o cache e a visão de logado reaparecia.
  // Por isso qualquer busca em andamento também é "carregando".
  const leitura = logado ? situacao : vigentes;
  const state = leitura.isError
    ? "error"
    : leitura.isLoading || leitura.fetchStatus === "fetching"
      ? "loading"
      : "ready";

  const pendentes = situacao.data?.pendentes ?? [];
  // Texto inteiro de cada versão em vigor (o `/documentos/me` já traz; sem sessão, um por tipo).
  const textos = logado
    ? (situacao.data?.documentos ?? [])
    : (vigentes.data ?? []).map((documento) => ({ documento, conteudo: "", aceito: false }));
  const vazio = textos.length === 0;

  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [versaoAberta, setVersaoAberta] = useState<number | null>(null);
  const [erroAceite, setErroAceite] = useState<string | null>(null);

  // A primeira pendência abre sozinha: o texto que a pessoa tem de ler já está na tela.
  const tipoAberto =
    escolhido ?? (vazio ? null : (pendentes[0]?.tipo ?? textos[0]!.documento.tipo));

  const daVersao = useQuery({
    queryKey: ["documentos", "versao", tipoAberto, versaoAberta],
    queryFn: () => documentosApi.documento(tipoAberto!, versaoAberta ?? undefined),
    enabled: !!tipoAberto,
  });

  const historico = useQuery({
    queryKey: ["documentos", "historico", tipoAberto],
    queryFn: () => documentosApi.historico(tipoAberto!),
    enabled: !!tipoAberto,
  });

  const aceitar = useMutation({
    mutationFn: (documentoId: string) => documentosApi.aceitar(documentoId),
    onSuccess: async () => {
      setErroAceite(null);
      await client.invalidateQueries({ queryKey: ["documentos"] });
    },
    onError: (falha) => {
      const codigo = falha instanceof ApiError ? falha.code : undefined;
      setErroAceite(codigo === "DOCUMENTO_NAO_VIGENTE" ? t.aceiteDeVersaoAntiga : t.aceiteErro);
    },
  });

  const aberto: DocumentoVigente | null = daVersao.data ?? null;
  const texto = aberto
    ? {
        tipo: aberto.documento.tipo,
        titulo: `${vinheta(aberto.documento)} — ${t.versao(aberto.documento.versao)}`,
        conteudo: aberto.conteudo,
      }
    : null;

  const abrir = (tipo: string, versao: number | null = null) => {
    setErroAceite(null);
    setEscolhido(tipo);
    setVersaoAberta(versao);
  };

  // Só se aceita o texto que está aberto E é a versão em vigor daquele tipo.
  const pendenteDoTexto = texto ? pendentes.find((item) => item.tipo === texto.tipo) : undefined;
  const onAceitar =
    pendenteDoTexto && aberto?.documento.vigente ? () => aceitar.mutate(pendenteDoTexto.id) : null;

  return (
    <LegalLayout>
      <DocumentoLegalMeus
        title={t.title}
        intro={t.intro}
        logado={logado}
        state={state}
        loadingLabel={t.loading}
        errorLabel={t.error}
        pendentes={pendentes.map(comoPendencia)}
        texto={texto}
        aceitandoId={aceitar.isPending && pendenteDoTexto ? pendenteDoTexto.id : null}
        onAceitar={onAceitar}
        onLerAtual={(tipo) => abrir(tipo)}
        historico={(historico.data ?? [])
          .filter((item) => item.tipo === tipoAberto)
          .map((item) => ({
            tipo: item.tipo,
            versao: item.versao,
            titulo: vinheta(item),
            vigente: item.vigente,
            onAbrir: () => abrir(item.tipo, item.versao),
          }))}
        labels={{
          pendenciaTitulo: t.pendenciaTitulo,
          pendenciaIntro: erroAceite ?? t.pendenciaIntro,
          pendenciaIr: t.pendenciaIr,
          aceito: t.aceito,
          aceitar: t.aceitar,
          aceitando: t.aceitando,
          aceiteAviso: t.aceiteAviso,
          aceiteErro: t.aceiteErro,
          aceiteFeito: t.aceiteFeito,
          historico: t.historico,
          versao: t.versao,
          vigente: t.vigente,
          naoVigente: t.naoVigente,
          anterior: t.anterior,
        }}
      >
        {texto ? <RichText content={texto.conteudo} /> : null}
      </DocumentoLegalMeus>
    </LegalLayout>
  );
}
