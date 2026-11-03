// Prova visual de #611: a lição de bons modos aberta pelo envio de uma imagem barrada, mais a
// prévia bloqueada no compositor do feed, a 390 e 1280 px. App real (Vite dev) com sessão semeada
// no localStorage e um backend falso em BACKEND_TARGET. Todo nome e valor aqui é obviamente falso.
//
//   PLAYWRIGHT_PATH=<caminho de playwright-core/index.js> node docs/proof/611/shot-611.mjs
//   node docs/proof/611/shot-611.mjs
//
// O mock responde o envio com 422 IMAGE_CONTENT_NOT_ALLOWED pelo caminho same-origin
// (/api/storage/...), que é o único em que o erro chega como ApiError ao compositor.
// Mede `scrollWidth - clientWidth` do documento e do diálogo em 1280 e 390 px.
import { writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// O Playwright não é dependência do app: passa-se o caminho do pacote em PLAYWRIGHT_PATH (o que
// `npm root -g` ou o cache do npx entregam), e sem ele o próprio npx resolve.
const playwrightPath = process.env.PLAYWRIGHT_PATH ?? (await npxPlaywright());
const { chromium } = await import(playwrightPath);

async function npxPlaywright() {
  const { execFileSync } = await import("node:child_process");
  const { pathToFileURL } = await import("node:url");
  const root = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
  for (const dir of [root]) {
    for (const name of ["playwright", "playwright-core"]) {
      try {
        return pathToFileURL(
          execFileSync("node", ["-p", `require.resolve("${dir}/${name}")`], {
            encoding: "utf8",
          }).trim(),
        ).href;
      } catch {
        // Próximo candidato.
      }
    }
  }
  throw new Error(
    "Playwright não encontrado: instale (npm i -g playwright) ou defina PLAYWRIGHT_PATH.",
  );
}

const APP = "http://127.0.0.1:5178";
const MOCK_PORT = 8124;
const OUT = dirname(fileURLToPath(import.meta.url));
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const seen = [];
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
  const j = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (p === "/auth/me" || p === "/me") return j(200, EU);
  if (p === "/novidades/atual" || p.endsWith("/ativo")) return j(200, null);
  if (p === "/media/uploads")
    return j(201, {
      id: "m1",
      provider: "S3",
      uploadUrl: "/api/storage/prova",
      uploadHeaders: { "content-type": "image/png" },
      cdnUrl: "https://exemplo.test/prova.png",
    });
  if (p.startsWith("/storage/")) {
    req.resume();
    return req.on("end", () => j(422, { code: "IMAGE_CONTENT_NOT_ALLOWED", message: "recusado" }));
  }
  if (p.includes("unread-summary"))
    return j(200, { total: 0, byModule: {}, byCommunity: {}, eventsToday: 0 });
  // Página paginada: a lista sem o `items` não estoura na tela, mas derruba a conta de pedidos.
  if (p === "/notifications" || p.startsWith("/network/requests") || p.includes("conversations"))
    return j(200, { items: [], nextCursor: null });
  if (p.startsWith("/feed/posts/seals")) return j(200, {});
  if (p === "/feed") return j(200, { items: [], nextCursor: null, lastSeenAt: null });
  // A tela da comunidade: o detalhe vem do loader, e o compositor precisa de membros e do feed.
  if (/^\/communities\/[^/]+$/.test(p))
    return j(200, {
      id: "c1",
      name: "Comunidade de prova",
      description: "Comunidade criada só para esta captura.",
      topic: null,
      members: 1,
      joined: true,
      cover: null,
      avatar: null,
    });
  if (/^\/communities\/[^/]+\/members$/.test(p)) return j(200, { items: [] });
  if (/^\/communities\/[^/]+\/feed$/.test(p))
    return j(200, { items: [], nextCursor: null, lastSeenAt: null });
  if (/^\/communities\/[^/]+\/pin$/.test(p)) return j(200, null);
  return j(200, []);
});

const PROVA_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

// Lê o estado da tela: o diálogo aberto, o texto dele, se ele rola e quanto estoura.
const LER = () => {
  const dialog = document.querySelector('[role="dialog"]');
  const rect = dialog?.getBoundingClientRect();
  return {
    dialogOpen: !!dialog,
    rules: dialog ? [...dialog.querySelectorAll("strong")].map((el) => el.textContent.trim()) : [],
    title: dialog?.querySelector("h2")?.textContent.trim() ?? null,
    dismiss: dialog
      ? ([...dialog.querySelectorAll("button")]
          .find((b) => /Entendido/.test(b.textContent))
          ?.textContent.trim() ?? null)
      : null,
    dialogWidth: rect ? Math.round(rect.width) : null,
    dialogHeight: rect ? Math.round(rect.height) : null,
    dialogScrolls: dialog ? dialog.scrollHeight - dialog.clientHeight : null,
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
  };
};

