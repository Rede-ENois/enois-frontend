import type { ProfileNameFont } from "@/types/application/cosmetics/profile-name-font";
import type { ProfileNameTheme } from "@/types/application/cosmetics/profile-name-theme";

export type ProfileNameStyle = {
  theme: ProfileNameTheme;
  font: ProfileNameFont;
  color: string;
};
