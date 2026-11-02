import { WEB_FONT_LINK_ID, WEB_FONT_STYLESHEET } from "./web-fonts";

/**
 * O script inline do `<head>`, que roda antes do primeiro paint.
 *
 * Aplica o tema guardado — e, junto, os modos econômicos e a teimosia de animações (as chaves
 * espelham src/lib/device-flags.ts): aparelho em modo econômico não deve nem começar a animar para
 * depois parar, nem baixar a fonte que a interface clássica não usa.
 *
 * Sem isso o app nasce claro (e na cor padrão) e só depois de hidratar assume o tema do usuário —
 * aquele flash. O CSS já vem resolvido do `localStorage`, então o script só injeta o texto, sem
 * repetir a matemática de cor. A coleção temática também entra aqui: o atributo `data-theme`
 * precisa existir antes do paint, porque o CSS estrutural do tema é escopado por ele.
 *
 * `data-lite` = lite **ou** BATATA (BATATA é um superconjunto do lite); `data-batata` é o modo
 * clássico. As fontes do Google só entram quando nenhum dos dois está ligado: no BATATA a
 * tipografia vem do sistema, e são sete famílias em dois hosts externos que deixam de ser pedidas.
 *
 * A injeção das fontes fica **fora** do `try`: se o `localStorage` estiver bloqueado (navegador em
 * modo restrito), a leitura lança e a página ainda precisa da fonte.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){
var lite=false,batata=false;
try{
var raw=localStorage.getItem("connect-grow-preferences");
if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.state&&parsed.state.theme==="dark"){document.documentElement.classList.add("dark");}}
var collection=localStorage.getItem("connect-grow-theme-collection");
if(collection){document.documentElement.setAttribute("data-theme",collection);}
lite=localStorage.getItem("connect-grow-lite-mode")==="1";
batata=localStorage.getItem("connect-grow-batata-mode")==="1";
if(batata){document.documentElement.setAttribute("data-batata","");}
if(lite||batata){document.documentElement.setAttribute("data-lite","");}
else if(localStorage.getItem("connect-grow-force-motion")==="1"){document.documentElement.setAttribute("data-force-motion","");}
var css=localStorage.getItem("connect-grow-theme-css");
if(css){var style=document.createElement("style");style.id="app-theme";style.textContent=css;document.head.appendChild(style);}
}catch(error){}
if(!lite&&!batata){
var pre1=document.createElement("link");pre1.rel="preconnect";pre1.href="https://fonts.googleapis.com";document.head.appendChild(pre1);
var pre2=document.createElement("link");pre2.rel="preconnect";pre2.href="https://fonts.gstatic.com";pre2.crossOrigin="anonymous";document.head.appendChild(pre2);
var font=document.createElement("link");font.id="${WEB_FONT_LINK_ID}";font.rel="stylesheet";font.href="${WEB_FONT_STYLESHEET}";document.head.appendChild(font);
}
})();`;
