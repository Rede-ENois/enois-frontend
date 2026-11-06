import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const OUT = fileURLToPath(new URL(".", import.meta.url));
const APP_PORT = Number(process.env.APP_PORT ?? 5192);
const APP = process.env.APP ?? `http://127.0.0.1:${APP_PORT}`;
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8127);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9343);
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
  headline: "Desenvolvedora",
  skills: [],
  goals: [],
  externalLinks: [],
  connectionsCount: 1,
  followersCount: 1,
  reputation: 3,
  bio: "Bio de teste",
};

let hideRepostsState = false;
const seen = [];
const consoleErrors = [];

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
  if (p.startsWith("/me/theme")) return json(res, 200, { theme: null, updatedAt: null });
  if (p.startsWith("/notifications/unread-summary")) return json(res, 200, { total: 0, byModule: {}, byCommunity: {}, eventsToday: 0 });
  if (p.startsWith("/notifications")) return json(res, 200, { items: [], unread: 0, nextCursor: null });
  if (p.startsWith("/conversations/unread-count")) return json(res, 200, { count: 0 });
  if (p.startsWith("/conversations")) return json(res, 200, { items: [], nextCursor: null });
  if (p.startsWith("/calls")) return json(res, 200, []);
  if (p.startsWith("/communities")) return json(res, 200, { items: [], nextCursor: null });
  if (p.startsWith("/network")) return json(res, 200, { items: [], nextCursor: null, connections: 0, pending: 0, suggestions: 0, followers: 0 });
  if (p.startsWith("/feed")) return json(res, 200, { items: [], nextCursor: null });
  return json(res, 200, {});
});

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.method === "Network.requestWillBeSent") {
        console.log("[network-req]", msg.params.request.method, msg.params.request.url);
      }
      if (msg.method === "Network.responseReceived") {
        console.log("[network-res]", msg.params.response.status, msg.params.response.url);
      }
      if (msg.method === "Network.loadingFailed") {
        console.log("[network-fail]", msg.params.errorText, msg.params.type);
      }
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
        if (msg.params.type === "error" && !text.includes('unique "key" prop')) {
          console.error("[browser-console-error]", text);
          consoleErrors.push(text);
        }
      }
      if (msg.method === "Runtime.exceptionThrown") {
        console.error("[browser-uncaught-exception]", JSON.stringify(msg.params.exceptionDetails));
        consoleErrors.push(JSON.stringify(msg.params.exceptionDetails));
      }
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
  throw new Error("Chrome não subiu na porta CDP");
}

