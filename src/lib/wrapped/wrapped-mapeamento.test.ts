import type { WrappedResposta } from "@/types/application/wrapped/wrapped-resposta";
import type { WrappedRetrospectiva } from "@/types/application/wrapped/wrapped-retrospectiva";
import type { WrappedRetrospectiva as WrappedRetroDS } from "@rede-enois/design-system/domain";
import { describe, expect, it } from "vitest";

import { paraEstado, textoCompartilhado } from "./wrapped-mapeamento";

/**
 * A tradução da resposta do backend para os estados e view models do design system. O backend
 * entrega tudo calculado; este teste prende a tradução — principalmente o que NÃO pode acontecer:
 * status sem retrospectiva nunca vira uma retrospectiva vazia, e o texto compartilhado não carrega
 * dado privado.
 */

const base: WrappedRetrospectiva = {
  ano: 2026,
  versaoAlgoritmo: 1,
  dadosInsuficientes: false,
  metricas: {
    publicacoes: 3,
    comentariosProprios: 4,
    reacoesRecebidas: 10,
    comentariosRecebidos: 2,
    compartilhamentosRecebidos: 1,
    repostsRecebidos: 0,
    reacoesFeitas: 20,
    comentariosFeitos: 5,
    compartilhamentosFeitos: 1,
    repostsFeitos: 0,
    votosFeitos: 0,
    salvos: 0,
    comunidadesParticipadas: 2,
    diasAtivos: 30,
    mesMaisAtivo: 4,
  },
  assuntosPublicados: [{ expressao: "rust", ocorrencias: 4 }],
  assuntosComentados: [],
  publicacoesMarcantes: [
    {
      id: "p1",
      autorId: "u1",
      autorUsername: "ana",
      autorNome: "Ana",
      trecho: "texto público",
      motivo: "PROPRIA_ENGAJADA",
      metrica: 13,
      dataIso: "2026-05-01",
    },
  ],
  tretas: [],
  interacoes: [],
  ritmo: {
    diaSemanaMaisAtivo: 1,
    horaMaisAtiva: 9,
    mesMaisAtivo: 4,
    porMes: Array.from({ length: 12 }, () => 0),
    porDiaSemana: Array.from({ length: 7 }, () => 0),
    porHora: Array.from({ length: 24 }, () => 0),
    comportamento: { porTrimestre: [1, 1, 1, 1], sentido: "ESTAVEL" },
  },
  perfil: { principal: "CRIADOR", caracteristicas: [] },
  impacto: {
    publicacoesComConversa: 1,
    comentariosComReacao: 0,
    interacoesRecebidas: 13,
    comunidades: 2,
    credibilidade: 500,
  },
  comunidades: [],
  encerramento: { temaPrincipal: "rust", caracteristica: "CRIADOR", estatistica: null },
};

const resposta = (
  status: WrappedResposta["status"],
  r: WrappedRetrospectiva | null,
): WrappedResposta => ({
  status,
  retrospectiva: r,
  dadosInsuficientes: r ? r.dadosInsuficientes : null,
});

describe("wrapped-mapeamento", () => {
  it("sem resposta é carregando", () => {
    expect(paraEstado(undefined)).toEqual({ kind: "loading" });
  });

  it("FORA_DA_JANELA e NOT_FOUND nunca viram retrospectiva", () => {
    expect(paraEstado(resposta("FORA_DA_JANELA", null))).toEqual({ kind: "fora-da-janela" });
    expect(paraEstado(resposta("NOT_FOUND", null))).toEqual({ kind: "fora-da-janela" });
  });

  it("NOT_READY e NAO_ELEGIVEL não fabricam dada", () => {
    expect(paraEstado(resposta("NOT_READY", null))).toEqual({ kind: "nao-pronta" });
    expect(paraEstado(resposta("NAO_ELEGIVEL", null))).toEqual({ kind: "sem-dados" });
  });

  it("READY monta os view models com os links do app", () => {
    const estado = paraEstado(resposta("READY", base));
    expect(estado.kind).toBe("ready");
    if (estado.kind !== "ready") return;
    const r = estado.retrospectiva;
    expect(r.metricas.interacoesRecebidas).toBe(13);
    expect(r.publicacoesMarcantes[0].href).toBe("/post/p1");
    expect(r.publicacoesMarcantes[0].motivo).toBe("PROPRIA");
  });

  it("o texto compartilhado usa o tema, nunca conteúdo privado", () => {
    const texto = textoCompartilhado(paraEstadoRetro(), "Ana");
    expect(texto).toContain("Ana");
    expect(texto).toContain("rust");
    expect(texto).not.toContain("texto público");
  });

  it("sem retrospectiva o texto é neutro, sem quebrar", () => {
    expect(textoCompartilhado(null, "Ana")).toContain("Ana");
  });
});

function paraEstadoRetro(): WrappedRetroDS {
  const estado = paraEstado(resposta("READY", base));
  if (estado.kind !== "ready") throw new Error("esperava ready");
  return estado.retrospectiva;
}
