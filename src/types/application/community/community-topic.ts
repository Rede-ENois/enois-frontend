/**
 * Os assuntos válidos de uma comunidade — espelho de `TOPICS` (menos o filtro "Todas") e de
 * `ContentTaxonomy.TOPICS` no backend. A rede não é só de tecnologia: humor, saúde, casa, pets e
 * fé também têm lugar.
 */
export type CommunityTopic =
  | "TECNOLOGIA"
  | "ENGENHARIA"
  | "DESIGN"
  | "PRODUTO"
  | "LIDERANCA"
  | "CARREIRA"
  | "FREELANCE"
  /** Tudo o que não cabe nos outros — melhor que forçar a comunidade num assunto que não é o dela. */
  | "OUTROS"
  | "GAMES"
  | "ART"
  | "MUSIC"
  | "EDUCACAO"
  | "CIENCIA"
  | "EMPREENDER"
  | "FINANCAS"
  | "MARKETING"
  | "RH"
  | "DADOS"
  | "FUN"
  | "QUALIDADE_VIDA"
  | "SAUDE"
  | "VIAGEM"
  | "COMIDA"
  | "ESPORTES"
  | "CINEMA"
  | "LIVROS"
  | "FOTOGRAFIA"
  | "CASA"
  | "PETS"
  | "PARENTALIDADE"
  | "RELACIONAMENTOS"
  | "MODA"
  | "POLITICA"
  | "RELIGIAO"
  /** Espaço acolhedor para desabafar (#725). */
  | "DESABAFO"
  /** Nichos pedidos no dia a dia da rede (2026-11-17). */
  | "MEIO_AMBIENTE"
  | "ANIMAIS"
  | "CULINARIA"
  | "JARDINAGEM"
  | "ARTESANATO"
  | "HISTORIA"
  | "FILOSOFIA"
  | "IDIOMAS";
