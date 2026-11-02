import type { BannerHtmlFrameProps } from "@/types/components/banner-html-frame-props";

import { SandboxedHtmlFrame } from "./post/sandboxed-html-frame";

/**
 * HTML/CSS dentro de uma capa (perfil, perfil profissional, grupo).
 *
 * O quadro tem, por padrão, folga interna e altura do conteúdo — o certo para uma página lida
 * dentro do card, mas não para uma capa: a folga empurra o HTML do autor para a direita e para
 * baixo, e a altura própria briga com a faixa. Aqui os dois padrões são os da capa, uma vez só,
 * para nenhum banner novo esquecer.
 */
export function BannerHtmlFrame(props: BannerHtmlFrameProps) {
  return <SandboxedHtmlFrame {...props} innerPadding={false} autoHeight={false} />;
}
