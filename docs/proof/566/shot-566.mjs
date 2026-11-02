// Prova visual do #566: a aba "Itens" da Aparência (molduras, emblemas, banners) equipa sem sair
// do perfil. App real (Vite), sessão simulada no localStorage e API interceptada no Chrome.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 9242;
/**
 * O SSR do dev chama `BACKEND_TARGET` direto (sem o proxy), então o mock mora num servidor HTTP
 * local: o Vite aponta para ele e a página chega pronta, sem depender da API de verdade.
 */
const MOCK_PORT = 5199;
const MOCK = `http://localhost:${MOCK_PORT}`;
const APP = process.env.APP ?? "http://127.0.0.1:5175";
const OUT = "/tmp/verif/566";
mkdirSync(OUT, { recursive: true });

let comItens = true;

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

const loja = (comItens) => [
  {
    id: "frame-aurora",
    kind: "FRAME",
    collection: "classicos",
    name: "Aurora",
    description: "Moldura de exemplo.",
    priceMf: 120,
    cssRing: "0 0 0 3px #7c3aed",
    releaseOrder: 1,
    available: true,
    purchasable: true,
    owned: comItens,
    equipped: comItens,
  },
  {
    id: "badge-estrela",
    kind: "BADGE",
    collection: "classicos",
    name: "Estrela",
    description: "Emblema de exemplo.",
    priceMf: 80,
    cssRing: "",
    releaseOrder: 2,
    available: true,
    purchasable: true,
    owned: comItens,
    equipped: false,
  },
  {
    id: "banner-noite",
    kind: "BANNER",
    collection: "classicos",
    name: "Noite",
    description: "Banner de exemplo.",
    priceMf: 200,
    cssRing: "",
    releaseOrder: 3,
    available: true,
    purchasable: true,
    owned: comItens,
    equipped: false,
  },
];

const chrome = spawn(
  "/usr/bin/google-chrome",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/verif/profile566",
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
};

/**
 * Backend de mentira para o SSR e para o navegador: o mesmo formato da API (o cliente valida a
 * resposta com o schema), servido em `MOCK_PORT` para o Vite apontar `BACKEND_TARGET` nele.
 */
function responder(url, metodo) {
  const caminho = url.replace(/^https?:\/\/[^/]+/, "");
  if (/\/api\/(v1\/)?me$/.test(caminho) || /\/auth\/me/.test(caminho)) return [200, perfil];
  if (/\/api\/(v1\/)?users\/melissa$/.test(caminho)) return [200, perfil];
  if (/\/api\/(v1\/)?users\/melissa\/posts/.test(caminho))
    return [200, { items: [], nextCursor: null }];
  if (/\/api\/(v1\/)?loja\?order=/.test(caminho) || /\/loja$/.test(caminho))
    return [200, loja(comItens)];
  if (/\/loja\/[^/]+\/(des)?equipar$/.test(caminho) && metodo === "POST")
    return [200, { id: "badge-estrela", equipped: true }];
  if (/\/me\/business-profile/.test(caminho)) return [200, { exists: false }];
  if (/\/stats\/community/.test(caminho)) return [200, { activeUsers: 42 }];
  if (/\/feed(\?|$)/.test(caminho)) return [200, { items: [], nextCursor: null }];
  if (/\/notifications/.test(caminho)) return [200, { items: [], unread: 0 }];
  if (/\/me\/theme/.test(caminho)) return [200, { collectionId: null, custom: null }];
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

/** O React hidrata depois do HTML do SSR: um clique cedo se perde, então clica até a tela mudar. */
async function clicarAte(seletorTexto, pronto, vezes = 20) {
  for (let i = 0; i < vezes; i++) {
    // Radix ativa a aba no `mousedown`, não no `click`: um `.click()` sozinho não troca a aba.
    const clicou = await evaluate(`(() => {
      const el = [...document.querySelectorAll("button")].find((b) =>
        (b.textContent || "").trim().includes(${JSON.stringify(seletorTexto)}),
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

async function abrirAparencia(width) {
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
  await send("Page.navigate", { url: `${APP}/perfil/melissa` });
  await clicarAte("Aparência", `document.querySelectorAll('[role="dialog"]').length > 0`);
  // A aba "Itens" precisa ser a MARCADA (o diálogo abre em "Tema global").
  return clicarAte(
    "Itens",
    `[...document.querySelectorAll('[role="tab"]')].some(
      (t) => t.getAttribute("data-state") === "active" && (t.textContent || "").trim() === "Itens",
    )`,
  );
}

const LEITURA = `(() => {
  const dialogo = document.querySelector('[role="dialog"]');
  const abas = [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim());
  const ativa = document.querySelector('[role="tab"][data-state="active"]')?.textContent?.trim() ?? null;
  const itens = [...document.querySelectorAll('[data-item-id]')].map((li) => li.querySelector("p")?.textContent ?? "");
  const botoes = [...(dialogo?.querySelectorAll("button") ?? [])].map((b) => b.textContent.trim()).filter(Boolean);
  const doc = document.documentElement;
  return JSON.stringify({
    abas,
    ativa,
    itens,
    botoes: [...new Set(botoes)].slice(0, 12),
    docWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
  });
})()`;

const resultado = [];
for (const width of [1280, 390]) {
  for (const comCompra of [true, false]) {
    comItens = comCompra;
    const abaItens = await abrirAparencia(width);
    await sleep(600);
    const medida = JSON.parse(await evaluate(LEITURA));
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const arquivo = `${OUT}/itens-${width}-${comCompra ? "com" : "sem"}itens.png`;
    writeFileSync(arquivo, Buffer.from(shot.data, "base64"));
    resultado.push({
      width,
      comItens: comCompra,
      abaItens,
      medida,
      arquivo,
    });
  }
}

writeFileSync(
  `${OUT}/resultado.json`,
  JSON.stringify({ resultado, chamadas: [...new Set(seen)].slice(0, 40) }, null, 2),
);
console.log(JSON.stringify({ resultado }, null, 2));
ws.close();
chrome.kill();
mock.close();
