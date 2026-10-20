import { readFileSync } from "node:fs";
import { chromium } from "playwright";

// Auditor de contraste (WCAG 3:1 minimo) por tema — gate da Fase 1 (plano de temas).
// Uso: dev server na 5199 + node scripts/theme-audit.mjs [tema-id ...] (vazio = todos).
const THEMES = process.argv.slice(2).length
  ? process.argv.slice(2).map((id) => ({ id }))
  : JSON.parse(readFileSync("/tmp/audit/temas-novos.json", "utf8"));
const BASE = process.env.AUDIT_BASE || "http://localhost:5199";
const PAGES = [
  "/",
  "/empresas",
  "/vagas",
  "/eventos",
  "/comunidades",
  "/developers",
  "/diretrizes",
];
const browser = await chromium.launch();
let clean = 0,
  problems = 0;
const problemas = [];

// warmup
{
  const p = await browser.newPage();
  for (const path of PAGES) {
    try {
      await p.goto(BASE + path, { waitUntil: "commit", timeout: 60000 });
      await p.waitForTimeout(1200);
    } catch {}
  }
  await p.close();
}

for (const t of THEMES) {
  for (const mode of ["light", "dark"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(
      ([t, m]) => {
        const prefs = JSON.parse(localStorage.getItem("connect-grow-preferences") || "{}");
        prefs.state = { ...(prefs.state || {}), theme: m, themeCollection: t };
        prefs.version = 0;
        localStorage.setItem("connect-grow-preferences", JSON.stringify(prefs));
        localStorage.setItem("connect-grow-theme-collection", t);
      },
      [t.id, mode],
    );
    for (const path of PAGES) {
      try {
        await page.goto(BASE + path, { waitUntil: "commit", timeout: 60000 });
        await page.waitForTimeout(2200);
        const out = await page.evaluate(() => {
          const lum = (c) => {
            const f = (v) => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
          };
          const contrast = (c1, c2) => {
            const l1 = lum(c1),
              l2 = lum(c2);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          };
          const parse = (str) => {
            const m = str.match(/rgba?\(([\d.]+), ?([\d.]+), ?([\d.]+)(?:, ?([\d.]+))?\)/);
            return m
              ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])]
              : null;
          };
          const bgOf = (el) => {
            let c = el;
            while (c && c !== document.documentElement) {
              const bg = parse(getComputedStyle(c).backgroundColor);
              if (bg && bg[3] > 0.5) return [bg[0], bg[1], bg[2]];
              c = c.parentElement;
            }
            return [255, 255, 255];
          };
          const bad = [];
          const seen = new Set();
          document.querySelectorAll("body *").forEach((el) => {
            const hasText = [...el.childNodes].some(
              (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
            );
            if (!hasText) return;
            const r = el.getBoundingClientRect();
            if (r.width < 8 || r.height < 6) return;
            const cs = getComputedStyle(el);
            if ((cs.webkitBackgroundClip || cs.backgroundClip) === "text") return; // logo com gradiente: cor transparente de proposito
            const fg = parse(cs.color);
            if (!fg || fg[3] < 0.5) return;
            const ratio = contrast(fg.slice(0, 3), bgOf(el));
            if (ratio < 3) {
              const key = ratio.toFixed(1) + el.textContent.trim().slice(0, 30);
              if (seen.has(key)) return;
              seen.add(key);
              bad.push(`${ratio.toFixed(1)} "${el.textContent.trim().slice(0, 40)}"`);
            }
          });
          return {
            sw: document.documentElement.scrollWidth,
            cw: document.documentElement.clientWidth,
            bad: bad.slice(0, 3),
          };
        });
        const overflow = out.sw > out.cw + 2;
        if (overflow || out.bad.length) {
          problems++;
          problemas.push(
            `${t.id} ${mode} ${path}: ${overflow ? "OVERFLOW " : ""}${out.bad.join(" | ")}`,
          );
          console.log(
            `ERRO-REAL ${t.id} ${mode} ${path}: ${out.bad.join(" | ")}${overflow ? " [OVERFLOW]" : ""}`,
          );
        } else {
          clean++;
        }
      } catch (err) {
        console.log(`ERRO-CATCH ${t.id} ${mode} ${path}: ${String(err).slice(0, 80)}`);
      }
    }
    await page.close();
  }
}
await browser.close();
const fs = await import("node:fs");
fs.writeFileSync("/tmp/audit/temas-relatorio.json", JSON.stringify(problemas, null, 1));
console.log(`LIMPO: ${clean} | COM PROBLEMA: ${problems} (de ${THEMES.length * 2 * PAGES.length})`);
