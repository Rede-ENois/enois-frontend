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
    // O campo do DS 0.33 é contentEditable; os eventos de teclado e de digitação vão nele.
    return host.querySelector<HTMLElement>('[role="textbox"]')!;
  }

  async function type(field: HTMLElement, text: string) {
    await act(async () => {
      field.textContent = text;
      const range = document.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      const selection = document.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  async function press(field: HTMLElement, init: KeyboardEventInit) {
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
      ...init,
    });
    await act(async () => {
      field.dispatchEvent(event);
    });
    return event;
  }

  it("Ctrl+Enter e Cmd+Enter chamam o envio e não quebram linha", async () => {
    const submit = vi.fn();
    const campo = await render(submit);
    await type(campo, "oi");

    expect((await press(campo, { ctrlKey: true })).defaultPrevented).toBe(true);
    await press(campo, { metaKey: true });

    expect(submit).toHaveBeenCalledTimes(2);
  });

  it("Enter puro não envia", async () => {
    const submit = vi.fn();
    const campo = await render(submit);
    await type(campo, "oi");

    expect((await press(campo, {})).defaultPrevented).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });

  it("com a lista de menção aberta, Enter escolhe a pessoa e Ctrl+Enter envia", async () => {
    const submit = vi.fn();
    const campo = await render(submit);
    await type(campo, "@an");
    await act(async () => {
      await client.refetchQueries();
    });
    await vi.waitFor(() => expect(host.textContent).toContain("ana"));

    // Com a lista aberta: Ctrl+Enter envia sem escolher ninguém...
    await press(campo, { ctrlKey: true });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(campo.textContent).toBe("@an");

    // ...e Enter continua escolhendo a pessoa, sem enviar.
    await press(campo, {});
    expect(submit).toHaveBeenCalledTimes(1);
    expect(campo.textContent).toBe("@ana ");
  });

  it("sem onSubmitShortcut, Ctrl+Enter não faz nada", async () => {
    const campo = await render();
    await type(campo, "oi");

    expect((await press(campo, { ctrlKey: true })).defaultPrevented).toBe(false);
  });
});
