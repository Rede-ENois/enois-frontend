import type { SandboxedHtmlFrameViewProps } from "./post/sandboxed-html-frame-view-props";

/** Banner não é página: ocupa a faixa inteira e não cresce com o conteúdo. */
export type BannerHtmlFrameProps = Omit<SandboxedHtmlFrameViewProps, "innerPadding" | "autoHeight">;
