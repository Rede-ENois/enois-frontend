// @vitest-environment jsdom
import { act, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MentionTextarea } from "./mention-textarea";

const mocks = vi.hoisted(() => ({
  search: vi.fn(async () => [{ id: "u1", username: "ana", name: "Ana", avatar: null }]),
}));

// A busca de menção é a única chamada de rede do campo: com ela mockada, a lista abre de verdade.
vi.mock("@/lib/api", () => ({ usersApi: { search: mocks.search } }));

function Field({ onSubmitShortcut }: { onSubmitShortcut?: () => void }) {
  const [value, setValue] = useState("");
  return (
    <MentionTextarea
      value={value}
      onChange={(next) => setValue(next)}
      onSubmitShortcut={onSubmitShortcut}
    />
  );
}

describe("MentionTextarea: Ctrl+Enter", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  async function render(onSubmitShortcut?: () => void) {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Field onSubmitShortcut={onSubmitShortcut} />
        </QueryClientProvider>,
      ),
    );
    return host.querySelector("textarea")!;
  }

  async function type(textarea: HTMLTextAreaElement, text: string) {
    // Setter nativo: o React só vê a mudança se o valor não vier pela própria prop.
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    await act(async () => {
      setter.call(textarea, text);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  async function press(textarea: HTMLTextAreaElement, init: KeyboardEventInit) {
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
      ...init,
    });
    await act(async () => {
      textarea.dispatchEvent(event);
    });
    return event;
  }

  it("Ctrl+Enter e Cmd+Enter chamam o envio e não quebram linha", async () => {
    const submit = vi.fn();
    const textarea = await render(submit);
    await type(textarea, "oi");

    expect((await press(textarea, { ctrlKey: true })).defaultPrevented).toBe(true);
    await press(textarea, { metaKey: true });

    expect(submit).toHaveBeenCalledTimes(2);
  });

  it("Enter puro não envia", async () => {
    const submit = vi.fn();
    const textarea = await render(submit);
    await type(textarea, "oi");

    expect((await press(textarea, {})).defaultPrevented).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });

  it("com a lista de menção aberta, Enter escolhe a pessoa e Ctrl+Enter envia", async () => {
    const submit = vi.fn();
    const textarea = await render(submit);
    await type(textarea, "@an");
    await act(async () => {
      await client.refetchQueries();
    });
    await vi.waitFor(() => expect(host.textContent).toContain("ana"));

    // Com a lista aberta: Ctrl+Enter envia sem escolher ninguém...
    await press(textarea, { ctrlKey: true });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(textarea.value).toBe("@an");

    // ...e Enter continua escolhendo a pessoa, sem enviar.
    await press(textarea, {});
    expect(submit).toHaveBeenCalledTimes(1);
    expect(textarea.value).toBe("@ana ");
  });

  it("sem onSubmitShortcut, Ctrl+Enter não faz nada", async () => {
    const textarea = await render();
    await type(textarea, "oi");

    expect((await press(textarea, { ctrlKey: true })).defaultPrevented).toBe(false);
  });
});
