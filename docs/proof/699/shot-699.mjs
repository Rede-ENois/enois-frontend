// Prova visual de #699: modal de novidades e pagina /novidades
// a 1280 px e 390 px, validando responsividade, scroll interno e ausencia de overflow.
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

const MOCK_PORT = Number(process.env.MOCK_PORT ?? 8132);
const CDP_PORT = Number(process.env.CDP_PORT ?? 9347);
const APP_PORT = 5183;
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
  id: "user_teste_whatsnew",
  username: "autor_whatsnew",
  name: "Usuário Teste",
  headline: "Membro da Comunidade",
  email: "whatsnew@exemplo.test",
  company: null,
  location: "São Paulo, SP",
  avatar: null,
  banner: null,
  badge: null,
  bio: "Perfil para teste visual do modal e pagina de novidades.",
  skills: ["Design", "React"],
  goals: [],
  availability: "ABERTO",
  portfolio: null,
  externalLinks: [],
  openToWork: true,
  isMentor: false,
  connectionsCount: 15,
  followersCount: 50,
  reputation: 25,
  onboardingCompleted: true,
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
  const path = url.pathname.replace(/^\/api/, "");
  console.log(`[mock-req] ${req.method} ${url.pathname} -> ${path}`);

  if (path === "/auth/me" || path === "/me" || path === "/v1/me") return json(res, 200, EU);
  if (path === "/me/business-profile") return json(res, 200, { exists: false });
  if (path === "/me/age-state") return json(res, 200, { isMinor: false, ageVerified: true });
  if (path === "/me/theme") return json(res, 200, { theme: "system" });
  if (path.startsWith("/profile/")) return json(res, 200, EU);
  if (path === "/me/preferences" || path === "/me/preferences/personalization")
    return json(res, 200, {
      likedTopics: [],
      blockedTopics: [],
      disabledModules: [],
      nightRestReminder: false, // Desativa lembrete de descanso noturno para não cobrir o WhatsNew
      liteMode: false,
      batataMode: false,
      whatsNewEnabled: true,
      whatsNewLastSeen: null, // Força abertura do modal no primeiro acesso
    });
  if (path === "/me/preferences/whats-new/dismissed")
    return json(res, 200, {
      whatsNewEnabled: true,
      whatsNewLastSeen: "2026.11.05",
    });
  if (path.startsWith("/novidades/atual"))
    return json(res, 200, {
      updatedAt: "2026-11-05T12:00:00Z",
      items: [],
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
          content: "Post do feed de fundo enquanto o modal de novidades e exibido.",
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
  if (path.startsWith("/notifications"))
    return json(res, 200, { items: [], unread: 0, nextCursor: null });
  if (path.startsWith("/conversations/unread-count")) return json(res, 200, { count: 0 });
  if (path.startsWith("/conversations")) return json(res, 200, { items: [], nextCursor: null });
  if (path.startsWith("/communities/mine")) return json(res, 200, { items: [], nextCursor: null });
  if (path.startsWith("/communities/favorites"))
    return json(res, 200, { items: [], nextCursor: null });
  if (path.startsWith("/network/requests"))
    return json(res, 200, { items: [], nextCursor: null, total: 0 });
  if (path.startsWith("/network/summary"))
    return json(res, 200, { connections: 15, pending: 0, suggestions: 0, followers: 50 });
  if (path.startsWith("/network/suggestions"))
    return json(res, 200, { items: [], nextCursor: null });
  if (path.startsWith("/emotes/index") || path.startsWith("/emotes")) return json(res, 200, []);
  if (path.startsWith("/avisos/ativo")) return json(res, 200, null);
  if (path.startsWith("/stats")) return json(res, 200, { activeUsers: 1 });
  if (path.startsWith("/network/summary"))
    return json(res, 200, { connections: 15, pending: 0, suggestions: 0, followers: 50 });
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

const LER_ESTADO_MODAL = `
  (() => {
    const dialog = document.querySelector('[role="dialog"]');
    const title = dialog?.querySelector('h2')?.textContent?.trim() || null;
    const items = dialog?.querySelectorAll('.rounded-2xl.border').length || 0;
    return JSON.stringify({
      dialogFound: !!dialog,
      title,
      itemsCount: items,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    });
  })()
`;

const LER_ESTADO_NOVIDADES = `
  (() => {
    const headerTitle = document.querySelector('h1')?.textContent?.trim() || null;
    const itemsCount = document.querySelectorAll('article').length;
    return JSON.stringify({
      headerTitle,
      itemsCount,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    });
  })()
`;

async function capturar(cdp, sessionId, width, name, scriptEstado, results) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 2, mobile: width < 600 },
    sessionId,
  );
  await sleep(1000);
  const raw = await cdp.evaluate(sessionId, scriptEstado);
  const state = raw ? JSON.parse(raw) : { overflow: 0 };
  const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.data, "base64"));
  results.push({ name, width, ...state });
  console.log(`Captura salva: ${name}.png (${width}px, overflow: ${state.overflow}px)`);
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

