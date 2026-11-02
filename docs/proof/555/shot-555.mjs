// Prova visual da issue #555: a aba Recentes do seletor de figurinhas.
// App real (Vite em 5174), sessão simulada no localStorage e API interceptada no Chrome.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 9241;
const APP = "http://127.0.0.1:5174";
const OUT = "/tmp/verif/555";
mkdirSync(OUT, { recursive: true });

const perfil = {
  id: "user_1",
  username: "melissa",
  name: "Melissa Exemplo",
  headline: null,
  email: "pessoa@exemplo.test",
  company: null,
  location: null,
  avatar: null,
  banner: null,
  badge: null,
  bio: null,
  skills: [],
};

// Catálogo de mentira no formato do backend, montando as miniaturas como SVG: nenhuma imagem sai
// para a rede, então o print não depende de CDN.
const figuras = ["KEKW", "PogChamp", "PepeLaugh", "catJAM", "monkaS", "LUL"];
const pagina = {
  items: figuras.map((code, indice) => ({
    code,
    provider: "BTTV",
    id: `fig-${indice}`,
    animated: false,
    popularRank: indice + 1,
    image: `/emotes/image/BTTV/fig-${indice}?variant=full`,
    thumb: `/emotes/image/BTTV/fig-${indice}?variant=thumb`,
  })),
  page: 1,
  limit: 40,
  total: figuras.length,
  totalPages: 1,
  generatedAt: "2026-11-02T00:00:00Z",
};

const TOM = ["#f4a259", "#5b8e7d", "#bc4b51", "#8cb369", "#4c86a8", "#9c6ade"];

const chrome = spawn(
  "/usr/bin/google-chrome",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/verif/profile555",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore", detached: true },
);
chrome.unref();

