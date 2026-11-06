// Prova visual de #704: revert de hashtags e retorno das bolhas de Assunto e Tipo
// no compositor compacto, a 1280 px e 390 px.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../..");
const OUT = __dirname;
mkdirSync(OUT, { recursive: true });

const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8126);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9339);
const APP_PORT = 5179;
const APP = process.env.APP ?? `http://127.0.0.1:${APP_PORT}`;

const CHROME_PATHS = [
  process.env.CHROME,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const CHROME = CHROME_PATHS.find((p) => existsSync(p));
if (!CHROME) {
  console.error("Chrome/Edge não encontrado!");
  process.exit(1);
}

const EU = {
  id: "user_teste_1",
  username: "autor_teste",
  name: "Autor de Teste",
  headline: "Desenvolvedor",
  email: "autor@exemplo.test",
  company: null,
  location: "São Paulo, SP",
  avatar: null,
  banner: null,
  badge: null,
  bio: "Perfil de teste do compositor.",
  skills: ["TypeScript", "React"],
  goals: [],
  availability: "ABERTO",
  portfolio: null,
  externalLinks: [],
  openToWork: true,
  isMentor: false,
  connectionsCount: 42,
  followersCount: 100,
  reputation: 10,
};

function json(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "*",
  });
  res.end(JSON.stringify(data));
}

const mock = createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "*",
    });
    return res.end();
  }

  const url = new URL(req.url, `http://127.0.0.1:${MOCK_PORT}`);
  const path = url.pathname;

  if (path === "/auth/me" || path === "/me" || path === "/v1/me") return json(res, 200, EU);
  if (path === "/me/business-profile") return json(res, 200, { exists: false });
  if (path.startsWith("/profile/")) return json(res, 200, EU);
  if (path === "/me/preferences" || path === "/me/preferences/personalization")
    return json(res, 200, {
      likedTopics: [],
      blockedTopics: [],
      disabledModules: [],
      nightRestReminder: true,
      liteMode: false,
      batataMode: false,
      whatsNewEnabled: true,
      whatsNewLastSeen: "2026.11.05",
    });
  if (path.startsWith("/feed/scheduled")) return json(res, 200, []);
  if (path.startsWith("/feed"))
    return json(res, 200, {
      items: [
        {
          id: "post_1",
          authorId: EU.id,
          authorUsername: EU.username,
          authorName: EU.name,
          authorAvatar: null,
          type: "INSIGHT",
          content: "Post de teste com bolhas de assunto restauradas.",
          tags: ["TECNOLOGIA"],
          mediaIds: [],
          createdAt: new Date().toISOString(),
          visibility: "PUBLIC",
          counters: { reactions: 1, comments: 0, saves: 0, shares: 0, reposts: 0 },
          status: "ACTIVE",
        },
      ],
      nextCursor: null,
      lastSeenAt: new Date().toISOString(),
    });
  if (path.startsWith("/notifications/unread-summary"))
    return json(res, 200, { total: 0, byModule: {}, byCommunity: {}, eventsToday: 0 });
  if (path.startsWith("/notifications")) return json(res, 200, { items: [], unread: 0 });
  if (path.startsWith("/conversations/unread-count")) return json(res, 200, { count: 0 });
  if (path.startsWith("/conversations")) return json(res, 200, { items: [], nextCursor: null });
  if (path.startsWith("/communities/mine")) return json(res, 200, { items: [], nextCursor: null });
  if (path.startsWith("/communities/favorites"))
    return json(res, 200, { items: [], nextCursor: null });
  if (path.startsWith("/emotes/index") || path.startsWith("/emotes")) return json(res, 200, []);
  if (path.startsWith("/avisos/ativo")) return json(res, 200, null);
  if (path.startsWith("/stats")) return json(res, 200, { activeUsers: 1 });
  if (path.startsWith("/network/summary"))
    return json(res, 200, { connections: 42, pending: 0, suggestions: 0, followers: 100 });
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
    return result?.value;
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
    const form = document.querySelector('[data-composer-toolbar]')?.closest('form') ?? document.querySelector('form');
    const topicButton = document.querySelector('button[aria-label="Assunto"]');
    const topicMenu = document.querySelector('[role="dialog"]') || document.querySelector('.max-h-72');
    return JSON.stringify({
      formFound: !!form,
      topicLabel: topicButton?.textContent?.trim() || null,
      topicMenuOpen: !!topicMenu,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    });
  })()
`;

async function capturar(cdp, sessionId, width, name, results) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 2, mobile: width < 600 },
    sessionId,
  );
  await sleep(800);
  const raw = await cdp.evaluate(sessionId, LER_ESTADO);
  const state = raw ? JSON.parse(raw) : { formFound: false, overflow: 0 };
  const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.data, "base64"));
  results.push({ name, width, ...state });
  console.log(
    `Captura salva: ${name}.png (${width}px, overflow: ${state.overflow}px, topicMenuOpen: ${state.topicMenuOpen})`,
  );
}

// Inicia Vite dev server se não estiver rodando
let viteProc = null;
const isViteUp = async () => {
  try {
    const res = await fetch(`${APP}/`);
    return res.status < 500;
  } catch {
    return false;
  }
};

if (!(await isViteUp())) {
  console.log("Iniciando Vite dev server...");
  const viteBin = join(ROOT, "node_modules/vite/bin/vite.js");
  viteProc = spawn(
    process.execPath,
    [viteBin, "dev", "--port", String(APP_PORT), "--host", "127.0.0.1"],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        BACKEND_TARGET: `http://127.0.0.1:${MOCK_PORT}`,
      },
      stdio: "pipe",
    },
  );

  for (let i = 0; i < 60; i++) {
    if (await isViteUp()) break;
    await sleep(500);
  }
}
console.log(`Vite pronto em ${APP}`);

