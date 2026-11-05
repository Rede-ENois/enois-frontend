import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("../../../", import.meta.url));
const server = await createServer({
  configFile: false,
  root,
  cacheDir: "node_modules/.vite-mobile-proof",
  plugins: [react(), tailwind()],
  resolve: { alias: { "@": fileURLToPath(new URL("../../../src", import.meta.url)) } },
  server: { host: "127.0.0.1", port: 6110, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
});
const measurements = [];
try {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("http://127.0.0.1:6110/docs/proof/mobile-input-focus-zoom/fixture.html", {
      waitUntil: "networkidle",
    });
    await page.locator("input").first().fill("x".repeat(121));
    assert.equal((await page.locator("input").first().inputValue()).length, 120);
    await page.locator("input").first().fill("Alternativa A");
    await page.getByRole("button", { name: "Remover alternativa", exact: true }).last().click();
    assert.equal(await page.locator("input").count(), 2);
    await page.getByRole("button").last().click();
    assert.equal(await page.locator("input").count(), 3);
    await page.getByLabel("Canal", { exact: true }).fill("x".repeat(1201));
    assert.equal((await page.getByLabel("Canal", { exact: true }).inputValue()).length, 1200);
    await page.getByLabel("Canal", { exact: true }).fill("Mensagem de demonstração");
    const result = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: document.querySelector('meta[name="viewport"]').content,
      fields: [...document.querySelectorAll("input,textarea")].map((field) => ({
        type: field.type,
        fontSize: parseFloat(getComputedStyle(field).fontSize),
        width: field.getBoundingClientRect().width,
        right: field.getBoundingClientRect().right,
        maxLength: field.maxLength,
      })),
    }));
    assert.equal(result.fields.length, 4);
    assert.ok(result.scrollWidth <= width, "Horizontal page overflow");
    assert.ok(!/maximum-scale|user-scalable=no/.test(result.viewport));
    for (const [index, field] of result.fields.entries()) {
      assert.equal(field.maxLength, index === 3 ? 1200 : 120);
      assert.equal(field.fontSize, width < 768 ? 16 : 14);
      assert.ok(field.right <= width);
    }
    measurements.push(result);
    await page.screenshot({
      path: fileURLToPath(new URL(`${width}.png`, import.meta.url)),
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  await writeFile(
    new URL("result.json", import.meta.url),
    JSON.stringify(
      {
        browser: await browser.version(),
        measurements,
        consoleErrorsAndWarnings: errors,
        limitations:
          "Isolated PollComposer and channel Textarea integration; does not verify an authenticated channel route, native iOS keyboard zoom or manual pinch gestures.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Frontend DS integration passed at 390 and 1280px.");
} finally {
  await browser.close();
  await server.close();
}
