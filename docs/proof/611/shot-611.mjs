// Prova visual de #611: a lição de bons modos aberta pelo envio de uma imagem barrada, mais a
// prévia bloqueada no compositor do feed, a 390 e 1280 px. App real (Vite dev) com sessão semeada
// no localStorage e um backend falso em BACKEND_TARGET. Todo nome e valor aqui é obviamente falso.
//
//   node docs/proof/611/shot-611.mjs
//
// Variáveis: APP (padrão http://127.0.0.1:5178), MOCK_PORT (8124), CDP_PORT (9339),
// OUT (docs/proof/611), CHROME (/usr/bin/google-chrome).
//
// O mock responde o envio com 422 IMAGE_CONTENT_NOT_ALLOWED pelo caminho same-origin
// (/api/storage/...), que é o único em que o erro chega como ApiError ao compositor.
// Mede `scrollWidth - clientWidth` do documento e do diálogo em 1280 e 390 px.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

const APP = process.env.APP ?? "http://127.0.0.1:5178";
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8124);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9339);
const OUT = process.env.OUT ?? new URL(".", import.meta.url).pathname;
const CHROME = process.env.CHROME ?? "/usr/bin/google-chrome";
mkdirSync(OUT, { recursive: true });

const EU = {
  id: "22222222-2222-2222-2222-222222222222",
  username: "eu",
  name: "Eu Mesma",
  email: "eu@exemplo.test",
  headline: "T",
  skills: [],
  goals: [],
  externalLinks: [],
  connectionsCount: 1,
  followersCount: 1,
  reputation: 3,
  bio: "x",
};

const seen = [];

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
  const p = new URL(req.url, "http://x").pathname.replace(/^\/api/, "");
  seen.push(`${req.method} ${p}`);
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    });
    return res.end();
  }
  if (p === "/auth/me" || p === "/me") return json(res, 200, EU);
  if (p === "/novidades/atual" || p.endsWith("/ativo")) return json(res, 200, null);
  if (p === "/media/uploads")
    return json(res, 201, {
      id: "m1",
      provider: "S3",
      uploadUrl: "/api/storage/prova",
      uploadHeaders: { "content-type": "image/png" },
      cdnUrl: "https://exemplo.test/prova.png",
    });
  if (p.startsWith("/storage/")) {
    req.resume();
    return req.on("end", () =>
      json(res, 422, { code: "IMAGE_CONTENT_NOT_ALLOWED", message: "recusado" }),
    );
  }
  if (p.includes("unread-summary"))
    return json(res, 200, { total: 0, byModule: {}, byCommunity: {}, eventsToday: 0 });
  // Página paginada: a lista sem o `items` não estoura na tela, mas derruba a conta de pedidos.
  if (p === "/notifications" || p.startsWith("/network/requests") || p.includes("conversations"))
    return json(res, 200, { items: [], nextCursor: null });
  if (p.startsWith("/feed/posts/seals")) return json(res, 200, {});
  if (p === "/feed") return json(res, 200, { items: [], nextCursor: null, lastSeenAt: null });
  // A tela da comunidade: o detalhe vem do loader, e o compositor precisa de membros e do feed.
  if (/^\/communities\/[^/]+$/.test(p))
    return json(res, 200, {
      id: "c1",
      name: "Comunidade de prova",
      description: "Comunidade criada só para esta captura.",
      topic: null,
      members: 1,
      joined: true,
      cover: null,
      avatar: null,
    });
  if (/^\/communities\/[^/]+\/members$/.test(p)) return json(res, 200, { items: [] });
  if (/^\/communities\/[^/]+\/feed$/.test(p))
    return json(res, 200, { items: [], nextCursor: null, lastSeenAt: null });
  if (/^\/communities\/[^/]+\/pin$/.test(p)) return json(res, 200, null);
  return json(res, 200, []);
});

