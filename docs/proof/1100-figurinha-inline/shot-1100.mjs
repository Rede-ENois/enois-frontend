// Prova visual de #1100 (figurinha no meio do texto), versão da branch `fix/1100-figurinha-onqa`.
//
// O "depois" é a marcação REAL que a 0.43.1 publicada emite (o `RichText` do design system):
// figurinha do catálogo e do pacote É Nóis com as classes que o pacote gera. O "antes" é a MESMA
// marcação com essas classes removidas — é o que a tela desenha sem as regras de endereço de
// `src/styles.css`, então a comparação é do mesmo texto, mesma fonte, mesma largura.
//
//   node docs/proof/1100-figurinha-inline/shot-1100.mjs
//
// Variáveis: OUT (docs/proof/1100-figurinha-inline), CDP_PORT (9344), CHROME (/usr/bin/google-chrome).
// O CSS é o `styles.css` COMPILADO desta branch: rode `npx vite build` antes e copie o
// `.vercel/output/static/assets/styles-*.css` para `${OUT}/styles.css` (o build é descartável, não
// vai para o repositório).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const OUT = process.env.OUT ?? new URL(".", import.meta.url).pathname;
const CDP_PORT = Number(process.env.CDP_PORT ?? 9344);
const CHROME = process.env.CHROME ?? "/usr/bin/google-chrome";
// Página de trabalho: um diretório real para que os `src` relativos (`./public/...`) resolvam e as
// imagens carreguem. O `styles.css` compilado desta branch é copiado para cá.
const PAGINA = process.env.PAGINA ?? "/tmp/prova-1100";
mkdirSync(OUT, { recursive: true });
mkdirSync(PAGINA, { recursive: true });

if (!existsSync(`${OUT}/styles.css`)) {
  throw new Error(
    `Falta ${OUT}/styles.css (o CSS compilado desta branch): rode \`npx vite build\` e copie ` +
      "`.vercel/output/static/assets/styles-*.css` para lá.",
  );
}
const CSS = readFileSync(`${OUT}/styles.css`, "utf8");
const CORPO = readFileSync(`${OUT}/render.html`, "utf8");

// As imagens da prova, nos caminhos relativos que a marcação usa (`./public/...`). O caminho do
// proxy (`/emotes/image/…`) não existe local, então um emote real do pacote ocupa o lugar dele —
// o que a medição precisa é a imagem carregar, não o conteúdo exato.
const IMAGENS = {
  "public/emojis/enois/like.webp": "public/emojis/enois/like.webp",
  "public/emotes/image/BTTV/abc123": "public/emojis/enois/cool.webp",
};
for (const [destino, origem] of Object.entries(IMAGENS)) {
  const caminho = `${PAGINA}/${destino}`;
  mkdirSync(caminho.slice(0, caminho.lastIndexOf("/")), { recursive: true });
  writeFileSync(caminho, readFileSync(origem));
}

// O "antes": a marcação sem as classes que as regras de endereço usam. Sem elas, a figurinha cai
// no desenho padrão de mídia do design system (moldura, canto arredondado, margem vertical).
const CORPO_ANTES = CORPO.replace(/ class="inline-block h-\[1\.75em\][^"]*"/g, "").replace(
  / class="my-1 max-h-96 rounded-xl border border-border-soft"/g,
  "",
);

function pagina(corpo) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${CSS}</style>
<style>
  /* A página da prova usa as fontes do sistema; só o tamanho do container é fixado, como no app. */
  body { margin: 0; background: #fff; color: #111; font-family: system-ui, sans-serif; }
  main { max-width: 42rem; margin: 0 auto; padding: 1.5rem; }
  section { margin-bottom: 2rem; }
  section h2 { font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; color: #666; margin: 0 0 .5rem; }
</style></head><body><main>${corpo}</main></body></html>`;
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (!msg.id || !this.pending.has(msg.id)) return;
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
  async evaluate(sessionId, expression) {
    const { result, exceptionDetails } = await this.send(
      "Runtime.evaluate",
      { expression, awaitPromise: true, returnByValue: true },
      sessionId,
    );
    if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails));
    return result.value;
  }
}

async function wsUrl() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      const body = await res.json();
      if (body.webSocketDebuggerUrl) return body.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error("Chrome não subiu");
}

// Mede a altura de cada parágrafo e o estouro horizontal — o que a revisão pede para comparar.
const MEDIR = `
  (() => {
    const secoes = [...document.querySelectorAll('section')];
    return JSON.stringify({
      paragrafos: secoes.map((s) => {
        const p = s.querySelector('p');
        const img = s.querySelector('img');
        return {
          titulo: s.dataset.titulo,
          altura: p ? Math.round(p.getBoundingClientRect().height) : null,
          imagem: img ? Math.round(img.getBoundingClientRect().width) : null,
        };
      }),
      estoura: document.documentElement.scrollWidth > window.innerWidth,
    });
  })()
`;

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=/tmp/cdp-1100-${process.pid}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const results = [];
try {
  const ws = new WebSocket(await wsUrl());
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  const cdp = new Cdp(ws);
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);

  async function capturar(nome, corpo, width) {
    const html = pagina(corpo);
    writeFileSync(`${PAGINA}/pagina.html`, html);
    await cdp.send("Page.navigate", { url: `file://${PAGINA}/pagina.html` }, sessionId);
    await sleep(700);
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width, height: 900, deviceScaleFactor: 2, mobile: width < 500 },
      sessionId,
    );
    await sleep(400);
    const state = JSON.parse(await cdp.evaluate(sessionId, MEDIR));
    const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    writeFileSync(`${OUT}/${nome}-${width}.png`, Buffer.from(png.data, "base64"));
    results.push({ nome: `${nome}-${width}`, width, ...state });
    console.log(`${nome}-${width}`, JSON.stringify(state));
  }

  for (const width of [1280, 390]) {
    await capturar("antes", CORPO_ANTES, width);
    await capturar("depois", CORPO, width);
  }

  writeFileSync(`${OUT}/resultado.json`, `${JSON.stringify(results, null, 2)}\n`);
  await cdp.send("Browser.close").catch(() => {});
} finally {
  chrome.kill();
}
