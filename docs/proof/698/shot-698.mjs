// Prova visual de #698: a mensagem de falha no envio de arquivo, como a pessoa lê no compositor do
// feed, a 390 e 1280 px. App real (Vite dev) com sessão semeada no localStorage e um backend falso
// em BACKEND_TARGET. Todo nome e valor aqui é obviamente falso.
//
//   node docs/proof/698/shot-698.mjs
//
// Variáveis: APP (padrão http://127.0.0.1:5179), MOCK_PORT (8125), CDP_PORT (9340),
// OUT (docs/proof/698), CHROME (/usr/bin/google-chrome).
//
// O mock responde `POST /media/uploads` com 413 MEDIA_TOO_LARGE e uma mensagem técnica do servidor:
// é o código que o kof apontou (a frase longa) e era o que a tela mostrava crua antes da #698.
// Mede `scrollWidth - clientWidth` do documento, a altura e a quantidade de linhas do banner.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

const APP = process.env.APP ?? "http://127.0.0.1:5179";
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8125);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9340);
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

// O texto que o app NÃO pode mostrar: é a mensagem crua do servidor que a #698 substitui.
const MENSAGEM_DO_SERVIDOR = "Erro interno inesperado ao enviar para o bucket de midia.";

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
  // O envio recusado: o servidor responde 413 com a frase técnica dele.
  if (p === "/media/uploads")
    return json(res, 413, { code: "MEDIA_TOO_LARGE", message: MENSAGEM_DO_SERVIDOR });
  if (p.includes("unread-summary"))
    return json(res, 200, { total: 0, byModule: {}, byCommunity: {}, eventsToday: 0 });
  if (p === "/notifications" || p.startsWith("/network/requests") || p.includes("conversations"))
    return json(res, 200, { items: [], nextCursor: null });
  if (p.startsWith("/feed/posts/seals")) return json(res, 200, {});
  if (p === "/feed") return json(res, 200, { items: [], nextCursor: null, lastSeenAt: null });
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

  async waitFor(sessionId, expression, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.evaluate(sessionId, expression)) return true;
      await sleep(200);
    }
    throw new Error(`tempo esgotado esperando: ${expression.slice(0, 120)}`);
  }

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

// O banner do `publishError` é o parágrafo com borda destrutiva dentro do compositor. Lê o texto,
// mede a altura e conta quantas linhas ele ocupa (pela razão altura / entrelinha), que é o que
// importa no mobile.
// O erro do envio aparece no selo da prévia da mídia (`moderationStatus === "blocked"`), que é a
// caixa estreita onde a frase longa pode quebrar linha no mobile. Lê o texto, a largura, a altura e
// quantas linhas ele ocupa.
const LER = `(() => {
    const selo = [...document.querySelectorAll('div')].find(
      (el) => /bg-destructive\\/90/.test(el.className) && /processar|conexão|guardar|indisponível|não bateu/.test(el.textContent),
    );
    const rect = selo?.getBoundingClientRect();
    const lineHeight = selo ? parseFloat(getComputedStyle(selo).lineHeight) || 16 : null;
    const texto = selo?.textContent.trim() ?? null;
    return JSON.stringify({
      seloPresente: !!selo,
      texto,
      vazaMensagemDoServidor: !!texto && texto.includes(${JSON.stringify(MENSAGEM_DO_SERVIDOR)}),
      largura: rect ? Math.round(rect.width) : null,
      altura: rect ? Math.round(rect.height) : null,
      entrelinha: lineHeight,
      linhas: rect && lineHeight ? Math.round(rect.height / lineHeight) : null,
      estouroDaPagina: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    });
  })()`;

const INPUT_HIDRATADO = `
  (() => {
    const input = document.querySelector('input[type="file"]');
    return !!(input && Object.keys(input).some((k) => k.startsWith('__reactProps')));
  })()
`;

// O compositor do feed começa recolhido ("No que você está pensando?"): o input de arquivo existe,
// mas o Publicar e o banner só aparecem com o compositor aberto.
const ABRIR_COMPOSITOR = `
  (() => {
    const launcher = [...document.querySelectorAll('button')].find(
      (b) => /aprendeu hoje|está pensando|No que você/.test(b.textContent),
    );
    if (!launcher) return 'sem-launcher';
    launcher.click();
    return 'aberto';
  })()
`;

async function viewport(cdp, sessionId, width) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width, height: 900, deviceScaleFactor: 2, mobile: width < 500 },
    sessionId,
  );
  await sleep(500);
}

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=/tmp/cdp-698-${process.pid}`,
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
  await cdp.evaluate(sessionId, ABRIR_COMPOSITOR);
  await sleep(600);

  // O envio da imagem começa na seleção do arquivo; o mock recusa com 413 MEDIA_TOO_LARGE e o
  // selo de erro aparece sobre a prévia.
  await cdp.setFileInput(sessionId, 'input[type="file"]', arquivo);
  await cdp.waitFor(sessionId, `!${LER}.includes('"seloPresente":false')`, 25000);

  for (const width of [1280, 390]) {
    await viewport(cdp, sessionId, width);
    await cdp.evaluate(
      sessionId,
      `(() => {
        const selo = [...document.querySelectorAll('div')].find(
          (el) => /bg-destructive\\/90/.test(el.className) && /processar/.test(el.textContent),
        );
        selo?.scrollIntoView({ block: 'center' });
        return 'ok';
      })()`,
    );
    await sleep(400);
    const state = JSON.parse(await cdp.evaluate(sessionId, LER));
    const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    writeFileSync(`${OUT}/banner-${width}.png`, Buffer.from(png.data, "base64"));
    results.push({ name: `banner-${width}`, width, ...state });
    console.log(`banner-${width}`, JSON.stringify(state));
  }

  console.log("chamadas de escrita:", seen.filter((s) => /^(POST|PUT)/.test(s)).join(", "));
  writeFileSync(`${OUT}/result.json`, `${JSON.stringify(results, null, 2)}\n`);
  await cdp.send("Browser.close").catch(() => {});
} finally {
  mock.close();
  chrome.kill();
}
