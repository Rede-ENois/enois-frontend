import type {
  ProfileAppearance,
  ProfileLook,
} from "@/types/application/profile/profile-appearance";

/**
 * Qual visual o perfil deve desenhar.
 *
 * O visual do perfil é do DONO: quem visita vê o que ele escolheu. O tema do app é outra coisa e
 * continua sendo de quem olha. Por isso a aparência do visitante (`/me`) só entra quando ele é o
 * dono — a chave `["me"]` é compartilhada com o `useCurrentUser()` e fica em cache para qualquer
 * pessoa logada, então usá-la sem esse portão aplicaria a aparência do visitante no perfil alheio.
 *
 * A prévia do diálogo vence enquanto está aberta, para o dono ver a mudança antes de salvar.
 */
export function resolveProfileLook({
  isOwnProfile,
  preview,
  ownAppearance,
  publicLook,
}: {
  isOwnProfile: boolean;
  preview: ProfileAppearance | null;
  ownAppearance: ProfileAppearance | null | undefined;
  publicLook: ProfileLook | null | undefined;
}): ProfileLook | null {
  const ownLook = isOwnProfile ? (preview ?? ownAppearance)?.social : null;

  return ownLook ?? publicLook ?? null;
}