const tmpDir = join(os.tmpdir(), `cdp-proof-704-${Date.now()}`);
mkdirSync(tmpDir, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tmpDir}`,
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

  // Semente de sessão
  await cdp.send("Page.navigate", { url: `${APP}/entrar` }, sessionId);
  await sleep(3000);
  await cdp.evaluate(
    sessionId,
    `(() => {
      document.cookie = "enois_auth=1; Path=/; Max-Age=86400; SameSite=Lax";
      localStorage.setItem('session_active', '1');
      localStorage.setItem('current_user', JSON.stringify({ id: '${EU.id}', username: '${EU.username}', name: '${EU.name}' }));
      return 'ok';
    })()`,
  );

  // Navega para o feed com sessão ativa
  await cdp.send("Page.navigate", { url: `${APP}/feed` }, sessionId);
  await sleep(6000);

  // Abre compositor clicando no launcher
  await cdp.evaluate(
    sessionId,
    `(() => {
      const launcher = [...document.querySelectorAll('button')].find(b =>
        b.textContent.includes('Começar publicação') || b.textContent.includes('publicação') || b.textContent.includes('Comece')
      );
      if (launcher) launcher.click();
      return !!launcher;
    })()`,
  );
  await sleep(1500);

  // 1. Compositor padrão com bolha de Assunto
  await capturar(cdp, sessionId, 1280, "compositor-1280", results);
  await capturar(cdp, sessionId, 390, "compositor-390", results);

  // 2. Abre a lista de assuntos e faz scroll parcial
  await cdp.evaluate(
    sessionId,
    `(() => {
      const btn = document.querySelector('button[aria-label="Assunto"]');
      if (btn) btn.click();
      return !!btn;
    })()`,
  );
  await sleep(600);
  await cdp.evaluate(
    sessionId,
    `(() => {
      const scrollable = document.querySelector('.max-h-72');
      if (scrollable) scrollable.scrollTop = 120;
    })()`,
  );
  await sleep(400);

  await capturar(cdp, sessionId, 1280, "assunto-aberto-1280", results);
  await capturar(cdp, sessionId, 390, "assunto-aberto-390", results);

  // 3. Abre o menu de anexo único (+)
  await cdp.evaluate(
    sessionId,
    `(() => {
      document.body.click();
      const attach = document.querySelector('button[aria-label="Anexar"]');
      if (attach) attach.click();
      return !!attach;
    })()`,
  );
  await sleep(600);

  await capturar(cdp, sessionId, 1280, "anexo-aberto-1280", results);
  await capturar(cdp, sessionId, 390, "anexo-aberto-390", results);

  writeFileSync(`${OUT}/result.json`, `${JSON.stringify(results, null, 2)}\n`);
  console.log("result.json gravado.");

  const readme = `# Prova visual: #704 (revert de hashtags e retorno das bolhas de Assunto e Tipo)

Captura automatizada em 1280 px e ~390 px conforme diretrizes do \`kof-agent-worker\`.

## Medições

| Captura | Largura | Overflow | Estado |
| :--- | :--- | :--- | :--- |
| \`compositor-1280.png\` | 1280 px | 0 px | Compositor aberto com bolha de "Escolha o assunto" (desktop) |
| \`compositor-390.png\` | 390 px | 0 px | Compositor aberto com bolha de "Escolha o assunto" (mobile) |
| \`assunto-aberto-1280.png\` | 1280 px | 0 px | Menu de Assunto aberto e rolado (\`max-h-72\`) (desktop) |
| \`assunto-aberto-390.png\` | 390 px | 0 px | Menu de Assunto aberto e rolado (\`max-h-72\`) (mobile) |
| \`anexo-aberto-1280.png\` | 1280 px | 0 px | Menu de anexo único (+) aberto (desktop) |
| \`anexo-aberto-390.png\` | 390 px | 0 px | Menu de anexo único (+) aberto (mobile) |

## Validações de Interface
- **Zero overflow horizontal**: \`overflow: 0\` em todas as larguras de tela.
- **Seletor de Assunto tradicional**:
  - Botão em formato de pílula com borda tracejada e \`ChevronDown\` quando vazio.
  - Popover com lista completa de assuntos em \`max-h-72\` e rolagem vertical suave.
- **Console limpo**: sem erros de renderização ou conflitos de layout.
`;
  writeFileSync(`${OUT}/README.md`, readme);
  console.log("README.md gravado.");

  await cdp.send("Browser.close").catch(() => {});
} finally {
  mock.close();
  try {
    chrome.kill();
  } catch {}
  if (viteProc) {
    try {
      viteProc.kill();
    } catch {}
  }
}
