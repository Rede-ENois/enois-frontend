// Prova visual do #562: a página "Conta e segurança" e o menu da conta com uma entrada só.
// App real (Vite), sessão simulada no localStorage e backend de mentira local (BACKEND_TARGET).
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 9243;
const MOCK_PORT = 5198;
const APP = process.env.APP ?? "http://127.0.0.1:5176";
const OUT = "/tmp/verif/562";
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
  goals: [],
  availability: null,
  portfolio: null,
  externalLinks: [],
  openToWork: false,
  isMentor: false,
};

const seen = [];

/** Backend de mentira: o SSR do dev chama `BACKEND_TARGET` direto, então ele mora num servidor. */
function responder(url, metodo) {
  const caminho = url.replace(/^https?:\/\/[^/]+/, "");
  if (/\/api\/(v1\/)?me$/.test(caminho) || /\/auth\/me/.test(caminho)) return [200, perfil];
  if (/\/api\/(v1\/)?users\/melissa$/.test(caminho)) return [200, perfil];
  if (/\/users\/melissa\/posts/.test(caminho)) return [200, { items: [], nextCursor: null }];
  if (/\/me\/business-profile/.test(caminho)) return [200, { exists: false }];
  if (/\/stats\/community/.test(caminho)) return [200, { activeUsers: 42 }];
  if (/\/feed(\?|$)/.test(caminho)) return [200, { items: [], nextCursor: null }];
  if (/\/notifications/.test(caminho)) return [200, { items: [], unread: 0 }];
  if (/\/me\/theme/.test(caminho)) return [200, { collectionId: null, custom: null }];
  if (/\/me\/preferences/.test(caminho)) return [200, {}];
  if (/\/me\/age-state/.test(caminho)) return [200, { state: "ADULT" }];
  if (/\/conversations/.test(caminho)) return [200, []];
  if (/\/loja\?order=/.test(caminho)) return [200, []];
  if (/\/auth\/sessions/.test(caminho)) return [200, []];
  if (/\/auth\/linked/.test(caminho)) return [200, []];
  return [404, { code: "NOT_FOUND", message: "mock" }];
}

const mock = createServer((req, res) => {
  const [status, body] = responder(req.url ?? "/", req.method ?? "GET");
  seen.push(`${req.method} ${req.url}`);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": APP,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
  });
  res.end(req.method === "OPTIONS" ? "" : JSON.stringify(body));
});
await new Promise((resolve) => mock.listen(MOCK_PORT, resolve));

const chrome = spawn(
  "/usr/bin/google-chrome",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/verif/profile562",
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
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
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

/** O React hidrata depois do HTML do SSR: clica até a tela mudar, em vez de dormir um tempo fixo. */
async function clicarAte(rotulo, pronto, vezes = 20) {
  for (let i = 0; i < vezes; i++) {
    const clicou = await evaluate(`(() => {
      const el = [...document.querySelectorAll("button")].find((b) =>
        (b.getAttribute("aria-label") || b.textContent || "").trim().includes(${JSON.stringify(rotulo)}),
      );
      if (!el) return false;
      for (const tipo of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
        el.dispatchEvent(new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0 }));
      }
      return true;
    })()`);
    if (clicou) {
      for (let j = 0; j < 8; j++) {
        if (await evaluate(pronto)) return true;
        await sleep(250);
      }
    } else {
      await sleep(500);
    }
  }
  return false;
}

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
    "ok"
  `);
}

const LEITURA = `(() => {
  const doc = document.documentElement;
  const linhas = [...document.querySelectorAll("a, button")]
    .map((el) => (el.textContent || "").trim())
    .filter((t) => t && t.length < 40);
  return JSON.stringify({
    onde: location.pathname,
    titulo: document.querySelector("h1")?.textContent?.trim() ?? null,
    secoes: [...document.querySelectorAll("h2")].map((h) => h.textContent.trim()),
    linhas: [...new Set(linhas)].slice(0, 20),
    docWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
  });
})()`;

/** A barra do feed usa o mesmo texto do menu: só conta depois de o menu abrir de fato. */
const LEITURA_MENU = `(() => {
  const doc = document.documentElement;
  const menu = document.querySelector('[data-slot="popover-content"], [role="dialog"]');
  const itens = menu ? [...menu.querySelectorAll("a, button")].map((el) => (el.textContent || "").trim()) : [];
  return JSON.stringify({
    aberto: Boolean(menu),
    itens: [...new Set(itens.filter(Boolean))],
    docWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
  });
})()`;

const MENU_ABERTO = `Boolean(
  document.querySelector('[data-slot="popover-content"]') ||
    document.querySelector('[role="dialog"]:not([data-state="closed"])'),
)`;

const resultado = [];
for (const width of [1280, 390]) {
  await preparar(width);

  // 1) A página nova.
  await send("Page.navigate", { url: `${APP}/conta` });
  for (let i = 0; i < 40; i++) {
    if (await evaluate(`document.querySelectorAll("h1").length > 0`)) break;
    await sleep(300);
  }
  await sleep(800);
  const pagina = JSON.parse(await evaluate(LEITURA));
  const shotPagina = await send("Page.captureScreenshot", { format: "png" });
  const arquivoPagina = `${OUT}/conta-${width}.png`;
  writeFileSync(arquivoPagina, Buffer.from(shotPagina.data, "base64"));

  // 2) O menu da conta, que agora tem uma entrada só para tudo isso.
  await send("Page.navigate", { url: `${APP}/feed` });
  await clicarAte("Menu da conta", MENU_ABERTO);
  await sleep(1500);
  const menu = JSON.parse(await evaluate(LEITURA_MENU));
  const shotMenu = await send("Page.captureScreenshot", { format: "png" });
  const arquivoMenu = `${OUT}/menu-${width}.png`;
  writeFileSync(arquivoMenu, Buffer.from(shotMenu.data, "base64"));

  resultado.push({ width, pagina, menu, arquivoPagina, arquivoMenu });
}

writeFileSync(
  `${OUT}/resultado.json`,
  JSON.stringify({ resultado, chamadas: [...new Set(seen)].slice(0, 40) }, null, 2),
);
console.log(JSON.stringify({ resultado }, null, 2));
ws.close();
chrome.kill();
mock.close();