const PROVA_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

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

  /** Espera a expressão devolver algo diferente de falso (hidratação, diálogo, navegação). */
  async waitFor(sessionId, expression, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.evaluate(sessionId, expression)) return true;
      await sleep(200);
    }
    throw new Error(`tempo esgotado esperando: ${expression.slice(0, 120)}`);
  }

  /** Coloca um arquivo no `<input type=file>` da página (o caminho do Playwright não existe aqui). */
  async setFileInput(sessionId, selector, filePath) {
    const { root } = await this.send("DOM.getDocument", { depth: -1 }, sessionId);
    const { nodeId } = await this.send(
      "DOM.querySelector",
      { nodeId: root.nodeId, selector },
      sessionId,
    );
    if (!nodeId) throw new Error(`input não encontrado: ${selector}`);
    await this.send("DOM.setFileInputFiles", { nodeId, files: [filePath] }, sessionId);
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

// Lê o estado da tela: o diálogo aberto, o texto dele, se ele rola e quanto estoura.
const LER = `
  (() => {
    const dialog = document.querySelector('[role="dialog"]');
    const rect = dialog?.getBoundingClientRect();
    return JSON.stringify({
      dialogOpen: !!dialog,
      rules: dialog ? [...dialog.querySelectorAll('strong')].map((el) => el.textContent.trim()) : [],
      title: dialog?.querySelector('h2')?.textContent.trim() ?? null,
      dismiss: dialog
        ? ([...dialog.querySelectorAll('button')]
            .find((b) => /Entendido/.test(b.textContent))
            ?.textContent.trim() ?? null)
        : null,
      dialogWidth: rect ? Math.round(rect.width) : null,
      dialogHeight: rect ? Math.round(rect.height) : null,
      dialogScrolls: dialog ? dialog.scrollHeight - dialog.clientHeight : null,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
    });
  })()
`;

const ABRIR = (texto) => `
  (() => {
    const button = [...document.querySelectorAll('button')].find((b) => ${texto});
    if (!button) return 'sem-botao';
    button.click();
    return button.textContent.trim();
  })()
`;

const DIALOGO_ABERTO = `!!document.querySelector('[role="dialog"]')`;
const DIALOGO_FECHADO = `!document.querySelector('[role="dialog"]')`;
// O SSR entrega o input de arquivo; o handler só existe depois da hidratação — antes disso o
// change é engolido. A espera é pelo `__reactProps`, que aparece quando o React assume o nó.
const INPUT_HIDRATADO = `
  (() => {
    const input = document.querySelector('input[type="file"]');
    return !!(input && Object.keys(input).some((k) => k.startsWith('__reactProps')));
  })()
`;

const ESTADO_PREVIA_FEED = `
  (() => JSON.stringify({
    hasBlockedPreview: /Imagem ocultada/.test(document.body.innerText),
    hasReopenButton: /Ver aula de bons modos/.test(document.body.innerText),
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))()
`;

// A prévia da comunidade é um selo de 80 px: só o ícone e o link ficam visíveis, e a frase inteira
// vive no `title`/`sr-only`. Por isso a checagem é do link, não do texto do feed.
const ESTADO_PREVIA_COMUNIDADE = `
  (() => JSON.stringify({
    hasBlockedPreview: document.body.innerHTML.includes('Imagem ocultada'),
    hasShortReopenButton: [...document.querySelectorAll('button')].some(
      (b) => b.textContent.trim() === 'Ver aula'),
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))()
`;

async function viewport(cdp, sessionId, width) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width, height: 900, deviceScaleFactor: 2, mobile: width < 500 },
    sessionId,
  );
  await sleep(500);
}

async function capturar(cdp, sessionId, width, name, results) {
  await viewport(cdp, sessionId, width);
  const state = JSON.parse(await cdp.evaluate(sessionId, LER));
  const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.data, "base64"));
  results.push({ name, ...state });
  console.log(name, JSON.stringify(state));
}

