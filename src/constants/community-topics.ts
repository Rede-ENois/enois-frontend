import { texts } from "@/texts";
import type { CommunityTopic } from "@/types/application/community/community-topic";

/**
 * Os assuntos da plataforma, num lugar só — comunidades, compositor e personalização leem daqui.
 *
 * Começaram como os tópicos de comunidade e foram ampliados conforme a rede deixou de ser só de
 * tecnologia: humor, saúde, casa, pets, família, política, fé, moda. Os oito originais continuam
 * primeiro e válidos — comunidades e posts antigos não mudam de mão. "Todas" é filtro de vitrine,
 * não assunto.
 *
 * A lista espelha ContentTaxonomy.TOPICS no backend; um assunto só vale se os dois lados o
 * conhecem.
 */
export const TOPICS = [
  "Todas",
  "TECNOLOGIA",
  "ENGENHARIA",
  "DESIGN",
  "PRODUTO",
  "LIDERANCA",
  "CARREIRA",
  "FREELANCE",
  "OUTROS",
  // O que a plataforma realmente abriga.
  "GAMES",
  "ART",
  "MUSIC",
  "EDUCACAO",
  "CIENCIA",
  "EMPREENDER",
  "FINANCAS",
  "MARKETING",
  "RH",
  "DADOS",
  // A rede é para todos os nichos, não só tech.
  "FUN",
  "QUALIDADE_VIDA",
  "SAUDE",
  "VIAGEM",
  "COMIDA",
  "ESPORTES",
  "CINEMA",
  "LIVROS",
  "FOTOGRAFIA",
  "CASA",
  "PETS",
  "PARENTALIDADE",
  "RELACIONAMENTOS",
  "MODA",
  "POLITICA",
  "RELIGIAO",
  // A #725 pediu o espaço de desabafo; como assunto, entra também no filtro de conteúdo.
  "DESABAFO",
  // Nichos pedidos no dia a dia da rede (2026-11-17).
  "MEIO_AMBIENTE",
  "ANIMAIS",
  "CULINARIA",
  "JARDINAGEM",
  "ARTESANATO",
  "HISTORIA",
  "FILOSOFIA",
  "IDIOMAS",
] as const;

export const TOPIC_LABELS: Record<(typeof TOPICS)[number], string> = {
  Todas: texts.communities.topics.all,
  TECNOLOGIA: texts.communities.topics.TECNOLOGIA,
  ENGENHARIA: texts.communities.topics.ENGENHARIA,
  DESIGN: texts.communities.topics.DESIGN,
  PRODUTO: texts.communities.topics.PRODUTO,
  LIDERANCA: texts.communities.topics.LIDERANCA,
  CARREIRA: texts.communities.topics.CARREIRA,
  FREELANCE: texts.communities.topics.FREELANCE,
  OUTROS: texts.communities.topics.OUTROS,
  GAMES: texts.communities.topics.GAMES,
  ART: texts.communities.topics.ART,
  MUSIC: texts.communities.topics.MUSIC,
  EDUCACAO: texts.communities.topics.EDUCACAO,
  CIENCIA: texts.communities.topics.CIENCIA,
  EMPREENDER: texts.communities.topics.EMPREENDER,
  FINANCAS: texts.communities.topics.FINANCAS,
  MARKETING: texts.communities.topics.MARKETING,
  RH: texts.communities.topics.RH,
  DADOS: texts.communities.topics.DADOS,
  FUN: texts.communities.topics.FUN,
  QUALIDADE_VIDA: texts.communities.topics.QUALIDADE_VIDA,
  SAUDE: texts.communities.topics.SAUDE,
  VIAGEM: texts.communities.topics.VIAGEM,
  COMIDA: texts.communities.topics.COMIDA,
  ESPORTES: texts.communities.topics.ESPORTES,
  CINEMA: texts.communities.topics.CINEMA,
  LIVROS: texts.communities.topics.LIVROS,
  FOTOGRAFIA: texts.communities.topics.FOTOGRAFIA,
  CASA: texts.communities.topics.CASA,
  PETS: texts.communities.topics.PETS,
  PARENTALIDADE: texts.communities.topics.PARENTALIDADE,
  RELACIONAMENTOS: texts.communities.topics.RELACIONAMENTOS,
  MODA: texts.communities.topics.MODA,
  POLITICA: texts.communities.topics.POLITICA,
  RELIGIAO: texts.communities.topics.RELIGIAO,
  DESABAFO: texts.communities.topics.DESABAFO,
  MEIO_AMBIENTE: texts.communities.topics.MEIO_AMBIENTE,
  ANIMAIS: texts.communities.topics.ANIMAIS,
  CULINARIA: texts.communities.topics.CULINARIA,
  JARDINAGEM: texts.communities.topics.JARDINAGEM,
  ARTESANATO: texts.communities.topics.ARTESANATO,
  HISTORIA: texts.communities.topics.HISTORIA,
  FILOSOFIA: texts.communities.topics.FILOSOFIA,
  IDIOMAS: texts.communities.topics.IDIOMAS,
};

/**
 * Rótulo do assunto: a API devolve o **código** ("TECNOLOGIA") e a tela mostra a **palavra**
 * ("Tecnologia") — como o filtro de assuntos e o card do post já faziam.
 *
 * Assunto desconhecido (a API ganhou um assunto novo e o front ainda não sabe) cai no próprio
 * código, que é melhor do que um rótulo vazio. Comunidade **sem assunto** não devolve nada
 * (a API manda `null`).
 */
export function topicLabel(topic: CommunityTopic | null | undefined): string | null {
  if (!topic) return null;
  return TOPIC_LABELS[topic as keyof typeof TOPIC_LABELS] ?? topic;
}

/**
 * Assuntos oferecidos ao **publicar** no feed. "Todas" é filtro de vitrine, não assunto, e
 * `RELACIONAMENTOS` saiu da publicação por decisão de produto.
 *
 * O assunto continua válido na taxonomia (comunidades, interesses e posts antigos), então quem já
 * publicou com ele não perde o rótulo — só deixa de ser oferecido no compositor.
 */
export const POST_TOPICS = TOPICS.filter(
  (topic) => topic !== "Todas" && topic !== "RELACIONAMENTOS",
);
