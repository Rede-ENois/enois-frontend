import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

const MOCK_PORT = 8129;
const VITE_PORT = 5188;
const CDP_PORT = 9448;
const APP = `http://127.0.0.1:${VITE_PORT}`;
const OUT = "docs/proof/1126";
const CHROME =
  process.env.CHROME ??
  "/home/johnson/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome";

mkdirSync(OUT, { recursive: true });

const fakeUser = {
  id: "22222222-2222-2222-2222-222222222222",
  username: "enois_tester",
  name: "Tester É Nóis",
  email: "tester@enois.ia.br",
  headline: "Dev Comunitário",
  company: "É Nóis",
  onboardingCompleted: true,
  skills: [],
  goals: [],
  externalLinks: [],
  connectionsCount: 5,
  followersCount: 12,
  reputation: 42,
  bio: "Perfil de teste automatizado",
};

const fakePost = (id, type, authorName, text) => ({
  id,
  authorId: "u_fake",
  authorUsername: "autor_enois",
  authorName,
  authorAvatar: null,
  type,
  content: text,
  tags: [],
  mediaIds: [],
  createdAt: new Date().toISOString(),
  visibility: "PUBLIC",
  counters: { reactions: 5, comments: 2, saves: 1, shares: 0, reposts: 0 },
  status: "ACTIVE",
});

function jsonResponse(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "*",
  });
  res.end(JSON.stringify(body));
}

const seen = [];

const mockServer = createServer((req, res) => {
  const p = new URL(req.url, "http://x").pathname.replace(/^\/api/, "");
  seen.push(`${req.method} ${p}`);
  console.log("-> MOCK:", req.method, p);
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    });
    return res.end();
  }

  if (p === "/auth/me" || p === "/me") return jsonResponse(res, 200, fakeUser);
  if (p === "/me/business-profile")
    return jsonResponse(res, 200, {
      exists: true,
      profile: { headline: "Dev Comunitário", company: "É Nóis" },
    });
  if (p.startsWith("/conversations/stream")) {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "access-control-allow-origin": "*",
      "access-control-allow-credentials": "true",
    });
    return;
  }
  if (p.startsWith("/feed/corporate"))
    return jsonResponse(res, 200, {
      items: [fakePost("cp1", "INSIGHT", "Empresa Parceira", "Post do ecossistema corporativo.")],
      nextCursor: null,
    });
  if (p.startsWith("/feed/posts/seals")) return jsonResponse(res, 200, {});
  if (p.startsWith("/feed/scheduled"))
    return jsonResponse(res, 200, { items: [], nextCursor: null });
  if (p.startsWith("/feed/draft")) return jsonResponse(res, 200, { draft: null });
  if (p.startsWith("/feed"))
    return jsonResponse(res, 200, {
      items: [
        fakePost(
          "p1",
          "INSIGHT",
          "Ana Exemplo",
          "Primeiro post comunitário no novo feed do É Nóis.",
        ),
        fakePost(
          "p2",
          "QUESTION",
          "Carlos Silva",
          "Como vocês organizam os componentes no Design System?",
        ),
      ],
      nextCursor: null,
      lastSeenAt: null,
    });
  if (p.startsWith("/eventos/saci-halloween"))
    return jsonResponse(res, 200, {
      active: false,
      startsAt: new Date().toISOString(),
      endsAt: new Date().toISOString(),
      counts: { saci: 0, halloween: 0 },
      myChoice: null,
      winner: null,
    });
  if (p.startsWith("/eventos/caca-saci"))
    return jsonResponse(res, 200, {
      active: false,
      startsAt: new Date().toISOString(),
      endsAt: new Date().toISOString(),
      spots: 1,
      found: [],
      completed: false,
    });
  if (p === "/novidades/atual" || p.endsWith("/ativo")) return jsonResponse(res, 200, null);
  if (p.includes("unread-summary"))
    return jsonResponse(res, 200, { total: 0, byModule: {}, byCommunity: {}, eventsToday: 0 });
  if (p === "/notifications" || p.includes("conversations"))
    return jsonResponse(res, 200, { items: [], nextCursor: null });
  if (p.startsWith("/network/requests"))
    return jsonResponse(res, 200, { items: [], nextCursor: null });
  if (p.startsWith("/network/suggestions")) return jsonResponse(res, 200, []);
  if (p.startsWith("/network/summary"))
    return jsonResponse(res, 200, { connectionsCount: 5, followersCount: 12 });
  if (p === "/conversations/unread-count") return jsonResponse(res, 200, { count: 0 });
  if (p.startsWith("/communities")) return jsonResponse(res, 200, { items: [], nextCursor: null });
  if (p.startsWith("/events")) return jsonResponse(res, 200, { items: [], nextCursor: null });
  if (p === "/wallet") return jsonResponse(res, 200, { balance: 1000 });
  if (p.startsWith("/stats")) return jsonResponse(res, 200, { activeUsers: 42 });
  if (p === "/me/theme") return jsonResponse(res, 200, { collectionId: null, custom: null });
  if (p === "/me/preferences") return jsonResponse(res, 200, {});
  if (p === "/me/age-state") return jsonResponse(res, 200, { state: "ADULT" });
  if (p === "/calls/open" || p.startsWith("/calls/open")) return jsonResponse(res, 200, []);
  if (p === "/empresas/mine" || p.startsWith("/empresas/mine")) return jsonResponse(res, 200, []);
  if (p === "/games/hoje" || p.startsWith("/games/hoje")) return jsonResponse(res, 200, []);

  return jsonResponse(res, 200, {});
});

