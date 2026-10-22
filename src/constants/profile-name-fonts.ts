import type { ProfileNameFont } from "@/types/application/cosmetics/profile-name-font";
import type { ProfileNameStyle } from "@/types/application/cosmetics/profile-name-style";
import type { ProfileNameTheme } from "@/types/application/cosmetics/profile-name-theme";

export const PROFILE_NAME_FONTS: Record<ProfileNameFont, string> = {
  SYSTEM: "ui-sans-serif, system-ui, sans-serif",
  SERIF: 'Georgia, "Times New Roman", serif',
  MONO: '"Courier New", Courier, monospace',
  ROUNDED: '"Trebuchet MS", ui-sans-serif, sans-serif',
  DISPLAY: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  PIXEL: '"Press Start 2P", "Courier New", monospace',
  GOTHIC: '"UnifrakturCook", "Old English Text MT", Georgia, serif',
};

export const PROFILE_NAME_COLORS = ["#ff7a18", "#ff4fa3", "#8b5cf6", "#22c55e", "#0ea5e9"];

export const PROFILE_NAME_THEMES: Record<
  ProfileNameTheme,
  { font: ProfileNameFont; colors: string[]; className: string }
> = {
  DEFAULT: { font: "SYSTEM", colors: ["#ff7a18"], className: "" },
  PIXEL: { font: "PIXEL", colors: ["#9cff57", "#36d98a"], className: "profile-name-theme-pixel" },
  GOTHIC: {
    font: "GOTHIC",
    colors: ["#e7c6ff", "#9b5de5"],
    className: "profile-name-theme-gothic",
  },
  NEON: {
    font: "DISPLAY",
    colors: ["#ff4fa3", "#8b5cf6", "#0ea5e9"],
    className: "profile-name-theme-neon",
  },
  GLITCH: { font: "MONO", colors: ["#22d3ee", "#ff4fa3"], className: "profile-name-theme-glitch" },
  CANDY: {
    font: "ROUNDED",
    colors: ["#ff7ab6", "#ffc6ff", "#ffd166"],
    className: "profile-name-theme-candy",
  },
};

export function profileNameFontFamily(font: ProfileNameStyle["font"] | null | undefined): string {
  return PROFILE_NAME_FONTS[font ?? "SYSTEM"];
}

export function profileNameTheme(theme: ProfileNameTheme | null | undefined) {
  return PROFILE_NAME_THEMES[theme ?? "DEFAULT"];
}

export function profileNameThemePaint(
  theme: ProfileNameTheme | null | undefined,
  color?: string | null,
) {
  const definition = profileNameTheme(theme);
  const colors = color ? [color, ...definition.colors.slice(1)] : definition.colors;
  return colors.length > 1 ? `linear-gradient(90deg, ${colors.join(", ")})` : colors[0];
}
