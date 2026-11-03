// Prova visual de #598: o diálogo de silenciar por prazo, nos dois estados (antes e depois de
// silenciar), a 390 e 1280 px. App real (Vite dev) com sessão semeada no localStorage e um backend
// falso em BACKEND_TARGET. Todo nome e valor aqui é obviamente falso.
//
//   node docs/proof/598/shot-598.mjs
//
// Variáveis: APP (padrão http://127.0.0.1:5178), MOCK_PORT (8123), CDP_PORT (9339),
// OUT (docs/proof/598), CHROME (/usr/bin/google-chrome).
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

const APP = process.env.APP ?? "http://127.0.0.1:5178";
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8123);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9339);
const OUT = process.env.OUT ?? new URL(".", import.meta.url).pathname;
const CHROME = process.env.CHROME ?? "/usr/bin/google-chrome";
mkdirSync(OUT, { recursive: true });

const PERFIL = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "fulana",
  name: "Fulana de Tal",
  headline: "Designer de produto",
  email: "fulana@exemplo.test",
  company: null,
  location: "Recife, PE",
  avatar: null,
  banner: null,
  badge: null,
  bio: "Perfil de teste.",
  skills: ["UX", "CSS"],
  goals: ["mentoria"],
  availability: "ABERTO",
  portfolio: null,
  externalLinks: [],
  openToWork: true,
  isMentor: false,
  connectionsCount: 12,
  followersCount: 30,
  reputation: 7,
};

const EU = {
  ...PERFIL,
  id: "22222222-2222-2222-2222-222222222222",
  username: "eu",
  name: "Eu Mesma",
  email: "eu@exemplo.test",
};

/** O vencimento que o backend devolve depois de um silêncio de 1 semana. */
const VENCE_EM = "2026-11-09T12:00:00Z";

let silenciada = false;

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "*",
  });
  res.end(JSON.stringify(body));
}

const mock = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const path = url.pathname.replace(/^\/api/, "");
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    });
    return res.end();
  }
  if (path === "/auth/me" || path === "/users/me" || path === "/me") return json(res, 200, EU);
  if (path === `/users/${PERFIL.username}`) return json(res, 200, PERFIL);
  if (path.endsWith("/status")) {
    return json(res, 200, {
      targetUserId: PERFIL.id,
      status: "ACCEPTED",
      requestedByMe: true,
      blocked: false,
      muted: silenciada,
      muteExpiresAt: silenciada ? VENCE_EM : null,
    });
  }
  if (path.startsWith("/network/mutes/") && req.method === "POST") {
    silenciada = true;
    return json(res, 200, { status: "MUTED" });
  }
  if (path.startsWith("/network/mutes/") && req.method === "DELETE") {
    silenciada = false;
    return json(res, 200, { status: "OK" });
  }
  if (path === "/network/mutes" || path === "/network/blocks") return json(res, 200, []);
  if (path.startsWith("/network/requests")) return json(res, 200, { items: [], nextCursor: null });
  if (path === "/network/summary")
    return json(res, 200, { connections: 12, pending: 0, suggestions: 0, followers: 30 });
  if (path.startsWith("/notifications/unread-summary"))
    return json(res, 200, { total: 0, byModule: {}, byCommunity: {}, eventsToday: 0 });
  if (path.startsWith("/notifications")) return json(res, 200, { items: [], unread: 0 });
  if (path.includes("/conversations")) return json(res, 200, { items: [], nextCursor: null });
  if (path.includes("/posts")) return json(res, 200, { items: [], nextCursor: null });
  if (path === "/profile/ranking") return json(res, 200, []);
  if (path.startsWith("/recommendations")) return json(res, 200, []);
  if (path === "/emotes/index") return json(res, 200, []);
  if (path.endsWith("/presence")) return json(res, 200, { online: false, lastSeenAt: null });
  if (path.endsWith("/seals")) return json(res, 200, []);
  if (path.endsWith("/projects")) return json(res, 200, []);
  if (path.endsWith("/experiences")) return json(res, 200, []);
  if (path.startsWith("/games/"))
    return json(res, 200, {
      userId: PERFIL.id,
      username: PERFIL.username,
      name: PERFIL.name,
      links: [],
      games: [],
      followers: 0,
      following: false,
    });
  if (path === "/avisos/ativo") return json(res, 200, null);
  if (path.startsWith("/feedback")) return json(res, 200, []);
  if (path.startsWith("/stats")) return json(res, 200, { activeUsers: 1 });
  return json(res, 200, []);
});

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
    const { result } = await this.send(
      "Runtime.evaluate",
      { expression, awaitPromise: true, returnByValue: true },
      sessionId,
    );
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