const http = async (path, init) => (await fetch(`http://127.0.0.1:${PORT}${path}`, init)).json();
for (let i = 0; i < 60; i++) {
  try {
    await http("/json/version");
    break;
  } catch {
    await sleep(250);
  }
}
const target = await http("/json/new?about:blank", { method: "PUT" });
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let id = 0;
const pending = new Map();
const seen = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
  if (msg.method === "Fetch.requestPaused") {
    const { requestId, request } = msg.params;
    const url = request.url;
    seen.push(url.replace(/^https?:\/\/[^/]+/, ""));
    if (url.includes("/emotes/image/")) {
      const indice = Math.abs([...url].reduce((soma, letra) => soma + letra.charCodeAt(0), 0));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="12" fill="${TOM[indice % TOM.length]}"/><circle cx="32" cy="32" r="14" fill="#fff" opacity="0.85"/></svg>`;
      void send("Fetch.fulfillRequest", {
        requestId,
        responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: "image/svg+xml" }],
        body: Buffer.from(svg).toString("base64"),
      }).catch(() => undefined);
      return;
    }
    let body = { code: "NOT_FOUND", message: "mock" };
    let status = 404;
    if (/\/api\/me$/.test(url)) {
      body = perfil;
      status = 200;
    } else if (/\/api\/emotes\/index/.test(url)) {
      body = { entries: {}, generatedAt: "2026-11-02T00:00:00Z" };
      status = 200;
    } else if (/\/api\/emotes(\?|$)/.test(url)) {
      body = pagina;
      status = 200;
    } else if (url.includes("/api/stats/community")) {
      body = { activeUsers: 42 };
      status = 200;
    } else if (url.includes("/api/feed")) {
      body = { items: [], nextCursor: null };
      status = 200;
    } else if (url.includes("/api/notifications")) {
      body = { items: [], unread: 0 };
      status = 200;
    }
    void send("Fetch.fulfillRequest", {
      requestId,
      responseCode: status,
      responseHeaders: [
        { name: "Content-Type", value: "application/json" },
        { name: "Access-Control-Allow-Origin", value: APP },
        { name: "Access-Control-Allow-Credentials", value: "true" },
      ],
      body: Buffer.from(JSON.stringify(body)).toString("base64"),
    }).catch(() => undefined);
  }
};
function send(method, params = {}) {
  const callId = ++id;
  ws.send(JSON.stringify({ id: callId, method, params }));
  return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Fetch.enable", {
  patterns: [{ urlPattern: "*://127.0.0.1:5174/api/*", requestStage: "Request" }],
});

// Sessão simulada: o app lê a pista do cookie e o indicador do localStorage, nada de token real.
async function preparar(width) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width < 600 ? 844 : 900,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await send("Page.navigate", { url: `${APP}/entrar` });
  await sleep(1200);
  await evaluate(`
    document.cookie = "enois_auth=1; Path=/; Max-Age=86400; SameSite=Lax";
    localStorage.setItem("session_active", "1");
    localStorage.setItem("current_user", ${JSON.stringify(JSON.stringify(perfil))});
    // Nada em Recentes ainda: é o estado de quem nunca usou uma figurinha.
    localStorage.removeItem("rede:emotes:recent:v1");
    "ok"
  `);
  await send("Page.navigate", { url: `${APP}/feed` });
  for (let i = 0; i < 60; i++) {
    const pronto = await evaluate(
      `[...document.querySelectorAll("button")].some((el) => (el.getAttribute("aria-label") || el.textContent || "").trim() === "Figurinhas")`,
    );
    if (pronto) break;
    await sleep(300);
  }
  await sleep(1000);
}

async function abrirSeletor() {
  return evaluate(`(() => {
    const b = [...document.querySelectorAll("button")].find(
      (el) => (el.getAttribute("aria-label") || el.textContent || "").trim() === "Figurinhas",
    );
    b?.click();
    return Boolean(b);
  })()`);
}

/** O diálogo monta depois do clique: espera ele existir em vez de dormir um tempo fixo. */
async function esperarDialogo(vezes = 8) {
  for (let i = 0; i < vezes; i++) {
    const aberto = await evaluate(`document.querySelectorAll('[role="dialog"]').length > 0`);
    if (aberto) return true;
    await sleep(250);
  }
  return false;
}

/**
 * O botão já está no HTML do SSR antes de o React hidratar, e um clique nesse intervalo se perde.
 * Clica de novo até o diálogo abrir, em vez de confiar num tempo fixo de espera.
 */
async function abrirSeletorComEspera() {
  for (let tentativa = 0; tentativa < 12; tentativa++) {
    if (!(await abrirSeletor())) {
      await sleep(500);
      continue;
    }
    if (await esperarDialogo(4)) return true;
  }
  return false;
}

/** A grade só existe quando a página do catálogo chega: espera as células em vez de cronometrar. */
async function esperarGrade(vezes = 24) {
  for (let i = 0; i < vezes; i++) {
    const pronta = await evaluate(
      `document.querySelectorAll('[role="dialog"] button[title] img').length > 0`,
    );
    if (pronta) return true;
    await sleep(250);
  }
  return false;
}

async function escolherFigurinha() {
  return evaluate(`(() => {
    const b = [...document.querySelectorAll("button[title]")].find(
      (el) => /^[A-Za-z]+$/.test(el.getAttribute("title") || "") && el.querySelector("img"),
    );
    b?.click();
    return b?.getAttribute("title") ?? null;
  })()`);
}

const LEITURA = `(() => {
  const aba = document.querySelector('[role="tab"][aria-selected="true"]');
  const onde = location.pathname;
  const rotulos = [...document.querySelectorAll('[role="tab"]')].map((el) => el.textContent);
  const celulas = [...document.querySelectorAll("button[title] img")].map((img) => img.alt);
  return JSON.stringify({
    onde,
    abas: rotulos,
    abaAtiva: aba?.textContent ?? null,
    celulas,
    buscaVisivel: Boolean(document.querySelector('input[placeholder="Buscar figurinha"]')),
    // O índice do catálogo está vazio neste roteiro: se a aba Recentes dependesse dele, ficaria
    // presa em "Carregando figurinhas..." em vez de desenhar a escolhida.
    carregando: (document.querySelector('[role="dialog"]')?.textContent ?? "").includes(
      "Carregando figurinhas",
    ),
    docWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  });
})()`;

const resultado = [];
for (const width of [1280, 390]) {
  await preparar(width);
  await abrirSeletorComEspera();
  await esperarGrade();
  // Sem recentes, abre em Todas.
  const estadoInicial = JSON.parse(await evaluate(LEITURA));

  const escolhida = await escolherFigurinha();
  await sleep(600);

  // Reabrir: agora a lista local tem a escolhida e a aba recente é a primeira.
  await evaluate(`document.querySelector('[role="dialog"]')?.remove()`);
  await send("Page.navigate", { url: `${APP}/feed` });
  await sleep(2500);
  await abrirSeletorComEspera();
  await esperarGrade();
  const estadoComRecentes = JSON.parse(await evaluate(LEITURA));

  const shot = await send("Page.captureScreenshot", { format: "png" });
  const arquivo = `${OUT}/seletor-${width}.png`;
  writeFileSync(arquivo, Buffer.from(shot.data, "base64"));
  resultado.push({ width, escolhida, estadoInicial, estadoComRecentes, arquivo });
}

writeFileSync(
  `${OUT}/resultado.json`,
  JSON.stringify({ resultado, chamadas: [...new Set(seen)].slice(0, 20) }, null, 2),
);
console.log(JSON.stringify({ resultado }, null, 2));
ws.close();
chrome.kill();