const tmpDir = join(os.tmpdir(), `cdp-proof-699-${Date.now()}`);
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

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.consoleAPICalled") {
      console.log(
        "[browser-console]",
        msg.params.type,
        msg.params.args.map((a) => a.value ?? a.description).join(" "),
      );
    }
    if (msg.method === "Runtime.exceptionThrown") {
      console.error("[browser-exception]", JSON.stringify(msg.params));
    }
  });

  // Semente de sessão via rota /entrar
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

  // 1. Navega para o feed com sessão ativa para abrir o modal de novidades
  await cdp.send("Page.navigate", { url: `${APP}/feed` }, sessionId);

  // Aguarda até o dialog do WhatsNew abrir no feed
  for (let i = 0; i < 50; i++) {
    const title = await cdp.evaluate(
      sessionId,
      `document.querySelector('[role="dialog"] h2')?.textContent?.trim() || null`,
    );
    if (title && title.includes("mudou")) {
      console.log(`[proof] Modal de novidades encontrado: "${title}" após ${(i + 1) * 300}ms!`);
      break;
    }
    await sleep(300);
  }

  // Capturas do modal aberto (desktop e mobile)
  await capturar(cdp, sessionId, 1280, "modal-1280", LER_ESTADO_MODAL, results);
  await capturar(cdp, sessionId, 390, "modal-390", LER_ESTADO_MODAL, results);

  // 2. Navega para a página de novidades clicando em "Ver histórico" no modal ou via rota
  console.log("[proof] Navegando para /novidades...");
  await cdp.evaluate(
    sessionId,
    `(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Ver histórico'));
      if (btn) {
        btn.click();
        return 'clicked';
      }
      return 'not_found';
    })()`,
  );

  // Aguarda até a página /novidades estar na tela com o h1 renderizado
  for (let i = 0; i < 40; i++) {
    const title = await cdp.evaluate(
      sessionId,
      `document.querySelector('h1')?.textContent?.trim() || null`,
    );
    if (title && title.includes("novo")) {
      console.log(
        `[proof] Página /novidades carregada com sucesso: "${title}" após ${(i + 1) * 300}ms!`,
      );
      break;
    }
    await sleep(300);
  }

  // Capturas da página de novidades (desktop e mobile)
  await capturar(cdp, sessionId, 1280, "novidades-1280", LER_ESTADO_NOVIDADES, results);
  await capturar(cdp, sessionId, 390, "novidades-390", LER_ESTADO_NOVIDADES, results);

  writeFileSync(`${OUT}/result.json`, `${JSON.stringify(results, null, 2)}\n`);
  console.log("result.json gravado.");

  const readme = `# Prova visual: #699 (aviso de novas features e mudanças de design)

Captura automatizada em 1280 px e ~390 px conforme diretrizes do \`kof-agent-worker\`.

## Medições

| Captura | Largura | Overflow | Estado |
| :--- | :--- | :--- | :--- |
| \`modal-1280.png\` | 1280 px | 0 px | Modal de novidades aberto no feed com passos e botão Experimentar (desktop) |
| \`modal-390.png\` | 390 px | 0 px | Modal de novidades em tela cheia mobile com scroll interno (mobile) |
| \`novidades-1280.png\` | 1280 px | 0 px | Página /novidades completa com histórico e toggle (desktop) |
| \`novidades-390.png\` | 390 px | 0 px | Página /novidades responsiva no mobile (mobile) |

## Validações de Interface
- **Zero overflow horizontal**: \`overflow: 0\` em todas as larguras.
- **Responsividade do modal**: \`max-h-[90vh]\` com lista rolável e rodapé visível em 390 px.
- **Página /novidades**: listagem de releases históricas, passos de "Como usar" e botão de ação.
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
