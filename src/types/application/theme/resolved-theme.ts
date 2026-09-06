import type { Theme } from "./theme";

export type ResolvedTheme = Exclude<Theme, "system">;
