import type { ProfileNameFont } from "@/types/application/cosmetics/profile-name-font";
import type { ProfileNameTheme } from "@/types/application/cosmetics/profile-name-theme";

/** Campos de personalização do nome como vêm no perfil completo. */
export type ProfileNameFields = {
  nameTheme?: ProfileNameTheme | null;
  nameFont?: ProfileNameFont | null;
  nameColor?: string | null;
  nameplate?: string | null;
};
