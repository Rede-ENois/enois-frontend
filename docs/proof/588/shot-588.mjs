// Visual proof of #588: the logged-in shell (feed, menu, dock), /notificacoes and /explorar at 390
// and 1280 px, light and dark. Real app (Vite dev), session seeded in localStorage, fake backend on
// BACKEND_TARGET. Every name and value here is obviously fake.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 9244;
const MOCK_PORT = Number(process.env.MOCK_PORT ?? 5198);
const APP = process.env.APP ?? "http://127.0.0.1:5176";
const OUT = process.env.OUT ?? "/tmp/verif/588";
const CHROME =
  process.env.CHROME ??
  (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "/usr/bin/google-chrome");
mkdirSync(OUT, { recursive: true });

const now = new Date();
const iso = (minutesAgo) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();
const today = iso(0).slice(0, 10);

const perfil = {
  id: "user_1",
  username: "pessoa",
  name: "Pessoa Exemplo",
  headline: null,
  email: "pessoa@exemplo.test",
  company: null,
  location: null,
  avatar: null,
  banner: null,
  badge: null,
  bio: null,
  skills: [],
  goals: [],
  availability: null,
  portfolio: null,
  externalLinks: [],
  openToWork: false,
  isMentor: false,
};

const post = (id, name, content, minutesAgo) => ({
  id,
  authorId: `u_${id}`,
  authorUsername: `autor${id}`,
  authorName: name,
  authorAvatar: null,
  type: "INSIGHT",
  content,
  tags: [],
  mediaIds: [],
  createdAt: iso(minutesAgo),
  visibility: "PUBLIC",
  counters: { reactions: 4, comments: 2, saves: 0, shares: 0, reposts: 0 },
  status: "ACTIVE",
});

const notification = (id, extra) => ({
  id,
  kind: "POST_COMMENTED",
  context: "SOCIAL",
  module: "OTHER",
  actorId: null,
  actorName: null,
  actorUsername: null,
  actorAvatar: null,
  body: "",
  read: false,
  ctaLabel: "Ver",
  place: null,
  eventDate: null,
  ...extra,
});

const notifications = [
  notification("n1", {
    actorId: "u2",
    actorName: "Ana Exemplo",
    actorUsername: "anaexemplo",
    // The row prints the actor name itself, so the title starts at the verb (as the backend sends it).
    title: "Comentou no seu post",
    body: "Boa, isso me ajudou muito!",
    href: "/api/feed/posts/p1",
    createdAt: iso(4),
  }),
  notification("n2", {
    kind: "COMMUNITY_POST",
    title: "Design aberto tem 3 posts novos",
    href: "/comunidades/c2",
    place: { type: "COMMUNITY", id: "c2", name: "Design aberto", color: null },
    createdAt: iso(40),
  }),
  notification("n3", {
    kind: "EVENT_NEXT_OCCURRENCE",
    module: "EVENTS",
    title: "Meetup de Go começa hoje às 19h",
    href: "/eventos?evento=e1",
    eventDate: today,
    createdAt: iso(90),
  }),
  notification("n4", {
    title: "Seu post recebeu 10 reações",
    href: "/api/feed/posts/p2",
    read: true,
    createdAt: iso(60 * 26),
  }),
];

const seen = [];
function responder(url) {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const routes = [
    [/\/(v1\/)?me$|\/auth\/me/, perfil],
    [/\/me\/business-profile/, { exists: false }],
    [
      /\/notifications\/unread-summary/,
      {
        total: 3,
        byModule: { OTHER: 2, EVENTS: 1 },
        byCommunity: { c2: 1 },
        eventsToday: 1,
      },
    ],
    [/\/notifications(\?|$)/, { items: notifications, nextCursor: null }],
    [/\/conversations\/unread-count/, { count: 2 }],
    [/\/conversations/, { items: [], nextCursor: null }],
    [/\/network\/requests/, { items: [], nextCursor: null }],
    [
      /\/communities\/mine/,
      {
        items: [
          { id: "c1", name: "Mulheres na Tecnologia" },
          { id: "c2", name: "Design aberto" },
        ],
        nextCursor: null,
      },
    ],
    [/\/communities\/favorites/, { items: [], nextCursor: null }],
    [
      /\/events(\?|$)/,
      {
        items: [
          {
            id: "e1",
            title: "Meetup de Go",
            date: today,
            time: "19:00",
            format: "IN_PERSON",
            host: "Go BH",
            attendees: 18,
            cover: null,
            streamUrl: null,
            location: "Centro",
            expired: false,
            attending: true,
          },
          {
            id: "e2",
            title: "Live de Rust",
            date: iso(-60 * 24 * 6).slice(0, 10),
            time: "20:00",
            format: "ONLINE",
            host: "Rust BR",
            attendees: 40,
            cover: null,
            streamUrl: null,
            location: null,
            expired: false,
            attending: false,
          },
        ],
        nextCursor: null,
      },
    ],
    [
      /\/feed(\?|$)/,
      {
        items: [
          post(
            "p1",
            "Ana Exemplo",
            "Hoje aprendi a usar context no Go para cancelar requisições. Mudou o meu dia.",
            12,
          ),
          post(
            "p2",
            "Bruno Exemplo",
            "Alguém indica material bom de acessibilidade para iniciantes?",
            55,
          ),
        ],
        nextCursor: null,
        lastSeenAt: null,
      },
    ],
    [/\/stats\/community/, { activeUsers: 42 }],
    [/\/me\/theme/, { collectionId: null, custom: null }],
    [/\/me\/preferences/, {}],
    [/\/me\/age-state/, { state: "ADULT" }],
    [/\/wallet/, { balance: 1240 }],
  ];
  for (const [pattern, body] of routes) if (pattern.test(path)) return [200, body];
  return [404, { code: "NOT_FOUND", message: "mock" }];
}