const LER_DIALOGO = `
  (() => {
    const dialog = document.querySelector('[role="dialog"]');
    const options = [...document.querySelectorAll('[role="radio"]')].map((b) => ({
      label: b.textContent.trim(),
      checked: b.getAttribute('aria-checked') === 'true',
      tabIndex: b.tabIndex,
    }));
    return JSON.stringify({
      open: !!dialog,
      text: dialog ? dialog.innerText.replace(/\\n+/g, ' | ') : null,
      options,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    });
  })()
`;

const ABRIR = `
  (() => {
    const button = [...document.querySelectorAll('button')]
      .find((b) => ['Silenciar', 'Remover silêncio'].includes(b.textContent.trim()));
    if (!button) return 'sem-botao';
    button.click();
    return button.textContent.trim();
  })()
`;

const CONFIRMAR = `
  (() => {
    const button = [...document.querySelectorAll('[role="dialog"] button')]
      .find((b) => ['Silenciar', 'Remover silêncio'].includes(b.textContent.trim()));
    if (!button) return 'sem-confirmar';
    button.click();
    return button.textContent.trim();
  })()
`;

async function capturar(cdp, sessionId, width, name, results) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width, height: 900, deviceScaleFactor: 2, mobile: width < 500 },
    sessionId,
  );
  await sleep(400);
  const state = JSON.parse(await cdp.evaluate(sessionId, LER_DIALOGO));
  const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.data, "base64"));
  results.push({ name, width, ...state });
  console.log(name, JSON.stringify(state));
}

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=/tmp/cdp-598-${process.pid}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const results = [];
try {
  await new Promise((resolve) => mock.listen(MOCK_PORT, "127.0.0.1", resolve));
  const ws = new WebSocket(await wsUrl());
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  const cdp = new Cdp(ws);

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);

  // A sessão vive em cookie HttpOnly; quem diz "estou logado" no cliente é a flag do localStorage.
  await cdp.send("Page.navigate", { url: `${APP}/sobre` }, sessionId);
  await sleep(3000);
  await cdp.evaluate(
    sessionId,
    `(() => {
      localStorage.setItem('session_active', '1');
      localStorage.setItem('current_user', JSON.stringify({ id: '${EU.id}', username: '${EU.username}', name: '${EU.name}' }));
      return 'ok';
    })()`,
  );

  await cdp.send("Page.navigate", { url: `${APP}/perfil/${PERFIL.username}` }, sessionId);
  await sleep(9000);

  // Estado A: ainda não silenciada — o menu de prazos.
  console.log("abre A:", await cdp.evaluate(sessionId, ABRIR));
  await sleep(900);
  await capturar(cdp, sessionId, 1280, "dialogo-1280", results);
  await capturar(cdp, sessionId, 390, "dialogo-390", results);

  // O botão do rodapé manda o POST; o cache da conexão é refeito e o perfil passa a mostrar o selo.
  console.log("confirma:", await cdp.evaluate(sessionId, CONFIRMAR));
  await sleep(2500);
  console.log(
    "selo:",
    await cdp.evaluate(
      sessionId,
      `JSON.stringify([...document.querySelectorAll('p')].map((p) => p.innerText.trim()).filter((t) => /silenci/i.test(t)))`,
    ),
  );

  // Estado B: já silenciada — a janela de remoção com a legenda de vencimento.
  console.log("abre B:", await cdp.evaluate(sessionId, ABRIR));
  await sleep(900);
  await capturar(cdp, sessionId, 1280, "silenciada-1280", results);
  await capturar(cdp, sessionId, 390, "silenciada-390", results);

  writeFileSync(`${OUT}/result.json`, `${JSON.stringify(results, null, 2)}\n`);
  await cdp.send("Browser.close").catch(() => {});
} finally {
  mock.close();
  chrome.kill();
}
