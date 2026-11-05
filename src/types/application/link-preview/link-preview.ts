/**
 * A miniatura de um link publicado num post ou comentário.
 *
 * `kind` diz de onde o cartão veio: `INTERNAL` é uma página do próprio Énóis (o botão abre dentro
 * do app) e `EXTERNAL` é um site de fora (abre em outra aba). Os campos de texto podem vir nulos —
 * site sem SEO definido não tem título nem descrição, e o cartão mostra só o endereço.
 */
export type LinkPreview = {
  kind: "INTERNAL" | "EXTERNAL";
  /** O endereço como o autor escreveu (absoluto). */
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  /** Nome do site (`og:site_name`), quando o site declara. */
  siteName: string | null;
};
