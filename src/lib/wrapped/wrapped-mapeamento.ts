import type { WrappedResposta } from "@/types/application/wrapped/wrapped-resposta";
import type { WrappedRetrospectiva as ApiRetrospectiva } from "@/types/application/wrapped/wrapped-retrospectiva";
import type { WrappedEstado, WrappedRetrospectiva } from "@rede-enois/design-system/domain";

/** O ano da retrospectiva em exibição. */
export const WRAPPED_ANO = 2026;

export function paraEstado(resposta: WrappedResposta | undefined): WrappedEstado {
  if (!resposta) return { kind: "loading" };
  switch (resposta.status) {
    case "READY":
      return resposta.retrospectiva
        ? { kind: "ready", retrospectiva: mapear(resposta.retrospectiva) }
        : { kind: "sem-dados" };
    case "NAO_ELEGIVEL":
      return { kind: "sem-dados" };
    case "NOT_READY":
      return { kind: "nao-pronta" };
    case "FORA_DA_JANELA":
    case "NOT_FOUND":
      return { kind: "fora-da-janela" };
  }
}

export function mapear(r: ApiRetrospectiva): WrappedRetrospectiva {
  return {
    ano: r.ano,
    dadosInsuficientes: r.dadosInsuficientes,
    metricas: {
      publicacoes: r.metricas.publicacoes,
      comentarios: r.metricas.comentariosProprios,
      interacoesFeitas:
        r.metricas.reacoesFeitas +
        r.metricas.comentariosFeitos +
        r.metricas.compartilhamentosFeitos +
        r.metricas.repostsFeitos +
        r.metricas.votosFeitos +
        r.metricas.salvos,
      interacoesRecebidas:
        r.metricas.reacoesRecebidas +
        r.metricas.comentariosRecebidos +
        r.metricas.compartilhamentosRecebidos +
        r.metricas.repostsRecebidos,
      comunidades: r.metricas.comunidadesParticipadas,
      diasAtivos: r.metricas.diasAtivos,
      mesMaisAtivo: r.metricas.mesMaisAtivo,
    },
    assuntosPublicados: r.assuntosPublicados,
    assuntosComentados: r.assuntosComentados,
    publicacoesMarcantes: r.publicacoesMarcantes.map((p) => ({
      id: p.id,
      href: `/post/${p.id}`,
      autorNome: p.autorNome ?? p.autorUsername ?? "",
      autorUsername: p.autorUsername ?? "",
      autorHref: p.autorUsername ? `/perfil/${p.autorUsername}` : null,
      trecho: p.trecho,
      metrica: p.metrica,
      motivo: p.motivo === "PROPRIA_ENGAJADA" ? "PROPRIA" : "PARTICIPACAO",
      dataLabel: p.dataIso,
    })),
    tretas: r.tretas.map((t) => ({
      publicacaoId: t.publicacaoId,
      href: `/post/${t.publicacaoId}`,
      comentarios: t.comentarios,
      diasDistintos: t.diasDistintos,
      duracaoDias: t.duracaoDias,
      trecho: t.trecho,
    })),
    interacoes: r.interacoes.map((i) => ({
      userId: i.userId,
      username: i.username,
      nome: i.nome,
      href: `/perfil/${i.username}`,
      vezes: i.vezes,
      tipo: i.tipo,
    })),
    ritmo: r.ritmo,
    perfil: r.perfil,
    impacto: r.impacto,
    comunidades: r.comunidades.map((c) => ({
      communityId: c.communityId,
      nome: c.nome,
      href: `/comunidades/${c.communityId}`,
      publicacoes: c.publicacoes,
    })),
    encerramento: r.encerramento,
  };
}

/** O texto curto do card compartilhado: só fatos da retrospectiva (tema principal), sem dado privado. */
export function textoCompartilhado(
  retrospectiva: WrappedRetrospectiva | null,
  nome: string,
): string {
  const tema = topAssunto(retrospectiva);
  const ano = retrospectiva?.ano ?? WRAPPED_ANO;
  const base = `${nome}, esse foi o meu ${ano} no Énóis!`;
  return tema ? `${base} Meu maior assunto foi ${tema}.` : base;
}

export function topAssunto(retrospectiva: WrappedRetrospectiva | null): string | null {
  if (!retrospectiva || retrospectiva.assuntosPublicados.length === 0) return null;
  return retrospectiva.assuntosPublicados[0].expressao;
}
