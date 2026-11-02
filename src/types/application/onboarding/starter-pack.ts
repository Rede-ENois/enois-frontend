import type { StarterPackCommunity } from "./starter-pack-community";
import type { StarterPackGroup } from "./starter-pack-group";
import type { StarterPackPerson } from "./starter-pack-person";

/** Sugestões do onboarding para os assuntos e habilidades escolhidos. */
export type StarterPack = {
  communities: StarterPackCommunity[];
  groups: StarterPackGroup[];
  people: StarterPackPerson[];
};
