/** Comunidade sugerida pelo pacote inicial (`GET /me/onboarding/starter-pack`). */
export type StarterPackCommunity = {
  id: string;
  name: string;
  description: string | null;
  /** Código do assunto (enum do backend), não o rótulo. */
  topic: string | null;
  avatar: string | null;
  memberCount: number;
};
