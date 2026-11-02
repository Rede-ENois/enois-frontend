import type { CommunityTopic } from "./community-topic";

export type Community = {
  id: string;
  name: string;
  /** Opcional: uma comunidade pode nascer só com o nome e ganhar descrição depois. */
  description: string | null;
  /**
   * O assunto é **anulável**: o backend devolve `null` para a comunidade que não tem assunto
   * escolhido (medido na QA em 2026-10-24: `topic: null` na lista de comunidades).
   */
  topic: CommunityTopic | null;
  members: number;
  joined: boolean;
  cover: string | null;
  avatar: string | null;
  /** Capa em HTML/CSS sanitizado (igual à do perfil); nulo = usa a foto da capa. */
  bannerHtml?: string | null;
  /** Cidade e UF (sigla); ausentes quando a comunidade não tem lugar. */
  city?: string | null;
  state?: string | null;
};
