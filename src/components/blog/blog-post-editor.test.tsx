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
  drafts: vi.fn(),
  createDraft: vi.fn(),
  saveDraftById: vi.fn(),
  discardDraftById: vi.fn(),
  uploadAll: vi.fn(),
  removeMedia: vi.fn(),
}));
let attachmentsIndex = 0;
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({
    status: "idle",
    uploadAll: (files: { file: File }[]) => mocks.uploadAll(files),
  }),
}));
vi.mock("@/lib/current-user", () => ({ getCurrentUserId: () => mocks.userId }));
vi.mock("@/lib/api/blogs", () => ({
  blogsApi: { publish: mocks.publish, editPost: mocks.edit, mine: mocks.mine },
}));
vi.mock("@/lib/api/media", () => ({ mediaApi: { delete: mocks.removeMedia, get: vi.fn() } }));
vi.mock("@/lib/api/feed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/feed")>();
  return {
    ...actual,
    feedApi: {
      ...actual.feedApi,
      drafts: () => mocks.drafts(),
      createDraft: (data: unknown) => mocks.createDraft(data),
      saveDraftById: (id: string, data: unknown) => mocks.saveDraftById(id, data),
      discardDraftById: (id: string) => mocks.discardDraftById(id),
    },
  };
});
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
/** O rascunho que o servidor devolve (o título do artigo mora no `content`, o corpo no `articleBody`). */
const rascunhoServidor = {
  id: "draft_srv_1",
  type: "ARTICLE",
  content: "Meu título",
  pageHtml: null,
  articleBody: "Texto que não pode sumir",
  topic: null,
  pollOptions: [],
  pollMultipleChoice: false,
  pollEndsAt: null,
  mentionedUserIds: [],
  createdAt: "2026-11-15T10:00:00Z",
  updatedAt: "2026-11-15T10:00:00Z",
};
const localDraft = {
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
  mocks.drafts.mockResolvedValue({ drafts: [rascunhoServidor] });
  mocks.createDraft.mockResolvedValue({ draft: { ...rascunhoServidor, id: "draft_srv_2" } });
  mocks.saveDraftById.mockResolvedValue({ draft: rascunhoServidor });
  mocks.discardDraftById.mockResolvedValue({ status: "DISCARDED" });
  mocks.removeMedia.mockResolvedValue({ id: "media", status: "DELETED" });
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
async function render(post?: BlogPost, continueDraftId?: string) {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <BlogPostEditor post={post} continueDraftId={continueDraftId} />
      </QueryClientProvider>,
    );
  });
  // A restauração vem da rede (feedApi.drafts): gira até o React assentar.
  for (let turn = 0; turn < 5; turn += 1) await act(async () => {});
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

