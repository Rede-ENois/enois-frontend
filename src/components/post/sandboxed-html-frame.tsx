import { useCallback, useEffect, useRef, useState } from "react";

import type { SandboxedHtmlFrameProps } from "@/types/components/post/sandboxed-html-frame-props";

import { contentHeight } from "@/lib/html-frame-height";
import { useLiteMode } from "@/lib/use-lite-mode";
import { cn } from "@/lib/utils";

import { useFrameTheme } from "./use-frame-theme";

/**
 * Renderiza o HTML de uma pagina dentro de um iframe isolado.
 *
 * Aqui mora a seguranca do recurso, e ela nao depende do sanitizador estar perfeito:
 *
 * - `sandbox` sem `allow-scripts`: script nenhum executa, nem com evento inline. `allow-same-origin`
 *   ENTRA de proposito, e nao afrouxa isso: quem executa script e o `allow-scripts`, que continua
 *   fora. O que a mesma origem da e o direito de o NOSSO codigo medir a altura do documento
 *   (`contentDocument`), e e assim que o quadro cresce ate o conteudo em vez de rolar por dentro.
 *   Nao acrescente `allow-scripts` aqui: com a mesma origem, isso daria ao HTML colado o mesmo
 *   poder do app (storage e sessao de quem le) — e e justamente o que o recurso evita.
 * - CSP dentro do proprio documento (`default-src 'none'`): nenhuma requisicao sai dai, entao o
 *   HTML nao consegue chamar um servidor externo nem carregar pixel de rastreio. O que segue
 *   liberado e imagem/video em https e data: com CSS inline, que e o que dá aparencia a pagina.
 * - Sem `allow-top-navigation`: o pior caso de um link e navegar dentro do quadro — e como
 *   colocamos `<base target="_blank">`, o link abre em outra aba em vez de trocar a pagina do post.
 *
 * `srcDoc` (e nao insercao por DOM) garante que o conteudo nunca e interpretado no documento do
 * app: ele nasce dentro do iframe, ja sob o sandbox.
 */
