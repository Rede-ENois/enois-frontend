import type { Profile } from "@/types/application/profile/profile";

export type Props = {
  profile: Profile;
  /** Opened by the page (from the "Editar perfil" menu). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