describe("rascunhos de artigo do blog (lista no servidor)", () => {
  it("restaura da conta o rascunho de artigo mais recente", async () => {
    await render();
    expect(title().value).toBe(rascunhoServidor.content);
    expect(container.querySelector("textarea")?.value).toBe(rascunhoServidor.articleBody);
    expect(container.textContent).toContain(texts.blog.editor.draftSaved);
    expect(mocks.drafts).toHaveBeenCalled();
  });

  it("restaura o rascunho específico quando vem de Continuar escrevendo", async () => {
    mocks.drafts.mockResolvedValue({
      drafts: [
        rascunhoServidor,
        {
          ...rascunhoServidor,
          id: "draft_srv_0",
          content: "O outro texto",
          articleBody: "Corpo do outro",
          updatedAt: "2026-11-14T09:00:00Z",
        },
      ],
    });
    await render(undefined, "draft_srv_0");
    expect(title().value).toBe("O outro texto");
    expect(container.querySelector("textarea")?.value).toBe("Corpo do outro");
  });

  it("continua digitando no rascunho restaurado: salva por id, sem criar outro", async () => {
    vi.useFakeTimers();
    await render();
    await fill("input", "Título editado por cima");
    // O autosave tem 2s de espera: girar o tempo dele.
    try {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500);
      });
    } finally {
      vi.useRealTimers();
    }
    expect(mocks.saveDraftById).toHaveBeenCalledWith(
      "draft_srv_1",
      expect.objectContaining({ type: "ARTICLE", content: "Título editado por cima" }),
    );
    expect(mocks.createDraft).not.toHaveBeenCalled();
  });

  it("cria um rascunho novo na conta quando não há nenhum de artigo", async () => {
    vi.useFakeTimers();
    mocks.drafts.mockResolvedValue({ drafts: [] });
    await render();
    await fill("input", "Post novo");
    try {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500);
      });
    } finally {
      vi.useRealTimers();
    }
    expect(mocks.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ARTICLE", content: "Post novo" }),
    );
  });

  it("sem rede, restaura e salva pelo localStorage como emergência", async () => {
    vi.useFakeTimers();
    mocks.drafts.mockRejectedValue(new Error("offline"));
    mocks.createDraft.mockRejectedValue(new Error("offline"));
    localStorage.setItem(key, JSON.stringify(localDraft));
    await render();
    expect(title().value).toBe(localDraft.title);
    expect(container.querySelector("textarea")?.value).toBe(localDraft.body);
    // A escrita local continua (a rede caiu; o navegador segura o rascunho do dia).
    await fill("input", "Editado offline");
    try {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2500);
      });
    } finally {
      vi.useRealTimers();
    }
    expect(JSON.parse(localStorage.getItem(key)!).title).toBe("Editado offline");
    // A tentativa de servidor falhou; nenhuma resposta de rascunho criado chegou ao editor.
    expect(mocks.createDraft).toHaveBeenCalled();
    expect(mocks.saveDraftById).not.toHaveBeenCalled();
  });

  it("descarta o rascunho do servidor quando o post publica", async () => {
    await render();
    await click(texts.blog.editor.publish);
    await act(async () => {});
    expect(mocks.publish).toHaveBeenCalledWith({
      title: rascunhoServidor.content,
      body: rascunhoServidor.articleBody,
      format: "MARKDOWN",
      mediaIds: [],
      notifySubscribers: true,
    });
    expect(mocks.discardDraftById).toHaveBeenCalledWith("draft_srv_1");
  });

  it("mantém o rascunho se publicar falhar", async () => {
    mocks.publish.mockRejectedValueOnce(new Error("Sem conexão"));
    await render();
    await click(texts.blog.editor.publish);
    expect(container.textContent).toContain("Sem conexão");
    expect(mocks.discardDraftById).not.toHaveBeenCalled();
    expect(title().value).toBe(rascunhoServidor.content);
  });

  it("não aplica nem remove o rascunho de criação ao editar um post publicado", async () => {
    localStorage.setItem(key, JSON.stringify(localDraft));
    await render({
      id: "post-a",
      title: "Já publicado",
      body: "Conteúdo publicado",
      bodyFormat: "MARKDOWN",
      mediaIds: [],
      publishedAt: "",
      updatedAt: "",
    });
    expect(title().value).toBe("Já publicado");
    expect(mocks.drafts).not.toHaveBeenCalled();
    await fill("input", "Título editado");
    await click(texts.blog.editor.savePost);
    expect(mocks.discardDraftById).not.toHaveBeenCalled();
    expect(mocks.edit).toHaveBeenCalledWith("post-a", {
      title: "Título editado",
      body: "Conteúdo publicado",
      format: "MARKDOWN",
      mediaIds: [],
    });
  });
});