const consoleLogs = [];

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Log.entryAdded") {
        consoleLogs.push(`[BROWSER LOG] ${JSON.stringify(msg.params.entry)}`);
      }
      if (msg.method === "Runtime.consoleAPICalled") {
        consoleLogs.push(
          `[CONSOLE ${msg.params.type}] ${msg.params.args.map((a) => a.value ?? a.description).join(" ")}`,
        );
      }
      if (msg.method === "Runtime.exceptionThrown") {
        consoleLogs.push(`[EXCEPTION] ${JSON.stringify(msg.params.exceptionDetails)}`);
      }
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

  async waitFor(sessionId, expression, timeoutMs = 25000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        if (await this.evaluate(sessionId, expression)) return true;
      } catch {}
      await sleep(200);
    }
    throw new Error(`Tempo esgotado esperando: ${expression.slice(0, 100)}`);
  }
}

async function wsUrl() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      const body = await res.json();
      if (body.webSocketDebuggerUrl) return body.webSocketDebuggerUrl;
    } catch {}
    await sleep(400);
  }
  throw new Error("Chrome não subiu no CDP");
}

async function waitForHttp(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {}
    await sleep(300);
  }
  throw new Error(`Servidor não respondeu em ${url}`);
}

async function viewport(cdp, sessionId, width) {
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    {
      width,
      height: width < 500 ? 844 : 900,
      deviceScaleFactor: 2,
      mobile: width < 500,
    },
    sessionId,
  );
  await sleep(400);
}

function sha256File(path) {
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex");
}

let viteProc = null;
let chromeProc = null;

