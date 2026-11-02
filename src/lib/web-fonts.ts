/**
 * As fontes do Google (Manrope e as famílias dos temas de nome).
 *
 * São sete famílias num pedido só, baixadas de dois hosts externos. No BATATA elas não servem
 * para nada: a camada de estilo troca a tipografia pela do sistema. Por isso o `<head>` **não**
 * tem o `<link>` fixo — o script de arranque injeta quando o aparelho não está em modo econômico,
 * e em BATATA a requisição nem sai.
 *
 * Quem desliga o BATATA com a tela aberta precisa da fonte de volta sem recarregar: é o que
 * `ensureWebFonts` faz (uma vez só, com o mesmo id do script).
 */
export const WEB_FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Press+Start+2P&family=UnifrakturCook:wght@700&family=Creepster&family=Mountains+of+Christmas:wght@700&family=Pacifico&family=Rye&family=Gochi+Hand&display=swap";

/** Id usado pelo script de arranque; um só `<link>` no documento inteiro. */
export const WEB_FONT_LINK_ID = "enois-web-fonts";

export function ensureWebFonts(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(WEB_FONT_LINK_ID)) return;
  const link = document.createElement("link");
  link.id = WEB_FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = WEB_FONT_STYLESHEET;
  document.head.appendChild(link);
}