export function SandboxedHtmlFrame({
  html,
  className,
  title,
  allowSoundCloudPlayer = false,
  innerPadding = true,
  autoHeight = true,
  maxHeight,
  clip = false,
}: SandboxedHtmlFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const theme = useFrameTheme(frame);
  // Modo lite: o iframe deixa de receber a permissão de autoplay — a página do autor continua
  // igual, só não sai tocando sozinha no meio do feed.
  const lite = useLiteMode();
  const [measured, setMeasured] = useState<number | null>(null);
  // Recorte nunca cresce: a altura vem da classe, e o HTML do autor se ajusta a ela ou é cortado.
  const grows = autoHeight && !clip;

  /**
   * Altura do conteudo, medida do lado de fora (a conta em `@/lib/html-frame-height`).
   *
   * Sem `allow-scripts` nao ha script dentro do quadro para avisar o tamanho — mas com
   * `allow-same-origin` o documento e legivel daqui, entao a conta sai no pai. O `ResizeObserver`
   * refaz a conta quando imagem ou fonte mudam o tamanho.
   */
  const measure = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const body = doc.body;
    const root = doc.documentElement;
    const conteudo = contentHeight({
      bodyScrollHeight: body?.scrollHeight ?? 0,
      bodyOffsetHeight: body?.offsetHeight ?? 0,
      rootScrollHeight: root?.scrollHeight ?? 0,
      rootClientHeight: root?.clientHeight ?? 0,
      rootOffsetHeight: root?.offsetHeight ?? 0,
    });
    if (conteudo <= 0) return;
    // O teto é o que quebra a realimentação: sem ele, um `height: 100vh` no HTML do autor cresce
    // junto com o quadro (o `vh` É a altura do quadro), o quadro cresce junto com o conteúdo, e a
    // página não para mais de crescer. Com o teto, o quadro para — e o que sobra rola por dentro.
    const altura = maxHeight ? Math.min(conteudo, maxHeight) : conteudo;
    setMeasured((atual) => (atual === altura ? atual : altura));
  }, [maxHeight]);

  useEffect(() => {
    if (!grows) return;
    const element = frame.current;
    if (!element) return;

    let observer: ResizeObserver | null = null;
    const attach = () => {
      measure();
      const body = element.contentDocument?.body;
      if (body && typeof ResizeObserver !== "undefined") {
        observer?.disconnect();
        observer = new ResizeObserver(() => measure());
        observer.observe(body);
      }
    };

    element.addEventListener("load", attach);
    // O `srcdoc` pode ter carregado antes deste efeito (primeira pintura): mede agora tambem.
    attach();
    window.addEventListener("resize", measure);

    return () => {
      element.removeEventListener("load", attach);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [grows, html, measure]);

  return (
    <iframe
      ref={frame}
      title={title}
      srcDoc={buildDocument(html, innerPadding, clip)}
      // Por padrão, o HTML colado não recebe scripts e mantém origem legível apenas para a medição.
      // O modo SoundCloud troca a origem legível por origem opaca e libera scripts para o iframe
      // aninhado; a CSP continua bloqueando scripts do documento e restringindo frames ao player.
      // `autoplay` delega a permissão pedida pelo autor; com som, o navegador exige gesto de quem lê.
      sandbox={
        allowSoundCloudPlayer
          ? "allow-scripts allow-popups allow-popups-to-escape-sandbox"
          : "allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      }
      allow={lite ? "fullscreen" : "autoplay; fullscreen"}
      allowFullScreen
      referrerPolicy="no-referrer"
      loading="lazy"
      // Sem borda, cantos ou sombra por padrão: quem envolve (card do post, card "Sobre") já dá o
      // acabamento, e a página deve encostar nas bordas em vez de flutuar dentro de uma moldura.
      // Quem quiser moldura passa a classe (o diálogo "Abrir página", por exemplo).
      // `border-0` e `bg-transparent` são obrigatórios, não estilo: o navegador desenha uma borda
      // clara de 2px em todo iframe por padrão, e o fundo branco aparecia atrás do conteúdo do autor
      // em tema escuro. Sem os dois, sobra uma "bordinha branca" em volta de tudo que é HTML/CSS.
      className={cn("w-full border-0 bg-transparent", className)}
      // A classe do chamador continua valendo como altura ate a medida chegar (o SSR nao mede):
      // o estilo em linha e que manda depois dela.
      style={{ colorScheme: theme, ...(grows && measured ? { height: measured } : {}) }}
    />
  );
}

/**
 * Politica aplicada por dentro do quadro: sem script, sem formulario e sem rede — exceto imagem e
 * midia em https (ou embutidas em data:), que sao o conteudo que a pagina legitimamente carrega e o
 * player SoundCloud, que precisa de um quadro filho para aparecer. O host e fixo e restrito: outros
 * quadros continuam bloqueados.
 */
const FRAME_CSP = [
  "default-src 'none'",
  "img-src https: data:",
  "media-src https: data:",
  "font-src data:",
  "style-src 'unsafe-inline'",
  // O que já está implícito no `default-src 'none'` vai escrito: a lista é a auditoria da política.
  // Quadro dentro de quadro, plugin, formulário, requisição de dados e worker ficam de fora — nenhuma
  // dessas portas existe no que a página precisa fazer.
  "frame-src https://w.soundcloud.com",
  "object-src 'none'",
  "connect-src 'none'",
  "worker-src 'none'",
  "form-action 'none'",
].join("; ");

/**
 * Aparencia base da pagina colada. Entra ANTES do `<style>` do autor, entao o CSS dele sobrescreve
 * o que quiser. Fundos e textos usam `light-dark()`: o pai grava `color-scheme` light ou dark no
 * quadro, e a cor acompanha o tema do app em vez do sistema operacional.
 */
function buildBaseCss(innerPadding: boolean, clip: boolean): string {
  const padding = innerPadding ? "14px 16px" : "0";
  // Faixa recortada (capa): o que passar da altura do quadro fica escondido em vez de virar barra
  // de rolagem — barra dentro de uma capa denuncia que ali dentro tem uma página, e não uma faixa.
  const overflow = clip ? "overflow:hidden" : "";
  return `*{box-sizing:border-box}
html,body{margin:0;${overflow}}
body{background:transparent;color:light-dark(#1a1a1a,#e8e6ff);color-scheme:light dark;padding:${padding};overflow-wrap:break-word;
font:400 14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
h1,h2,h3,h4,h5,h6{line-height:1.25;margin:.6em 0 .4em}
p{margin:.5em 0}
img,video,svg,canvas{max-width:100%;height:auto}
figure{margin:.8em 0}
audio{width:100%}
figcaption{font-size:12px;color:light-dark(#666,#b3b0c9);margin-top:4px}
a{color:light-dark(#7c3aed,#c4b5fd)}
ul,ol{padding-left:1.4em}
table{border-collapse:collapse;max-width:100%;font-size:13px}
th,td{border:1px solid light-dark(#e3e3e3,#3f3d55);padding:5px 8px;text-align:left}
pre{overflow-x:auto;background:light-dark(#f5f5f5,#221f33);color:light-dark(#1a1a1a,#e8e6ff);padding:10px;border-radius:8px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px}
blockquote{margin:.6em 0;padding-left:12px;border-left:3px solid light-dark(#ddd,#4a4860);color:light-dark(#555,#c8c6dc)}
/* Onde vai um player embutido: o quadro não roda script, então o vídeo/áudio aparece logo abaixo
   da página. Aqui fica a marca do lugar dele, para a página não perder a referência visual. */
[data-enois-embed]{display:block;aspect-ratio:16/9;background:light-dark(#f2f2f5,#221f33);border-radius:10px;
border:1px dashed light-dark(#cfcfd6,#4a4860);margin:.8em 0}`;
}

function buildDocument(html: string, innerPadding: boolean, clip: boolean): string {
  return [
    '<!doctype html><html lang="pt-BR"><head>',
    `<meta http-equiv="Content-Security-Policy" content="${FRAME_CSP}">`,
    // Viewport de celular: e o tamanho do quadro, entao o HTML se comporta como numa tela de
    // telefone (e o print sai inteiro, sem rolagem).
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<base target="_blank">',
    `<style>${buildBaseCss(innerPadding, clip)}</style>`,
    "</head><body>",
    html,
    "</body></html>",
  ].join("");
}
