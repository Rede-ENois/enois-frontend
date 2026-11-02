import type { SandboxedHtmlFrameProps } from "@rede-enois/design-system/patterns";

/** O que o app decide (tema e modo lite); quem chama só descreve o conteúdo e o tamanho. */
export type SandboxedHtmlFrameViewProps = Omit<
  SandboxedHtmlFrameProps,
  "theme" | "themeStyleElementId" | "lite"
>;
