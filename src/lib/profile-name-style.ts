import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";
import type { ProfileNameFields } from "@/types/application/profile/profile-name-fields";

/** Estilo do nome quando o perfil já veio completo (mensagens, ranking, listas). */
export function authorNameStyle(
  profile: ProfileNameFields | null | undefined,
): AuthorNameStyle | null {
  if (!profile) return null;
  if (!profile.nameTheme && !profile.nameFont && !profile.nameColor && !profile.nameplate)
    return null;
  return {
    theme: profile.nameTheme,
    font: profile.nameFont,
    color: profile.nameColor,
    nameplate: profile.nameplate,
  };
}
