export type Theme = "light" | "dark" | "system";

export type ResolvedTheme = Exclude<Theme, "system">;