async function capturarEstado(cdp, sessionId, width, name, expression, results) {
  await viewport(cdp, sessionId, width);
  const state = JSON.parse(await cdp.evaluate(sessionId, expression));
  const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.data, "base64"));
  results.push({ name, ...state });
  console.log(name, JSON.stringify(state));
}

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=/tmp/cdp-611-${process.pid}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const arquivo = `${OUT}/arquivo-de-prova.png`;
writeFileSync(arquivo, PROVA_PNG);

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
  await cdp.send("DOM.enable", {}, sessionId);

  // A sessão do app vive no localStorage; a rota /sobre existe sem login e grava ali.
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

  await cdp.send("Page.navigate", { url: `${APP}/feed` }, sessionId);
  await cdp.waitFor(sessionId, INPUT_HIDRATADO);

  // Envio da imagem: o compositor abre e a prévia fica bloqueada.
  await cdp.setFileInput(sessionId, 'input[type="file"]', arquivo);
  try {
    await cdp.waitFor(sessionId, DIALOGO_ABERTO, 20000);
  } catch {
    console.log("SEM DIALOGO. escritas:", seen.filter((s) => /^(POST|PUT)/.test(s)).join(", "));
    console.log("corpo:", (await cdp.evaluate(sessionId, "document.body.innerText")).slice(0, 400));
    throw new Error("dialogo nao abriu no feed");
  }
  await sleep(700);

  for (const width of [1280, 390]) await capturar(cdp, sessionId, width, `licao-${width}`, results);

  // O rodapé fecha a lição e a prévia bloqueada continua no compositor com o botão de reabrir.
  await cdp.evaluate(sessionId, ABRIR(`/Entendido/.test(b.textContent)`));
  await cdp.waitFor(sessionId, DIALOGO_FECHADO, 10000);

  for (const width of [1280, 390])
    await capturarEstado(
      cdp,
      sessionId,
      width,
      `previa-feed-${width}`,
      ESTADO_PREVIA_FEED,
      results,
    );

  // O botão da prévia reabre a lição: se fosse decorativo, a pessoa ficaria sem explicação.
  await cdp.evaluate(sessionId, ABRIR(`/Ver aula de bons modos/.test(b.textContent)`));
  await cdp.waitFor(sessionId, DIALOGO_ABERTO, 10000);
  await sleep(500);
  await capturar(cdp, sessionId, 1280, "reabre-pela-previa", results);

  // A mesma prévia no compositor da comunidade — outra superfície alterada, com "Ver aula" curto.
  await cdp.send("Page.navigate", { url: `${APP}/comunidades/c1` }, sessionId);
  await cdp.waitFor(sessionId, INPUT_HIDRATADO);
  await cdp.setFileInput(sessionId, 'input[type="file"]', arquivo);
  await cdp.waitFor(sessionId, DIALOGO_ABERTO, 20000);
  await cdp.evaluate(sessionId, ABRIR(`/Entendido/.test(b.textContent)`));
  await cdp.waitFor(sessionId, DIALOGO_FECHADO, 10000);

  for (const width of [1280, 390]) {
    // O compositor da comunidade fica abaixo da dobra; a captura tem de mostrar a prévia.
    await viewport(cdp, sessionId, width);
    await cdp.evaluate(
      sessionId,
      `(() => { [...document.querySelectorAll('button')]
        .find((b) => b.textContent.trim() === 'Ver aula')
        ?.scrollIntoView({ block: 'center' }); return 'ok'; })()`,
    );
    await sleep(500);
    await capturarEstado(
      cdp,
      sessionId,
      width,
      `previa-comunidade-${width}`,
      ESTADO_PREVIA_COMUNIDADE,
      results,
    );
  }

  // O botão curto da comunidade também reabre a lição.
  await cdp.evaluate(sessionId, ABRIR(`b.textContent.trim() === 'Ver aula'`));
  await cdp.waitFor(sessionId, DIALOGO_ABERTO, 10000);
  await sleep(500);
  await capturar(cdp, sessionId, 1280, "comunidade-reabre", results);

  console.log("chamadas de escrita:", seen.filter((s) => /^(POST|PUT)/.test(s)).join(", "));
  writeFileSync(`${OUT}/result.json`, `${JSON.stringify(results, null, 2)}\n`);
  await cdp.send("Browser.close").catch(() => {});
} finally {
  mock.close();
  chrome.kill();
}