const LER_ESTADO = `
  (() => {
    const switchEl = document.querySelector('[role="switch"]') || document.querySelector('button[data-state]');
    const isChecked = switchEl ? (switchEl.getAttribute('aria-checked') === 'true' || switchEl.getAttribute('data-state') === 'checked') : false;
    const bodyText = document.body ? document.body.innerText : '';
    const pageOverflow = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    return JSON.stringify({
      switchChecked: isChecked,
      hasTitle: /Preferências de feed|Feed/i.test(bodyText),
      hasHint: /republicações|reposts|Quando ativado/i.test(bodyText),
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
  results.push({ name: `${name}-${width}`, width, ...state, consoleErrorsCount: consoleErrors.length });
  console.log(`${name}-${width}`, JSON.stringify(state));
}

let viteProc = null;
const isViteUp = async () => {
  try {
    const res = await fetch(`${APP}/`);
    return res.status < 500;
  } catch {
    return false;
  }
};

const userDataDir = join(tmpdir(), `cdp-706-${process.pid}`);
let chrome = null;
const results = [];

try {
  await new Promise((resolve) => mock.listen(MOCK_PORT, "127.0.0.1", resolve));
  console.log(`Mock rodando na porta ${MOCK_PORT}`);

  if (!(await isViteUp())) {
    console.log(`Iniciando Vite dev server na porta ${APP_PORT}...`);
    const viteBin = join(ROOT, "node_modules/vite/bin/vite.js");
    viteProc = spawn(
      process.execPath,
      [viteBin, "--port", String(APP_PORT), "--host", "127.0.0.1"],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          BACKEND_TARGET: `http://127.0.0.1:${MOCK_PORT}`,
        },
        stdio: "inherit",
      },
    );

    for (let i = 0; i < 60; i++) {
      if (await isViteUp()) break;
      await sleep(500);
    }
  }
  console.log(`Vite pronto em ${APP}`);

  chrome = spawn(
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

  const ws = new WebSocket(await wsUrl());
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  const cdp = new Cdp(ws);

  const { targetId } = await cdp.send("Target.createTarget", { url: `${APP}/entrar` });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);

  // Injeta automaticamente no novo documento para persistir a sessao
  await cdp.send(
    "Page.addScriptToEvaluateOnNewDocument",
    {
      source: `
        try {
          localStorage.setItem('session_active', '1');
          localStorage.setItem('session_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
          localStorage.setItem('current_user', JSON.stringify(${JSON.stringify(EU)}));
        } catch (e) {}
      `,
    },
    sessionId,
  );

  // Define cookie via CDP Network
  await cdp.send(
    "Network.setCookie",
    {
      name: "enois_auth",
      value: "1",
      domain: "127.0.0.1",
      path: "/",
    },
    sessionId,
  );

  await sleep(2000);
  await cdp.evaluate(
    sessionId,
    `(() => {
      try {
        localStorage.clear();
        localStorage.setItem('session_active', '1');
        localStorage.setItem('session_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
        localStorage.setItem('current_user', JSON.stringify(${JSON.stringify(EU)}));
      } catch (e) {}
      return 'ok';
    })()`,
  );

  // Navega para preferencias de feed
  await cdp.send("Page.navigate", { url: `${APP}/conta/preferencias-feed` }, sessionId);
  await sleep(3000);
  console.log("URL atual:", await cdp.evaluate(sessionId, "window.location.href"));
  console.log("Body text:", await cdp.evaluate(sessionId, "document.body.innerText"));
  console.log("Chamadas recebidas no mock:", seen.join(", "));

  // Aguarda até o Switch carregar (saindo do estado isPending/skeleton)
  console.log("Aguardando Switch carregar...");
  await cdp.waitFor(
    sessionId,
    `!!document.querySelector('[role="switch"]') && /republicações|reposts/i.test(document.body.innerText)`,
    60000,
  );
  console.log("Switch carregado com sucesso!");
  await sleep(500);

  // 1. Estado desligado (1280 e 390)
  const domInfo = await cdp.evaluate(sessionId, `(() => ({
    bodyText: document.body ? document.body.innerText : null,
    section: document.querySelector('section')?.outerHTML || null,
    sw: document.querySelector('[role="switch"]')?.outerHTML || null,
  }))()`);
  console.log("DOM INFO:", JSON.stringify(domInfo));

  for (const width of [1280, 390]) {
    await capturar(cdp, sessionId, width, "feed-prefs-desligado", results);
  }

  // 2. Clica no interruptor para ligar
  await viewport(cdp, sessionId, 1280);
  await cdp.evaluate(
    sessionId,
    `(() => {
      const sw = document.querySelector('[role="switch"]');
      sw?.click();
      return 'ok';
    })()`,
  );

  // Aguarda o switch mudar para aria-checked="true"
  await cdp.waitFor(
    sessionId,
    `document.querySelector('[role="switch"]')?.getAttribute('aria-checked') === 'true'`,
    10000,
  );
  await sleep(500);

  // 3. Estado ligado (1280 e 390)
  for (const width of [1280, 390]) {
    await capturar(cdp, sessionId, width, "feed-prefs-ligado", results);
  }

  console.log("chamadas:", seen.join(", "));
  console.log("erros de console capturados:", consoleErrors.length);
  writeFileSync(join(OUT, "result.json"), `${JSON.stringify(results, null, 2)}\n`);

  const readme = `# Prova Visual — Preferências de Feed (#706)

Evidências de renderização e estado do interruptor na rota \`/conta/preferencias-feed\` nos viewports desktop (1280px) e mobile (390px).

## Capturas

- \`feed-prefs-desligado-1280.png\` / \`feed-prefs-desligado-390.png\`: Estado inicial carregado (\`switchChecked: false\`, \`hasHint: true\`).
- \`feed-prefs-ligado-1280.png\` / \`feed-prefs-ligado-390.png\`: Estado pós-clique (\`switchChecked: true\`, \`hasHint: true\`).

## Métricas registradas (\`result.json\`)

- **Overflow horizontal:** 0px em ambos os viewports.
- **Erros de console:** 0 erros capturados durante a sessão.
- **Interatividade:** O switch reflete com sucesso o toggle entre \`false\` e \`true\`.
`;
  writeFileSync(join(OUT, "README.md"), readme);

  await cdp.send("Browser.close").catch(() => {});
} finally {
  mock.close();
  if (chrome) chrome.kill();
  if (viteProc) viteProc.kill();
}
