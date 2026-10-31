import { describe, expect, it } from "vitest";

import { blogReadingMinutes } from "./blog-reading-time";

describe("blogReadingMinutes", () => {
  it("arredonda para cima com mínimo de um minuto", () => {
    expect(blogReadingMinutes("", "MARKDOWN")).toBe(1);
    expect(blogReadingMinutes("palavra ".repeat(200), "MARKDOWN")).toBe(1);
    expect(blogReadingMinutes("palavra ".repeat(201), "MARKDOWN")).toBe(2);
    expect(blogReadingMinutes("palavra ".repeat(600), "MARKDOWN")).toBe(3);
  });

  it("usa o texto completo do Markdown e ignora endereços e imagens", () => {
    const body = `# Título\n\n${"**palavra** ".repeat(199)}[leia](https://example.com)\n\n![foto](https://example.com/image.png)`;
    expect(blogReadingMinutes(body, "MARKDOWN")).toBe(2);
  });

  it("conta o texto HTML sem atributos, comentários, scripts ou estilos", () => {
    const noise = "ignorar ".repeat(1000);
    const body = `<head><title>${noise}</title></head><style>${noise}</style><script>${noise}</script><!-- ${noise} --><p class="${noise}">${"palavra ".repeat(200)}</p>`;
    expect(blogReadingMinutes(body, "HTML")).toBe(1);
    expect(blogReadingMinutes(`${body}<p>outra</p>`, "HTML")).toBe(2);
  });

  it("separa blocos e espaços HTML sem inflar entidades", () => {
    expect(blogReadingMinutes(`<p>${"a&ccedil;&atilde;o&nbsp;".repeat(200)}</p>`, "HTML")).toBe(1);
    expect(blogReadingMinutes("<p>ação</p>".repeat(201), "HTML")).toBe(2);
  });
});
