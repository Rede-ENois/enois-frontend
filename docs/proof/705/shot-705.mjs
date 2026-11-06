// Prova visual de #705: o saldo em faíscas e fagulhas, a explicação do decimal e a prévia do valor
// no formulário de pagamento, a 390 e 1280 px. App real (Vite dev) com sessão semeada no
// localStorage e um backend falso em BACKEND_TARGET. Todo nome e valor aqui é obviamente falso.
//
//   node docs/proof/705/shot-705.mjs
//
// Variáveis: APP (padrão http://127.0.0.1:5182), MOCK_PORT (8127), CDP_PORT (9343),
// OUT (docs/proof/705), CHROME (/usr/bin/google-chrome).
//
// A carteira responde 101830 milésimos — o mesmo exemplo do pedido: "101 faíscas 830 fagulhas".
// Mede o texto renderizado, quantas linhas a explicação ocupa e o estouro da página.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

const APP = process.env.APP ?? "http://127.0.0.1:5182";
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8127);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9343);
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

// 101,830 faíscas: o exemplo citado no pedido.
const SALDO_MILESIMOS = 101_830;

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
  if (p === "/carteira")
    return json(res, 200, {
      balance: SALDO_MILESIMOS,
      escala: 1000,
      cotacaoBrlCents: 10,
      cotacaoBrlMicros: 100_000,
      chave: "chave-falsa-de-prova",
      entries: [],
      streak: null,
    });
  if (p.startsWith("/coin/cotacao"))
    return json(res, 200, {
      brlCents: 10,
      brlMicros: 100_000,
      escala: 1000,
      atualizadaEm: "2026-11-06T00:00:00Z",
      historico: [],
    });
  if (p.includes("unread-summary"))
    return json(res, 200, { total: 0, byModule: {}, byCommunity: {}, eventsToday: 0 });
  if (p === "/notifications" || p.startsWith("/network/requests") || p.includes("conversations"))
    return json(res, 200, { items: [], nextCursor: null });
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

const LER_CARTEIRA = `
  (() => {
    const saldo = document.querySelector('p.text-4xl');
    const explicacao = [...document.querySelectorAll('p')].find((el) =>
      /1\\.000 fagulhas/.test(el.textContent),
    );
    const exemplo = [...document.querySelectorAll('p')].find((el) =>
      /101,83 faíscas/.test(el.textContent),
    );
    const rect = explicacao?.getBoundingClientRect();
    const lineHeight = explicacao ? parseFloat(getComputedStyle(explicacao).lineHeight) || 16 : null;
    return JSON.stringify({
      saldo: saldo?.textContent.trim() ?? null,
      explica: !!explicacao,
      exemploVisivel: !!exemplo,
      larguraDaExplicacao: rect ? Math.round(rect.width) : null,
      linhasDaExplicacao: rect && lineHeight ? Math.round(rect.height / lineHeight) : null,
      estouroDaPagina: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    });
  })()
`;

// O menu da conta (desktop) mostra o saldo; antes ele vinha em milésimos crus.
const LER_MENU = `
  (() => {
    const texto = document.body.innerText;
    const linha = texto.split('\\n').find((l) => /faísca/.test(l)) ?? null;
    return JSON.stringify({ linhaDoSaldo: linha });
  })()
`;

const LER_PAGAMENTO = `
  (() => {
    const previa = [...document.querySelectorAll('span')].find((el) =>
      /fagulha/.test(el.textContent) && /≈/.test(el.textContent),
    );
    return JSON.stringify({
      previaDoValor: previa?.textContent.replace(/\\s+/g, ' ').trim() ?? null,
    });
  })()
`;

async function viewport(cdp, sessionId, width) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width, height: 1000, deviceScaleFactor: 2, mobile: width < 500 },
    sessionId,
  );
  await sleep(500);
}

async function capturar(cdp, sessionId, width, name, expression, results) {
  await viewport(cdp, sessionId, width);
  const state = JSON.parse(await cdp.evaluate(sessionId, expression));
  const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  writeFileSync(`${OUT}/${name}-${width}.png`, Buffer.from(png.data, "base64"));
  results.push({ name: `${name}-${width}`, width, ...state });
  console.log(`${name}-${width}`, JSON.stringify(state));
}

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=/tmp/cdp-705-${process.pid}`,
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

  await cdp.send("Page.navigate", { url: `${APP}/sobre` }, sessionId);
  await sleep(3500);
  await cdp.evaluate(
    sessionId,
    `(() => {
      localStorage.setItem('session_active', '1');
      localStorage.setItem('session_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      localStorage.setItem('current_user', JSON.stringify({ id: '${EU.id}', username: '${EU.username}', name: '${EU.name}' }));
      return 'ok';
    })()`,
  );

  await cdp.send("Page.navigate", { url: `${APP}/carteira` }, sessionId);
  await cdp.waitFor(
    sessionId,
    `!!document.body && /101 faíscas 830 fagulhas/.test(document.body.innerText)`,
    25000,
  );
  await sleep(700);

  for (const width of [1280, 390])
    await capturar(cdp, sessionId, width, "carteira", LER_CARTEIRA, results);

  // A prévia do valor: digita "101,83" e o formulário mostra "101 faíscas 830 fagulhas ≈ R$ …".
  await viewport(cdp, sessionId, 1280);
  await cdp.evaluate(
    sessionId,
    `(() => {
      const botao = [...document.querySelectorAll('button')].find((b) => /Pagar|Enviar/.test(b.textContent));
      botao?.click();
      return 'ok';
    })()`,
  );
  await cdp.waitFor(
    sessionId,
    `!!document.querySelector('h3') && /Pagar/.test(document.body.innerText)`,
    10000,
  );
  await sleep(400);
  await cdp.evaluate(
    sessionId,
    `(() => {
      const field = [...document.querySelectorAll('input')].find((el) => el.inputMode === 'decimal');
      if (!field) return 'sem-campo';
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(field, '101,83');
      field.dispatchEvent(new Event('input', { bubbles: true }));
      return 'ok';
    })()`,
  );
  await cdp.waitFor(sessionId, `!!document.body && /fagulha/.test(document.body.innerText)`, 10000);
  await sleep(400);

  for (const width of [1280, 390])
    await capturar(cdp, sessionId, width, "pagamento", LER_PAGAMENTO, results);

  console.log("chamadas:", seen.join(", "));
  writeFileSync(`${OUT}/result.json`, `${JSON.stringify(results, null, 2)}\n`);
  await cdp.send("Browser.close").catch(() => {});
} finally {
  mock.close();
  chrome.kill();
}