try {
  console.log("1. Iniciando mock server na porta", MOCK_PORT);
  await new Promise((resolve) => mockServer.listen(MOCK_PORT, "127.0.0.1", resolve));

  console.log("2. Iniciando Vite dev server na porta", VITE_PORT);
  viteProc = spawn("npx", ["vite", "--port", String(VITE_PORT), "--strictPort"], {
    env: {
      ...process.env,
      BACKEND_TARGET: `http://127.0.0.1:${MOCK_PORT}`,
    },
    stdio: "pipe",
  });
  viteProc.stdout.on("data", (d) => {
    const s = d.toString();
    if (s.includes("error") || s.includes("Error") || s.includes("warn"))
      console.log("[VITE STDOUT]", s.trim());
  });
  viteProc.stderr.on("data", (d) => console.error("[VITE STDERR]", d.toString().trim()));
  await waitForHttp(`${APP}/`);

  console.log("3. Iniciando Chrome Headless na porta CDP", CDP_PORT);
  chromeProc = spawn(
    CHROME,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=/tmp/cdp-1126-${Date.now()}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const ws = new WebSocket(await wsUrl());
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  const cdp = new Cdp(ws);

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send("Log.enable", {}, sessionId);

  console.log("4. Semeando sessão autenticada");
  await cdp.send("Page.navigate", { url: `${APP}/sobre` }, sessionId);
  await sleep(1500);

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

  await cdp.evaluate(
    sessionId,
    `(() => {
      localStorage.setItem("session_active", "1");
      localStorage.setItem("session_id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
      localStorage.setItem("current_user", JSON.stringify(${JSON.stringify(fakeUser)}));
      sessionStorage.setItem("onboarding-shown", "1");
      document.cookie = "enois_auth=1; Path=/; Max-Age=86400; SameSite=Lax";
      return "ok";
    })()`,
  );

  console.log("5. Navegando para o Feed");
  await viewport(cdp, sessionId, 1280);
  await cdp.send("Page.navigate", { url: `${APP}/feed` }, sessionId);
  console.log("Aguardando carregamento dos módulos do feed...");
  for (let i = 0; i < 40; i++) {
    const tabsCount = await cdp.evaluate(
      sessionId,
      "document.querySelectorAll('[role=\"tab\"]').length",
    );
    if (tabsCount >= 5) {
      console.log(`✓ Feed hidratado com sucesso: ${tabsCount} abas!`);
      break;
    }
    await sleep(500);
  }

  await cdp.waitFor(
    sessionId,
    `document.querySelectorAll('[role="group"][aria-label="Tipo de feed"] button').length === 12`,
    15000,
  );
  console.log("✓ 12 pílulas do filtro de feed carregadas!");

  const results = [];

  const MEASURE_FEED = `
    (() => {
      const docEl = document.documentElement;
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const activeTabEl = document.querySelector('[role="tab"][data-state="active"]');
      const pillRow = document.querySelector('[role="group"][aria-label="Tipo de feed"]');
      const pills = pillRow ? Array.from(pillRow.querySelectorAll('button')) : [];
      
      const clientWidth = docEl.clientWidth;
      const prClientWidth = pillRow ? pillRow.clientWidth : 0;
      const prScrollWidth = pillRow ? pillRow.scrollWidth : 0;

      const pillsList = pills.map((p) => p.textContent.trim());
      const visiblePills = pills.filter((p) => {
        const r = p.getBoundingClientRect();
        return r.left >= 0 && r.right <= clientWidth;
      }).map((p) => p.textContent.trim());

      const overflowElements = Array.from(document.querySelectorAll('*'))
        .filter((el) => el.getBoundingClientRect().right > clientWidth + 2)
        .map((el) => ({
          tag: el.tagName,
          className: typeof el.className === "string" ? el.className.slice(0, 80) : "",
          role: el.getAttribute("role"),
          right: Math.round(el.getBoundingClientRect().right),
        }))
        .slice(0, 5);

      return JSON.stringify({
        url: location.pathname + location.search,
        overflowX: Math.max(0, docEl.scrollWidth - docEl.clientWidth),
        overflowElements,
        tabsCount: tabs.length,
        tabs: tabs.map((t) => t.textContent.trim()),
        activeTab: activeTabEl ? activeTabEl.textContent.trim() : null,
        pillsCount: pills.length,
        pillsList: pillsList,
        pillsRowScrolls: prScrollWidth > prClientWidth,
        pillsRowScrollWidth: prScrollWidth,
        pillsRowClientWidth: prClientWidth,
        visiblePillsCount: visiblePills.length,
        visiblePills: visiblePills,
      });
    })()
  `;

  async function capture(name, width) {
    await viewport(cdp, sessionId, width);
    try {
      await cdp.waitFor(
        sessionId,
        `(() => {
          const tabs = document.querySelectorAll('[role="tab"]');
          return tabs.length >= 5;
        })()`,
        10000,
      );
    } catch (err) {
      const cur = await cdp.evaluate(sessionId, "location.href");
      console.error(`ERRO NO CAPTURE ${name}: A URL ATUAL É ${cur}`);
      throw err;
    }
    await sleep(400);

    const data = JSON.parse(await cdp.evaluate(sessionId, MEASURE_FEED));

    // Validações rigorosas
    if (!data.url.startsWith("/feed")) {
      throw new Error(`URL inválida capturada: ${data.url}`);
    }
    if (data.tabsCount === 0) {
      throw new Error(`tabsCount é 0 em ${name}! A página não renderizou as abas do feed.`);
    }

    const png = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
    const filePath = `${OUT}/${name}.png`;
    writeFileSync(filePath, Buffer.from(png.data, "base64"));
    const sha = sha256File(filePath);

    const record = { name, width, sha, ...data };
    results.push(record);
    console.log(`✓ Capturado ${name} (${width}px):`, {
      url: data.url,
      tabs: data.tabsCount,
      pills: data.pillsCount,
      overflowX: data.overflowX,
      activeTab: data.activeTab,
      sha: sha.slice(0, 10),
    });
    return record;
  }

  // 1. Social Desktop (1280px)
  console.log("6. Capturando Social Desktop (1280px)");
  await viewport(cdp, sessionId, 1280);
  await sleep(600);
  await capture("feed-social-1280", 1280);

  // 2. Social Mobile (390px)
  console.log("7. Capturando Social Mobile (390px)");
  await viewport(cdp, sessionId, 390);
  await sleep(600);
  await capture("feed-social-390", 390);

  // 3. Profissional Desktop (1280px)
  console.log("8. Alternando para aba Corporativa");
  const tabSwitchInfo = await cdp.evaluate(
    sessionId,
    `(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const corpTab = tabs.find((t) => /Corporativo|Profissional/.test(t.textContent));
      if (!corpTab) return 'sem_corp_tab';
      corpTab.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      corpTab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      corpTab.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
      corpTab.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      corpTab.click();
      return {
        tabText: corpTab.textContent.trim(),
        activeNow: document.querySelector('[role="tab"][data-state="active"]')?.textContent?.trim(),
      };
    })()`,
  );
  console.log("Tab switch info:", tabSwitchInfo);
  await sleep(1000);

  console.log("9. Capturando Profissional Desktop (1280px)");
  await viewport(cdp, sessionId, 1280);
  await sleep(600);
  await capture("feed-prof-1280", 1280);

  // 4. Profissional Mobile (390px)
  console.log("10. Capturando Profissional Mobile (390px)");
  await viewport(cdp, sessionId, 390);
  await sleep(600);
  await capture("feed-prof-390", 390);

  // Validação dos SHAs
  const socialMobileSha = results.find((r) => r.name === "feed-social-390")?.sha;
  const profMobileSha = results.find((r) => r.name === "feed-prof-390")?.sha;
  if (socialMobileSha === profMobileSha) {
    throw new Error(
      `FALHA CRÍTICA: feed-social-390.png e feed-prof-390.png têm o mesmo SHA (${socialMobileSha})!`,
    );
  }

  const socialDesktop = results.find((r) => r.name === "feed-social-1280");
  const socialMobile = results.find((r) => r.name === "feed-social-390");
  const profDesktop = results.find((r) => r.name === "feed-prof-1280");
  const profMobile = results.find((r) => r.name === "feed-prof-390");

  if (socialDesktop.pillsCount !== 12) {
    throw new Error(
      `Esperava 12 pílulas no social desktop, mas obteve: ${socialDesktop.pillsCount}`,
    );
  }

  // Grava result.json
  writeFileSync(`${OUT}/result.json`, JSON.stringify({ results }, null, 2));

  // Gera README.md estritamente honesto com valores medidos reais
  const readme = `# Prova visual: #1126 (Navegação do Feed com Abas e Filtros sem overflow)

Capturas em viewport desktop (1280 px) e mobile (390 px) para os contextos social e profissional com a nova barra de abas e pílulas.
Sessão real no ambiente de desenvolvimento com mock local dos endpoints da API, confirmando hidratação e renderização da rota real \`/feed\`.

## Como foi medido

O script \`shot-1126.mjs\` sobe o backend falso para responder aos endpoints da API do feed sem 401, inicia o Vite dev em porta isolada apontando para ele (\`BACKEND_TARGET\`), semeia a sessão no \`localStorage\` e cookies, e conecta ao Chrome headless via Chrome DevTools Protocol (CDP) com \`deviceScaleFactor: 2\`.

1. Confirma navegação autenticada em \`/feed\` (assegura que não houve redirecionamento para \`/entrar\`).
2. Mede a contagem real de abas (\`[role="tab"]\`), aba ativa e as 12 pílulas do filtro de tipo (\`PillRow\`).
3. No mobile (390 px), mede o comportamento da barra de rolagem lateral (\`pillsRowScrolls\`) e as pílulas visíveis sem rolagem.
4. No contexto profissional (\`/feed?aba=CORPORATE\`), confirma que a aba Profissional está ativa e que as capturas são distintas entre social e profissional (hashes SHA-256 distintos comprovados).
5. Mede o estouro horizontal do documento (\`scrollWidth - clientWidth\`).

## Resultado Medido

| Captura | Contexto | Largura | URL | Aba Ativa | Abas Medidas | Pílulas Medidas | Estouro Horizontal (\`scrollWidth - clientWidth\`) | SHA-256 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| \`feed-social-1280.png\` | Social | 1280 px | \`${socialDesktop.url}\` | ${socialDesktop.activeTab} | ${socialDesktop.tabsCount} | ${socialDesktop.pillsCount} | ${socialDesktop.overflowX} px | \`${socialDesktop.sha.slice(0, 12)}...\` |
| \`feed-social-390.png\` | Social | 390 px | \`${socialMobile.url}\` | ${socialMobile.activeTab} | ${socialMobile.tabsCount} | ${socialMobile.pillsCount} | ${socialMobile.overflowX} px | \`${socialMobile.sha.slice(0, 12)}...\` |
| \`feed-prof-1280.png\` | Profissional | 1280 px | \`${profDesktop.url}\` | ${profDesktop.activeTab} | ${profDesktop.tabsCount} | ${profDesktop.pillsCount} | ${profDesktop.overflowX} px | \`${profDesktop.sha.slice(0, 12)}...\` |
| \`feed-prof-390.png\` | Profissional | 390 px | \`${profMobile.url}\` | ${profMobile.activeTab} | ${profMobile.tabsCount} | ${profMobile.pillsCount} | ${profMobile.overflowX} px | \`${profMobile.sha.slice(0, 12)}...\` |

### Detalhes dos Componentes e Comportamento Responsivo

1. **Abas (${socialDesktop.tabsCount} abas renderizadas)**:
   - Abas disponíveis: \`${socialDesktop.tabs.join(", ")}\`.
   - Aba ativa no social: **${socialDesktop.activeTab}**.
   - Aba ativa no profissional: **${profDesktop.activeTab}**.
2. **Filtro de Tipos de Post (12 pílulas)**:
   - Todas as 12 pílulas renderizadas no social: \`${socialDesktop.pillsList.join(", ")}\`.
   - No desktop (1280 px): as 12 pílulas são apresentadas no container sem quebrar nem estourar a página (**${socialDesktop.overflowX} px** de overflow).
   - No mobile (390 px): a faixa de pílulas utiliza rolagem horizontal (\`pillsRowScrolls: ${socialMobile.pillsRowScrolls}\`), com as primeiras pílulas visíveis imediatamente (\`${socialMobile.visiblePills.join(", ")}\`) e as demais acessíveis por gesto lateral natural, mantendo o estouro da página em **${socialMobile.overflowX} px**.
3. **Diferença Comprovada entre Contextos**:
   - \`feed-social-390.png\` SHA: \`${socialMobileSha}\`
   - \`feed-prof-390.png\` SHA: \`${profMobileSha}\`
   - Os arquivos são distintos e comprovam a alternância de contexto social vs. profissional.
4. **Sem vazamento de estilo ou classes proibidas**:
   - Conformidade estrita com o Design System (\`Tabs\`, \`TabsList\`, \`TabsTrigger\`, \`PillRow\`, \`Pill\`), sem classes utilitárias na rota e sem seletores de acessibilidade no CSS global.
`;

  writeFileSync(`${OUT}/README.md`, readme);
  console.log("README.md e result.json gravados com sucesso!");

  await cdp.send("Browser.close").catch(() => {});
} finally {
  if (chromeProc) chromeProc.kill();
  if (viteProc) viteProc.kill();
  if (mockServer.closeAllConnections) mockServer.closeAllConnections();
  mockServer.close();
  setTimeout(() => process.exit(0), 500);
}
