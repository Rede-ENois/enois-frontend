/** Pessoa sugerida pelo pacote inicial (`GET /me/onboarding/starter-pack`). */
export type StarterPackPerson = {
  id: string;
  username: string;
  name: string;
  headline: string | null;
  avatar: string | null;
};