describe("fotos e vídeos no post do blog (vlog)", () => {
  const arquivo = (name: string, type: string) => new File(["x"], name, { type });

  const esperar = async () => {
    for (let turn = 0; turn < 5; turn += 1) await act(async () => {});
  };

  const escolherArquivos = async (files: File[]) => {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input).not.toBeNull();
    Object.defineProperty(input, "files", { value: files, configurable: true });
    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    for (let turn = 0; turn < 5; turn += 1) await act(async () => {});
  };

  // Cada teste define as próprias subidas; uma implementação que vaza de um teste para o outro
  // fazia "uma falhou" passar com a resposta do teste anterior.
  beforeEach(() => {
    mocks.uploadAll.mockReset();
    mocks.uploadAll.mockImplementation(async (files: { file: File }[]) =>
      files.map(({ file }) => {
        attachmentsIndex += 1;
        return { mediaId: `media-${attachmentsIndex}`, cdnUrl: `/${file.name}` };
      }),
    );
  });

  it("sobe o anexo escolhido e publica com os ids das mídias", async () => {
    await render();
    await fill("input", "Meu vlog");
    await fill("textarea", "Texto do vlog");
    await escolherArquivos([arquivo("mutiracao.mp4", "video/mp4")]);

    expect(mocks.uploadAll).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("mutiracao.mp4");

    await click(texts.blog.editor.publish);
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.objectContaining({ mediaIds: [`media-${attachmentsIndex}`] }),
    );
  });

  it("bloqueia a publicação enquanto o anexo sobe", async () => {
    let terminar: (value: { mediaId: string; cdnUrl: string }[]) => void = () => {};
    mocks.uploadAll.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          terminar = resolve;
        }),
    );
    await render();
    await fill("input", "Meu vlog");
    await fill("textarea", "Texto do vlog");
    await escolherArquivos([arquivo("foto.jpg", "image/jpeg")]);

    const publicar = [...container.querySelectorAll("button")].find(
      (item) => item.textContent === texts.blog.editor.publish,
    ) as HTMLButtonElement;
    expect(publicar.disabled).toBe(true);
    expect(container.textContent).toContain(
      texts.blog.editor.mediaUploading.replace("{{name}}", "foto.jpg"),
    );

    await act(async () => terminar([{ mediaId: "media-sobe", cdnUrl: "/foto.jpg" }]));
    expect(publicar.disabled).toBe(false);
  });

  it("remover o anexo tira a mídia do post", async () => {
    await render();
    await fill("input", "Meu vlog");
    await fill("textarea", "Texto do vlog");
    await escolherArquivos([arquivo("foto.jpg", "image/jpeg")]);
    // O anexo enviado é o Pill com o nome do arquivo; clicar nele remove.
    const remover = [...container.querySelectorAll("button")].find(
      (item) => item.textContent === "foto.jpg",
    );
    expect(remover).not.toBeUndefined();
    await act(async () => remover!.click());
    await esperar();
    expect(mocks.removeMedia).toHaveBeenCalledWith(`media-${attachmentsIndex}`);
    await click(texts.blog.editor.publish);
    expect(mocks.publish).toHaveBeenCalledWith(expect.objectContaining({ mediaIds: [] }));
  });

  it("anexo que falha na subida fica marcado e pode ser tentado de novo", async () => {
    mocks.uploadAll.mockRejectedValueOnce(new Error("rede"));
    await render();
    await fill("input", "Meu vlog");
    await fill("textarea", "Texto do vlog");
    await escolherArquivos([arquivo("foto.jpg", "image/jpeg")]);

    // A falha não some com o anexo: o Pill diz que dá para tentar, e publicar levaria o post sem
    // a foto — então a tentativa é o caminho oferecido.
    expect(container.textContent).toContain(texts.blog.editor.mediaRetry);
    const publicar = [...container.querySelectorAll("button")].find(
      (item) => item.textContent === texts.blog.editor.publish,
    ) as HTMLButtonElement;

    // A próxima subida (a da tentativa) vence; a primeira falhou no mock de cima.
    mocks.uploadAll.mockImplementation(async () => [
      { mediaId: "media-tentativa", cdnUrl: "/foto.jpg" },
    ]);
    const tentar = [...container.querySelectorAll("button")].find((item) =>
      (item.textContent ?? "").includes(texts.blog.editor.mediaRetry),
    );
    await act(async () => tentar!.click());
    await esperar();

    expect(container.textContent).toContain("foto.jpg");
    expect(publicar.disabled).toBe(false);
    await click(texts.blog.editor.publish);
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.objectContaining({ mediaIds: ["media-tentativa"] }),
    );
  });

  it("um anexo que falha não derruba os outros que subiram", async () => {
    mocks.uploadAll
      .mockImplementationOnce(async () => [{ mediaId: "media-boa", cdnUrl: "/boa.jpg" }])
      .mockImplementationOnce(async () => {
        throw new Error("rede");
      });
    await render();
    await escolherArquivos([arquivo("boa.jpg", "image/jpeg"), arquivo("ruim.jpg", "image/jpeg")]);
    await esperar();

    expect(container.textContent).toContain("boa.jpg");
    expect(container.textContent).toContain(texts.blog.editor.mediaRetry);
  });

  it("editar um post com mídia mantém os ids sem subir de novo", async () => {
    await render({
      id: "post-vlog",
      title: "Já publicado",
      body: "Conteúdo publicado",
      bodyFormat: "MARKDOWN",
      mediaIds: ["media-antiga"],
      publishedAt: "",
      updatedAt: "",
    });
    await click(texts.blog.editor.savePost);
    expect(mocks.uploadAll).not.toHaveBeenCalled();
    expect(mocks.edit).toHaveBeenCalledWith(
      "post-vlog",
      expect.objectContaining({ mediaIds: ["media-antiga"] }),
    );
  });
});