const mock = createServer((req, res) => {
  const [status, body] = responder(req.url ?? "/");
  seen.push(`${status} ${req.method} ${req.url}`);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": APP,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
  });
  res.end(req.method === "OPTIONS" ? "" : JSON.stringify(body));
});
await new Promise((resolve) => mock.listen(MOCK_PORT, resolve));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${OUT}/profile`,
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
const send = (method, params = {}) => {
  const callId = ++id;
  ws.send(JSON.stringify({ id: callId, method, params }));
  return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
};
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
await send("Page.enable");
await send("Runtime.enable");

async function prepare(width, theme) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width < 600 ? 844 : 900,
    deviceScaleFactor: width < 600 ? 2 : 1,
    mobile: width < 600,
  });
  await send("Page.navigate", { url: `${APP}/entrar` });
  await sleep(1200);
  await evaluate(`
    document.cookie = "enois_auth=1; Path=/; Max-Age=86400; SameSite=Lax";
    localStorage.setItem("session_active", "1");
    localStorage.setItem("current_user", ${JSON.stringify(JSON.stringify(perfil))});
    localStorage.removeItem("connect-grow-preferences");
    localStorage.setItem("connect-grow-theme", ${JSON.stringify(theme)});
    "ok"
  `);
}

async function open(path, ready) {
  await send("Page.navigate", { url: `${APP}${path}` });
  for (let i = 0; i < 40; i++) {
    // The page may still be swapping documents: a missing body reads as "not ready yet".
    if (await evaluate(`(() => { try { return Boolean(${ready}); } catch { return false; } })()`))
      break;
    await sleep(300);
  }
  await sleep(1500);
}

const MEASURE = `JSON.stringify({
  path: location.pathname,
  dark: document.documentElement.classList.contains("dark"),
  docWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  signals: [...document.querySelectorAll('[aria-label="Tem novidade"], [aria-label$="pendentes"], [aria-label$="não lidas"]')].length,
  today: document.body.innerText.includes("hoje"),
})`;

async function shot(name) {
  const data = JSON.parse(await evaluate(MEASURE));
  const png = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.data, "base64"));
  return { name, ...data };
}

const results = [];
for (const theme of ["dark", "light"]) {
  for (const width of [390, 1280]) {
    await prepare(width, theme);
    await open(
      "/feed",
      `Boolean(document.querySelector("article")) || document.body.innerText.includes("O que você aprendeu")`,
    );
    results.push(await shot(`feed-${width}-${theme}`));
    await open("/notificacoes", `document.body.innerText.includes("Avisos")`);
    results.push(await shot(`avisos-${width}-${theme}`));
    await open("/explorar", `document.body.innerText.includes("Explorar")`);
    results.push(await shot(`explorar-${width}-${theme}`));
    if (width < 600) {
      await open("/feed", `Boolean(document.querySelector('[aria-label="Abrir menu"]'))`);
      await evaluate(`document.querySelector('[aria-label="Abrir menu"]')?.click(); "ok"`);
      await sleep(1200);
      results.push(await shot(`menu-${width}-${theme}`));
    }
  }
}

writeFileSync(
  `${OUT}/result.json`,
  JSON.stringify(
    { results, misses: [...new Set(seen.filter((s) => s.startsWith("404")))] },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 1));
ws.close();
chrome.kill();
mock.close();