const results = [];
let browser;
try {
  await new Promise((r) => mock.listen(MOCK_PORT, "127.0.0.1", r));

  browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 300)));

  // A sessão do app vive no localStorage; a rota /sobre existe sem login e grava ali.
  await page.goto(`${APP}/sobre`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    (eu) => {
      localStorage.setItem("session_active", "1");
      localStorage.setItem("current_user", JSON.stringify(eu));
    },
    { id: EU.id, username: EU.username, name: EU.name },
  );

  await page.goto(`${APP}/feed`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[type="file"]', { state: "attached", timeout: 30000 });
  // O SSR entrega o input; o handler só existe depois da hidratação — antes disso o change é engolido.
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[type="file"]');
      return !!(input && Object.keys(input).some((k) => k.startsWith("__reactProps")));
    },
    { timeout: 30000 },
  );

  // Envio da imagem: o compositor abre e a prévia fica bloqueada.
  writeFileSync(`${OUT}/arquivo-de-prova.png`, PROVA_PNG);
  await page.locator('input[type="file"]').setInputFiles(`${OUT}/arquivo-de-prova.png`, {
    force: true,
  });
  try {
    await page.waitForSelector('[role="dialog"]', { timeout: 20000 });
  } catch {
    console.log("SEM DIALOGO. escritas:", seen.filter((s) => /^(POST|PUT)/.test(s)).join(", "));
    console.log("corpo:", (await page.evaluate(() => document.body.innerText)).slice(0, 400));
    throw new Error("dialogo nao abriu no feed");
  }
  await page.waitForTimeout(700);

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await sleep(500);
    const state = await page.evaluate(LER);
    await page.screenshot({ path: `${OUT}/licao-${width}.png` });
    results.push({ name: `licao-${width}`, ...state });
    console.log(`licao-${width}`, JSON.stringify(state));
  }

  // O rodapé fecha a lição e a prévia bloqueada continua no compositor com o botão de reabrir.
  await page.getByRole("button", { name: /Entendido/ }).click();
  await page.waitForSelector('[role="dialog"]', { state: "detached", timeout: 10000 });

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await sleep(400);
    const previa = await page.evaluate(() => ({
      hasBlockedPreview: /Imagem ocultada/.test(document.body.innerText),
      hasReopenButton: /Ver aula de bons modos/.test(document.body.innerText),
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    await page.screenshot({ path: `${OUT}/previa-feed-${width}.png` });
    results.push({ name: `previa-feed-${width}`, ...previa });
    console.log(`previa-feed-${width}`, JSON.stringify(previa));
  }

  // O botão da prévia reabre a lição: se fosse decorativo, a pessoa ficaria sem explicação.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: /Ver aula de bons modos/ }).click();
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  await sleep(500);
  const reaberto = await page.evaluate(LER);
  await page.screenshot({ path: `${OUT}/reabre-pela-previa.png` });
  results.push({ name: "reabre-pela-previa", ...reaberto });
  console.log("reabre-pela-previa", JSON.stringify(reaberto));

  // A mesma prévia no compositor da comunidade — outra superfície alterada, com "Ver aula" curto.
  await page.goto(`${APP}/comunidades/c1`, { waitUntil: "domcontentloaded" });
  const inputComunidade = page.locator('input[type="file"]');
  await inputComunidade.waitFor({ state: "attached", timeout: 30000 });
  await page.waitForFunction(
    () => {
      const input = document.querySelector('input[type="file"]');
      return !!(input && Object.keys(input).some((k) => k.startsWith("__reactProps")));
    },
    { timeout: 30000 },
  );
  await inputComunidade.setInputFiles(`${OUT}/arquivo-de-prova.png`, { force: true });
  await page.waitForSelector('[role="dialog"]', { timeout: 20000 });
  await page.getByRole("button", { name: /Entendido/ }).click();
  await page.waitForSelector('[role="dialog"]', { state: "detached", timeout: 10000 });

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await sleep(400);
    // O compositor da comunidade fica abaixo da dobra; a captura tem de mostrar a prévia.
    await page.evaluate(() => {
      [...document.querySelectorAll("button")]
        .find((b) => b.textContent.trim() === "Ver aula")
        ?.scrollIntoView({ block: "center" });
    });
    await sleep(500);
    const previa = await page.evaluate(() => ({
      // A prévia da comunidade é um selo de 80 px: só o ícone e o link ficam visíveis, e a frase
      // inteira vive no `title`/`sr-only`. Por isso a checagem é do link, não do texto do feed.
      hasBlockedPreview: document.body.innerHTML.includes("Imagem ocultada"),
      hasShortReopenButton: [...document.querySelectorAll("button")].some(
        (b) => b.textContent.trim() === "Ver aula",
      ),
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    await page.screenshot({ path: `${OUT}/previa-comunidade-${width}.png` });
    results.push({ name: `previa-comunidade-${width}`, ...previa });
    console.log(`previa-comunidade-${width}`, JSON.stringify(previa));
  }

  // O botão curto da comunidade também reabre a lição.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Ver aula", exact: true }).click();
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  await sleep(500);
  const reabertoComunidade = await page.evaluate(LER);
  await page.screenshot({ path: `${OUT}/comunidade-reabre.png` });
  results.push({ name: "comunidade-reabre", ...reabertoComunidade });
  console.log("comunidade-reabre", JSON.stringify(reabertoComunidade));

  console.log("chamadas de escrita:", seen.filter((s) => /^(POST|PUT)/.test(s)).join(", "));
  writeFileSync(`${OUT}/result.json`, `${JSON.stringify(results, null, 2)}\n`);
} finally {
  await browser?.close();
  mock.close();
}
