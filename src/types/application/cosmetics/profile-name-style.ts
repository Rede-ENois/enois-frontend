import type { ProfileNameFont } from "@/types/application/cosmetics/profile-name-font";
import type { ProfileNameTheme } from "@/types/application/cosmetics/profile-name-theme";

/** Saved name style; a seasonal theme brings its own font and color, so both may be null. */
export type ProfileNameStyle = {
  theme: ProfileNameTheme;
  font: ProfileNameFont | null;
  color: string | null;
};
