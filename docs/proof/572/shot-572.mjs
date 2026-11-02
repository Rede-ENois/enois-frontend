// Reprodução do #572: abrir as peças de um look no marketplace estica os vizinhos da mesma linha.
//
// Sobe um backend falso (o SSR do dev chama BACKEND_TARGET direto) e o Chrome headless por CDP.
// Mede a altura de cada card de look antes e depois de abrir o `<details>` de um deles.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = 9244;
const MOCK_PORT = 5198;
const APP = process.env.APP ?? "http://127.0.0.1:5176";
const OUT = process.env.OUT ?? "/tmp/verif/572";
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const perfil = {
  id: "user_melissa",
  username: "melissa",
  name: "Melissa Exemplo",
  email: "pessoa@exemplo.test",
  avatar: null,
  avatarFrame: null,
  badges: [],
  pronouns: null,
  bio: null,
  banner: null,
};

const item = (id, kind, collection, order) => ({
  id,
  kind,
  collection,
  name: `Peça ${id}`,
  description: `Descrição da peça ${id}`,
  priceMf: 1000,
  cssRing: "",
  releaseOrder: order,
  available: true,
  purchasable: true,
  owned: false,
  equipped: false,
});

/** Quatro looks na mesma linha: cada um com peças de vários tipos, como no catálogo real. */
const catalog = [
  item("tema-noite", "CARD_THEME", "saci", 1),
  item("moldura-redemoinho", "FRAME", "saci", 2),
  item("emblema-abobora", "BADGE", "saci", 3),
  item("nome-saci", "NAME_STYLE", "saci", 4),
  item("placa-saci", "NAMEPLATE", "saci", 5),
  item("banner-saci", "BANNER", "saci", 6),
  item("tema-fogueira", "CARD_THEME", "halloween", 7),
  item("moldura-fogueira", "FRAME", "halloween", 8),
  item("emblema-fantasma", "BADGE", "halloween", 9),
  item("nome-fogueira", "NAME_STYLE", "halloween", 10),
  item("placa-fogueira", "NAMEPLATE", "halloween", 11),
  item("banner-fogueira", "BANNER", "halloween", 12),
  item("tema-neve", "CARD_THEME", "natal", 13),
  item("moldura-neve", "FRAME", "natal", 14),
  item("emblema-sino", "BADGE", "natal", 15),
  item("nome-neve", "NAME_STYLE", "natal", 16),
  item("placa-neve", "NAMEPLATE", "natal", 17),
  item("banner-neve", "BANNER", "natal", 18),
  item("tema-festa", "CARD_THEME", "junina", 19),
  item("moldura-festa", "FRAME", "junina", 20),
  item("emblema-bandeira", "BADGE", "junina", 21),
  item("nome-festa", "NAME_STYLE", "junina", 22),
  item("placa-festa", "NAMEPLATE", "junina", 23),
  item("banner-festa", "BANNER", "junina", 24),
];

/** As peças do look são ids REAIS do catálogo: id fora dele não vira peça na tela. */
const look = (id, title, collection) => ({
  id,
  title,
  items: catalog.filter((entry) => entry.collection === collection).map((entry) => entry.id),
  statusIcon: null,
  statusText: null,
});

const collections = [
  {
    id: "saci",
    name: "Dia do Saci",
    available: true,
    windows: [{ start: "10-25", end: "11-05" }],
    looks: [look("look-saci", "Saci-pererê", "saci")],
  },
  {
    id: "halloween",
    name: "Halloween",
    available: true,
    windows: [{ start: "10-01", end: "11-02" }],
    looks: [look("look-fogueira", "Fogueira", "halloween")],
  },
  {
    id: "natal",
    name: "Natal",
    available: true,
    windows: [{ start: "12-01", end: "12-31" }],
    looks: [look("look-neve", "Neve", "natal")],
  },
  {
    id: "junina",
    name: "Festa Junina",
    available: true,
    windows: [{ start: "06-01", end: "06-30" }],
    looks: [look("look-festa", "Festa", "junina")],
  },
];

const wallet = {
  balance: 5000,
  escala: 1,
  cotacaoBrlCents: 100,
  cotacaoBrlMicros: 1_000_000,
  chave: "demonstracao",
  entries: [],
};

