/**
 * Os metas de rede social de uma página.
 *
 * <p>O `title` e a `description` que a rota já declara viram também o `og:title` e o
 * `og:description`: sem isso, quem abre o link no WhatsApp, no X ou no Telegram vê a cópia do
 * site inteiro ("Énóis · Rede humana" / "Construa relações de verdade, não apenas conexões") em
 * vez da página — e a página é justamente o que a pessoa está abrindo.
 *
 * <p>As rotas que têm imagem própria (post, blog, perfil) continuam definindo o `og:image`
 * dela; as demais herdam a imagem do root.
 */
export function ogMetas(
  title: string,
  description: string,
): { property: string; content: string }[] {
  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ];
}
