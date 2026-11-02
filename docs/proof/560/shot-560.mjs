// Prova visual da issue #560: o menu da conta diz em qual perfil a pessoa está.
// App real (Vite em 5174), sessão simulada no localStorage e API interceptada no Chrome.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 9240;
const APP = "http://127.0.0.1:5174";
const OUT = "/tmp/verif/560";
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

const chrome = spawn(
  "/usr/bin/google-chrome",
  ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`,
   "--user-data-dir=/tmp/verif/profile560", "--hide-scrollbars", "about:blank"],
  { stdio: "ignore", detached: true },
);
chrome.unref();

const http = async (path, init) => (await fetch(`http://127.0.0.1:${PORT}${path}`, init)).json();
for (let i = 0; i < 60; i++) {
  try { await http("/json/version"); break; } catch { await sleep(250); }
}
const target = await http("/json/new?about:blank", { method: "PUT" });
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

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
    let body = { code: "NOT_FOUND", message: "mock" };
    let status = 404;
    if (/\/api\/me$/.test(url) || /\/api\/v1\/me$/.test(url)) {
      body = perfil; status = 200;
    } else if (url.includes("/me/business-profile")) {
      body = { exists: true, status: "ACTIVE", username: "melissa-pro", name: "Melissa Pro" };
      status = 200;
    } else if (url.includes("/api/stats/community")) {
      body = { activeUsers: 42 }; status = 200;
    } else if (url.endsWith("/api/feed") || url.includes("/api/feed?")) {
      body = { items: [], nextCursor: null }; status = 200;
    } else if (url.includes("/api/notifications")) {
      body = { items: [], unread: 0 }; status = 200;
    } else if (url.includes("/api/auth/me") || url.includes("/api/auth/session")) {
      body = perfil; status = 200;
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
    "ok"
  `);
  await send("Page.navigate", { url: `${APP}/feed` });
  // Espera o menu da conta aparecer (o avatar no cabeçalho).
  for (let i = 0; i < 60; i++) {
    const ok = await evaluate(
      `[...document.querySelectorAll("button")].some((el) => el.getAttribute("aria-label") === "Menu da conta")`,
    );
    if (ok) break;
    await sleep(300);
  }
  await sleep(1200);
}

async function abrirMenu() {
  return evaluate(`(() => {
    const b = [...document.querySelectorAll("button")].find(
      (el) => el.getAttribute("aria-label") === "Menu da conta",
    );
    b?.click();
    return Boolean(b);
  })()`);
}

const LEITURA = `(() => {
  const txt = document.body.innerText;
  const el = [...document.querySelectorAll("p")].find((p) => /perfil (Social|Profissional)/i.test(p.textContent || ""));
  const r = el?.getBoundingClientRect();
  return JSON.stringify({
    aviso: el?.textContent?.trim() ?? null,
    caixa: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
    docWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    temSocial: /perfil Social/i.test(txt),
    temProfissional: /perfil Profissional/i.test(txt),
  });
})()`;

const resultado = [];
const debug = [];
for (const width of [1280, 390]) {
  await preparar(width);
  const rotulo = await abrirMenu();
  await sleep(700);
  const medida = JSON.parse(await evaluate(LEITURA));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  const arquivo = `${OUT}/menu-${width}.png`;
  writeFileSync(arquivo, Buffer.from(shot.data, "base64"));
  resultado.push({ width, rotulo, medida, arquivo });
  debug.push({ width, texto: await evaluate(`document.body.innerText.slice(0, 300)`), botoes: await evaluate(`[...document.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") || b.textContent.trim()).slice(0, 25)`) });
}

console.log(JSON.stringify({ resultado, debug, chamadas: [...new Set(seen)].slice(0, 20) }, null, 2));
ws.close();
chrome.kill();
