// @vitest-environment jsdom
import { type ReactNode, act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { BlogPost } from "@/types/application/blog/blog-post";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlogPostEditor } from "./blog-post-editor";

const mocks = vi.hoisted(() => ({
  userId: "user-a",
  publish: vi.fn(),
  edit: vi.fn(),
  mine: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock("@/lib/current-user", () => ({ getCurrentUserId: () => mocks.userId }));
vi.mock("@/lib/api/blogs", () => ({
  blogsApi: { publish: mocks.publish, editPost: mocks.edit, mine: mocks.mine },
}));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/mention-textarea", () => ({
  MentionTextarea: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));
vi.mock("@/components/html-editor", () => ({
  HtmlEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="HTML" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));
const key = "connect-grow-blog-post-draft:user-a";
const draft = {
  title: "Meu título",
  body: "Texto que não pode sumir",
  format: "MARKDOWN",
  avisar: true,
};
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.userId = "user-a";
  localStorage.clear();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mocks.mine.mockResolvedValue(null);
  mocks.publish.mockResolvedValue({});
  mocks.edit.mockResolvedValue({});
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  vi.restoreAllMocks();
  localStorage.clear();
});
async function render(post?: BlogPost) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <BlogPostEditor post={post} />
      </QueryClientProvider>,
    ),
  );
}
async function fill(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
  await act(async () => {
    const prototype =
      input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function click(label: string) {
  const button = [...container.querySelectorAll("button")].find(
    (item) => item.textContent === label,
  )!;
  expect(button).toBeDefined();
  await act(async () => button.click());
}
async function remount() {
  await act(async () => root.unmount());
  root = createRoot(container);
  await render();
}
function title() {
  return container.querySelector<HTMLInputElement>(
    `input[placeholder="${texts.blog.editor.postTitle}"]`,
  )!;
}

describe("rascunho local de novos posts do blog", () => {
  it("salva enquanto digita e recupera título, HTML e opção de aviso ao voltar ou recarregar", async () => {
    await render();
    await fill("input", draft.title);
    await click(texts.blog.editor.modeHtml);
    await fill("textarea", "<p>Meu HTML</p>");
    await act(async () =>
      container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click(),
    );
    await remount();
    expect(title().value).toBe(draft.title);
    expect(container.querySelector<HTMLTextAreaElement>('textarea[aria-label="HTML"]')?.value).toBe(
      "<p>Meu HTML</p>",
    );
    expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(
      false,
    );
    expect(container.textContent).toContain(texts.blog.editor.draftSaved);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({
      title: draft.title,
      body: "<p>Meu HTML</p>",
      format: "HTML",
      avisar: false,
    });
  });
  it("restaura sem sobrescrever o rascunho com o formulário vazio inicial", async () => {
    localStorage.setItem(key, JSON.stringify(draft));
    await render();
    expect(title().value).toBe(draft.title);
    expect(container.querySelector("textarea")?.value).toBe(draft.body);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(draft);
  });
  it("separa os rascunhos por usuário", async () => {
    localStorage.setItem(key, JSON.stringify(draft));
    mocks.userId = "user-b";
    await render();
    expect(title().value).toBe("");
    await fill("input", "Texto de outra pessoa");
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(draft);
    expect(JSON.parse(localStorage.getItem("connect-grow-blog-post-draft:user-b")!).title).toBe(
      "Texto de outra pessoa",
    );
  });
  it("mantém o rascunho se publicar falhar e limpa somente após sucesso", async () => {
    localStorage.setItem(key, JSON.stringify(draft));
    mocks.publish.mockRejectedValueOnce(new Error("Sem conexão"));
    await render();
    await click(texts.blog.editor.publish);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(draft);
    expect(container.textContent).toContain("Sem conexão");
    await click(texts.blog.editor.publish);
    expect(mocks.publish).toHaveBeenLastCalledWith({
      title: draft.title,
      body: draft.body,
      format: draft.format,
      notifySubscribers: true,
    });
    expect(localStorage.getItem(key)).toBeNull();
    await remount();
    expect(title().value).toBe("");
  });
  it("preserva alterações digitadas enquanto uma publicação está em andamento", async () => {
    let finish!: (value: object) => void;
    mocks.publish.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    localStorage.setItem(key, JSON.stringify(draft));
    await render();
    await click(texts.blog.editor.publish);
    await fill("textarea", "Continuei digitando");
    await act(async () => finish({}));
    expect(JSON.parse(localStorage.getItem(key)!).body).toBe("Continuei digitando");
  });
  it("não aplica nem remove o rascunho de criação ao editar um post publicado", async () => {
    localStorage.setItem(key, JSON.stringify(draft));
    await render({
      id: "post-a",
      title: "Já publicado",
      body: "Conteúdo publicado",
      bodyFormat: "MARKDOWN",
      publishedAt: "",
      updatedAt: "",
    });
    expect(title().value).toBe("Já publicado");
    await fill("input", "Título editado");
    await click(texts.blog.editor.savePost);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(draft);
    expect(mocks.edit).toHaveBeenCalledWith("post-a", {
      title: "Título editado",
      body: "Conteúdo publicado",
      format: "MARKDOWN",
    });
  });
  it("permite continuar escrevendo se o rascunho estiver corrompido", async () => {
    localStorage.setItem(key, "JSON inválido");
    await render();
    await fill("input", "Novo rascunho");
    expect(JSON.parse(localStorage.getItem(key)!).title).toBe("Novo rascunho");
  });
  it("avisa quando o navegador não consegue salvar, sem impedir a escrita", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    await render();
    await fill("input", "Meu texto");
    expect(title().value).toBe("Meu texto");
    expect(container.textContent).toContain(texts.blog.editor.draftSaveError);
    expect(container.textContent).not.toContain(texts.blog.editor.draftSaved);
  });
});
