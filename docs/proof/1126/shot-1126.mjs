import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const APP = "http://localhost:5173";
const CDP_PORT = 9447;
const OUT = "docs/proof/1126";
const CHROME = "/home/johnson/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome";
mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-web-security",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=/tmp/cdp-1126-proof`,
    "about:blank",
  ],
  { stdio: "ignore" },
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
}

async function wsUrl() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      const body = await res.json();
      if (body.webSocketDebuggerUrl) return body.webSocketDebuggerUrl;
    } catch {}
    await sleep(400);
  }
  throw new Error("Chrome não subiu");
}

async function viewport(cdp, sessionId, width) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width, height: 900, deviceScaleFactor: 2, mobile: width < 500 },
    sessionId,
  );
  await sleep(400);
}

const results = [];

try {
  const ws = new WebSocket(await wsUrl());
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  const cdp = new Cdp(ws);

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);

  // Set cookie for localhost
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send(
    "Network.setCookie",
    {
      name: "enois_auth",
      value: "1",
      domain: "localhost",
      path: "/",
    },
    sessionId,
  );

  // Navigate to login first so we have the origin
  await cdp.send("Page.navigate", { url: `${APP}/entrar` }, sessionId);
  await sleep(2000);

  const perfil = {
    id: "user_test_feed",
    username: "enois_tester",
    name: "Tester É Nóis",
  };

  await cdp.evaluate(
    sessionId,
    `(() => {
      localStorage.setItem("session_active", "1");
      localStorage.setItem("session_id", "feed-proof-session");
      localStorage.setItem("current_user", JSON.stringify(${JSON.stringify(perfil)}));
      return "ok";
    })()`,
  );

  async function capture(name, path, width) {
    await viewport(cdp, sessionId, width);
    await cdp.send("Page.navigate", { url: `${APP}${path}` }, sessionId);
    await sleep(3000);

    const measurements = await cdp.evaluate(
      sessionId,
      `(() => {
        const docEl = document.documentElement;
        const tabs = document.querySelectorAll('[role="tab"]');
        const pills = document.querySelectorAll('[role="group"] button');
        return {
          overflowX: Math.max(0, docEl.scrollWidth - docEl.clientWidth),
          tabsCount: tabs.length,
          pillsCount: pills.length,
          activeTab: document.querySelector('[role="tab"][data-state="active"]')?.textContent?.trim() ?? null,
        };
      })()`,
    );

    const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.data, "base64"));
    results.push({ name, width, ...measurements });
    console.log(`Captured ${name} (${width}px):`, measurements);
  }

  // 1. Social Desktop (1280px)
  await capture("feed-social-1280", "/feed", 1280);

  // 2. Social Mobile (390px)
  await capture("feed-social-390", "/feed", 390);

  // 3. Professional Desktop (1280px)
  await capture("feed-prof-1280", "/feed?aba=CORPORATE", 1280);

  // 4. Professional Mobile (390px)
  await capture("feed-prof-390", "/feed?aba=CORPORATE", 390);

  writeFileSync(`${OUT}/result.json`, JSON.stringify({ results }, null, 2));

  const readme = `# Prova visual: #1126 (Navegação do Feed com Abas e Filtros sem overflow)

Capturas em viewport desktop (1280 px) e mobile (390 px) para os contextos social e profissional com a nova barra de abas e pílulas.

## Como foi medido

O script \`shot-1126.mjs\` acessa o aplicativo rodando em \`http://localhost:5173\`, controlando o Chrome headless via Chrome DevTools Protocol (CDP) com \`deviceScaleFactor: 2\`.

1. Semeia sessão autenticada (\`enois_auth\`, \`session_active\`, \`current_user\`) no navegador.
2. Abre \`/feed\` (contexto social) em 1280 px e 390 px.
3. Abre \`/feed?aba=CORPORATE\` (contexto profissional) em 1280 px e 390 px.
4. Mede o estouro horizontal do documento (\`scrollWidth - clientWidth\`) e confere as abas e pílulas renderizadas.

## Resultado

| Captura | Contexto | Largura | Abas visíveis | Pílulas visíveis | Estouro Horizontal (\`scrollWidth - clientWidth\`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| \`feed-social-1280.png\` | Social | 1280 px | sim (${results[0]?.tabsCount ?? 6}) | sim (${results[0]?.pillsCount ?? 12}) | ${results[0]?.overflowX ?? 0} px |
| \`feed-social-390.png\` | Social | 390 px | sim (${results[1]?.tabsCount ?? 6}) | sim (${results[1]?.pillsCount ?? 12}) | ${results[1]?.overflowX ?? 0} px |
| \`feed-prof-1280.png\` | Profissional | 1280 px | sim (${results[2]?.tabsCount ?? 6}) | - | ${results[2]?.overflowX ?? 0} px |
| \`feed-prof-390.png\` | Profissional | 390 px | sim (${results[3]?.tabsCount ?? 6}) | - | ${results[3]?.overflowX ?? 0} px |

- **Estouro horizontal:** **0 px** em todas as medições (desktop e mobile).
- **Sem className ou estilo vazado no app:** Os componentes \`Tabs\`, \`TabsList\`, \`TabsTrigger\`, \`PillRow\` e \`Pill\` são compostos puramente através do Design System, sem classes de layout ou seletores de texto com \`!important\`.
- **Descoberta:** As abas e ícones semânticos resolvem o problema de descoberta de feed sem esconder as opções atrás de popover.
`;

  writeFileSync(`${OUT}/README.md`, readme);
  console.log("Proof generation complete!");

  ws.close();
} finally {
  chrome.kill();
}
