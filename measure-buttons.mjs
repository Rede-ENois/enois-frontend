import { chromium } from "playwright";

const browser = await chromium.launch();
for (const [label, width, height] of [["iPhone SE", 375, 667], ["iPhone 12", 390, 844], ["Android", 360, 800], ["tablet", 768, 1024]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(`<!doctype html><html><body style="margin:0">
    <div style="width:${width}px;padding:16px;box-sizing:border-box">
      <div style="display:flex;gap:8px">
        <button id="a" style="min-width:0;flex:1;display:inline-flex;align-items:center;gap:6px;justify-content:center;padding:0 10px;font-size:11.2px;line-height:1;border-radius:9999px;border:1px solid #ccc;background:#fff;white-space:nowrap">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/></svg>Denunciar
        </button>
        <button id="b" style="min-width:0;flex:1;display:inline-flex;align-items:center;gap:6px;justify-content:center;padding:0 10px;font-size:11.2px;line-height:1;border-radius:9999px;border:1px solid #ccc;background:#fff;white-space:nowrap">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.63 19 19.5 19.5 0 0 1 2.08 9.18 2 2 0 0 1 4.06 7h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.79a2 2 0 0 1-.45 2.11L8.09 14.91a16 16 0 0 0 6 6l1.29-1.22a2 2 0 0 1 2.11-.45c.89.34 1.83.58 2.79.7A2 2 0 0 1 22 16.92z"/></svg>Encerrar
        </button>
      </div>
    </div></body></html>`);
  const r = await page.evaluate(() => {
    const a = document.getElementById("a"), b = document.getElementById("b");
    const row = a.parentElement;
    return { a: a.getBoundingClientRect().width, b: b.getBoundingClientRect().width, row: row.getBoundingClientRect().width, scrollW: a.scrollWidth, clientW: a.clientWidth };
  });
  console.log(label, width, JSON.stringify(r));
  await page.close();
}
await browser.close();
