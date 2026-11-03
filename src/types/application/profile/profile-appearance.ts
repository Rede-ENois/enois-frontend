import type { ProfileLook } from "@rede-enois/design-system/domain";

export type { ProfileLook };

/**
 * Aparência das duas vitrines da conta. Social e profissional são independentes: cada uma
 * guarda o próprio preset e os próprios ajustes finos.
 */
export type ProfileAppearance = {
  social: ProfileLook;
  professional: ProfileLook;
};

export const DEFAULT_PROFILE_LOOK: ProfileLook = {
  theme: null,
  accent: null,
  font: null,
  header: null,
  textures: null,
  borders: null,
  decoration: null,
};

export function emptyProfileAppearance(): ProfileAppearance {
  return { social: DEFAULT_PROFILE_LOOK, professional: DEFAULT_PROFILE_LOOK };
}

/** O documento do backend pode vir sem os dois lados: completa com "não escolheu". */
export function toProfileAppearance(
  value: ProfileAppearance | null | undefined,
): ProfileAppearance {
  return {
    social: { ...DEFAULT_PROFILE_LOOK, ...value?.social },
    professional: { ...DEFAULT_PROFILE_LOOK, ...value?.professional },
  };
}