const mock = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${MOCK_PORT}`);
  const path = url.pathname.replace(/^\/api(\/v1)?/, "");
  let body = { code: "NOT_FOUND", message: "mock" };
  let status = 404;
  if (path === "/me" || path === "/auth/me") {
    body = perfil;
    status = 200;
  } else if (path === "/carteira") {
    body = wallet;
    status = 200;
  } else if (path === "/coin/cotacao") {
    body = { brlCents: 100, brlMicros: 1_000_000, historico: [] };
    status = 200;
  } else if (path === "/loja") {
    body = catalog;
    status = 200;
  } else if (path === "/loja/colecoes") {
    body = collections;
    status = 200;
  } else if (path === "/notifications") {
    body = { items: [], unread: 0 };
    status = 200;
  } else if (path === "/stats/community") {
    body = { activeUsers: 42 };
    status = 200;
  } else if (path === "/me/business-profile") {
    body = { exists: false };
    status = 200;
  }
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": APP,
    "Access-Control-Allow-Credentials": "true",
  });
  res.end(JSON.stringify(body));
});
await new Promise((resolve) => mock.listen(MOCK_PORT, "127.0.0.1", resolve));

const chrome = spawn(
  "/usr/bin/google-chrome",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/verif/profile572",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore", detached: true },
);
chrome.unref();

const http = async (path, init) => (await fetch(`http://127.0.0.1:${PORT}${path}`, init)).json();
for (let i = 0; i < 60; i++) {
  try {
    await http("/json/version");
    break;
  } catch {
    await sleep(250);
  }
}
const target = await http("/json/new?about:blank", { method: "PUT" });
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let id = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};
function send(method, params = {}) {
  const callId = ++id;
  ws.send(JSON.stringify({ id: callId, method, params }));
  return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

await send("Page.enable");
await send("Runtime.enable");

async function clicarAte(rotulo, pronto, vezes = 20) {
  for (let i = 0; i < vezes; i++) {
    const clicou = await evaluate(`(() => {
      const el = [...document.querySelectorAll("button, [role=tab]")].find((b) =>
        (b.getAttribute("aria-label") || b.textContent || "").trim().includes(${JSON.stringify(rotulo)}),
      );
      if (!el) return false;
      for (const tipo of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
        el.dispatchEvent(new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0 }));
      }
      return true;
    })()`);
    if (clicou) {
      for (let j = 0; j < 8; j++) {
        if (await evaluate(pronto)) return true;
        await sleep(250);
      }
    } else {
      await sleep(500);
    }
  }
  return false;
}

/** Altura de cada card de look, na ordem da grade, e a linha (topo) de cada um. */
const MEDIR = `(() => {
  const cards = [...document.querySelectorAll(".cos-look")];
  return JSON.stringify({
    cards: cards.map((card) => {
      const box = card.getBoundingClientRect();
      return {
        titulo: card.querySelector(".cos-look__name")?.textContent?.trim() ?? null,
        altura: Math.round(box.height),
        topo: Math.round(box.top),
        aberto: Boolean(card.querySelector("details[open]")),
      };
    }),
    docWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  });
})()`;

const resultado = [];
for (const width of [1280, 390]) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width < 600 ? 844 : 1000,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await send("Page.navigate", { url: `${APP}/entrar` });
  await sleep(1200);
  await evaluate(`
    document.cookie = "enois_auth=1; Path=/; Max-Age=86400; SameSite=Lax";
    localStorage.setItem("session_active", "1");
    localStorage.setItem("current_user", ${JSON.stringify(JSON.stringify(perfil))});
    "ok"
  `);

  await send("Page.navigate", { url: `${APP}/carteira?tab=loja` });
  await clicarAte("Loja", `document.querySelectorAll(".cos-look").length > 0`, 30);
  await sleep(1200);

  const antes = JSON.parse(await evaluate(MEDIR));
  const shotAntes = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${OUT}/looks-${width}-fechado.png`, Buffer.from(shotAntes.data, "base64"));

  // Abre as peças do PRIMEIRO look: é o gesto do vídeo da issue.
  const abriu = await evaluate(`(() => {
    const card = document.querySelector(".cos-look details");
    if (!card) return false;
    card.open = true;
    card.dispatchEvent(new Event("toggle", { bubbles: true }));
    return true;
  })()`);
  await sleep(600);

  const depois = JSON.parse(await evaluate(MEDIR));
  const shotDepois = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${OUT}/looks-${width}-aberto.png`, Buffer.from(shotDepois.data, "base64"));

  resultado.push({ width, abriu, antes, depois });
}

writeFileSync(`${OUT}/resultado.json`, JSON.stringify({ resultado }, null, 2));
console.log(JSON.stringify({ resultado }, null, 2));
ws.close();
chrome.kill();
mock.close();
