import type { PapoIntervaloTimelineView } from "@/types/application/paporeto/papo-intervalo-view";
import type { PapoAssuntoView } from "@/types/application/paporeto/papo-subject-view";

import { api } from "../api-client";

/**
 * Papo Reto: os assuntos que nomeiam a conversa da rede.
 *
 * É SÓ leitura — o Papo Reto é medido do que já é público (posts e comentários do feed),
 * nunca perguntado (isso seria enquete). A resposta vem agregada: subject dobrado, status
 * de trajetória, contagens do conjunto e timeline por bucket de hora, sem autor, sem texto
 * de publicação e sem link de quem falou.
 */
export const papoRetoApi = {
  /** O ranking global dos assuntos em alta (comunidade opcional vem depois). */
  ranking: () => api.get<PapoAssuntoView[]>("/papo-reto"),

  /** A timeline do assunto na janela pedida ("24h", "7d", "30d"). */
  timeline: (subject: string, janela: "24h" | "7d" | "30d") =>
    api.get<PapoIntervaloTimelineView[]>(
      `/papo-reto/${encodeURIComponent(subject)}/timeline?janela=${janela}`,
    ),

  /** Quantas falas a última semana analisou (a honestidade da amostra em número). */
  analise: () => api.get<number>("/papo-reto/analise"),
};
