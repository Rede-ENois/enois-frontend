import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import {
  DocumentoLegalAdmin,
  DocumentoLegalPublicarConfirmacao,
} from "@rede-enois/design-system/domain";

import { useIsPlatformAdmin } from "@/lib/admin/use-is-platform-admin";
import { TIPOS_DE_DOCUMENTO, documentosAdminApi, documentosApi } from "@/lib/documentos";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/admin/documentos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.documentos.admin.seoTitle }] }),
  component: AdminDocumentos,
});

const t = texts.documentos.admin;

const ROTULOS = {
  tituloSecao: t.title,
  apenasAdmin: t.intro,
  versao: texts.documentos.versao,
  vigente: texts.documentos.vigente,
  naoVigente: texts.documentos.naoVigente,
  tipo: t.tipo,
  titulo: t.tituloCampo,
  resumo: t.resumo,
  conteudo: t.conteudo,
  conteudoAjuda: t.conteudoAjuda,
  enviar: t.enviar,
  enviando: t.enviando,
  erro: t.erro,
  criarFeito: t.criarFeito,
  publicar: t.publicar,
  publicarAviso: t.publicarAviso,
  publicando: t.publicando,
  confirmar: t.confirmar,
  cancelar: t.cancelar,
  publicado: t.publicado,
  publicadoErro: t.publicadoErro,
  vazio: t.vazio,
  publicados: t.publicados,
  confirmacaoTitulo: t.confirmacaoTitulo,
};

/**
 * Criação do rascunho de uma versão nova dos documentos legais.
 *
 * Criar não publica: a tela só cria o rascunho, e a publicação é o segundo ato, com confirmação.
 * Como o backend, o botão de publicar só aparece depois do rascunho existir — e nada aqui roda
 * sozinho: sem o clique de publicar, o texto não entra em vigor para ninguém.
 */
function AdminDocumentos() {
  const admin = useIsPlatformAdmin();
  const client = useQueryClient();
  const [tipo, setTipo] = useState<string>(TIPOS_DE_DOCUMENTO[0]);
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [idRascunho, setIdRascunho] = useState<string | null>(null);
  const [versaoCriada, setVersaoCriada] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  // As versões publicadas, para o admin conferir o que está no ar antes de publicar outra.
  const historico = useQuery({
    queryKey: ["documentos", "admin", "historico"],
    queryFn: () =>
      Promise.all(TIPOS_DE_DOCUMENTO.map((item) => documentosApi.historico(item))).then((listas) =>
        listas.flat(),
      ),
    enabled: admin,
  });

  const criar = useMutation({
    mutationFn: () =>
      documentosAdminApi.criarRascunho({
        tipo,
        titulo: titulo.trim(),
        resumo: resumo.trim(),
        conteudo,
      }),
    onSuccess: (rascunho) => {
      setIdRascunho(rascunho.id);
      setVersaoCriada(rascunho.versao);
    },
  });

  const publicar = useMutation({
    mutationFn: (documentoId: string) => documentosAdminApi.publicar(documentoId),
    onSuccess: async () => {
      setConfirmando(false);
      setIdRascunho(null);
      await client.invalidateQueries({ queryKey: ["documentos"] });
    },
    onError: () => setConfirmando(false),
  });

  const rascunhoEstado = criar.isPending
    ? "enviando"
    : criar.isError
      ? "falhou"
      : idRascunho
        ? "criado"
        : "inicial";

  return (
    <AppContainer>
      <DocumentoLegalAdmin
        labels={ROTULOS}
        tipo={tipo}
        opcoesTipo={TIPOS_DE_DOCUMENTO.map((item) => ({
          valor: item,
          rotulo: texts.documentos.rotulo[item],
        }))}
        onTipo={setTipo}
        titulo={titulo}
        onTitulo={setTitulo}
        resumo={resumo}
        onResumo={setResumo}
        conteudo={conteudo}
        onConteudo={setConteudo}
        rascunho={{ estado: rascunhoEstado, versao: versaoCriada }}
        onEnviar={() => criar.mutate()}
        idRascunho={idRascunho}
        publicando={publicar.isPending}
        onPublicar={() => setConfirmando(true)}
        publicados={historico.data ?? []}
      >
        <DocumentoLegalPublicarConfirmacao
          labels={ROTULOS}
          aberta={confirmando}
          publicando={publicar.isPending}
          onConfirmar={() => idRascunho && publicar.mutate(idRascunho)}
          onCancelar={() => setConfirmando(false)}
        />
      </DocumentoLegalAdmin>
    </AppContainer>
  );
}
