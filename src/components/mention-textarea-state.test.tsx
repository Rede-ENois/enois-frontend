// @vitest-environment jsdom
import { act, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MentionTextarea } from "./mention-textarea";

vi.mock("@/lib/api", () => ({
  usersApi: {
    search: async () => [{ id: "user-a", username: "ana-test", name: "Ana Example", avatar: null }],
  },
}));
vi.mock("@/lib/emotes/api", () => ({
  emoteImageUrl: (path: string) => path,
  emotesApi: {
    page: async () => ({
      items: [{ code: "KEKW", provider: "BTTV", id: "test-emote", thumb: "/test-emote.png" }],
      page: 1,
      total: 1,
      totalPages: 1,
    }),
  },
}));

const changed = vi.fn();
let replaceValue: (value: string) => void;
let root: Root;
let host: HTMLDivElement;
let client: QueryClient;

function Field() {
  const [value, setValue] = useState("");
  replaceValue = setValue;
  return (
    <MentionTextarea
      value={value}
      onChange={(next, ids) => {
        setValue(next);
        changed(next, ids);
      }}
      toolbar
    />
  );
}

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  changed.mockClear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Field />
      </QueryClientProvider>,
    ),
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  client.clear();
  vi.unstubAllGlobals();
});

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)));

async function selectMention() {
  const textarea = host.querySelector("textarea")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
      textarea,
      "@an",
    );
    textarea.setSelectionRange(3, 3);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await settle();
  const option = [...host.querySelectorAll("button")].find((button) =>
    button.textContent?.includes("Ana Example"),
  );
  expect(option).toBeDefined();
  await act(async () =>
    option!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true })),
  );
  await settle();
  expect(changed).toHaveBeenLastCalledWith("@ana-test ", ["user-a"]);
  return textarea;
}

async function chooseEmote() {
  const open = [...host.querySelectorAll("button")].find((button) =>
    button.textContent?.includes(texts.emotes.button),
  );
  expect(open).toBeDefined();
  await act(async () => open!.click());
  await settle();
  const emote = document.querySelector<HTMLButtonElement>('button[title="KEKW"]');
  expect(emote).not.toBeNull();
  await act(async () => emote!.click());
  await settle();
}

describe("emote insertion through the real mention editor", () => {
  it("does not restore a mention after the parent clears the draft", async () => {
    await selectMention();
    await act(async () => replaceValue(""));
    await chooseEmote();
    expect(changed).toHaveBeenLastCalledWith("KEKW", []);
  });

  it("removes the recipient when an emote replaces the selected mention", async () => {
    const textarea = await selectMention();
    textarea.setSelectionRange(0, "@ana-test".length);
    await chooseEmote();
    expect(changed).toHaveBeenLastCalledWith("KEKW ", []);
  });

  it("keeps a confirmed mention when the emote is inserted after it", async () => {
    const textarea = await selectMention();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    await chooseEmote();
    expect(changed).toHaveBeenLastCalledWith("@ana-test KEKW", ["user-a"]);
    expect(textarea.selectionStart).toBe("@ana-test KEKW".length);
  });
});
