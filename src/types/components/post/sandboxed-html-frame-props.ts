export type SandboxedHtmlFrameProps = {
  /** HTML a renderizar. Pode vir cru (preview do autor) ou sanitizado (post publicado). */
  html: string;
  /** Altura/classe do quadro; o padrão é uma altura de "mini página". */
  className?: string;
  /** Descrição do quadro para leitores de tela. */
  title: string;
  /** Permite scripts apenas nos iframes SoundCloud aprovados pela CSP; a origem do HTML segue opaca. */
  allowSoundCloudPlayer?: boolean;
  /**
   * Folga interna em volta do conteúdo (o "papel" da página). `false` faz o HTML começar na borda
   * do quadro, para quem quer usar o espaço inteiro — é o caso da bio do perfil, onde o quadro
   * ocupa a largura do card e uma margem branca em volta parecia sobra.
   */
  innerPadding?: boolean;
  /**
   * O quadro cresce até a altura do conteúdo (padrão) em vez de rolar por dentro. Quem é janela —
   * a prévia do editor, a página em tela cheia e o quadro embutido no post — passa `false` e
   * mantém a rolagem própria.
   */
  autoHeight?: boolean;
  /**
   * Teto da altura, em pixels, para o quadro que cresce. Bateu no teto, ele para de crescer e o
   * que sobra passa a rolar por dentro (nada se perde).
   *
   * Sem teto, um `height: 100vh` no HTML do autor realimenta a medida — o `vh` é a altura do
   * quadro, e o quadro é a altura do conteúdo — e a página vira uma faixa que cresce sem fim.
   */
  maxHeight?: number;
  /**
   * Recorta o que passar da altura em vez de crescer ou rolar. É o caso das CAPAS: o HTML é uma
   * faixa, não uma página, e o que o autor mandar a mais é cortado na borda (como o `object-cover`
   * faz com a foto). Implica não crescer.
   */
  clip?: boolean;
};
