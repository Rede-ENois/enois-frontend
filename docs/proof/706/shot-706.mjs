import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const APP = process.env.APP ?? "http://127.0.0.1:5182";
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8127);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9343);
const OUT = process.env.OUT ?? fileURLToPath(new URL(".", import.meta.url));
const CHROME =
  process.env.CHROME ??
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/usr/bin/google-chrome");

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

let hideRepostsState = false;
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
  if (p === "/me/preferences") {
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (typeof parsed.hideReposts === "boolean") {
            hideRepostsState = parsed.hideReposts;
          }
        } catch {}
        json(res, 200, {
          likedTopics: [],
          blockedTopics: [],
          disabledModules: [],
          nightRestReminder: false,
          nightRestDismissedOn: null,
          liteMode: false,
          batataMode: false,
          hideReposts: hideRepostsState,
        });
      });
      return;
    }
    return json(res, 200, {
      likedTopics: [],
      blockedTopics: [],
      disabledModules: [],
      nightRestReminder: false,
      nightRestDismissedOn: null,
      liteMode: false,
      batataMode: false,
      hideReposts: hideRepostsState,
    });
  }
  return json(res, 200, {});
});

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      if (!msg.id) return;
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

const LER_ESTADO = `
  (() => {
    const switchEl = document.querySelector('[role="switch"]') || document.querySelector('button[data-state]');
    const isChecked = switchEl ? (switchEl.getAttribute('aria-checked') === 'true' || switchEl.getAttribute('data-state') === 'checked') : false;
    const bodyText = document.body ? document.body.innerText : '';
    const pageOverflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    return JSON.stringify({
      switchChecked: isChecked,
      hasTitle: /Preferências de feed|Feed/.test(bodyText),
      hasHint: /republicações|reposts/i.test(bodyText),
      pageOverflow,
    });
  })()
`;

async function viewport(cdp, sessionId, width) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width, height: 900, deviceScaleFactor: 2, mobile: width < 500 },
    sessionId,
  );
  await sleep(400);
}

async function capturar(cdp, sessionId, width, name, results) {
  await viewport(cdp, sessionId, width);
  const raw = await cdp.evaluate(sessionId, LER_ESTADO);
  const state = JSON.parse(raw);
  const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  writeFileSync(join(OUT, `${name}-${width}.png`), Buffer.from(png.data, "base64"));
  results.push({ name: `${name}-${width}`, width, ...state });
  console.log(`${name}-${width}`, JSON.stringify(state));
}

const userDataDir = `${tmpdir()}/cdp-706-${process.pid}`;
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
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
  await sleep(2500);
  await cdp.evaluate(
    sessionId,
    `(() => {
      localStorage.setItem('session_active', '1');
      localStorage.setItem('session_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
      localStorage.setItem('current_user', JSON.stringify({ id: '${EU.id}', username: '${EU.username}', name: '${EU.name}' }));
      return 'ok';
    })()`,
  );

  await cdp.send("Page.navigate", { url: `${APP}/conta/preferencias-feed` }, sessionId);
  await cdp.waitFor(
    sessionId,
    `!!document.body && /Preferências de feed|Ocultar reposts/i.test(document.body.innerText)`,
    25000,
  );
  await sleep(600);

  // 1. Estado desligado (1280 e 390)
  for (const width of [1280, 390]) {
    await capturar(cdp, sessionId, width, "feed-prefs-desligado", results);
  }

  // 2. Clica no interruptor para ligar
  await viewport(cdp, sessionId, 1280);
  await cdp.evaluate(
    sessionId,
    `(() => {
      const sw = document.querySelector('[role="switch"]') || document.querySelector('button[data-state]');
      sw?.click();
      return 'ok';
    })()`,
  );
  await sleep(600);

  // 3. Estado ligado (1280 e 390)
  for (const width of [1280, 390]) {
    await capturar(cdp, sessionId, width, "feed-prefs-ligado", results);
  }

  console.log("chamadas:", seen.join(", "));
  writeFileSync(join(OUT, "result.json"), `${JSON.stringify(results, null, 2)}\n`);
  await cdp.send("Browser.close").catch(() => {});
} finally {
  mock.close();
  chrome.kill();
}
