/**
 * The brand page ground per mode, the DS `--background` token (light, then dark). Used where a hex
 * is needed before or without the CSS (theme fallbacks, gallery packages). `brand-ground.test.ts`
 * keeps it in step with the DS stylesheet.
 */
export const BRAND_GROUND = { light: "#f7f4fb", dark: "#15111c" } as const;
